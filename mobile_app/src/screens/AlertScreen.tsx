import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';

interface AlertScreenProps {
  onDismiss: () => void;
  onBlock: () => void;
}

export function AlertScreen({ onDismiss, onBlock }: AlertScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Warning Icon Badge */}
        <View style={styles.iconContainer}>
          <View style={styles.warningCircle}>
            <Text style={styles.warningIconText}>⚠️</Text>
          </View>
        </View>

        {/* Main Alert Card */}
        <View style={styles.alertCard}>
          <View style={styles.alertTagRow}>
            <View style={styles.dangerDot} />
            <Text style={styles.alertTagText}>CRITICAL SCAM WARNING</Text>
          </View>

          <Text style={styles.alertTitle}>Potential Vishing Attack Detected</Text>

          <Text style={styles.alertDesc}>
            Our AI has identified this incoming call as a high-probability voice phishing (vishing) attempt. The caller is using synthesized voice patterns and social engineering tactics.
          </Text>

          <GlassCard style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Scam Confidence:</Text>
              <Text style={styles.detailValRed}>89% High Risk</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Caller Number:</Text>
              <Text style={styles.detailVal}>+91 98765 43210</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Detected Threats:</Text>
              <Text style={styles.detailVal}>AI Voice Cloning & Urgency</Text>
            </View>
          </GlassCard>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity activeOpacity={0.85} style={styles.blockBtn} onPress={onBlock}>
            <Text style={styles.blockBtnText}>⛔ Hang Up & Block Caller</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} style={styles.helplineBtn} onPress={onDismiss}>
            <Text style={styles.helplineBtnText}>📞 Call Cyber Helpline (1930)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
            <Text style={styles.dismissBtnText}>Dismiss Warning</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0505',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 36,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  warningCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 2,
    borderColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningIconText: {
    fontSize: 40,
  },
  alertCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: 20,
    marginBottom: 24,
  },
  alertTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dangerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.danger,
    marginRight: 8,
  },
  alertTagText: {
    color: C.danger,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    marginBottom: 10,
    lineHeight: 28,
  },
  alertDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 20,
    marginBottom: 18,
  },
  detailsCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: C.textSec,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  detailValRed: {
    fontSize: 13,
    fontWeight: '800',
    color: C.danger,
  },
  actionsContainer: {
    gap: 12,
  },
  blockBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  blockBtnText: {
    color: C.text,
    fontSize: 16,
    fontWeight: '800',
  },
  helplineBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helplineBtnText: {
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
  },
  dismissBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    color: C.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
