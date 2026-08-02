import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { ShieldLogo } from '../components/ShieldLogo';

interface LiveCallScreenProps {
  onEndCall: () => void;
}

export function LiveCallScreen({ onEndCall }: LiveCallScreenProps) {
  const [seconds, setSeconds] = useState(14);
  const [riskLevel, setRiskLevel] = useState<'safe' | 'suspicious' | 'scam'>('safe');
  const [confidence, setConfidence] = useState(96);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // Simulate threat detection after 15 seconds
    const threatTimer = setTimeout(() => {
      setRiskLevel('scam');
      setConfidence(89);
    }, 12000);

    return () => {
      clearInterval(timer);
      clearTimeout(threatTimer);
    };
  }, []);

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
          <Text style={styles.callerSub}>Incoming Call · {formatTimer(seconds)}</Text>
        </View>

        {/* Live Protection Status */}
        <GlassCard bright style={styles.statusCard}>
          <ShieldLogo size={60} animate />
          <Text style={styles.statusTitle}>
            {riskLevel === 'scam' ? '🚨 SCAM THREAT DETECTED' : 'AI Protection Active'}
          </Text>
          <Text style={styles.statusSub}>
            {riskLevel === 'scam'
              ? 'Voice patterns match known vishing scam profile (89% Confidence)'
              : 'Analyzing incoming audio stream in real-time'}
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
              Risk Status: {riskLevel.toUpperCase()} ({confidence}%)
            </Text>
          </View>
        </GlassCard>

        {/* Call Action Controls */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, isMuted && styles.actionBtnActive]}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Text style={styles.actionBtnIcon}>{isMuted ? '🔇' : '🎙️'}</Text>
            <Text style={styles.actionBtnText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.hangUpBtn, riskLevel === 'scam' && styles.scamHangUpBtn]}
            onPress={onEndCall}
          >
            <Text style={styles.hangUpText}>
              {riskLevel === 'scam' ? '⛔ HANG UP & BLOCK' : 'End Call'}
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
    backgroundColor: C.bgDeep,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 32,
  },
  callerHeader: {
    alignItems: 'center',
    marginTop: 24,
  },
  callerAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  callerAvatarText: {
    fontSize: 36,
  },
  callerName: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
    marginBottom: 6,
  },
  callerSub: {
    fontSize: 14,
    color: C.textSec,
    fontWeight: '600',
  },
  statusCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    marginTop: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  statusSub: {
    fontSize: 13,
    color: C.textSec,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  riskBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  actionBtnActive: {
    backgroundColor: C.accentDim,
    borderColor: C.accent,
  },
  actionBtnIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionBtnText: {
    fontSize: 11,
    color: C.textSec,
    fontWeight: '600',
  },
  hangUpBtn: {
    flex: 1,
    marginLeft: 16,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  scamHangUpBtn: {
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  hangUpText: {
    color: C.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
