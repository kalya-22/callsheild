import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { CallShieldApi } from '../services/CallShieldApi';

export default function HomeScreen() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await CallShieldApi.getStatus();
      setBackendStatus(res.status === 'ready' || res.status === 'healthy' ? 'Online' : 'Connected');
      setErrorMsg(null);
    } catch (e) {
      setBackendStatus('Offline');
    }
  };

  const pickAudio = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        const file = res.assets[0];
        setSelectedFile(file.name);
        setLoading(true);
        setErrorMsg(null);
        setResult(null);

        const prediction = await CallShieldApi.predictAudioFile(file.uri, file.name);
        setResult(prediction);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const isHighRisk = result?.warning;
  const riskColor = isHighRisk ? '#EF4444' : '#10B981';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CallShield AI</Text>
          <TouchableOpacity style={[styles.statusBadge, { borderColor: backendStatus === 'Offline' ? '#EF4444' : '#10B981' }]} onPress={checkStatus}>
            <View style={[styles.statusDot, { backgroundColor: backendStatus === 'Offline' ? '#EF4444' : '#10B981' }]} />
            <Text style={[styles.statusText, { color: backendStatus === 'Offline' ? '#EF4444' : '#10B981' }]}>
              {backendStatus === 'Offline' ? 'API Offline' : 'ML API Connected'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroSub}>AI VOICE & VISHING DETECTOR</Text>
          <Text style={styles.heroTitle}>Analyze Speech Files</Text>
          <Text style={styles.heroDesc}>
            Upload recorded phone calls or WAV audio files. Our ML feature extraction model detects neural synthetic voice anomalies in real time.
          </Text>

          <TouchableOpacity style={styles.uploadBtn} onPress={pickAudio} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.uploadBtnText}>Upload & Detect Audio</Text>
            )}
          </TouchableOpacity>

          {selectedFile && <Text style={styles.fileLabel}>Selected: {selectedFile}</Text>}
        </View>

        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Prediction Result */}
        {result && (
          <View style={[styles.resultCard, { borderColor: riskColor }]}>
            <Text style={[styles.riskBadge, { color: riskColor }]}>
              {result.risk_level.toUpperCase()} RISK
            </Text>
            <Text style={styles.resultDisplayLabel}>
              {result.predicted_label === 'ai_generated' ? 'AI-Generated Voice Detected' : 'Human Voice Appears Safe'}
            </Text>
            <Text style={styles.confidenceText}>
              AI Confidence: {(result.ai_probability * 100).toFixed(1)}%
            </Text>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${result.ai_probability * 100}%`, backgroundColor: riskColor }]} />
            </View>

            {result.chunk_predictions && result.chunk_predictions.length > 0 && (
              <View style={styles.chunksContainer}>
                <Text style={styles.chunksTitle}>Chunk-Wise Analysis</Text>
                {result.chunk_predictions.map((chunk: any, i: number) => (
                  <View key={i} style={styles.chunkRow}>
                    <Text style={styles.chunkTime}>
                      {chunk.start_time_seconds.toFixed(1)}s - {chunk.end_time_seconds.toFixed(1)}s
                    </Text>
                    <Text style={{ color: chunk.ai_probability > 0.5 ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>
                      {(chunk.ai_probability * 100).toFixed(0)}% AI
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  heroCard: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#334155', marginTop: 10 },
  heroSub: { color: '#38BDF8', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },
  heroTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  heroDesc: { color: '#94A3B8', fontSize: 13, marginTop: 6, lineHeight: 18 },
  uploadBtn: { backgroundColor: '#2563EB', borderRadius: 14, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  uploadBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  fileLabel: { color: '#CBD5E1', fontSize: 12, marginTop: 10 },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: '#EF4444' },
  errorText: { color: '#FCA5A5', fontSize: 13 },
  resultCard: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20, marginTop: 20, borderWidth: 1.5 },
  riskBadge: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  resultDisplayLabel: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  confidenceText: { color: '#94A3B8', fontSize: 14, marginTop: 8 },
  progressTrack: { height: 8, backgroundColor: '#334155', borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  chunksContainer: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  chunksTitle: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  chunkRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  chunkTime: { color: '#CBD5E1', fontSize: 13 },
});
