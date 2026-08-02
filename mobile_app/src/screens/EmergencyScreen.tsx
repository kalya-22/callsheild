import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Linking } from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';

interface EmergencyScreenProps {
  onBack: () => void;
}

export function EmergencyScreen({ onBack }: EmergencyScreenProps) {
  function callHelpline() {
    Linking.openURL('tel:1930');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency SOS Response</Text>
        </View>

        {/* Big Emergency Dial Button */}
        <GlassCard bright style={styles.sosCard}>
          <TouchableOpacity style={styles.sosCircle} onPress={callHelpline}>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>

          <Text style={styles.sosTitle}>National Cyber Crime Helpline</Text>
          <Text style={styles.sosSub}>Tap above to dial 1930 directly to report active financial fraud or scam threats.</Text>

          <TouchableOpacity style={styles.callBtn} onPress={callHelpline}>
            <Text style={styles.callBtnText}>📞 Dial 1930 Now</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Emergency Contacts */}
        <Text style={styles.sectionTitle}>Trusted Emergency Contacts</Text>

        <GlassCard style={styles.contactItem}>
          <Text style={styles.contactName}>Family SOS Contact</Text>
          <Text style={styles.contactPhone}>+91 98765 00000</Text>
        </GlassCard>

        <GlassCard style={styles.contactItem}>
          <Text style={styles.contactName}>Bank Fraud Desk Helpline</Text>
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
    paddingBottom: 32,
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
  sosCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    fontSize: 13,
    color: C.textSec,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
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
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 10,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  contactPhone: {
    fontSize: 14,
    fontWeight: '700',
    color: C.accent,
  },
});
