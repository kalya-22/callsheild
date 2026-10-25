import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Linking, Alert } from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GuardianStorage, GuardianConfig } from '../services/GuardianStorage';

interface EmergencyScreenProps {
  userName?: string;
  onBack: () => void;
  onNavigateFamilyShield?: () => void;
}

export function EmergencyScreen({ userName = 'User', onBack, onNavigateFamilyShield }: EmergencyScreenProps) {
  const [guardian, setGuardian] = useState<GuardianConfig | null>(null);

  useEffect(() => {
    GuardianStorage.getGuardianConfig().then(setGuardian);
  }, []);

  function callHelpline() {
    Linking.openURL('tel:1930');
  }

  async function handleAlertGuardian() {
    if (!guardian?.guardianPhone) {
      Alert.alert('Guardian Alert', 'No guardian contact found. Please configure Family Shield first.');
      if (onNavigateFamilyShield) onNavigateFamilyShield();
      return;
    }
    const success = await GuardianStorage.triggerGuardianSms(userName, '+91 98765 43210', 94);
    if (success) {
      Alert.alert('Guardian Alert Prepared', `Emergency alert SMS composed for ${guardian.guardianName || 'Family'}.`);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency SOS Hub</Text>
        </View>

        {/* Big Emergency Dial Button with Outer Ring */}
        <GlassCard variant="danger" style={styles.sosCard}>
          <View style={styles.sosOuterGlow}>
            <TouchableOpacity style={styles.sosCircle} onPress={callHelpline} activeOpacity={0.82}>
              <Text style={styles.sosText}>SOS</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sosTitle}>National Cyber Crime Helpline</Text>
          <Text style={styles.sosSub}>Tap below to dial 1930 directly to report active financial fraud, unauthorized transactions, or cyber threats.</Text>

          <TouchableOpacity style={styles.callBtn} onPress={callHelpline} activeOpacity={0.85}>
            <Text style={styles.callBtnText}>📞 Dial 1930 Now (Toll Free)</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Family Shield / Guardian Section */}
        <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 Family Shield Guardian Alert</Text>
        <GlassCard variant="purple" style={styles.guardianCard}>
          <View style={styles.guardianHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.guardianName}>
                {guardian?.guardianName || 'Family Guardian'} ({guardian?.relationship || 'Son / Daughter'})
              </Text>
              <Text style={styles.guardianPhone}>{guardian?.guardianPhone || '+91 98765 43210'}</Text>
            </View>
            <View style={styles.guardianBadge}>
              <Text style={styles.guardianBadgeText}>ARMED</Text>
            </View>
          </View>

          <Text style={styles.guardianSub}>
            Automated SMS emergency alerts dispatch to your guardian if AI voice clones are detected during calls.
          </Text>

          <View style={styles.guardianActionsRow}>
            <TouchableOpacity style={styles.alertGuardianBtn} onPress={handleAlertGuardian} activeOpacity={0.85}>
              <Text style={styles.alertGuardianBtnText} numberOfLines={1}>📢 Dispatch Alert</Text>
            </TouchableOpacity>

            {onNavigateFamilyShield && (
              <TouchableOpacity style={styles.editGuardianBtn} onPress={onNavigateFamilyShield} activeOpacity={0.8}>
                <Text style={styles.editGuardianBtnText}>⚙️ Configure</Text>
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>

        {/* Emergency Contacts */}
        <Text style={styles.sectionTitle}>Trusted Emergency Helplines</Text>

        <GlassCard style={styles.contactItem} onPress={() => Linking.openURL(`tel:${guardian?.guardianPhone || '+919876543210'}`)}>
          <View style={styles.contactLeft}>
            <View style={styles.contactIconCircle}>
              <Text style={{ fontSize: 18 }}>👨‍👩‍👧‍👦</Text>
            </View>
            <View>
              <Text style={styles.contactName}>{guardian?.guardianName || 'Family Guardian Contact'}</Text>
              <Text style={styles.contactRole}>{guardian?.relationship || 'Family Member'}</Text>
            </View>
          </View>
          <Text style={styles.contactPhone}>{guardian?.guardianPhone || '+91 98765 43210'}</Text>
        </GlassCard>

        <GlassCard style={styles.contactItem} onPress={() => Linking.openURL('tel:1800226160')}>
          <View style={styles.contactLeft}>
            <View style={[styles.contactIconCircle, { backgroundColor: 'rgba(37, 99, 235, 0.15)' }]}>
              <Text style={{ fontSize: 18 }}>🏛️</Text>
            </View>
            <View>
              <Text style={styles.contactName}>Bank Fraud Desk Helpline</Text>
              <Text style={styles.contactRole}>National Banking Shield</Text>
            </View>
          </View>
          <Text style={styles.contactPhone}>1800 22 6160</Text>
        </GlassCard>
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
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  sosCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
  },
  sosOuterGlow: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  sosCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  sosText: {
    fontSize: 26,
    fontWeight: '900',
    color: C.text,
  },
  sosTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  sosSub: {
    fontSize: 12,
    color: C.textSec,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  callBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginBottom: 10,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  contactRole: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },
  contactPhone: {
    fontSize: 13,
    fontWeight: '800',
    color: C.accentLight,
  },
  guardianCard: {
    padding: 16,
    marginBottom: 24,
  },
  guardianHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  guardianName: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
  },
  guardianPhone: {
    fontSize: 13,
    color: C.accent,
    fontWeight: '700',
    marginTop: 2,
  },
  guardianBadge: {
    backgroundColor: C.successDim,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.success,
  },
  guardianBadgeText: {
    color: C.success,
    fontSize: 10,
    fontWeight: '800',
  },
  guardianSub: {
    fontSize: 12,
    color: C.textSec,
    lineHeight: 18,
    marginBottom: 14,
  },
  guardianActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  alertGuardianBtn: {
    flex: 1,
    height: 44,
    backgroundColor: C.danger,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertGuardianBtnText: {
    color: C.text,
    fontSize: 13,
    fontWeight: '800',
  },
  editGuardianBtn: {
    paddingHorizontal: 16,
    height: 44,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editGuardianBtnText: {
    color: C.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
