import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';

export function AnalyticsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Threat Analytics & Insights</Text>

        {/* Protection Summary Card */}
        <GlassCard bright style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Weekly Threat Defense Summary</Text>

          <View style={styles.barsContainer}>
            {[
              { day: 'Mon', count: 12, threat: 2, height: '40%' },
              { day: 'Tue', count: 18, threat: 4, height: '65%' },
              { day: 'Wed', count: 24, threat: 6, height: '85%' },
              { day: 'Thu', count: 15, threat: 3, height: '50%' },
              { day: 'Fri', count: 30, threat: 8, height: '95%' },
              { day: 'Sat', count: 10, threat: 1, height: '35%' },
              { day: 'Sun', count: 8, threat: 0, height: '25%' },
            ].map((item) => (
              <View key={item.day} style={styles.barItem}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: item.height as any }]} />
                </View>
                <Text style={styles.barDay}>{item.day}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Threat Distribution Grid */}
        <Text style={styles.sectionTitle}>Vishing Attack Categories</Text>

        <GlassCard style={styles.statCard}>
          <View style={styles.statRow}>
            <Text style={styles.statName}>Bank Impersonation</Text>
            <Text style={[styles.statPercent, { color: C.danger }]}>45%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '45%', backgroundColor: C.danger }]} />
          </View>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <View style={styles.statRow}>
            <Text style={styles.statName}>Tech Support Scams</Text>
            <Text style={[styles.statPercent, { color: C.warning }]}>30%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '30%', backgroundColor: C.warning }]} />
          </View>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <View style={styles.statRow}>
            <Text style={styles.statName}>Lottery & Gift Traps</Text>
            <Text style={[styles.statPercent, { color: C.accent }]}>25%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '25%', backgroundColor: C.accent }]} />
          </View>
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
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
    marginBottom: 20,
  },
  summaryCard: {
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 20,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingHorizontal: 8,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 14,
    height: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: C.primary,
    borderRadius: 7,
  },
  barDay: {
    fontSize: 11,
    color: C.textSec,
    marginTop: 8,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  statCard: {
    padding: 16,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  statPercent: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
