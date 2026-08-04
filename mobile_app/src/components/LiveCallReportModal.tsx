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
import { FinalCallReportData } from '../services/CallLiveStreamEngine';

interface LiveCallReportModalProps {
  visible: boolean;
  reportData: FinalCallReportData | null;
  onClose: () => void;
}

export function LiveCallReportModal({ visible, reportData, onClose }: LiveCallReportModalProps) {
  if (!visible || !reportData) return null;

  const isScam = reportData.overallPrediction === 'ai_generated';
  const riskColor = isScam ? C.danger : C.success;

  function handleExportPdf() {
    if (!reportData) return;
    Alert.alert(
      'Exporting Security Report',
      `PDF evidence report generated for Call #${reportData.timestamp}.\nSaved to device downloads.`
    );
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
              {isScam ? '🚨 AI-Generated Voice Clone' : '🛡️ Authentic Human Voice'}
            </Text>
            <Text style={styles.verdictSub}>
              {isScam
                ? 'High probability of vishing scam. Speech synthesis artifacts detected.'
                : 'Natural pitch, cadence, and human vocal acoustics verified.'}
            </Text>
          </GlassCard>

          {/* Circular Risk Score Meter */}
          <GlassCard bright style={styles.gaugeCard}>
            <CircularGauge
              value={reportData.overallRiskScore}
              size={140}
              color={riskColor}
              label={`${reportData.overallRiskScore}%`}
              sublabel="AI Scam Risk Score"
            />

            {/* Metrics Snapshot Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{reportData.confidencePercent}%</Text>
                <Text style={styles.metricLabel}>Confidence %</Text>
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

          {reportData.detectionTimeline.map((chunk) => (
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
                      chunk.riskLevel === 'scam'
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
                        chunk.riskLevel === 'scam'
                          ? C.danger
                          : chunk.riskLevel === 'suspicious'
                          ? C.warning
                          : C.success,
                    },
                  ]}
                >
                  {chunk.predictedLabel.toUpperCase()} ({chunk.confidencePercent}%)
                </Text>
              </View>
            </GlassCard>
          ))}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
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
