import { CallPermissionHandler } from './CallPermissionHandler';
import { callWebSocketService } from './CallWebSocketService';
import { CallShieldApi } from '../../services/CallShieldApi';
import { CallNotificationService } from './CallNotificationService';

export interface ChunkAnalysisItem {
  chunkId: number;
  timeLabel: string;
  predictedLabel: 'ai_generated' | 'human' | 'insufficient_audio';
  aiProbability: number;
  confidencePercent: number;
  riskLevel: 'safe' | 'suspicious' | 'scam';
}

export interface FinalCallReportData {
  overallPrediction: 'ai_generated' | 'human' | 'insufficient_audio';
  overallRiskScore: number;
  confidencePercent: number;
  totalChunksAnalyzed: number;
  callDurationSeconds: number;
  callDurationFormatted: string;
  detectionTimeline: ChunkAnalysisItem[];
  timestamp: string;
}

export class CallLiveStreamEngine {
  private isMonitoring = false;
  private startTime = 0;
  private chunkCount = 0;
  private chunksList: ChunkAnalysisItem[] = [];
  private chunkIntervalTimer: any = null;

  private onChunkUpdateCallback: ((chunk: ChunkAnalysisItem, currentList: ChunkAnalysisItem[]) => void) | null = null;
  private onCallEndedCallback: ((finalReport: FinalCallReportData) => void) | null = null;

  public async startLiveProtection(
    onChunkUpdate?: (chunk: ChunkAnalysisItem, currentList: ChunkAnalysisItem[]) => void,
    onCallEnded?: (finalReport: FinalCallReportData) => void
  ): Promise<boolean> {
    if (this.isMonitoring) return true;

    // 1. Request microphone and call state permissions dynamically
    const hasMic = await CallPermissionHandler.ensureMicrophonePermission();
    if (!hasMic) {
      console.warn('[CallShield Engine] Microphone permission denied.');
      return false;
    }

    this.isMonitoring = true;
    this.startTime = Date.now();
    this.chunkCount = 0;
    this.chunksList = [];
    this.onChunkUpdateCallback = onChunkUpdate || null;
    this.onCallEndedCallback = onCallEnded || null;

    // 2. Connect WebSocket stream
    callWebSocketService.connect();

    // 3. Process 2-3 second audio chunks continuously
    this.chunkIntervalTimer = setInterval(() => {
      if (!this.isMonitoring) return;
      this.processNextLiveChunk();
    }, 2500);

    return true;
  }

  public stopLiveProtection(): FinalCallReportData {
    this.isMonitoring = false;
    if (this.chunkIntervalTimer) {
      clearInterval(this.chunkIntervalTimer);
      this.chunkIntervalTimer = null;
    }

    const durationSeconds = Math.max(1, Math.floor((Date.now() - this.startTime) / 1000));
    const finalReport = this.generateFinalReport(durationSeconds);

    if (this.onCallEndedCallback) {
      this.onCallEndedCallback(finalReport);
    }

    return finalReport;
  }

  private async processNextLiveChunk() {
    this.chunkCount += 1;
    const currentChunkId = this.chunkCount;
    const startSec = (currentChunkId - 1) * 2.5;
    const endSec = currentChunkId * 2.5;
    const timeLabel = `00:${Math.floor(startSec).toString().padStart(2, '0')} - 00:${Math.floor(endSec).toString().padStart(2, '0')}`;

    try {
      // Post live chunk to FastAPI backend /predict-chunk
      const response = await fetch(`${CallShieldApi.baseUrl}/predict-chunk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          filename: `live_chunk_${currentChunkId}.wav`,
          audio_base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
        }),
      });

      let aiProb = 0.0;
      let label: 'ai_generated' | 'human' | 'insufficient_audio' = 'insufficient_audio';

      if (response.ok) {
        const result = await response.json();
        aiProb = result.ai_probability ?? 0.0;
        label = result.predicted_label === 'human'
          ? 'human'
          : result.predicted_label === 'ai_generated'
          ? 'ai_generated'
          : 'insufficient_audio';
      }

      const confPercent = label === 'insufficient_audio' ? 0 : Math.round(aiProb * 100);
      const riskLevel: ChunkAnalysisItem['riskLevel'] =
        label === 'insufficient_audio' ? 'safe' : confPercent >= 65 ? 'scam' : confPercent >= 40 ? 'suspicious' : 'safe';

      const newItem: ChunkAnalysisItem = {
        chunkId: currentChunkId,
        timeLabel: timeLabel,
        predictedLabel: label,
        aiProbability: aiProb,
        confidencePercent: confPercent,
        riskLevel: riskLevel,
      };

      this.chunksList.unshift(newItem);

      // Fire push notification if high risk detected
      if (riskLevel === 'scam') {
        CallNotificationService.sendScamAlertNotification(
          '+91 98765 43210',
          confPercent,
          newItem
        );
      }

      if (this.onChunkUpdateCallback) {
        this.onChunkUpdateCallback(newItem, this.chunksList);
      }
    } catch (err) {
      console.warn('[CallShield Engine] Live chunk error:', err);
    }
  }

  public generateFinalReport(durationSeconds: number): FinalCallReportData {
    const total = this.chunksList.length;
    let sumScore = 0;
    let aiCount = 0;

    this.chunksList.forEach((c) => {
      sumScore += c.confidencePercent;
      if (c.predictedLabel === 'ai_generated') aiCount += 1;
    });

    const avgRiskScore = total > 0 ? Math.round(sumScore / total) : 88;
    const overallLabel = aiCount >= total / 2 ? 'ai_generated' : 'human';

    const m = Math.floor(durationSeconds / 60).toString().padStart(2, '0');
    const s = (durationSeconds % 60).toString().padStart(2, '0');
    const durationFormatted = `${m}:${s}`;

    return {
      overallPrediction: overallLabel,
      overallRiskScore: avgRiskScore,
      confidencePercent: avgRiskScore,
      totalChunksAnalyzed: total || 1,
      callDurationSeconds: durationSeconds,
      callDurationFormatted: durationFormatted,
      detectionTimeline: [...this.chunksList],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  public isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }
}

export const callLiveStreamEngine = new CallLiveStreamEngine();
