import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { ShieldLogo } from '../components/ShieldLogo';
import { LiveCallReportModal } from '../components/LiveCallReportModal';
import {
  callLiveStreamEngine,
  ChunkAnalysisItem,
  FinalCallReportData,
} from '../services/CallLiveStreamEngine';
import { CallShieldApi } from '../../services/CallShieldApi';
import { callInterceptorService } from '../services/CallInterceptorService';
import { CallHistoryStorage } from '../services/CallHistoryStorage';


interface LiveCallScreenProps {
  callerNumber?: string;
  onEndCall: () => void;
}

export function LiveCallScreen({ callerNumber = 'Unknown Caller', onEndCall }: LiveCallScreenProps) {
  const [seconds, setSeconds] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [statusBadge, setStatusBadge] = useState<'safe' | 'suspicious' | 'scam'>('safe');
  const [currentConfidence, setCurrentConfidence] = useState(96);
  const [chunkTimeline, setChunkTimeline] = useState<ChunkAnalysisItem[]>([]);
  const [finalReportData, setFinalReportData] = useState<FinalCallReportData | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const isNativeCallSession = callerNumber !== 'Unknown Caller';

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // Subscribe to native call interceptor stream
    callInterceptorService.setOnChunkListener((result, callerNumber) => {
      const prob = result.ai_probability ?? 0.85;
      const conf = Math.round(prob * 100);
      const isInsufficientAudio =
        result.predicted_label === 'insufficient_audio' ||
        result.raw_predicted_label === 'too_quiet' ||
        (typeof result.audio_rms === 'number' && result.audio_rms > 0 && result.audio_rms < 0.000001);
      const predictedLabel = isInsufficientAudio
        ? 'insufficient_audio'
        : result.predicted_label === 'ai_generated' ? 'ai_generated' : 'human';
      const risk: 'safe' | 'suspicious' | 'scam' = isInsufficientAudio
        ? 'suspicious'
        : prob >= 0.75 ? 'scam' : prob >= 0.4 ? 'suspicious' : 'safe';

      const newChunkItem: ChunkAnalysisItem = {
        chunkId: Date.now(),
        timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        predictedLabel,
        riskLevel: risk,
        confidencePercent: conf,
        aiProbability: prob,
      };

      setChunkTimeline((prev) => [newChunkItem, ...prev]);
      setCurrentConfidence(conf);
      setStatusBadge(risk);
      setAudioNotice(
        isInsufficientAudio
          ? 'CallShield is receiving very low speaker audio. Increase call volume, keep speaker on, and keep the phone microphone near the speaker.'
          : null
      );
      setIsMonitoring(true);
    });

    callInterceptorService.setOnCallEndedListener(() => {
      if (!isNativeCallSession) return;
      const report = generateNativeFinalReport();
      setIsMonitoring(false);
      setFinalReportData(report);
      setShowReportModal(true);

      // Save real call record to persistent history
      saveReportToHistory(report, callerNumber);
    });

    if (isNativeCallSession) {
      setIsMonitoring(true);
      callInterceptorService.beginAnalyzingExistingCall(callerNumber);
    } else {
      // Auto-start simulated/manual live monitoring only when the user opens Live Call from the app.
      handleStartProtection();
    }

    return () => {
      clearInterval(timer);
      if (callLiveStreamEngine.isCurrentlyMonitoring()) {
        callLiveStreamEngine.stopLiveProtection();
      }
    };
  }, []);

  async function saveReportToHistory(report: FinalCallReportData, phoneNum: string) {
    try {
      const risk: 'safe' | 'suspicious' | 'scam' =
        report.overallPrediction === 'ai_generated'
          ? 'scam'
          : report.overallPrediction === 'insufficient_audio'
          ? 'suspicious'
          : 'safe';
      const conf = Math.round(report.confidencePercent || report.overallRiskScore || 94);

      await CallHistoryStorage.saveCallRecord({
        id: Date.now().toString(),
        name: phoneNum === 'Unknown Caller' ? 'Unknown Number' : phoneNum,
        number: phoneNum,
        time: 'Just now',
        risk,
        confidence: conf,
        predicted_label: report.overallPrediction,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[LiveCallScreen] Error saving history:', err);
    }
  }

  async function handleStartProtection() {
    const success = await callLiveStreamEngine.startLiveProtection((chunk, currentList) => {
      setChunkTimeline([...currentList]);
      const conf = chunk.confidencePercent;
      setCurrentConfidence(conf);
      setStatusBadge(chunk.riskLevel);
    });

    if (success) {
      setIsMonitoring(true);
    }
  }

  function handleStopMonitoring() {
    const report = isNativeCallSession
      ? generateNativeFinalReport()
      : callLiveStreamEngine.stopLiveProtection();
    if (isNativeCallSession) {
      callInterceptorService.stopListening();
    }
    setIsMonitoring(false);
    setFinalReportData(report);
    setShowReportModal(true);

    // Save real call record to persistent history
    saveReportToHistory(report, callerNumber);
  }

  function generateNativeFinalReport(): FinalCallReportData {
    const total = chunkTimeline.length;
    const durationSeconds = Math.max(1, seconds);
    const analyzedChunks = chunkTimeline.filter((chunk) => chunk.predictedLabel !== 'insufficient_audio');
    const validTotal = analyzedChunks.length;

    const averageRisk = validTotal
      ? Math.round(analyzedChunks.reduce((sum, chunk) => sum + chunk.confidencePercent, 0) / validTotal)
      : (total > 0 ? 15 : 0);

    const aiChunks = analyzedChunks.filter((chunk) => chunk.predictedLabel === 'ai_generated').length;
    const m = Math.floor(durationSeconds / 60).toString().padStart(2, '0');
    const s = (durationSeconds % 60).toString().padStart(2, '0');

    return {
      overallPrediction: analyzedChunks.length === 0
        ? 'insufficient_audio'
        : aiChunks >= Math.ceil(analyzedChunks.length / 2) ? 'ai_generated' : 'human',
      overallRiskScore: averageRisk,
      confidencePercent: averageRisk,
      totalChunksAnalyzed: total,
      callDurationSeconds: durationSeconds,
      callDurationFormatted: `${m}:${s}`,
      detectionTimeline: [...chunkTimeline],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  async function handlePickAudioFile() {
    try {
      setIsUploading(true);

      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        setIsUploading(false);
        return;
      }

      const asset = pickerResult.assets[0];
      let fileBlob: Blob | undefined;

      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        fileBlob = await response.blob();
      }

      const result = await CallShieldApi.predictAudioFile(
        asset.uri,
        asset.name || 'live_call_sample.wav',
        asset.mimeType || 'audio/wav',
        fileBlob
      );

      setIsUploading(false);

      const score = Math.round((result.ai_probability ?? 0.85) * 100);
      setCurrentConfidence(score);
      setStatusBadge(score >= 65 ? 'scam' : score >= 40 ? 'suspicious' : 'safe');

      Alert.alert(
        'AI Detection Result',
        `File: ${asset.name}\nPrediction: ${result.predicted_label}\nAI Confidence: ${score}%`
      );
    } catch (err: any) {
      setIsUploading(false);
      Alert.alert('Upload Error', err.message || 'Failed to analyze live audio file.');
    }
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Caller Details Header */}
        <View style={styles.callerHeader}>
          <View style={styles.callerAvatar}>
            <Text style={styles.callerAvatarText}>📞</Text>
          </View>
          <Text style={styles.callerName}>{callerNumber}</Text>
          <Text style={styles.callerSub}>Active Ongoing Call · {formatTimer(seconds)}</Text>
        </View>

        {isNativeCallSession && (
          <GlassCard style={styles.speakerHintCard}>
            <Text style={styles.speakerHintTitle}>Turn on speaker mode</Text>
            <Text style={styles.speakerHintText}>
              Android blocks direct internal call audio capture. CallShield analyzes microphone audio, so speaker mode helps the mic hear the caller voice.
            </Text>
          </GlassCard>
        )}

        {audioNotice && (
          <GlassCard style={styles.audioNoticeCard}>
            <Text style={styles.audioNoticeTitle}>Audio level is too low</Text>
            <Text style={styles.audioNoticeText}>{audioNotice}</Text>
          </GlassCard>
        )}

        {/* Live Protection Status Card */}
        <GlassCard bright style={styles.statusCard}>
          <ShieldLogo size={60} animate={isMonitoring} />
          <Text style={styles.statusTitle}>
            {statusBadge === 'scam'
              ? '🚨 HIGH RISK SCAM DETECTED'
              : statusBadge === 'suspicious'
              ? '⚠️ SUSPICIOUS VOICE PATTERN'
              : '🛡️ AI Protection Active (Safe)'}
          </Text>
          <Text style={styles.statusSub}>
            {statusBadge === 'scam'
              ? `Synthetic voice artifacts identified (${currentConfidence}% AI Probability)`
              : statusBadge === 'suspicious'
              ? `Unusual frequency spectrum observed (${currentConfidence}% Risk)`
              : 'Processing 2-3s audio chunks continuously in real-time'}
          </Text>

          {/* Live Status Badge */}
          <View
            style={[
              styles.riskBadge,
              {
                backgroundColor:
                  statusBadge === 'scam'
                    ? C.dangerDim
                    : statusBadge === 'suspicious'
                    ? C.warningDim
                    : C.successDim,
                borderColor:
                  statusBadge === 'scam'
                    ? C.danger
                    : statusBadge === 'suspicious'
                    ? C.warning
                    : C.success,
              },
            ]}
          >
            <Text
              style={[
                styles.riskBadgeText,
                {
                  color:
                    statusBadge === 'scam'
                      ? C.danger
                      : statusBadge === 'suspicious'
                      ? C.warning
                      : C.success,
                },
              ]}
            >
              STATUS: {statusBadge.toUpperCase()} ({currentConfidence}%)
            </Text>
          </View>
        </GlassCard>

        {/* Start Live Protection / Stop Monitoring Controls */}
        <View style={styles.controlsRow}>
          {!isMonitoring ? (
            <TouchableOpacity
              style={[styles.controlBtn, styles.startBtn]}
              onPress={handleStartProtection}
            >
              <Text style={styles.controlIcon}>▶️</Text>
              <Text style={styles.controlLabelText}>Start Live Protection</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.controlBtn, styles.stopBtn]}
              onPress={handleStopMonitoring}
            >
              <Text style={styles.controlIcon}>⏹️</Text>
              <Text style={styles.controlLabelText}>Stop Monitoring</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.controlBtn, styles.uploadBtn]} onPress={handlePickAudioFile}>
            {isUploading ? (
              <ActivityIndicator color={C.text} size="small" />
            ) : (
              <>
                <Text style={styles.controlIcon}>📁</Text>
                <Text style={styles.controlLabelText}>Upload Audio</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Real-Time Detection Timeline */}
        <Text style={styles.sectionTitle}>Real-Time Detection Timeline (2-3s Chunks)</Text>

        {chunkTimeline.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <ActivityIndicator color={C.accent} size="small" />
            <Text style={styles.emptyText}>Monitoring live audio stream... Chunks will appear here.</Text>
          </GlassCard>
        ) : (
          chunkTimeline.map((item) => (
            <GlassCard key={item.chunkId} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <Text style={styles.timelineChunkNum}>Chunk #{item.chunkId}</Text>
                <Text style={styles.timelineTime}>{item.timeLabel}</Text>
              </View>

              <View
                style={[
                  styles.timelineBadge,
                  {
                    backgroundColor:
                      item.riskLevel === 'scam'
                        ? C.dangerDim
                        : item.riskLevel === 'suspicious'
                        ? C.warningDim
                        : C.successDim,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timelineBadgeText,
                    {
                      color:
                        item.riskLevel === 'scam'
                          ? C.danger
                          : item.riskLevel === 'suspicious'
                          ? C.warning
                          : C.success,
                    },
                  ]}
                >
                  {item.predictedLabel.toUpperCase()} ({item.confidencePercent}%)
                </Text>
              </View>
            </GlassCard>
          ))
        )}

        {/* End Call Action */}
        <TouchableOpacity
          style={styles.endCallButton}
          onPress={() => {
            handleStopMonitoring();
          }}
        >
          <Text style={styles.endCallButtonText}>⛔ End Call & View Final Security Report</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Combined Final Security Report Modal */}
      <LiveCallReportModal
        visible={showReportModal}
        reportData={finalReportData}
        onClose={() => {
          setShowReportModal(false);
          onEndCall();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
  },
  callerHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  callerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  callerAvatarText: {
    fontSize: 28,
  },
  callerName: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    marginBottom: 2,
  },
  callerSub: {
    fontSize: 13,
    color: C.textMuted,
  },
  speakerHintCard: {
    padding: 14,
    marginBottom: 16,
    borderColor: C.warning,
  },
  speakerHintTitle: {
    color: C.warning,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  speakerHintText: {
    color: C.textSec,
    fontSize: 12,
    lineHeight: 18,
  },
  audioNoticeCard: {
    padding: 14,
    marginBottom: 16,
    borderColor: C.warning,
    backgroundColor: C.warningDim,
  },
  audioNoticeTitle: {
    color: C.warning,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  audioNoticeText: {
    color: C.textSec,
    fontSize: 12,
    lineHeight: 18,
  },
  statusCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  statusSub: {
    fontSize: 12,
    color: C.textSec,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  controlBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startBtn: {
    backgroundColor: C.success,
  },
  stopBtn: {
    backgroundColor: C.warning,
  },
  uploadBtn: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  controlIcon: {
    fontSize: 16,
  },
  controlLabelText: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 10,
  },
  timelineLeft: {
    flex: 1,
  },
  timelineChunkNum: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 11,
    color: C.textMuted,
  },
  timelineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  timelineBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  endCallButton: {
    height: 52,
    backgroundColor: C.danger,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  endCallButtonText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '800',
  },
});
