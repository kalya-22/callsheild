import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { ShieldLogo } from '../components/ShieldLogo';
import { CallShieldApi } from '../../services/CallShieldApi';

interface RecentCall {
  id: string;
  name: string;
  number: string;
  time: string;
  risk: 'safe' | 'suspicious' | 'scam';
  confidence: number;
}

const mockRecentCalls: RecentCall[] = [
  { id: '1', name: 'HDFC Bank Support', number: '+91 22 6160 6161', time: '2m ago', risk: 'safe', confidence: 96 },
  { id: '2', name: 'Unknown Number', number: '+91 98765 43210', time: '1h ago', risk: 'scam', confidence: 92 },
  { id: '3', name: 'Mom', number: '+91 94440 12345', time: '3h ago', risk: 'safe', confidence: 99 },
  { id: '4', name: 'Insurance Desk', number: '+91 80123 45678', time: '5h ago', risk: 'suspicious', confidence: 74 },
];

interface HomeScreenProps {
  onStartLiveCall?: () => void;
}

export function HomeScreen({ onStartLiveCall }: HomeScreenProps) {
  const [protectionActive, setProtectionActive] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>(mockRecentCalls);

  useEffect(() => {
    async function checkHealth() {
      try {
        await CallShieldApi.getStatus();
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const getRiskStyle = (risk: RecentCall['risk']) => {
    switch (risk) {
      case 'safe':
        return { color: C.success, bg: C.successDim, label: 'Safe' };
      case 'suspicious':
        return { color: C.warning, bg: C.warningDim, label: 'Suspicious' };
      case 'scam':
        return { color: C.danger, bg: C.dangerDim, label: 'Scam Threat' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Good day,</Text>
            <Text style={styles.userName}>John Doe 👋</Text>
          </View>

          {/* Backend Server Status Pill */}
          <View style={[styles.statusBadge, { borderColor: backendOnline ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)' }]}>
            <View style={[styles.statusDot, { backgroundColor: backendOnline ? C.success : C.danger }]} />
            <Text style={styles.statusText}>{backendOnline ? 'AI Online' : 'Local Mode'}</Text>
          </View>
        </View>

        {/* Shield Toggle Banner */}
        <GlassCard bright style={styles.shieldBanner}>
          <View style={styles.shieldLeft}>
            <ShieldLogo size={56} animate={protectionActive} />
            <View style={styles.shieldInfo}>
              <Text style={styles.shieldStatusTitle}>
                {protectionActive ? 'Live Shield Active' : 'Shield Paused'}
              </Text>
              <Text style={styles.shieldStatusSub}>
                {protectionActive ? 'Real-time AI monitoring active' : 'Tap to resume call protection'}
              </Text>
            </View>
          </View>
          <Switch
            trackColor={{ false: '#334155', true: C.primary }}
            thumbColor={protectionActive ? C.text : '#94A3B8'}
            value={protectionActive}
            onValueChange={setProtectionActive}
          />
        </GlassCard>

        {/* Action Button: Simulate / Monitor Incoming Call */}
        {onStartLiveCall && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.liveCallButton}
            onPress={onStartLiveCall}
          >
            <Text style={styles.liveCallButtonText}>📞 Launch Live Call Protection Monitor</Text>
          </TouchableOpacity>
        )}

        {/* Quick Stats Grid */}
        <Text style={styles.sectionHeader}>Security Snapshot</Text>
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statValue, { color: C.danger }]}>14</Text>
            <Text style={styles.statLabel}>Scams Blocked</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Text style={[styles.statValue, { color: C.accent }]}>48</Text>
            <Text style={styles.statLabel}>Calls Analyzed</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Text style={[styles.statValue, { color: C.success }]}>99%</Text>
            <Text style={styles.statLabel}>Protection Score</Text>
          </GlassCard>
        </View>

        {/* Recent Calls Section */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionHeader}>Recent Analyzed Calls</Text>
        </View>

        {recentCalls.map((item) => {
          const riskStyle = getRiskStyle(item.risk);
          return (
            <GlassCard key={item.id} style={styles.callCard}>
              <View style={styles.callMain}>
                <View style={styles.callIcon}>
                  <Text style={styles.callIconText}>📞</Text>
                </View>
                <View style={styles.callDetails}>
                  <Text style={styles.callName}>{item.name}</Text>
                  <Text style={styles.callNumber}>{item.number}</Text>
                </View>
              </View>

              <View style={styles.callMeta}>
                <View style={[styles.riskTag, { backgroundColor: riskStyle.bg }]}>
                  <Text style={[styles.riskTagText, { color: riskStyle.color }]}>
                    {riskStyle.label} ({item.confidence}%)
                  </Text>
                </View>
                <Text style={styles.callTime}>{item.time}</Text>
              </View>
            </GlassCard>
          );
        })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSec,
  },
  shieldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 16,
  },
  shieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  shieldInfo: {
    marginLeft: 12,
    flex: 1,
  },
  shieldStatusTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    marginBottom: 2,
  },
  shieldStatusSub: {
    fontSize: 12,
    color: C.textSec,
  },
  liveCallButton: {
    height: 50,
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 4,
  },
  liveCallButtonText: {
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: C.textSec,
    fontWeight: '600',
  },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 14,
  },
  callMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  callIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  callIconText: {
    fontSize: 18,
  },
  callDetails: {
    flex: 1,
  },
  callName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginBottom: 2,
  },
  callNumber: {
    fontSize: 12,
    color: C.textMuted,
  },
  callMeta: {
    alignItems: 'flex-end',
  },
  riskTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 4,
  },
  riskTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  callTime: {
    fontSize: 11,
    color: C.textMuted,
  },
});
