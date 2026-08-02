import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { ShieldLogo } from '../components/ShieldLogo';

interface SafeResultScreenProps {
  onDone: () => void;
}

export function SafeResultScreen({ onDone }: SafeResultScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Shield Icon */}
        <View style={styles.logoWrapper}>
          <ShieldLogo size={100} animate={false} />
        </View>

        {/* Header */}
        <Text style={styles.title}>Caller Verified Safe</Text>
        <Text style={styles.subtitle}>
          No artificial voice synthesis or scam patterns detected during analysis.
        </Text>

        {/* Verification Details */}
        <GlassCard bright style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Caller ID</Text>
            <Text style={styles.val}>HDFC Bank Official (+91 22 6160 6161)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Human Confidence</Text>
            <Text style={[styles.val, { color: C.success }]}>99% Human Voice</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>AI Threat Score</Text>
            <Text style={[styles.val, { color: C.success }]}>1% (Low)</Text>
          </View>
        </GlassCard>

        {/* Done Button */}
        <TouchableOpacity activeOpacity={0.85} style={styles.doneBtn} onPress={onDone}>
          <Text style={styles.doneBtnText}>Return to Dashboard</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: C.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: C.textSec,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  card: {
    width: '100%',
    padding: 20,
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: C.textSec,
  },
  val: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  doneBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: C.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
