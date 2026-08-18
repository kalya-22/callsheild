import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { CallShieldApi } from '../../services/CallShieldApi';
import { callWebSocketService } from './CallWebSocketService';
import { CallPermissionHandler } from './CallPermissionHandler';
import { CallNotificationService } from './CallNotificationService';

const { CallInterceptorModule } = NativeModules;

export interface NativeCallEvent {
  event: 'ON_CALL_RINGING' | 'ON_CALL_CONNECTED' | 'ON_CHUNK_CAPTURED' | 'ON_CALL_ENDED' | 'ON_ANALYZE_CALL_CLICKED';
  phoneNumber?: string;
  audioBase64?: string;
  chunkId?: number;
  aiProbability?: number;
  predictedLabel?: 'ai_generated' | 'human' | 'insufficient_audio';
  riskLevel?: 'low' | 'medium' | 'high';
  rawPredictedLabel?: string;
  audioRms?: number;
  timestamp?: number;
}

class CallInterceptorService {
  private eventEmitter: NativeEventEmitter | null = null;
  private isListening = false;
  private consecutiveAiChunks = 0;
  private currentCallerNumber = 'Unknown Caller';
  private lastPredictionScore = 0;

  private onThreatCallback: ((riskData: any) => void) | null = null;
  private onChunkCallback: ((chunkData: any, callerNumber: string) => void) | null = null;
  private onAnalyzeClickedCallback: ((callerNumber: string) => void) | null = null;
  private onCallEndedCallback: ((callerNumber: string) => void) | null = null;

  public setOnChunkListener(callback: (chunkData: any, callerNumber: string) => void) {
    this.onChunkCallback = callback;
  }

  public setOnAnalyzeClickedListener(callback: (callerNumber: string) => void) {
    this.onAnalyzeClickedCallback = callback;
    this.ensureNativeEventSubscription();
    void this.consumePendingAnalyzeCall();
  }

  public setOnCallEndedListener(callback: (callerNumber: string) => void) {
    this.onCallEndedCallback = callback;
    this.ensureNativeEventSubscription();
  }

  public beginAnalyzingExistingCall(callerNumber?: string) {
    this.currentCallerNumber = this.resolveCallerNumber(callerNumber);
    this.isListening = true;
    this.consecutiveAiChunks = 0;
    this.ensureNativeEventSubscription();
    CallNotificationService.configure();
    callWebSocketService.connect();
    callWebSocketService.onPrediction(this.handlePredictionResult);
  }

