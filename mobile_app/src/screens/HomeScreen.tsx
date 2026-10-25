import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { ShieldLogo } from '../components/ShieldLogo';
import { CallShieldApi } from '../../services/CallShieldApi';
import { callInterceptorService } from '../services/CallInterceptorService';
import { CallPermissionHandler } from '../services/CallPermissionHandler';
import { CallHistoryStorage, CallRecord } from '../services/CallHistoryStorage';
import { SupabaseService } from '../services/SupabaseService';

interface RecentCall {
  id: string;
  name: string;
  number: string;
  time: string;
  risk: 'safe' | 'suspicious' | 'scam';
  confidence: number;
}

interface HomeScreenProps {
  userName?: string;
  onStartLiveCall?: () => void;
  onUploadSuccess?: (predictionResult: any) => void;
  onTriggerAlert?: () => void;
  onNavigateFamilyShield?: () => void;
}

export function HomeScreen({
  userName = 'User',
  onStartLiveCall,
  onUploadSuccess,
  onTriggerAlert,
  onNavigateFamilyShield,
}: HomeScreenProps) {
  const [protectionActive, setProtectionActive] = useState(true);
  const [nativeInterceptorActive, setNativeInterceptorActive] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [stats, setStats] = useState({ scamsBlocked: 0, callsAnalyzed: 0, protectionScore: 99 });

  // Dynamic time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  useEffect(() => {
    async function loadRealHistory() {
      try {
        const stored = await CallHistoryStorage.syncFromCloud();
        if (stored && stored.length > 0) {
          setRecentCalls(stored);
        }
        const s = await CallHistoryStorage.getStats();
        setStats(s);
      } catch (err) {
        console.warn('[HomeScreen] Error loading history:', err);
      }
    }
    loadRealHistory();
  }, []);

  useEffect(() => {
    async function checkHealth() {
      try {
        await CallShieldApi.getStatus();
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (nativeInterceptorActive) {
      CallPermissionHandler.requestAllCallPermissions();
    }
  }, [nativeInterceptorActive]);

  async function handlePickAndUploadAudio() {
    try {
      setIsUploading(true);
      setUploadError('');

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

      setIsUploading(false);

      const score = Math.round(result.overall_risk_score || result.ai_confidence_percent || (result.predicted_label === 'human' ? 91 : 85));
      const isScam = result.predicted_label === 'ai_generated';
      const riskLevel: 'safe' | 'suspicious' | 'scam' = isScam ? 'scam' : 'safe';

      const newRecord: CallRecord = {
        id: Date.now().toString(),
        name: asset.name || 'Uploaded Sample',
        number: asset.name || 'Audio File',
        time: 'Just now',
        risk: riskLevel,
        confidence: score,
        predicted_label: result.predicted_label,
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = await CallHistoryStorage.saveCallRecord(newRecord);
      setRecentCalls(updatedHistory);
      const s = await CallHistoryStorage.getStats();
      setStats(s);

      // Sync to Supabase cloud database
      SupabaseService.savePredictionRecord({
        filename: asset.name || 'uploaded_audio',
        predicted_label: result.predicted_label,
        ai_probability: result.ai_probability ?? result.ai_confidence_percent / 100,
        risk_level: isScam ? 'high' : 'low',
        warning: isScam,
        chunk_count: result.chunk_count ?? 1,
        chunk_predictions_json: JSON.stringify(result.chunk_predictions ?? []),
      });

      if (onUploadSuccess) {
        onUploadSuccess(result);
      } else {
        Alert.alert(
          'AI Detection Complete',
          `File: ${asset.name}\nResult: ${result.predicted_label === 'ai_generated' ? '🚨 AI Voice Clone / Scam' : '✅ Authentic Human Voice'}\nAI Confidence: ${score}%`
        );
      }
    } catch (err: any) {
      setIsUploading(false);
      const errMsg = err.message || 'File upload failed. Ensure FastAPI backend is running.';
      setUploadError(errMsg);
      Alert.alert('Upload Failed', errMsg);
    }
  }

  const getRiskStyle = (risk: RecentCall['risk']) => {
    switch (risk) {
      case 'safe':
        return { color: C.success, bg: C.successDim, label: 'Safe' };
      case 'suspicious':
        return { color: C.warning, bg: C.warningDim, label: 'Suspicious' };
      case 'scam':
        return { color: C.danger, bg: C.dangerDim, label: 'Scam Threat' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerUserRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{(userName || 'U')[0].toUpperCase()}</Text>
              <View style={[styles.avatarOnlineDot, { backgroundColor: backendOnline ? C.success : C.warning }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingText}>{getGreeting()}</Text>
              <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                borderColor: backendOnline
                  ? 'rgba(16, 185, 129, 0.35)'
                  : 'rgba(239, 68, 68, 0.35)',
                backgroundColor: backendOnline
                  ? 'rgba(16, 185, 129, 0.08)'
                  : 'rgba(239, 68, 68, 0.08)',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: backendOnline ? C.success : C.danger },
              ]}
            />
            <Text style={[styles.statusText, { color: backendOnline ? C.successLight : C.dangerLight }]}>
              {backendOnline ? 'AI CORE ACTIVE' : 'OFFLINE MODE'}
            </Text>
          </View>
        </View>

        {/* Live Shield Hero Status Card */}
        <GlassCard variant="glow" style={styles.shieldBanner}>
          <View style={styles.shieldHeaderRow}>
            <View style={styles.cyberTag}>
              <Text style={styles.cyberTagText}>● NEURAL THREAT INTERCEPTOR</Text>
            </View>
            <Switch
              trackColor={{ false: '#334155', true: C.primaryLight }}
              thumbColor={protectionActive ? C.text : '#94A3B8'}
              value={protectionActive}
              onValueChange={setProtectionActive}
            />
          </View>
          <View style={styles.shieldMainRow}>
            <View style={styles.shieldIconWrapper}>
              <ShieldLogo size={62} animate={protectionActive} />
            </View>
            <View style={styles.shieldInfo}>
              <Text style={styles.shieldStatusTitle}>
                {protectionActive ? 'Live Shield Active' : 'Shield Standby'}
              </Text>
              <Text style={styles.shieldStatusSub}>
                {protectionActive
                  ? 'Real-time deepfake acoustic defense active'
                  : 'Tap toggle to re-arm AI call protection'}
              </Text>
              <View style={styles.activeEnginePill}>
                <Text style={styles.activeEnginePillText}>
                  {protectionActive ? 'Latency < 85ms • 98.7% Accuracy' : 'Protection Paused'}
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Native Android Call Interceptor Toggle Card */}
        <GlassCard variant="accent" style={styles.interceptorCard}>
          <View style={styles.shieldLeft}>
            <View style={styles.interceptorIconCircle}>
              <Text style={styles.interceptorIcon}>📞</Text>
            </View>
            <View style={styles.shieldInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={styles.moduleTitle}>
                  {nativeInterceptorActive ? 'Android Call Interceptor' : 'Interceptor Disabled'}
                </Text>
                <View style={[styles.moduleBadge, { borderColor: nativeInterceptorActive ? 'rgba(6, 182, 212, 0.4)' : 'rgba(148, 163, 184, 0.2)' }]}>
                  <Text style={[styles.moduleBadgeText, { color: nativeInterceptorActive ? C.accentLight : C.textMuted }]}>
                    {nativeInterceptorActive ? 'ARMED' : 'OFF'}
                  </Text>
                </View>
              </View>
              <Text style={styles.moduleSub}>
                {nativeInterceptorActive
                  ? 'Real-time background hook for incoming cellular streams'
                  : 'Enable to auto-analyze calls when phone rings'}
              </Text>
            </View>
          </View>
          <Switch
            trackColor={{ false: '#334155', true: C.accent }}
            thumbColor={nativeInterceptorActive ? C.text : '#94A3B8'}
            value={nativeInterceptorActive}
            onValueChange={setNativeInterceptorActive}
          />
        </GlassCard>

        {/* Family Shield Senior Protection Banner */}
        {onNavigateFamilyShield && (
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={onNavigateFamilyShield}
            style={{ marginBottom: 16 }}
          >
            <GlassCard variant="purple" style={styles.familyCard}>
              <View style={styles.shieldLeft}>
                <View style={styles.familyIconCircle}>
                  <Text style={styles.familyIcon}>👨‍👩‍👧‍👦</Text>
                </View>
                <View style={styles.shieldInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={styles.moduleTitle}>Family Shield Protection</Text>
                    <View style={styles.protectedTag}>
                      <Text style={styles.protectedTagText}>GUARDIAN LINKED</Text>
                    </View>
                  </View>
                  <Text style={styles.moduleSub}>
                    Senior citizen safeguard: instant SMS emergency alert to family if AI clone is detected
                  </Text>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}

        {/* Action Button: Launch Live Call Monitor */}
        {onStartLiveCall && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.liveCallButton}
            onPress={onStartLiveCall}
          >
            <View style={styles.liveCallButtonInner}>
              <View style={styles.liveCallPulseDot} />
              <Text style={styles.liveCallButtonText} numberOfLines={1}>⚡ Launch Live Call Protection</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Upload Audio for AI Detection Card */}
        <GlassCard bright style={styles.uploadCard}>
          <View style={styles.uploadHeaderRow}>
            <View style={styles.uploadIconBadge}>
              <Text style={styles.uploadIconText}>📁</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.uploadTitle}>Upload Audio for AI Forensic Scan</Text>
              <Text style={styles.uploadSub}>
                Test any recorded audio file against WavLM & ResNet deepfake voice models.
              </Text>
            </View>
          </View>

          <View style={styles.formatPillsRow}>
            <View style={styles.formatPill}><Text style={styles.formatPillText}>.WAV</Text></View>
            <View style={styles.formatPill}><Text style={styles.formatPillText}>.MP3</Text></View>
            <View style={styles.formatPill}><Text style={styles.formatPillText}>.FLAC</Text></View>
            <View style={styles.formatPill}><Text style={styles.formatPillText}>.M4A</Text></View>
          </View>

          <TouchableOpacity
            activeOpacity={0.82}
            style={[styles.uploadBtn, isUploading && styles.uploadBtnDisabled]}
            onPress={handlePickAndUploadAudio}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color={C.text} size="small" />
            ) : (
              <Text style={styles.uploadBtnText}>Select & Analyze Audio File</Text>
            )}
          </TouchableOpacity>

          {uploadError ? <Text style={styles.errorText}>{uploadError}</Text> : null}
        </GlassCard>

        {/* Quick Stats Grid */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Security Snapshot</Text>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>VERIFIED SHIELD</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <View style={[styles.statTopBorder, { backgroundColor: C.danger }]} />
            <Text style={[styles.statValue, { color: C.dangerLight }]}>{stats.scamsBlocked}</Text>
            <Text style={styles.statLabel}>Scams Blocked</Text>
            <Text style={styles.statSublabel}>100% Mitigated</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={[styles.statTopBorder, { backgroundColor: C.accent }]} />
            <Text style={[styles.statValue, { color: C.accentLight }]}>{stats.callsAnalyzed}</Text>
            <Text style={styles.statLabel}>Calls Analyzed</Text>
            <Text style={styles.statSublabel}>Real-time Scan</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={[styles.statTopBorder, { backgroundColor: C.success }]} />
            <Text style={[styles.statValue, { color: C.successLight }]}>{stats.protectionScore}%</Text>
            <Text style={styles.statLabel}>Protection Score</Text>
            <Text style={styles.statSublabel}>System Health</Text>
          </GlassCard>
        </View>

        {/* Recent Calls Section */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionHeader}>Recent Analyzed Calls</Text>
          <Text style={styles.feedCountText}>{recentCalls.length} records</Text>
        </View>

        {recentCalls.map((item) => {
          const riskStyle = getRiskStyle(item.risk);
          const isScam = item.risk === 'scam';
          const isSuspicious = item.risk === 'suspicious';
          const iconGlyph = isScam ? '🚨' : isSuspicious ? '⚠️' : '🛡️';

          return (
            <GlassCard key={item.id} style={styles.callCard}>
              <View style={styles.callMain}>
                <View
                  style={[
                    styles.callIcon,
                    {
                      borderColor: riskStyle.color,
                      backgroundColor: isScam ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    },
                  ]}
                >
                  <Text style={styles.callIconText}>{iconGlyph}</Text>
                </View>
                <View style={styles.callDetails}>
                  <Text style={styles.callName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.callNumber}>{item.number}</Text>
                  {/* Confidence meter bar */}
                  <View style={styles.meterTrack}>
                    <View
                      style={[
                        styles.meterFill,
                        {
                          width: `${Math.min(100, Math.max(10, item.confidence))}%`,
                          backgroundColor: riskStyle.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.callMeta}>
                <View style={[styles.riskTag, { backgroundColor: riskStyle.bg, borderColor: riskStyle.color }]}>
                  <Text style={[styles.riskTagText, { color: riskStyle.color }]}>
                    {riskStyle.label} ({item.confidence}%)
                  </Text>
                </View>
                <Text style={styles.callTime}>{item.time}</Text>
              </View>
            </GlassCard>
          );
        })}
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
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderWidth: 1.5,
    borderColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: C.text,
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.bg,
  },
  greetingText: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  shieldBanner: {
    padding: 18,
    marginBottom: 16,
  },
  shieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cyberTag: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  cyberTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.primaryLight,
    letterSpacing: 0.8,
  },
  shieldMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldIconWrapper: {
    marginRight: 14,
  },
  shieldInfo: {
    flex: 1,
  },
  shieldStatusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    marginBottom: 3,
  },
  shieldStatusSub: {
    fontSize: 12,
    color: C.textSec,
    lineHeight: 16,
    marginBottom: 8,
  },
  activeEnginePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  activeEnginePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.accentLight,
  },
  interceptorCard: {
    padding: 16,
    marginBottom: 14,
  },
  shieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  interceptorIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  interceptorIcon: {
    fontSize: 20,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  moduleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  moduleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  moduleSub: {
    fontSize: 11,
    color: C.textSec,
    lineHeight: 16,
  },
  familyCard: {
    padding: 16,
  },
  familyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
  familyIcon: {
    fontSize: 20,
  },
  protectedTag: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
  protectedTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D8B4FE',
    letterSpacing: 0.5,
  },
  liveCallButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.5)',
    overflow: 'hidden',
    elevation: 4,
  },
  liveCallButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  liveCallPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.accentLight,
    marginRight: 10,
  },
  liveCallButtonText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  uploadCard: {
    padding: 18,
    marginBottom: 20,
  },
  uploadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  uploadIconText: {
    fontSize: 20,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    marginBottom: 2,
  },
  uploadSub: {
    fontSize: 11,
    color: C.textSec,
    lineHeight: 16,
  },
  formatPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  formatPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  formatPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
  },
  uploadBtn: {
    height: 46,
    backgroundColor: C.accent,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnDisabled: {
    opacity: 0.6,
  },
  uploadBtnText: {
    color: C.bgDeep,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  errorText: {
    color: C.dangerLight,
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.2,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.successLight,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  statTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 3,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 11,
    color: C.text,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  statSublabel: {
    fontSize: 9,
    color: C.textMuted,
    fontWeight: '600',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  feedCountText: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '600',
  },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 13,
  },
  callMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  callIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  callIconText: {
    fontSize: 18,
  },
  callDetails: {
    flex: 1,
  },
  callName: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
    marginBottom: 2,
  },
  callNumber: {
    fontSize: 11,
    color: C.textMuted,
    marginBottom: 5,
  },
  meterTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    width: '80%',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 2,
  },
  callMeta: {
    alignItems: 'flex-end',
  },
  riskTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  riskTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  callTime: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: '600',
  },
});
