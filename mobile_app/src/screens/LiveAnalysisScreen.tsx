import React, { useState } from 'react';
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
import { CircularGauge } from '../components/CircularGauge';
import { CallShieldApi } from '../../services/CallShieldApi';

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
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleUploadNewFile() {
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
        asset.name || 'audio_sample.wav',
        asset.mimeType || 'audio/wav',
        fileBlob
      );

      setAnalysisResult(result);
      setIsUploading(false);
    } catch (err: any) {
      setIsUploading(false);
      Alert.alert('Upload Error', err.message || 'Failed to analyze uploaded audio file.');
    }
  }

  const riskScore = analysisResult
    ? Math.round((analysisResult.ai_probability ?? 0.85) * 100)
    : 89;

  const chunks = analysisResult?.chunk_predictions
    ? analysisResult.chunk_predictions.map((chunk: any, index: number) => ({
        id: index + 1,
        score: Math.round((chunk.ai_probability ?? 0.8) * 100),
        label: chunk.predicted_label || 'ai_generated',
        time: `00:0${index * 5} - 00:0${(index + 1) * 5}`,
      }))
    : [
        { id: 4, score: 92, label: 'ai_generated', time: '00:16 - 00:20' },
        { id: 3, score: 87, label: 'ai_generated', time: '00:11 - 00:15' },
        { id: 2, score: 88, label: 'ai_generated', time: '00:06 - 00:10' },
        { id: 1, score: 24, label: 'human', time: '00:00 - 00:05' },
      ];

  const isHighRisk = riskScore >= 65;

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

        {/* Upload Audio File Action */}
        <GlassCard bright style={styles.uploadCard}>
          <View style={styles.uploadRow}>
            <View style={styles.uploadTextContainer}>
              <Text style={styles.uploadTitle}>Analyze Local Audio File</Text>
              <Text style={styles.uploadSub}>
                Upload .wav or .mp3 to process with backend AI neural network.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.uploadBtn, isUploading && styles.uploadBtnDisabled]}
              onPress={handleUploadNewFile}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color={C.bgDeep} size="small" />
              ) : (
                <Text style={styles.uploadBtnText}>Upload File</Text>
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Gauge Card */}
        <GlassCard bright style={styles.gaugeCard}>
          <Text style={styles.cardHeaderTag}>OVERALL THREAT ASSESSMENT</Text>
          <View style={styles.gaugeCenter}>
            <CircularGauge
              value={riskScore}
              size={150}
              color={isHighRisk ? C.danger : C.success}
              label={`${riskScore}%`}
              sublabel="AI Scam Risk"
            />
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{riskScore}%</Text>
              <Text style={styles.metricLabel}>Current Score</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{chunks.length} Chunks</Text>
              <Text style={styles.metricLabel}>AI Chunks</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: isHighRisk ? C.danger : C.success }]}>
                {isHighRisk ? 'AI Scam' : 'Human'}
              </Text>
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
            onPress={onTriggerSafe}
          >
            <Text style={styles.demoBtnText}>🛡️ View Safe Result</Text>
          </TouchableOpacity>
        </View>

        {/* Chunk Breakdown List */}
        <Text style={styles.sectionTitle}>Audio Stream Chunks Breakdown</Text>

        {chunks.map((chunk: any) => (
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
  uploadCard: {
    padding: 14,
    marginBottom: 16,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
    marginBottom: 2,
  },
  uploadSub: {
    fontSize: 11,
    color: C.textSec,
  },
  uploadBtn: {
    paddingHorizontal: 14,
    height: 38,
    backgroundColor: C.accent,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnDisabled: {
    opacity: 0.7,
  },
  uploadBtnText: {
    color: C.bgDeep,
    fontSize: 12,
    fontWeight: '800',
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