  private ensureNativeEventSubscription() {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners('CallShieldNativeEvent');
      this.eventEmitter.addListener('CallShieldNativeEvent', this.handleNativeEvent);
    }
  }

  private async consumePendingAnalyzeCall() {
    if (Platform.OS !== 'android' || !CallInterceptorModule?.getPendingAnalyzeCall) return;
    try {
      const pending = await CallInterceptorModule.getPendingAnalyzeCall();
      if (pending) {
        await this.handleNativeEvent(pending);
      }
    } catch (err) {
      console.warn('[CallShield Interceptor] Could not read pending analyze call:', err);
    }
  }

  constructor() {
    if (Platform.OS === 'android' && CallInterceptorModule) {
      this.eventEmitter = new NativeEventEmitter(CallInterceptorModule);
    }
  }

  public async startListening(onThreatDetected?: (riskData: any) => void) {
    if (this.isListening) return;

    // 1. Dynamic Microphone Permission check on call connection
    const hasMicPermission = await CallPermissionHandler.ensureMicrophonePermission();
    if (!hasMicPermission) {
      console.warn('[CallShield Interceptor] Microphone permission denied by user.');
    }

    this.isListening = true;
    this.consecutiveAiChunks = 0;
    this.onThreatCallback = onThreatDetected || null;

    // Connect WebSocket stream & notifications
    CallNotificationService.configure();
    callWebSocketService.connect();
    callWebSocketService.onPrediction(this.handlePredictionResult);

    if (Platform.OS === 'android' && CallInterceptorModule) {
      CallInterceptorModule.startCallProtection();
    }

    this.ensureNativeEventSubscription();
  }

  public stopListening() {
    this.isListening = false;
    this.consecutiveAiChunks = 0;
    callWebSocketService.disconnect();

    this.ensureNativeEventSubscription();
    if (Platform.OS === 'android' && CallInterceptorModule) {
      CallInterceptorModule.stopCallProtection();
    }
  }

  private handleNativeEvent = async (event: NativeCallEvent) => {
    switch (event.event) {
      case 'ON_ANALYZE_CALL_CLICKED':
        this.currentCallerNumber = this.resolveCallerNumber(event.phoneNumber);
        if (this.onAnalyzeClickedCallback) {
          this.onAnalyzeClickedCallback(this.currentCallerNumber);
        }
        break;

      case 'ON_CALL_RINGING':
        this.currentCallerNumber = this.resolveCallerNumber(event.phoneNumber);
        console.log(`[CallShield Interceptor] Ringing call from: ${this.currentCallerNumber}`);
        await CallPermissionHandler.ensurePhoneStatePermission();
        break;

      case 'ON_CALL_CONNECTED':
        this.currentCallerNumber = this.resolveCallerNumber(event.phoneNumber);
        console.log('[CallShield Interceptor] Call connected. Checking mic permission...');
        await CallPermissionHandler.ensureMicrophonePermission();
        callWebSocketService.connect();
        break;

      case 'ON_CHUNK_CAPTURED':
        if (event.aiProbability !== undefined) {
          this.handlePredictionResult({
            chunk_id: event.chunkId,
            ai_probability: event.aiProbability,
            predicted_label: event.predictedLabel || 'insufficient_audio',
            risk_level: event.riskLevel || 'low',
            raw_predicted_label: event.rawPredictedLabel,
            audio_rms: event.audioRms,
          });
        } else if (event.audioBase64) {
          await this.processAudioChunk(event.audioBase64);
        }
        break;

      case 'ON_CALL_ENDED':
        console.log('[CallShield Interceptor] Call ended. Generating final analysis report...');
        if (!this.isListening) {
          if (this.onCallEndedCallback) {
            this.onCallEndedCallback(event.phoneNumber || this.currentCallerNumber);
          }
          return;
        }
        await this.generateCallEndReport();
        if (this.onCallEndedCallback) {
          this.onCallEndedCallback(event.phoneNumber || this.currentCallerNumber);
        }
        this.stopListening();
        break;
    }
  };

  private async processAudioChunk(base64Data: string) {
    const sentOverWs = callWebSocketService.sendAudioChunk(base64Data, 'live_interceptor_chunk.wav');
    if (sentOverWs) return;

    try {
      const response = await fetch(`${CallShieldApi.baseUrl}/predict-chunk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          filename: 'live_interceptor_chunk.wav',
          audio_base64: base64Data,
        }),
      });

      if (!response.ok) return;

      const result = await response.json();
      this.handlePredictionResult(result);
    } catch (err) {
      console.warn('[CallShield Interceptor] Chunk prediction error:', err);
    }
  }

  private handlePredictionResult = (result: any) => {
    const aiProbability = result.ai_probability ?? 0.85;
    this.lastPredictionScore = Math.round(aiProbability * 100);

    if (this.onChunkCallback) {
      this.onChunkCallback(result, this.currentCallerNumber);
    }

    if (aiProbability >= 0.75) {
      this.consecutiveAiChunks += 1;
    } else {
      this.consecutiveAiChunks = Math.max(0, this.consecutiveAiChunks - 1);
    }

    // If 3 consecutive chunks show >= 75% AI scam probability, trigger Red Alert & System Notification
    if (this.consecutiveAiChunks >= 3) {
      const reportData = {
        phoneNumber: this.currentCallerNumber,
        riskScore: this.lastPredictionScore,
        verdict: 'ai_generated',
        timestamp: new Date().toISOString(),
      };

      // Fire high-priority system notification to lock screen
      CallNotificationService.sendScamAlertNotification(
        this.currentCallerNumber,
        this.lastPredictionScore,
        reportData
      );

      if (this.onThreatCallback) {
        this.onThreatCallback({
          riskLevel: 'high',
          probability: this.lastPredictionScore,
          verdict: 'ai_generated',
          chunkCount: this.consecutiveAiChunks,
        });
      }
    }
  };

  private resolveCallerNumber(phoneNumber?: string) {
    const normalized = (phoneNumber || '').trim();
    if (normalized && normalized !== 'Unknown Caller') {
      return normalized;
    }
    return this.currentCallerNumber || 'Unknown Caller';
  }

  private async generateCallEndReport() {
    const isScam = this.lastPredictionScore >= 65;
    const reportData = {
      id: Date.now().toString(),
      name: isScam ? 'Suspicious Caller' : 'Verified Contact',
      number: this.currentCallerNumber,
      time: 'Just now',
      risk: isScam ? 'scam' : 'safe',
      confidence: this.lastPredictionScore,
      verdict: isScam ? 'ai_generated' : 'human',
    };

    if (isScam) {
      await CallNotificationService.sendScamAlertNotification(
        this.currentCallerNumber,
        this.lastPredictionScore,
        reportData
      );
    } else {
      await CallNotificationService.sendSafeCallNotification(
        this.currentCallerNumber,
        this.lastPredictionScore || 98,
        reportData
      );
    }
  }

  public async blockNumber(phoneNumber: string): Promise<boolean> {
    if (Platform.OS === 'android' && CallInterceptorModule) {
      return await CallInterceptorModule.blockNumber(phoneNumber);
    }
    return false;
  }
}

export const callInterceptorService = new CallInterceptorService();
