import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { ShieldLogo } from '../components/ShieldLogo';
import { callInterceptorService } from '../services/CallInterceptorService';
import { callWebSocketService } from '../services/CallWebSocketService';
import { CallShieldApi } from '../../services/CallShieldApi';

interface LiveCallScreenProps {
  onEndCall: () => void;
}

export function LiveCallScreen({ onEndCall }: LiveCallScreenProps) {
  const [seconds, setSeconds] = useState(0);
  const [riskLevel, setRiskLevel] = useState<'safe' | 'suspicious' | 'scam'>('safe');
  const [confidence, setConfidence] = useState(96);
  const [isMuted, setIsMuted] = useState(false);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // Start live WebSocket stream and interceptor listener
    callWebSocketService.connect();
    callInterceptorService.startListening((threatData) => {
      const prob = threatData.probability ?? 89;
      setConfidence(prob);
      setRiskLevel(prob >= 65 ? 'scam' : prob >= 40 ? 'suspicious' : 'safe');
    });

    const unsubscribe = callWebSocketService.onPrediction((data) => {
      const aiProb = Math.round((data.ai_probability ?? 0.85) * 100);
      setConfidence(aiProb);
      setRiskLevel(aiProb >= 65 ? 'scam' : aiProb >= 40 ? 'suspicious' : 'safe');
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
      callInterceptorService.stopListening();
    };
  }, []);

  async function handleAnalyzeAudioFile() {
    try {
      setIsAnalyzingFile(true);

      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        setIsAnalyzingFile(false);
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

      setIsAnalyzingFile(false);

      const score = Math.round((result.ai_probability ?? 0.85) * 100);
      setConfidence(score);
      setRiskLevel(score >= 65 ? 'scam' : score >= 40 ? 'suspicious' : 'safe');

      Alert.alert(
        'Live Call Analysis Result',
        `File: ${asset.name}\nPrediction: ${result.predicted_label}\nAI Confidence: ${score}%`
      );
    } catch (err: any) {
      setIsAnalyzingFile(false);
      Alert.alert('Analysis Error', err.message || 'Failed to analyze live call audio');
    }
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Caller Details Header */}
        <View style={styles.callerHeader}>
          <View style={styles.callerAvatar}>
            <Text style={styles.callerAvatarText}>📞</Text>
          </View>
          <Text style={styles.callerName}>+91 98765 43210</Text>
          <Text style={styles.callerSub}>Active Call · {formatTimer(seconds)}</Text>
        </View>

        {/* Live Protection Status */}
        <GlassCard bright style={styles.statusCard}>
          <ShieldLogo size={60} animate />
          <Text style={styles.statusTitle}>
            {riskLevel === 'scam'
              ? '🚨 SCAM THREAT DETECTED'
              : riskLevel === 'suspicious'
              ? '⚠️ SUSPICIOUS VOICE PATTERN'
              : '🛡️ AI Protection Active'}
          </Text>
          <Text style={styles.statusSub}>
            {riskLevel === 'scam'
              ? `Voice patterns match known vishing scam profile (${confidence}% AI Risk)`
              : riskLevel === 'suspicious'
              ? `Unusual voice frequency spectrum detected (${confidence}% Risk)`
              : 'Analyzing live audio stream with machine learning in real-time'}
          </Text>

          {/* Risk Level Badge */}
          <View
            style={[
              styles.riskBadge,
              {
                backgroundColor:
                  riskLevel === 'scam'
                    ? C.dangerDim
                    : riskLevel === 'suspicious'
                    ? C.warningDim
                    : C.successDim,
                borderColor:
                  riskLevel === 'scam'
                    ? C.danger
                    : riskLevel === 'suspicious'
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
                    riskLevel === 'scam'
                      ? C.danger
                      : riskLevel === 'suspicious'
                      ? C.warning
                      : C.success,
                },
              ]}
            >
              {riskLevel === 'scam'
                ? `HIGH RISK (${confidence}%)`
                : riskLevel === 'suspicious'
                ? `SUSPICIOUS (${confidence}%)`
                : `SAFE (${confidence}%)`}
            </Text>
          </View>
        </GlassCard>

        {/* Upload Audio Stream for Real Analysis */}
        <GlassCard style={styles.actionUploadCard}>
          <View style={styles.actionUploadText}>
            <Text style={styles.actionUploadTitle}>Test Audio File on Active Call</Text>
            <Text style={styles.actionUploadSub}>
              Pass an audio file through live ML pipeline
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.uploadBtn, isAnalyzingFile && styles.uploadBtnDisabled]}
            onPress={handleAnalyzeAudioFile}
            disabled={isAnalyzingFile}
          >
            {isAnalyzingFile ? (
              <ActivityIndicator color={C.bgDeep} size="small" />
            ) : (
              <Text style={styles.uploadBtnText}>Upload & Analyze</Text>
            )}
          </TouchableOpacity>
        </GlassCard>

        {/* Call Control Buttons */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎙️'}</Text>
            <Text style={styles.controlLabel}>{isMuted ? 'Muted' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, styles.hangupBtn]}
            onPress={onEndCall}
          >
            <Text style={styles.controlIcon}>⛔</Text>
            <Text style={[styles.controlLabel, styles.hangupText]}>
              {riskLevel === 'scam' ? 'BLOCK & HANG UP' : 'End Call'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  callerHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  callerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  callerAvatarText: {
    fontSize: 32,
  },
  callerName: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
    marginBottom: 4,
  },
  callerSub: {
    fontSize: 13,
    color: C.textMuted,
  },
  statusCard: {
    padding: 24,
    alignItems: 'center',
    marginVertical: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  statusSub: {
    fontSize: 12,
    color: C.textSec,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  riskBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionUploadCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionUploadText: {
    flex: 1,
    marginRight: 10,
  },
  actionUploadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  actionUploadSub: {
    fontSize: 11,
    color: C.textMuted,
  },
  uploadBtn: {
    paddingHorizontal: 12,
    height: 36,
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
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  controlBtn: {
    flex: 1,
    height: 60,
    backgroundColor: C.card,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  controlBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: C.danger,
  },
  hangupBtn: {
    backgroundColor: C.danger,
    borderColor: C.danger,
  },
  controlIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text,
  },
  hangupText: {
    color: C.text,
    fontWeight: '800',
  },
});
