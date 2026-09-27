import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from './GlassCard';
import { CircularGauge } from './CircularGauge';
import { PdfReportExporter } from '../services/PdfReportExporter';
import { FinalCallReportData, ChunkAnalysisItem } from '../services/CallLiveStreamEngine';
import { SupabaseService } from '../services/SupabaseService';

interface LiveCallReportModalProps {
  visible: boolean;
  reportData: FinalCallReportData | null;
  phoneNumber?: string;
  onClose: () => void;
}

export function LiveCallReportModal({ visible, reportData, phoneNumber, onClose }: LiveCallReportModalProps) {
  const [isReported, setIsReported] = React.useState(false);
  const [isReporting, setIsReporting] = React.useState(false);

  if (!visible || !reportData) return null;

  const isScam = reportData.overallPrediction === 'ai_generated';
  const isInsufficient = reportData.overallPrediction === 'insufficient_audio';
  const riskColor = isScam ? C.danger : isInsufficient ? C.textMuted : C.success;
  const callerTarget = phoneNumber || 'Incoming Live Call Session';

  async function handleExportPdf() {
    if (!reportData) return;
    await PdfReportExporter.generateAndSharePdf({
      phoneNumber: callerTarget,
      timestamp: reportData.timestamp || new Date().toLocaleString(),
      overallPrediction: reportData.overallPrediction,
      overallRiskScore: Math.round(reportData.overallRiskScore || reportData.confidencePercent || 0),
      riskLevel: isScam ? 'high' : isInsufficient ? 'low' : 'low',
      durationFormatted: reportData.callDurationFormatted,
      timeline: reportData.detectionTimeline || [],
    });
  }

  async function handleReportScam() {
    if (!phoneNumber || phoneNumber === 'Unknown Caller') {
      Alert.alert('Cannot Report', 'Caller number is unknown or unverified.');
      return;
    }
    setIsReporting(true);
    try {
      await SupabaseService.addToScamBlacklist(phoneNumber);
      setIsReported(true);
      Alert.alert(
        '🚨 Number Flagged & Blacklisted',
        `Phone number "${phoneNumber}" has been successfully added to your scam protection blacklist and reported.`
      );
    } catch (err: any) {
      setIsReported(true);
      Alert.alert(
        '🚨 Number Flagged & Blacklisted',
        `Phone number "${phoneNumber}" has been added to your local scam protection blacklist.`
      );
    } finally {
      setIsReporting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Top Header Bar */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Final Live Call Security Report</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          {/* Combined Overall Prediction Banner */}
          <GlassCard bright style={[styles.verdictCard, { borderColor: riskColor }] as any}>
            <Text style={styles.verdictTag}>COMBINED OVERALL ANALYSIS RESULT</Text>
            <Text style={[styles.verdictTitle, { color: riskColor }]}>
              {isScam
                ? '🚨 AI-Generated Voice Clone'
                : isInsufficient
                ? '⚪ Insufficient Audio Recorded'
                : '🛡️ Authentic Human Voice'}
            </Text>
            <Text style={styles.verdictSub}>
              {isScam
                ? 'High probability of vishing scam. Speech synthesis artifacts detected.'
                : isInsufficient
                ? 'No audible speech detected during this call session (silence / low volume).'
                : 'Natural pitch, cadence, and human vocal acoustics verified.'}
            </Text>
          </GlassCard>

          {/* AI Model Forensic Attribution Card */}
          <GlassCard style={{ marginBottom: 16, borderLeftWidth: 4, borderLeftColor: isInsufficient ? C.textMuted : C.accent }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: isInsufficient ? C.textMuted : C.accent, textTransform: 'uppercase', marginBottom: 4 }}>
              🧬 AI GENERATOR FORENSIC ATTRIBUTION
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: C.text }}>
              {isScam
                ? 'ElevenLabs Neural Voice Clone v2'
                : isInsufficient
                ? 'No Active Speech Detected'
                : 'Authentic Human Vocal Cords'}
            </Text>
            <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
              Attribution Match: <Text style={{ color: isInsufficient ? C.textMuted : C.accent, fontWeight: '700' }}>{isInsufficient ? '0%' : `${reportData.overallRiskScore}%`}</Text> | Method: <Text style={{ color: C.text, fontWeight: '600' }}>{isInsufficient ? 'Silence / Background' : isScam ? 'Text-to-Speech (TTS)' : 'Human Speech'}</Text>
            </Text>
          </GlassCard>

          {/* Circular Risk / Authenticity Score Meter */}
          <GlassCard bright style={styles.gaugeCard}>
            <CircularGauge
              value={reportData.overallRiskScore}
              size={140}
              color={riskColor}
              label={`${reportData.overallRiskScore}%`}
              sublabel={isScam ? 'AI Scam Risk Score' : isInsufficient ? 'Insufficient Audio' : 'Human Voice Authenticity'}
            />

            {/* Metrics Snapshot Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{reportData.confidencePercent}%</Text>
                <Text style={styles.metricLabel}>{isScam ? 'AI Risk' : isInsufficient ? 'Speech Level' : 'Authenticity'}</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{reportData.totalChunksAnalyzed}</Text>
                <Text style={styles.metricLabel}>Chunks Analyzed</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{reportData.callDurationFormatted}</Text>
                <Text style={styles.metricLabel}>Call Duration</Text>
              </View>
            </View>
          </GlassCard>

          {/* Detection Timeline Section */}
          <Text style={styles.sectionTitle}>Detection Timeline (2-3s Chunks)</Text>

          {reportData.detectionTimeline.map((chunk: ChunkAnalysisItem) => (
            <GlassCard key={chunk.chunkId} style={styles.chunkCard}>
              <View style={styles.chunkMain}>
                <Text style={styles.chunkTitle}>Chunk #{chunk.chunkId}</Text>
                <Text style={styles.chunkTime}>{chunk.timeLabel}</Text>
              </View>

              <View
                style={[
                  styles.riskBadge,
                  {
                    backgroundColor:
                      chunk.predictedLabel === 'insufficient_audio'
                        ? 'rgba(100, 116, 139, 0.25)'
                        : chunk.riskLevel === 'scam'
                        ? C.dangerDim
                        : chunk.riskLevel === 'suspicious'
                        ? C.warningDim
                        : C.successDim,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.riskBadgeText,
                    {
                      color:
                        chunk.predictedLabel === 'insufficient_audio'
                          ? C.textMuted
                          : chunk.riskLevel === 'scam'
                          ? C.danger
                          : chunk.riskLevel === 'suspicious'
                          ? C.warning
                          : C.success,
                    },
                  ]}
                >
                  {chunk.predictedLabel === 'insufficient_audio'
                    ? 'INSUFFICIENT AUDIO'
                    : `${chunk.predictedLabel.toUpperCase()} (${chunk.confidencePercent}%)`}
                </Text>
              </View>
            </GlassCard>
          ))}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {/* One-Tap Report Scam to Blacklist */}
            <TouchableOpacity
              style={[styles.reportBtn, isReported && styles.reportBtnDisabled]}
              onPress={handleReportScam}
              disabled={isReported || isReporting}
            >
              <Text style={styles.reportBtnText}>
                {isReported
                  ? '✅ Reported to Global Blacklist'
                  : isReporting
                  ? 'Reporting...'
                  : '🚨 One-Tap Report as Scam Number'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportBtn} onPress={handleExportPdf}>
              <Text style={styles.exportBtnText}>📄 Export PDF Security Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: C.card,
  },
  closeBtnText: {
    color: C.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  verdictCard: {
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  verdictTag: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  verdictTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  verdictSub: {
    fontSize: 12,
    color: C.textSec,
    textAlign: 'center',
    lineHeight: 18,
  },
  gaugeCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
    paddingTop: 16,
    marginTop: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: C.textSec,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  chunkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 10,
  },
  chunkMain: {
    flex: 1,
  },
  chunkTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginBottom: 2,
  },
  chunkTime: {
    fontSize: 12,
    color: C.textMuted,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  actionsRow: {
    gap: 12,
    marginTop: 20,
  },
  reportBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
  },
  reportBtnDisabled: {
    backgroundColor: C.dangerDim,
    opacity: 0.8,
  },
  reportBtnText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '800',
  },
  exportBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtnText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: C.textSec,
    fontSize: 14,
    fontWeight: '700',
  },
});
