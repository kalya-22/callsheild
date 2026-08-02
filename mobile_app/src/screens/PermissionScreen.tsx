import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Switch } from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';

interface PermissionScreenProps {
  onGrant: () => void;
}

export function PermissionScreen({ onGrant }: PermissionScreenProps) {
  const [micGranted, setMicGranted] = useState(true);
  const [phoneGranted, setPhoneGranted] = useState(true);
  const [notifGranted, setNotifGranted] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headerTitle}>Permissions Required</Text>
        <Text style={styles.headerSub}>
          CallShield requires device permissions to protect incoming calls from AI scam threats.
        </Text>

        {/* Microphone Permission */}
        <GlassCard style={styles.permCard}>
          <View style={styles.permInfo}>
            <Text style={styles.permTitle}>Microphone Access</Text>
            <Text style={styles.permDesc}>
              Allows real-time voice pattern analysis during active calls.
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#334155', true: C.primary }}
            thumbColor={micGranted ? C.text : '#94A3B8'}
            value={micGranted}
            onValueChange={setMicGranted}
          />
        </GlassCard>

        {/* Phone State Permission */}
        <GlassCard style={styles.permCard}>
          <View style={styles.permInfo}>
            <Text style={styles.permTitle}>Call State & Phone Access</Text>
            <Text style={styles.permDesc}>
              Detects incoming call status to automatically trigger AI protection.
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#334155', true: C.primary }}
            thumbColor={phoneGranted ? C.text : '#94A3B8'}
            value={phoneGranted}
            onValueChange={setPhoneGranted}
          />
        </GlassCard>

        {/* Notifications Permission */}
        <GlassCard style={styles.permCard}>
          <View style={styles.permInfo}>
            <Text style={styles.permTitle}>Scam Warning Notifications</Text>
            <Text style={styles.permDesc}>
              Displays high-risk popup alerts when potential vishing is detected.
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#334155', true: C.primary }}
            thumbColor={notifGranted ? C.text : '#94A3B8'}
            value={notifGranted}
            onValueChange={setNotifGranted}
          />
        </GlassCard>
      </View>

      {/* Grant Action Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity activeOpacity={0.85} style={styles.grantButton} onPress={onGrant}>
          <Text style={styles.grantButtonText}>Grant Permissions & Continue</Text>
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
    paddingTop: 32,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: C.text,
    marginBottom: 8,
  },
  headerSub: {
    fontSize: 14,
    color: C.textSec,
    lineHeight: 20,
    marginBottom: 28,
  },
  permCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 18,
  },
  permInfo: {
    flex: 1,
    marginRight: 12,
  },
  permTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
  },
  permDesc: {
    fontSize: 12,
    color: C.textSec,
    lineHeight: 17,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  grantButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantButtonText: {
    color: C.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
