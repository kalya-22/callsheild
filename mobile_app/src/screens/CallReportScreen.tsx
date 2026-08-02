import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { CircularGauge } from '../components/CircularGauge';

interface CallReportScreenProps {
  onBack: () => void;
  reportItem?: any;
}

export function CallReportScreen({ onBack, reportItem }: CallReportScreenProps) {
  const filename = reportItem?.filename ?? 'sample_vishing_recording.wav';
  const score = Math.round((reportItem?.ai_probability ?? 0.89) * 100);
  const isHighRisk = score >= 65;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Bar */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Call Security Report</Text>
        </View>

        {/* Overview Gauge Card */}
        <GlassCard bright style={styles.overviewCard}>
          <Text style={styles.fileName}>{filename}</Text>
          <Text style={styles.fileTime}>Analyzed Today at 10:42 AM</Text>

          <View style={styles.gaugeCenter}>
            <CircularGauge
              value={score}
              size={150}
              color={isHighRisk ? C.danger : C.success}
              label={`${score}%`}
              sublabel="AI Probability"
            />
          </View>

          <View style={[styles.verdictBadge, { backgroundColor: isHighRisk ? C.dangerDim : C.successDim }]}>
            <Text style={[styles.verdictText, { color: isHighRisk ? C.danger : C.success }]}>
              {isHighRisk ? '🚨 AI-GENERATED VISHING VOICE' : '🛡️ VERIFIED HUMAN VOICE'}
            </Text>
          </View>
        </GlassCard>

        {/* Detailed Breakdown */}
        <Text style={styles.sectionTitle}>Model Evidence Summary</Text>

        <GlassCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Voice Synthesis Score:</Text>
            <Text style={styles.infoVal}>0.89 / 1.00</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Spectral Pitch Variance:</Text>
            <Text style={styles.infoVal}>Unnatural Flat Cadence</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Audio Format:</Text>
            <Text style={styles.infoVal}>WAV 16kHz Mono</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Processed Chunks:</Text>
            <Text style={styles.infoVal}>4 Chunks (100% Analyzed)</Text>
          </View>
        </GlassCard>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.exportBtn} onPress={onBack}>
          <Text style={styles.exportBtnText}>Export Evidence Log (PDF)</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: C.card,
    marginRight: 12,
  },
  backBtnText: {
    color: C.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
  },
  overviewCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  fileTime: {
    fontSize: 12,
    color: C.textMuted,
    marginBottom: 16,
  },
  gaugeCenter: {
    marginBottom: 16,
  },
  verdictBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  verdictText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  infoCard: {
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: C.textSec,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
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
    fontSize: 15,
    fontWeight: '700',
  },
});
