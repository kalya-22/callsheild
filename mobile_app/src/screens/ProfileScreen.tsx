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
  onNavigateFamilyShield?: () => void;
}

export function ProfileScreen({
  userName = 'User',
  userEmail = 'user@callshield.ai',
  onLogout,
  onNavigateSettings,
  onNavigateBlocked,
  onNavigateReport,
  onNavigateEmergency,
  onNavigateFamilyShield,
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Account & Security Hub</Text>

        {/* Profile Card */}
        <GlassCard variant="glow" style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.avatarStatusBadge} />
          </View>
          <Text style={styles.name}>{userName || 'User'}</Text>
          <Text style={styles.phone}>{userEmail || 'user@callshield.ai'}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.shieldBadge}>
              <Text style={styles.shieldBadgeText}>● PRO SHIELD DEFENSE ARMED</Text>
            </View>
          </View>
        </GlassCard>

        {/* Action Tools */}
        <Text style={styles.sectionTitle}>Security Modules & Controls</Text>

        <GlassCard style={styles.toolCard} onPress={onNavigateEmergency}>
          <View style={styles.toolRow}>
            <View style={[styles.toolIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <Text style={styles.toolIcon}>🚨</Text>
            </View>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>Emergency SOS Response</Text>
              <Text style={styles.toolSub}>Instant 1-tap call to 1930 National Cyber Desk</Text>
            </View>
            <Text style={styles.toolChevron}>›</Text>
          </View>
        </GlassCard>

        <GlassCard variant="purple" style={styles.toolCard} onPress={onNavigateFamilyShield}>
          <View style={styles.toolRow}>
            <View style={[styles.toolIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.2)', borderColor: 'rgba(168, 85, 247, 0.4)' }]}>
              <Text style={styles.toolIcon}>👨‍👩‍👧‍👦</Text>
            </View>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>Family Shield & Guardian Alerts</Text>
              <Text style={styles.toolSub}>Senior citizen protection • Auto-alert family on AI scam</Text>
            </View>
            <Text style={[styles.toolChevron, { color: '#C084FC' }]}>›</Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.toolCard} onPress={onNavigateReport}>
          <View style={styles.toolRow}>
            <View style={[styles.toolIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
              <Text style={styles.toolIcon}>📢</Text>
            </View>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>Report Scam to Community</Text>
              <Text style={styles.toolSub}>Flag malicious caller numbers & vishing patterns</Text>
            </View>
            <Text style={styles.toolChevron}>›</Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.toolCard} onPress={onNavigateBlocked}>
          <View style={styles.toolRow}>
            <View style={[styles.toolIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
              <Text style={styles.toolIcon}>🚫</Text>
            </View>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>Blocked Scam Numbers</Text>
              <Text style={styles.toolSub}>Manage blocked caller blacklist & automated rules</Text>
            </View>
            <Text style={styles.toolChevron}>›</Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.toolCard} onPress={onNavigateSettings}>
          <View style={styles.toolRow}>
            <View style={[styles.toolIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)', borderColor: 'rgba(6, 182, 212, 0.3)' }]}>
              <Text style={styles.toolIcon}>⚙️</Text>
            </View>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>App & Server Settings</Text>
              <Text style={styles.toolSub}>FastAPI host configuration, sensitivity, notifications</Text>
            </View>
            <Text style={styles.toolChevron}>›</Text>
          </View>
        </GlassCard>

        {/* Logout */}
        <TouchableOpacity activeOpacity={0.82} style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>🚪 Sign Out from Device</Text>
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
    paddingBottom: 110,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
    marginBottom: 20,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 22,
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 2,
    borderColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarStatusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.success,
    borderWidth: 2,
    borderColor: C.bgDeep,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: C.text,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    marginBottom: 2,
  },
  phone: {
    fontSize: 12,
    color: C.textSec,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  shieldBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  shieldBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.successLight,
    letterSpacing: 0.6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.textSec,
    letterSpacing: 0.2,
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
  toolIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  toolIcon: {
    fontSize: 20,
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
    lineHeight: 15,
  },
  toolChevron: {
    fontSize: 22,
    color: C.textMuted,
    fontWeight: '300',
    marginLeft: 8,
  },
  logoutButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  logoutButtonText: {
    color: C.dangerLight,
    fontSize: 14,
    fontWeight: '700',
  },
});
