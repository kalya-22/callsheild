import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';

interface ScamReportScreenProps {
  onBack: () => void;
}

export function ScamReportScreen({ onBack }: ScamReportScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [category, setCategory] = useState('Bank Impersonation');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a valid phone number.');
      return;
    }
    setSubmitted(true);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Scam to Community</Text>
        </View>

        {submitted ? (
          <GlassCard bright style={styles.successCard}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>Scam Report Submitted!</Text>
            <Text style={styles.successSub}>
              Thank you for keeping the CallShield community safe. This number (+{phoneNumber}) has been flagged in our global threat database.
            </Text>
            <TouchableOpacity style={styles.submitBtn} onPress={onBack}>
              <Text style={styles.submitBtnText}>Done</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          <GlassCard bright style={styles.formCard}>
            <Text style={styles.label}>Scam Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 98765 43210"
              placeholderTextColor={C.textMuted}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Scam Category</Text>
            <View style={styles.categoryRow}>
              {['Bank Impersonation', 'Tech Support', 'Lottery Fraud', 'Police Fake'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catPill, category === cat && styles.catPillActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catPillText, category === cat && styles.catPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Description / Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what the caller requested (e.g. asked for OTP, credit card PIN, urgent transfer)..."
              placeholderTextColor={C.textMuted}
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity activeOpacity={0.85} style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Submit Scam Report</Text>
            </TouchableOpacity>
          </GlassCard>
        )}
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
  formCard: {
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textSec,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    height: 48,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    color: C.text,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  catPillActive: {
    backgroundColor: C.primaryDim,
    borderColor: C.primary,
  },
  catPillText: {
    fontSize: 12,
    color: C.textSec,
    fontWeight: '600',
  },
  catPillTextActive: {
    color: C.accent,
    fontWeight: '800',
  },
  submitBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  submitBtnText: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
  },
  successCard: {
    padding: 24,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    marginBottom: 8,
  },
  successSub: {
    fontSize: 13,
    color: C.textSec,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
});
