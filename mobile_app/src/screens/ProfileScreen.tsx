import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';

interface ProfileScreenProps {
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
  onNavigateSettings?: () => void;
  onNavigateBlocked?: () => void;
  onNavigateReport?: () => void;
  onNavigateEmergency?: () => void;
}

export function ProfileScreen({
  userName = 'User',
  userEmail = 'user@callshield.ai',
  onLogout,
  onNavigateSettings,
  onNavigateBlocked,
  onNavigateReport,
  onNavigateEmergency,
}: ProfileScreenProps) {
  // Compute initials from dynamic name
  const initials = userName
    ? userName
        .trim()
        .split(/\s+/)
        .map((part) => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('') || 'U'
    : 'U';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>My Profile & Security</Text>

        {/* Profile Card */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{userName || 'User'}</Text>
          <Text style={styles.phone}>{userEmail || 'user@callshield.ai'}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.shieldBadge}>
              <Text style={styles.shieldBadgeText}>PRO SHIELD ACTIVE</Text>
            </View>
          </View>
        </GlassCard>

        {/* Action Tools */}
        <Text style={styles.sectionTitle}>Security & App Tools</Text>

        <GlassCard style={styles.toolCard} onPress={onNavigateEmergency}>
          <View style={styles.toolRow}>
            <Text style={styles.toolIcon}>🚨</Text>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>Emergency SOS Helpline</Text>
              <Text style={styles.toolSub}>Instant 1-tap call to 1930 Cyber Desk</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.toolCard} onPress={onNavigateReport}>
          <View style={styles.toolRow}>
            <Text style={styles.toolIcon}>📢</Text>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>Report Scam to Community</Text>
              <Text style={styles.toolSub}>Flag malicious caller numbers & vishing notes</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.toolCard} onPress={onNavigateBlocked}>
          <View style={styles.toolRow}>
            <Text style={styles.toolIcon}>🚫</Text>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>Blocked Scam Numbers</Text>
              <Text style={styles.toolSub}>Manage blocked caller list & automated rules</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.toolCard} onPress={onNavigateSettings}>
          <View style={styles.toolRow}>
            <Text style={styles.toolIcon}>⚙️</Text>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>App & Server Settings</Text>
              <Text style={styles.toolSub}>FastAPI host configuration, sensitivity, notifications</Text>
            </View>
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
    marginBottom: 20,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginBottom: 2,
  },
  phone: {
    fontSize: 12,
    color: C.textSec,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  shieldBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
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
    fontSize: 15,
    fontWeight: '700',
    color: C.textSec,
    marginBottom: 12,
  },
  toolCard: {
    padding: 14,
    marginBottom: 10,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  toolText: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginBottom: 2,
  },
  toolSub: {
    fontSize: 11,
    color: C.textSec,
  },
  logoutButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: C.dangerDim,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  logoutButtonText: {
    color: C.danger,
    fontSize: 15,
    fontWeight: '700',
  },
});
