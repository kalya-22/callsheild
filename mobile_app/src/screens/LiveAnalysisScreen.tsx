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

interface LiveAnalysisScreenProps {
  onBack: () => void;
  onTriggerAlert: () => void;
  onTriggerSafe: () => void;
}

export function LiveAnalysisScreen({
  onBack,
  onTriggerAlert,
  onTriggerSafe,
}: LiveAnalysisScreenProps) {
  const riskScore = 89;
  const chunkCount = 4;
  const aiChunks = 3;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Real-Time AI Analysis</Text>
        </View>

        {/* Gauge Card */}
        <GlassCard bright style={styles.gaugeCard}>
          <Text style={styles.cardHeaderTag}>OVERALL THREAT ASSESSMENT</Text>
          <View style={styles.gaugeCenter}>
            <CircularGauge
              value={riskScore}
              size={150}
              color={C.danger}
              label={`${riskScore}%`}
              sublabel="AI Scam Risk"
            />
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>89%</Text>
              <Text style={styles.metricLabel}>Current Chunk</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>3 / 4</Text>
              <Text style={styles.metricLabel}>AI Chunks</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: C.danger }]}>Scam</Text>
              <Text style={styles.metricLabel}>Verdict</Text>
            </View>
          </View>
        </GlassCard>

        {/* Action Trigger Buttons for Demo */}
        <View style={styles.demoButtonsRow}>
          <TouchableOpacity
            style={[styles.demoBtn, { backgroundColor: C.danger }]}
            onPress={onTriggerAlert}
          >
            <Text style={styles.demoBtnText}>🚨 Trigger Scam Red Alert</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.demoBtn, { backgroundColor: C.success }]}
            onTriggerSafe={onTriggerSafe}
            onPress={onTriggerSafe}
          >
            <Text style={styles.demoBtnText}>🛡️ View Safe Result</Text>
          </TouchableOpacity>
        </View>

        {/* Chunk Breakdown List */}
        <Text style={styles.sectionTitle}>Audio Stream Chunks Breakdown</Text>

        {[
          { id: 4, score: 92, label: 'ai_generated', time: '00:16 - 00:20', threat: 'High' },
          { id: 3, score: 87, label: 'ai_generated', time: '00:11 - 00:15', threat: 'High' },
          { id: 2, score: 88, label: 'ai_generated', time: '00:06 - 00:10', threat: 'High' },
          { id: 1, score: 24, label: 'human', time: '00:00 - 00:05', threat: 'Low' },
        ].map((chunk) => (
          <GlassCard key={chunk.id} style={styles.chunkCard}>
            <View style={styles.chunkMain}>
              <Text style={styles.chunkTitle}>Chunk #{chunk.id}</Text>
              <Text style={styles.chunkTime}>{chunk.time}</Text>
            </View>

            <View style={styles.chunkRight}>
              <View
                style={[
                  styles.chunkBadge,
                  { backgroundColor: chunk.score > 60 ? C.dangerDim : C.successDim },
                ]}
              >
                <Text
                  style={[
                    styles.chunkBadgeText,
                    { color: chunk.score > 60 ? C.danger : C.success },
                  ]}
                >
                  {chunk.label.toUpperCase()} ({chunk.score}%)
                </Text>
              </View>
            </View>
          </GlassCard>
        ))}
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
  gaugeCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderTag: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  gaugeCenter: {
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
    paddingTop: 14,
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
  demoButtonsRow: {
    gap: 10,
    marginBottom: 24,
  },
  demoBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoBtnText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '700',
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
    marginBottom: 10,
    padding: 14,
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
  chunkRight: {
    alignItems: 'flex-end',
  },
  chunkBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  chunkBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
