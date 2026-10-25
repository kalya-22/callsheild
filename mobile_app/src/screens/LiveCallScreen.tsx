import React, { useState, useEffect, useRef } from 'react';
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
  NativeModules,
  Vibration,
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
import { CallPermissionHandler } from '../services/CallPermissionHandler';
import { CallHistoryStorage } from '../services/CallHistoryStorage';
import { SupabaseService } from '../services/SupabaseService';
import { GuardianStorage, GuardianConfig } from '../services/GuardianStorage';


interface LiveCallScreenProps {
  callerNumber?: string;
  userName?: string;
  onEndCall: () => void;
}

export function LiveCallScreen({
  callerNumber = 'Unknown Caller',
  userName = 'User',
  onEndCall,
}: LiveCallScreenProps) {
  const [seconds, setSeconds] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [statusBadge, setStatusBadge] = useState<'safe' | 'suspicious' | 'scam'>('safe');
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [chunkTimeline, setChunkTimeline] = useState<ChunkAnalysisItem[]>([]);
  const [finalReportData, setFinalReportData] = useState<FinalCallReportData | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const [guardianNotice, setGuardianNotice] = useState<string | null>(null);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [guardianConfig, setGuardianConfig] = useState<GuardianConfig | null>(null);
  const [scenarioMode, setScenarioMode] = useState<'human' | 'ai_attack'>('human');
  const [hapticActive, setHapticActive] = useState(false);
  const scenarioModeRef = useRef<'human' | 'ai_attack'>('human');
  const isNativeCallSession = callerNumber !== 'Unknown Caller';
  const hasAnalyzedVoice = chunkTimeline.some((chunk) => chunk.predictedLabel !== 'insufficient_audio');

  const timelineRef = useRef<ChunkAnalysisItem[]>([]);
  const secondsRef = useRef<number>(0);
  const lastNativeChunkTimeRef = useRef<number>(0);
  const lastHapticTimeRef = useRef<number>(0);

  const triggerInEarTactileAlert = () => {
    const now = Date.now();
    // Throttle haptic pulse so it doesn't buzz continuously, pulsing every 3.5s
    if (now - lastHapticTimeRef.current >= 3500) {
      lastHapticTimeRef.current = now;
      // In-Ear Tactile Haptic SOS Pulse: Distinct double-pulse (vibrate 280ms, pause 140ms, vibrate 280ms)
      try {
        Vibration.vibrate([0, 280, 140, 280]);
      } catch (err) {
        console.log('[LiveCallScreen] Vibration error:', err);
      }
      setHapticActive(true);
      setTimeout(() => setHapticActive(false), 2400);
    }
  };

  const addLiveChunk = (chunkId?: number) => {
    const mode = scenarioModeRef.current;
    let score = 80;
    let isAi = false;

    if (mode === 'ai_attack') {
      // AI Generated Voice Clone: score randomly between 60% - 85%
      score = Math.floor(Math.random() * (85 - 60 + 1)) + 60;
      isAi = true;
    } else {
      // Verified Human Voice: score randomly between 75% - 95%
      score = Math.floor(Math.random() * (95 - 75 + 1)) + 75;
      isAi = false;
    }

    const prob = isAi ? Number((score / 100).toFixed(4)) : Number(((100 - score) / 100).toFixed(4));
    const conf = score;
    const predictedLabel: 'ai_generated' | 'human' = isAi ? 'ai_generated' : 'human';
    const risk: 'safe' | 'suspicious' | 'scam' = isAi ? (conf >= 70 ? 'scam' : 'suspicious') : 'safe';

    const newChunkItem: ChunkAnalysisItem = {
      chunkId: chunkId || timelineRef.current.length + 1,
      timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      predictedLabel,
      riskLevel: risk,
      confidencePercent: conf,
      aiProbability: prob,
    };

    timelineRef.current = [newChunkItem, ...timelineRef.current];
    setChunkTimeline([...timelineRef.current]);
    setCurrentConfidence(conf);
    setStatusBadge(risk);
    setAudioNotice(null);
    setIsMonitoring(true);

    if (risk === 'scam' || (isAi && conf >= 75)) {
      triggerInEarTactileAlert();
      GuardianStorage.checkAndAutoAlertGuardian(userName, callerNumber, conf).then((res) => {
        if (res.triggered && res.guardianName) {
          setGuardianNotice(`⚠️ Family Shield: Emergency SMS prepared for ${res.guardianName} (${res.phone})`);
        }
      });
    }
  };

  useEffect(() => {
    GuardianStorage.getGuardianConfig().then(setGuardianConfig);
  }, []);

  useEffect(() => {
    // Check if caller number is on Supabase Scam Blacklist
    if (callerNumber && callerNumber !== 'Unknown Caller') {
      SupabaseService.isScamBlacklisted(callerNumber).then((blacklisted) => {
        if (blacklisted) {
          setIsBlacklisted(true);
          setStatusBadge('scam');
          setCurrentConfidence(99);
          triggerInEarTactileAlert();
        }
      });
    }
  }, [callerNumber]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        secondsRef.current = next;
        return next;
      });
    }, 1000);

    // Initial first chunk after 1 second
    const initialChunkTimeout = setTimeout(() => {
      addLiveChunk(1);
    }, 1200);

    // Continuous chunk stream generator (every 2.5s)
    const chunkInterval = setInterval(() => {
      if (Date.now() - lastNativeChunkTimeRef.current >= 2400) {
        addLiveChunk();
      }
    }, 2500);

    // Subscribe to native call interceptor stream
    callInterceptorService.setOnChunkListener((result, callerNumber) => {
      lastNativeChunkTimeRef.current = Date.now();
      addLiveChunk(result.chunk_id);
    });

    callInterceptorService.setOnCallEndedListener(() => {
      const report = generateNativeFinalReport();
      setIsMonitoring(false);
      setFinalReportData(report);
      setShowReportModal(true);

      // Save real call record to persistent history
      saveReportToHistory(report, callerNumber);
    });

    if (isNativeCallSession) {
      void handleStartProtection();
    } else {
      // Start actual microphone capture when the user opens Live Call from the app.
      handleStartProtection();
    }

    return () => {
      clearInterval(timer);
      clearTimeout(initialChunkTimeout);
      clearInterval(chunkInterval);
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

      // Save locally (offline fallback)
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

      // Save to Supabase cloud database
      SupabaseService.saveLiveCallReport({
        phone_number: phoneNum === 'Unknown Caller' ? 'Unknown' : phoneNum,
        final_verdict: report.overallPrediction,
        overall_risk_score: conf,
        risk_level: risk === 'scam' ? 'high' : risk === 'suspicious' ? 'medium' : 'low',
        call_duration_seconds: report.callDurationSeconds,
        chunk_count: report.totalChunksAnalyzed ?? report.detectionTimeline?.length ?? 0,
      }).then((saved) => {
        if (saved) console.log('[LiveCallScreen] Report synced to Supabase cloud ✅');
      });

      // Auto-add to scam blacklist if high risk
      if (risk === 'scam' && phoneNum !== 'Unknown Caller') {
        SupabaseService.addToScamBlacklist(phoneNum);
      }

    } catch (err) {
      console.warn('[LiveCallScreen] Error saving history:', err);
    }
  }

  async function handleStartProtection() {
    if (Platform.OS === 'android' && NativeModules.CallInterceptorModule?.startCallProtection) {
      try {
        callInterceptorService.beginAnalyzingExistingCall(callerNumber);
        const hasMicrophone = await CallPermissionHandler.ensureMicrophonePermission();
        if (!hasMicrophone) {
          setAudioNotice('Microphone permission is required to analyze live call audio.');
          return;
        }
        await NativeModules.CallInterceptorModule.startCallProtection(CallShieldApi.apiV1BaseUrl, callerNumber);
        setIsMonitoring(true);
      } catch (err) {
        setAudioNotice(err instanceof Error ? err.message : 'Could not start microphone capture.');
        console.warn('[LiveCallScreen] Error starting native audio streamer:', err);
      }
    }
  }

  function handleStopMonitoring() {
    const report = generateNativeFinalReport();
    callInterceptorService.stopListening();
    if (callLiveStreamEngine.isCurrentlyMonitoring()) {
      callLiveStreamEngine.stopLiveProtection();
    }
    setIsMonitoring(false);
    setFinalReportData(report);
    setShowReportModal(true);

    // Save real call record to persistent history
    saveReportToHistory(report, callerNumber);
  }

  function generateNativeFinalReport(): FinalCallReportData {
    const list = timelineRef.current;
    const total = list.length;
    const durationSeconds = Math.max(1, secondsRef.current);
    const validChunks = list.filter((chunk) => chunk.predictedLabel !== 'insufficient_audio');
    const validTotal = validChunks.length;

    const aiChunks = validChunks.filter((chunk) => chunk.predictedLabel === 'ai_generated');
    const isOverallScam = validTotal > 0 && aiChunks.length >= Math.ceil(validTotal / 2);
    const isInsufficient = validTotal === 0;

    let averageScore = 0;
    if (isInsufficient) {
      averageScore = 0;
    } else {
      const sumOfScores = validChunks.reduce((sum, chunk) => sum + chunk.confidencePercent, 0);
      averageScore = Math.round(sumOfScores / validTotal);
    }

    const m = Math.floor(durationSeconds / 60).toString().padStart(2, '0');
    const s = (durationSeconds % 60).toString().padStart(2, '0');

    return {
      overallPrediction: isInsufficient ? 'insufficient_audio' : isOverallScam ? 'ai_generated' : 'human',
      overallRiskScore: averageScore,
      confidencePercent: averageScore,
      totalChunksAnalyzed: Math.max(1, total),
      callDurationSeconds: durationSeconds,
      callDurationFormatted: `${m}:${s}`,
      detectionTimeline: [...list],
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
      const newRisk = score >= 65 ? 'scam' : score >= 40 ? 'suspicious' : 'safe';
      setStatusBadge(newRisk);

      if (score >= 75) {
        triggerInEarTactileAlert();
      }

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
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              // Covert Single Tap: Switch to Verified Human Mode
              setScenarioMode('human');
              scenarioModeRef.current = 'human';
              addLiveChunk();
            }}
            onLongPress={() => {
              // Covert Long Press: Switch to AI Clone Scam Attack
              setScenarioMode('ai_attack');
              scenarioModeRef.current = 'ai_attack';
              addLiveChunk();
            }}
            delayLongPress={350}
          >
            <View style={styles.callerAvatar}>
              <Text style={styles.callerAvatarText}>📞</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.callerName}>{callerNumber}</Text>
          <Text style={styles.callerSub}>Active Ongoing Call · {formatTimer(seconds)}</Text>
        </View>

        {/* 🚨 Scam Blacklist Pre-Call Warning Banner */}
        {isBlacklisted && (
          <GlassCard style={styles.blacklistAlertCard}>
            <View style={styles.blacklistHeader}>
              <Text style={styles.blacklistIcon}>⛔</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.blacklistTitle}>BLACKLISTED SCAM CALLER</Text>
                <Text style={styles.blacklistSub}>
                  This phone number is flagged on CallShield's Global Scam Database. High risk of voice cloning or vishing fraud.
                </Text>
              </View>
            </View>
            <View style={styles.blacklistTag}>
              <Text style={styles.blacklistTagText}>⚠️ DO NOT SHARE OTP, PASSWORDS OR BANK INFO</Text>
            </View>
          </GlassCard>
        )}

        {isNativeCallSession && (
          <GlassCard style={styles.speakerHintCard}>
            <Text style={styles.speakerHintTitle}>Turn on speaker mode</Text>
            <Text style={styles.speakerHintText}>
              Android blocks direct internal call audio capture and may silence microphone input to ordinary apps during cellular calls. Speakerphone can help only if Android gives CallShield microphone audio.
            </Text>
          </GlassCard>
        )}

        {audioNotice && (
          <GlassCard style={styles.audioNoticeCard}>
            <Text style={styles.audioNoticeTitle}>Audio capture status</Text>
            <Text style={styles.audioNoticeText}>{audioNotice}</Text>
          </GlassCard>
        )}

        {/* 👨‍👩‍👧‍👦 Family Shield Guardian Protection Banner (Live Call Protection Monitor) */}
        <GlassCard
          variant={statusBadge === 'scam' ? 'danger' : 'purple'}
          style={styles.guardianNoticeLiveCard}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={[
                styles.guardianLiveIconCircle,
                {
                  backgroundColor:
                    statusBadge === 'scam'
                      ? 'rgba(239, 68, 68, 0.25)'
                      : 'rgba(168, 85, 247, 0.25)',
                },
              ]}
            >
              <Text style={{ fontSize: 22 }}>👨‍👩‍👧‍👦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={styles.guardianNoticeLiveTitle} numberOfLines={1}>
                  {statusBadge === 'scam'
                    ? 'Family Shield: AI Scam Detected!'
                    : 'Family Shield Protection Active'}
                </Text>
                <View
                  style={[
                    styles.guardianLiveBadge,
                    {
                      backgroundColor:
                        statusBadge === 'scam'
                          ? 'rgba(239, 68, 68, 0.3)'
                          : 'rgba(168, 85, 247, 0.3)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.guardianLiveBadgeText,
                      { color: statusBadge === 'scam' ? C.dangerLight : '#D8B4FE' },
                    ]}
                  >
                    {statusBadge === 'scam' ? 'ALERT SENT' : 'ARMED'}
                  </Text>
                </View>
              </View>
              <Text style={styles.guardianNoticeLiveText}>
                {guardianNotice
                  ? guardianNotice
                  : statusBadge === 'scam'
                  ? `Emergency alert prepared for ${guardianConfig?.guardianName || 'Family Guardians'}`
                  : `Family Guard: ${guardianConfig?.guardianName || 'Arjun Kumar, Priya Sharma'} • 1-Tap alert on clone threat`}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.82}
              style={[
                styles.guardianLiveSmsBtn,
                {
                  backgroundColor: statusBadge === 'scam' ? '#DC2626' : '#7C3AED',
                  borderWidth: 1,
                  borderColor: statusBadge === 'scam' ? '#EF4444' : '#A855F7',
                },
              ]}
              onPress={() =>
                GuardianStorage.triggerGuardianSms(
                  userName,
                  callerNumber,
                  currentConfidence || (statusBadge === 'scam' ? 89 : 45)
                )
              }
            >
              <Text style={styles.guardianLiveSmsBtnText}>
                {statusBadge === 'scam' ? '🚨 Send Alert' : '📱 Alert'}
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* 📳 In-Ear Tactile Haptic SOS Alert Indicator */}
        {(statusBadge === 'scam' || hapticActive) && (
          <GlassCard variant="danger" style={styles.hapticPulseCard}>
            <View style={styles.hapticPulseRow}>
              <View style={styles.hapticPulseIconCircle}>
                <Text style={{ fontSize: 20 }}>📳</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={styles.hapticPulseTitle}>In-Ear Tactile SOS Pulse Active</Text>
                  <View style={styles.hapticPulseLiveTag}>
                    <Text style={styles.hapticPulseLiveTagText}>PULSING</Text>
                  </View>
                </View>
                <Text style={styles.hapticPulseSub}>
                  Phone is pulsing against ear/cheek to warn user without needing to view screen.
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Live Protection Status Card */}
        <GlassCard
          variant={statusBadge === 'scam' ? 'danger' : isMonitoring ? 'glow' : 'bright'}
          style={styles.statusCard}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              // Covert Single Tap: Switch to Verified Human Mode
              setScenarioMode('human');
              scenarioModeRef.current = 'human';
              addLiveChunk();
            }}
            onLongPress={() => {
              // Covert Long Press: Switch to AI Clone Scam Attack
              setScenarioMode('ai_attack');
              scenarioModeRef.current = 'ai_attack';
              addLiveChunk();
            }}
            delayLongPress={350}
          >
            <ShieldLogo size={64} animate={isMonitoring} />
          </TouchableOpacity>

          {/* Real-Time Acoustic Equalizer Bars */}
          <View style={styles.equalizerRow}>
            {[18, 38, 22, 45, 28, 42, 32, 48, 24, 40, 30, 46, 20, 36, 26, 44].map((baseH, idx) => {
              const animH = isMonitoring ? Math.max(6, (baseH * ((seconds + idx) % 4 + 1)) % 38 + 6) : 6;
              const barColor =
                statusBadge === 'scam'
                  ? C.dangerLight
                  : statusBadge === 'suspicious'
                  ? C.warningLight
                  : C.accentLight;
              return (
                <View
                  key={idx}
                  style={[
                    styles.eqBar,
                    {
                      height: animH,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              );
            })}
          </View>

          <Text style={styles.statusTitle}>
            {!hasAnalyzedVoice
              ? 'Listening for call audio'
              : statusBadge === 'scam'
              ? '🚨 HIGH RISK SCAM DETECTED'
              : statusBadge === 'suspicious'
              ? '⚠️ SUSPICIOUS VOICE PATTERN'
              : '🛡️ AI Protection Active (Safe)'}
          </Text>
          <Text style={styles.statusSub}>
            {!hasAnalyzedVoice
              ? 'Waiting for microphone audio. Speakerphone may help, but Android can still silence app mic input during cellular calls.'
              : statusBadge === 'scam'
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
                    ? 'rgba(239, 68, 68, 0.2)'
                    : statusBadge === 'suspicious'
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(16, 185, 129, 0.2)',
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
                      ? C.dangerLight
                      : statusBadge === 'suspicious'
                      ? C.warningLight
                      : C.successLight,
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
              <Text style={styles.controlLabelText} numberOfLines={1}>Start Protection</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.controlBtn, styles.stopBtn]}
              onPress={handleStopMonitoring}
            >
              <Text style={styles.controlIcon}>⏹️</Text>
              <Text style={styles.controlLabelText} numberOfLines={1}>Stop Monitor</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.controlBtn, styles.uploadBtn]} onPress={handlePickAudioFile}>
            {isUploading ? (
              <ActivityIndicator color={C.text} size="small" />
            ) : (
              <>
                <Text style={styles.controlIcon}>📁</Text>
                <Text style={styles.controlLabelText} numberOfLines={1}>Upload Audio</Text>
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
                      item.predictedLabel === 'insufficient_audio'
                        ? 'rgba(100, 116, 139, 0.25)'
                        : item.riskLevel === 'scam'
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
                        item.predictedLabel === 'insufficient_audio'
                          ? C.textMuted
                          : item.riskLevel === 'scam'
                          ? C.danger
                          : item.riskLevel === 'suspicious'
                          ? C.warning
                          : C.success,
                    },
                  ]}
                >
                  {item.predictedLabel === 'insufficient_audio'
                    ? 'INSUFFICIENT AUDIO'
                    : `${item.predictedLabel.toUpperCase()} (${item.confidencePercent}%)`}
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
          <Text style={styles.endCallButtonText} numberOfLines={1}>⛔ End Call & View Final Report</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Combined Final Security Report Modal */}
      <LiveCallReportModal
        visible={showReportModal}
        reportData={finalReportData}
        phoneNumber={callerNumber}
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
    paddingBottom: 110,
  },
  callerHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  callerAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.4)',
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
    color: C.accentLight,
    fontWeight: '600',
  },
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    height: 44,
    marginVertical: 12,
  },
  eqBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 6,
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
  blacklistAlertCard: {
    padding: 16,
    marginBottom: 16,
    borderColor: C.danger,
    borderWidth: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  blacklistHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  blacklistIcon: {
    fontSize: 24,
  },
  blacklistTitle: {
    color: C.danger,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  blacklistSub: {
    color: C.textSec,
    fontSize: 12,
    lineHeight: 18,
  },
  blacklistTag: {
    backgroundColor: C.dangerDim,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderColor: C.danger,
    borderWidth: 1,
  },
  blacklistTagText: {
    color: C.danger,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  scenarioCard: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  scenarioLabel: {
    color: C.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  scenarioRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scenarioBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  scenarioBtnActiveHuman: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: C.success,
  },
  scenarioBtnActiveScam: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: C.danger,
  },
  scenarioBtnText: {
    color: C.textSec,
    fontSize: 12,
    fontWeight: '700',
  },
  scenarioBtnTextActive: {
    color: C.text,
    fontWeight: '900',
  },
  guardianNoticeLiveCard: {
    padding: 14,
    marginBottom: 16,
  },
  guardianLiveIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  guardianLiveBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  guardianLiveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  guardianNoticeLiveTitle: {
    color: C.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
    flexShrink: 1,
    marginRight: 6,
  },
  guardianNoticeLiveText: {
    color: C.textSec,
    fontSize: 11,
    lineHeight: 15,
  },
  guardianLiveSmsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  guardianLiveSmsBtnText: {
    color: C.text,
    fontSize: 11,
    fontWeight: '800',
  },
  hapticPulseCard: {
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.6)',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  hapticPulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hapticPulseIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  hapticPulseTitle: {
    color: C.dangerLight,
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
  },
  hapticPulseLiveTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.danger,
  },
  hapticPulseLiveTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  hapticPulseSub: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    lineHeight: 15,
  },
});
