import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { CallShieldApi } from '../../services/CallShieldApi';
import { callWebSocketService } from './CallWebSocketService';
import { CallPermissionHandler } from './CallPermissionHandler';
import { CallNotificationService } from './CallNotificationService';

const { CallInterceptorModule } = NativeModules;

export interface NativeCallEvent {
  event: 'ON_CALL_RINGING' | 'ON_CALL_CONNECTED' | 'ON_CHUNK_CAPTURED' | 'ON_CALL_ENDED';
  phoneNumber?: string;
  audioBase64?: string;
  timestamp?: number;
}

class CallInterceptorService {
  private eventEmitter: NativeEventEmitter | null = null;
  private isListening = false;
  private consecutiveAiChunks = 0;
  private currentCallerNumber = '+91 98765 43210';
  private lastPredictionScore = 0;

  private onThreatCallback: ((riskData: any) => void) | null = null;

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

    if (this.eventEmitter) {
      this.eventEmitter.addListener('CallShieldNativeEvent', this.handleNativeEvent);
    }
  }

  public stopListening() {
    this.isListening = false;
    this.consecutiveAiChunks = 0;
    callWebSocketService.disconnect();

    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners('CallShieldNativeEvent');
    }
    if (Platform.OS === 'android' && CallInterceptorModule) {
      CallInterceptorModule.stopCallProtection();
    }
  }

  private handleNativeEvent = async (event: NativeCallEvent) => {
    switch (event.event) {
      case 'ON_CALL_RINGING':
        this.currentCallerNumber = event.phoneNumber || '+91 98765 43210';
        console.log(`[CallShield Interceptor] Ringing call from: ${this.currentCallerNumber}`);
        await CallPermissionHandler.ensurePhoneStatePermission();
        break;

      case 'ON_CALL_CONNECTED':
        console.log('[CallShield Interceptor] Call connected. Checking mic permission...');
        await CallPermissionHandler.ensureMicrophonePermission();
        callWebSocketService.connect();
        break;

      case 'ON_CHUNK_CAPTURED':
        if (event.audioBase64) {
          await this.processAudioChunk(event.audioBase64);
        }
        break;

      case 'ON_CALL_ENDED':
        console.log('[CallShield Interceptor] Call ended. Generating final analysis report...');
        await this.generateCallEndReport();
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
