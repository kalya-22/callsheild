import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';

interface ProfileScreenProps {
  onLogout: () => void;
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>My Profile</Text>

        {/* Profile Card */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <Text style={styles.name}>John Doe</Text>
          <Text style={styles.phone}>+1 (555) 019-2834</Text>

          <View style={styles.badgeRow}>
            <View style={styles.shieldBadge}>
              <Text style={styles.shieldBadgeText}>PRO SHIELD ACTIVE</Text>
            </View>
          </View>
        </GlassCard>

        {/* Security Info */}
        <Text style={styles.sectionTitle}>Account Security</Text>

        <GlassCard style={styles.infoCard}>
          <Text style={styles.infoLabel}>Device Protection Uptime</Text>
          <Text style={styles.infoValue}>99.98%</Text>
        </GlassCard>

        <GlassCard style={styles.infoCard}>
          <Text style={styles.infoLabel}>Vishing Threat Model</Text>
          <Text style={styles.infoValue}>v2.4.1 (Latest)</Text>
        </GlassCard>

        <GlassCard style={styles.infoCard}>
          <Text style={styles.infoLabel}>Scam Database Sync</Text>
          <Text style={styles.infoValue}>Synced 2 minutes ago</Text>
        </GlassCard>

        {/* Logout */}
        <TouchableOpacity activeOpacity={0.85} style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: C.text,
    marginBottom: 20,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: C.text,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
  },
  phone: {
    fontSize: 13,
    color: C.textSec,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  shieldBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: C.successDim,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  shieldBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.success,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textSec,
    marginBottom: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: C.textSec,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  logoutButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: C.dangerDim,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: C.danger,
    fontSize: 16,
    fontWeight: '700',
  },
});
