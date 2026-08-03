import { CallShieldApi } from '../../services/CallShieldApi';

export class CallWebSocketService {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private onPredictionListeners: ((data: any) => void)[] = [];

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const httpUrl = CallShieldApi.baseUrl;
    const wsUrl = httpUrl.replace(/^http/, 'ws') + '/ws/live-stream';

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        console.log('[CallShield WebSocket] Connected to sub-100ms ML stream:', wsUrl);
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.status === 'success' && payload.result) {
            this.notifyListeners(payload.result);
          }
        } catch (err) {
          console.warn('[CallShield WebSocket] Message parse error:', err);
        }
      };

      this.socket.onerror = (error) => {
        console.warn('[CallShield WebSocket] Error:', error);
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.socket = null;
        console.log('[CallShield WebSocket] Connection closed');
      };
    } catch (err) {
      console.warn('[CallShield WebSocket] Connection failed:', err);
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }

  public sendAudioChunk(audioBase64: string, filename = 'live_chunk.wav'): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.connect();
      return false;
    }

    try {
      this.socket.send(
        JSON.stringify({
          audio_base64: audioBase64,
          filename: filename,
        })
      );
      return true;
    } catch (err) {
      console.warn('[CallShield WebSocket] Send failed:', err);
      return false;
    }
  }

  public onPrediction(callback: (data: any) => void): () => void {
    this.onPredictionListeners.push(callback);
    return () => {
      this.onPredictionListeners = this.onPredictionListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(data: any): void {
    this.onPredictionListeners.forEach((cb) => cb(data));
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }
}

export const callWebSocketService = new CallWebSocketService();
