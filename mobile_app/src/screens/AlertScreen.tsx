import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Vibration,
} from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GuardianStorage, GuardianConfig } from '../services/GuardianStorage';

interface AlertScreenProps {
  userName?: string;
  callerNumber?: string;
  onDismiss: () => void;
  onBlock: () => void;
  onNavigateFamilyShield?: () => void;
}

export function AlertScreen({
  userName = 'User',
  callerNumber = '+91 98765 43210',
  onDismiss,
  onBlock,
  onNavigateFamilyShield,
}: AlertScreenProps) {
  const [guardian, setGuardian] = useState<GuardianConfig | null>(null);
  const [alertSent, setAlertSent] = useState(false);

  useEffect(() => {
    // In-Ear Tactile Haptic SOS Pulse: Distinct double-pulse warning against ear/cheek
    try {
      Vibration.vibrate([0, 300, 150, 300]);
    } catch (err) {
      console.log('[AlertScreen] Vibration error:', err);
    }

    GuardianStorage.getGuardianConfig().then((cfg) => {
      setGuardian(cfg);
      // Auto-trigger if configured
      if (cfg.enabled && cfg.autoAlertOnScam) {
        GuardianStorage.checkAndAutoAlertGuardian(userName, callerNumber, 89).then((res) => {
          if (res.triggered) setAlertSent(true);
        });
      }
    });
  }, []);

  async function handleAlertGuardian() {
    const success = await GuardianStorage.triggerGuardianSms(userName, callerNumber, 89);
    if (success) {
      setAlertSent(true);
      Alert.alert('Guardian Alert Sent', `Emergency alert SMS dispatched to ${guardian?.guardianName || 'Family'}.`);
    }
  }
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Icon Badge with Cyber Glow Ring */}
        <View style={styles.iconContainer}>
          <View style={styles.warningOuterRing}>
            <View style={styles.warningMiddleRing}>
              <View style={styles.warningCircle}>
                <Text style={styles.warningIconText}>🚨</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Main Alert Card */}
        <GlassCard variant="danger" style={styles.alertCard}>
          <View style={styles.alertTagRow}>
            <View style={styles.dangerDot} />
            <Text style={styles.alertTagText}>CRITICAL VISHING DETECTED</Text>
            <View style={styles.liveThreatBadge}>
              <Text style={styles.liveThreatBadgeText}>LIVE INTERCEPT</Text>
            </View>
          </View>

          <Text style={styles.alertTitle}>AI Voice Clone Attack in Progress</Text>

          <Text style={styles.alertDesc}>
            CallShield's neural acoustic engine has flagged this live incoming call as a synthetic voice clone. Acoustic anomalies indicate neural TTS generation.
          </Text>

          {/* Forensic Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Scam Threat Level</Text>
              <View style={styles.threatPill}>
                <Text style={styles.threatPillText}>89% CRITICAL</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Incoming Caller ID</Text>
              <Text style={styles.detailVal}>{callerNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Attributed Synthesizer</Text>
              <Text style={styles.detailValCyan}>ElevenLabs Neural Clone v2</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Detected Anomalies</Text>
              <Text style={styles.detailVal}>Phase jitter • Unnatural cadence</Text>
            </View>
            <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.detailLabel}>In-Ear Tactile Alert</Text>
              <View style={styles.tactilePill}>
                <Text style={styles.tactilePillText}>📳 SOS Double-Pulse Active</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Family Shield Guardian Notice */}
        {guardian?.enabled && (
          <GlassCard variant="purple" style={styles.guardianNoticeCard}>
            <View style={styles.guardianNoticeRow}>
              <View style={styles.guardianNoticeIconCircle}>
                <Text style={{ fontSize: 20 }}>👨‍👩‍👧‍👦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.guardianNoticeTitle}>
                    {alertSent ? 'Guardian Alert Dispatched ✅' : 'Family Shield Active'}
                  </Text>
                  <View style={styles.guardianActiveTag}>
                    <Text style={styles.guardianActiveTagText}>ARMED</Text>
                  </View>
                </View>
                <Text style={styles.guardianNoticeSub}>
                  {alertSent
                    ? `Emergency alert prepared for ${guardian.guardianName} (${guardian.guardianPhone})`
                    : `Senior citizen protection: alerts ${guardian.guardianName} (${guardian.relationship || 'Guardian'}) immediately.`}
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity activeOpacity={0.85} style={styles.blockBtn} onPress={onBlock}>
            <Text style={styles.blockBtnText}>⛔ End Call & Block Caller</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} style={styles.guardianBtn} onPress={handleAlertGuardian}>
            <Text style={styles.guardianBtnText} numberOfLines={1}>👨‍👩‍👧‍👦 Dispatch Alert to Guardian</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} style={styles.helplineBtn} onPress={onDismiss}>
            <Text style={styles.helplineBtnText} numberOfLines={1}>📞 Dial 1930 Cyber Helpline</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.75} style={styles.dismissBtn} onPress={onDismiss}>
            <Text style={styles.dismissBtnText} numberOfLines={1}>Dismiss Warning (Listen Carefully)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0305',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 110,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  warningOuterRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  warningMiddleRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  warningCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 2,
    borderColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningIconText: {
    fontSize: 34,
  },
  alertCard: {
    padding: 20,
    marginBottom: 18,
  },
  alertTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.danger,
    marginRight: 8,
  },
  alertTagText: {
    color: C.dangerLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    flex: 1,
  },
  liveThreatBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  liveThreatBadgeText: {
    color: C.dangerLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: C.text,
    marginBottom: 8,
    lineHeight: 28,
  },
  alertDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 19,
    marginBottom: 18,
  },
  detailsCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  detailLabel: {
    fontSize: 12,
    color: C.textSec,
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text,
  },
  detailValCyan: {
    fontSize: 12,
    fontWeight: '800',
    color: C.accentLight,
  },
  threatPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.danger,
  },
  threatPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: C.dangerLight,
  },
  tactilePill: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  tactilePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FCA5A5',
  },
  guardianNoticeCard: {
    padding: 16,
    marginBottom: 20,
  },
  guardianNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guardianNoticeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  guardianNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
    marginBottom: 2,
  },
  guardianActiveTag: {
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
  guardianActiveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D8B4FE',
    letterSpacing: 0.5,
  },
  guardianNoticeSub: {
    fontSize: 12,
    color: C.textSec,
    lineHeight: 16,
  },
  actionsContainer: {
    gap: 12,
  },
  blockBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
    elevation: 4,
  },
  blockBtnText: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  guardianBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A855F7',
  },
  guardianBtnText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  helplineBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  helplineBtnText: {
    color: C.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  dismissBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  dismissBtnText: {
    color: C.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
