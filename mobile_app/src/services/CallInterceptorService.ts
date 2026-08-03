import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { CallShieldApi } from '../../services/CallShieldApi';
import { callWebSocketService } from './CallWebSocketService';

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

  private onThreatCallback: ((riskData: any) => void) | null = null;

  constructor() {
    if (Platform.OS === 'android' && CallInterceptorModule) {
      this.eventEmitter = new NativeEventEmitter(CallInterceptorModule);
    }
  }

  public startListening(onThreatDetected?: (riskData: any) => void) {
    if (this.isListening) return;
    this.isListening = true;
    this.consecutiveAiChunks = 0;
    this.onThreatCallback = onThreatDetected || null;

    // Connect WebSocket stream
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
        console.log(`[CallShield Interceptor] Ringing call from: ${event.phoneNumber}`);
        break;

      case 'ON_CALL_CONNECTED':
        console.log('[CallShield Interceptor] Call connected. Capturing audio stream...');
        callWebSocketService.connect();
        break;

      case 'ON_CHUNK_CAPTURED':
        if (event.audioBase64) {
          await this.processAudioChunk(event.audioBase64);
        }
        break;

      case 'ON_CALL_ENDED':
        console.log('[CallShield Interceptor] Call ended.');
        this.stopListening();
        break;
    }
  };

  private async processAudioChunk(base64Data: string) {
    // 1. Try pushing over low-latency WebSocket connection first
    const sentOverWs = callWebSocketService.sendAudioChunk(base64Data, 'live_interceptor_chunk.wav');
    if (sentOverWs) return;

    // 2. Fallback to HTTP POST /predict-chunk if WebSocket is reconnecting
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
    const aiProbability = result.ai_probability ?? 0;

    if (aiProbability >= 0.75) {
      this.consecutiveAiChunks += 1;
    } else {
      this.consecutiveAiChunks = Math.max(0, this.consecutiveAiChunks - 1);
    }

    // If 3 consecutive chunks show >= 75% AI scam probability, trigger Red Alert
    if (this.consecutiveAiChunks >= 3 && this.onThreatCallback) {
      this.onThreatCallback({
        riskLevel: 'high',
        probability: Math.round(aiProbability * 100),
        verdict: 'ai_generated',
        chunkCount: this.consecutiveAiChunks,
      });
    }
  };

  public async blockNumber(phoneNumber: string): Promise<boolean> {
    if (Platform.OS === 'android' && CallInterceptorModule) {
      return await CallInterceptorModule.blockNumber(phoneNumber);
    }
    return false;
  }
}

export const callInterceptorService = new CallInterceptorService();
