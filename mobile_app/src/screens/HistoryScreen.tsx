import React, { useState, useEffect } from 'react';
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
import { CallShieldApi } from '../../services/CallShieldApi';

import { CallHistoryStorage } from '../services/CallHistoryStorage';
import { PdfReportExporter } from '../services/PdfReportExporter';
import { SupabaseService } from '../services/SupabaseService';

type FilterType = 'All' | 'Safe' | 'Suspicious' | 'Scam';

interface HistoryItem {
  prediction_id: number;
  filename: string;
  predicted_label: string;
  ai_probability: number;
  risk_level: string;
  created_at: string;
  confidence_percent?: number;
  source?: 'local' | 'api' | 'cloud_call' | 'cloud_prediction';
}

interface HistoryScreenProps {
  onSelectReport: (item: HistoryItem) => void;
}

export function HistoryScreen({ onSelectReport }: HistoryScreenProps) {
  const [filter, setFilter] = useState<FilterType>('All');
  const [search, setSearch] = useState('');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  function isChunkFile(name?: string): boolean {
    if (!name) return false;
    const lower = name.toLowerCase();
    return (
      lower.startsWith('live_chunk_') ||
      lower.startsWith('live_call_') ||
      lower.startsWith('live_interceptor_') ||
      lower.startsWith('chunk_') ||
      lower.includes('_chunk') ||
      lower.includes('chunk #')
    );
  }

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const items: HistoryItem[] = [];

        // Source 1: Local Call Sessions (from actual completed calls & reports)
        try {
          const stored = await CallHistoryStorage.getCallHistory();
          if (stored && stored.length > 0) {
            const localItems = stored
              .filter((rec) => !isChunkFile(rec.number) && !isChunkFile(rec.name))
              .map((rec, index) => {
                const isScam = rec.risk === 'scam' || rec.predicted_label === 'ai_generated';
                const isSuspicious = rec.risk === 'suspicious' || rec.predicted_label === 'insufficient_audio';
                const conf = rec.confidence || (isScam ? 80 : 88);
                const aiProb = isScam ? conf / 100 : isSuspicious ? 0.45 : Number(((100 - conf) / 100).toFixed(2));

                return {
                  prediction_id: parseInt(rec.id) || Date.now() + index,
                  filename: rec.number || rec.name || 'Incoming Call',
                  predicted_label: rec.predicted_label || (isScam ? 'ai_generated' : isSuspicious ? 'insufficient_audio' : 'human'),
                  ai_probability: aiProb,
                  risk_level: isScam ? 'high' : isSuspicious ? 'medium' : 'low',
                  created_at: rec.timestamp || new Date().toISOString(),
                  confidence_percent: conf,
                  source: 'local' as const,
                };
              });
            items.push(...localItems);
          }
        } catch { /* local storage unavailable */ }

        // Source 2: Supabase live_call_reports (completed call session reports)
        try {
          const cloudCalls = await SupabaseService.getLiveCallReports(50);
          if (cloudCalls && cloudCalls.length > 0) {
            const cloudCallItems: HistoryItem[] = cloudCalls
              .filter((r: any) => !isChunkFile(r.phone_number))
              .map((r: any, idx: number) => {
                const isScam = r.risk_level === 'high' || r.final_verdict === 'ai_generated';
                const isSuspicious = r.risk_level === 'medium' || r.final_verdict === 'insufficient_audio';
                const conf = r.overall_risk_score || (isScam ? 80 : 88);
                const aiProb = isScam ? conf / 100 : isSuspicious ? 0.45 : Number(((100 - conf) / 100).toFixed(2));

                return {
                  prediction_id: r.id ?? Date.now() + idx + 1000,
                  filename: r.phone_number || 'Live Call',
                  predicted_label: r.final_verdict || (isScam ? 'ai_generated' : isSuspicious ? 'insufficient_audio' : 'human'),
                  ai_probability: aiProb,
                  risk_level: isScam ? 'high' : isSuspicious ? 'medium' : 'low',
                  created_at: r.created_at || new Date().toISOString(),
                  confidence_percent: conf,
                  source: 'cloud_call' as const,
                };
              });
            items.push(...cloudCallItems);
          }
        } catch { /* Supabase live_call_reports unavailable */ }

        // Source 3: Full Uploaded Audio Files (excludes streaming chunks)
        try {
          const apiData = await CallShieldApi.getHistory(50);
          if (apiData && apiData.length > 0) {
            const nonChunkFiles = apiData.filter((d: any) => !isChunkFile(d.filename));
            const apiItems: HistoryItem[] = nonChunkFiles.map((d: any) => {
              const isScam = d.predicted_label === 'ai_generated' || d.risk_level === 'high';
              const conf = Math.round((d.ai_confidence_percent || d.ai_probability * 100) ?? 85);
              return {
                prediction_id: d.prediction_id,
                filename: d.filename,
                predicted_label: d.predicted_label,
                ai_probability: d.ai_probability,
                risk_level: d.risk_level,
                created_at: d.created_at,
                confidence_percent: conf,
                source: 'api' as const,
              };
            });
            items.push(...apiItems);
          }
        } catch { /* Backend offline */ }

        // Deduplicate by prediction_id and sort by newest first
        const seen = new Set<number>();
        const unique = items.filter((item) => {
          if (seen.has(item.prediction_id)) return false;
          seen.add(item.prediction_id);
          return true;
        });
        unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setHistoryItems(unique);
      } catch (err) {
        console.warn('[HistoryScreen] Error loading history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const getRiskMeta = (item: HistoryItem) => {
    const isHuman =
      item.predicted_label === 'human' ||
      item.predicted_label === 'human_voice' ||
      item.risk_level === 'low' ||
      item.risk_level === 'safe';
    const isScam =
      item.predicted_label === 'ai_generated' ||
      item.risk_level === 'high' ||
      item.risk_level === 'scam';
    const isSuspicious =
      item.predicted_label === 'insufficient_audio' ||
      item.risk_level === 'medium' ||
      item.risk_level === 'suspicious';

    if (isHuman && !isScam) {
      return { label: 'Safe', color: C.success, bg: C.successDim };
    }
    if (isScam) {
      return { label: 'Scam', color: C.danger, bg: C.dangerDim };
    }
    if (isSuspicious) {
      return { label: 'Suspicious', color: C.warning, bg: C.warningDim };
    }
    return item.ai_probability >= 0.6
      ? { label: 'Scam', color: C.danger, bg: C.dangerDim }
      : { label: 'Safe', color: C.success, bg: C.successDim };
  };

  const filteredItems = historyItems.filter((item) => {
    const meta = getRiskMeta(item);
    const matchesFilter = filter === 'All' || meta.label === filter;
    const matchesSearch =
      item.filename.toLowerCase().includes(search.toLowerCase()) ||
      item.predicted_label.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Title */}
        <Text style={styles.headerTitle}>Call Protection History</Text>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search audio calls or files..."
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['All', 'Safe', 'Suspicious', 'Scam'] as FilterType[]).map((f) => {
            const active = filter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* History Item Cards */}
        {filteredItems.map((item) => {
          const meta = getRiskMeta(item);
          const confPercent = item.confidence_percent ?? Math.round(item.ai_probability * 100);

          return (
            <GlassCard
              key={item.prediction_id}
              style={[
                styles.itemCard,
                { borderLeftWidth: 3.5, borderLeftColor: meta.color },
              ]}
              onPress={() => onSelectReport(item)}
            >
              <View style={styles.itemMain}>
                <View style={[styles.avatarCircle, { backgroundColor: meta.bg, borderColor: meta.color }]}>
                  <Text style={[styles.avatarText, { color: meta.color }]}>
                    {meta.label === 'Scam' ? '🚨' : meta.label === 'Suspicious' ? '⚠️' : '🛡️'}
                  </Text>
                </View>

                <View style={styles.itemDetails}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.filename}</Text>
                  <Text style={styles.itemSub}>
                    {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>

              <View style={styles.itemRight}>
                <View style={[styles.riskTag, { backgroundColor: meta.bg, borderColor: meta.color }]}>
                  <Text style={[styles.riskTagText, { color: meta.color }]}>
                    {meta.label} ({confPercent}%)
                  </Text>
                </View>

                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.pdfExportBtn}
                    onPress={async () => {
                      await PdfReportExporter.generateAndSharePdf({
                        reportId: `CS-${item.prediction_id}`,
                        phoneNumber: item.filename,
                        timestamp: new Date(item.created_at).toLocaleString(),
                        overallPrediction: item.predicted_label,
                        overallRiskScore: confPercent,
                        riskLevel: meta.label.toLowerCase(),
                      });
                    }}
                  >
                    <Text style={styles.pdfExportBtnText}>📄 PDF</Text>
                  </TouchableOpacity>

                  {/* One-Tap Blacklist Button */}
                  <TouchableOpacity
                    style={styles.blacklistBtn}
                    onPress={async () => {
                      const phone = item.filename;
                      if (!phone || phone.includes('sample') || phone.includes('.wav') || phone.includes('.mp3')) {
                        Alert.alert('Cannot Blacklist', 'Selected entry is an uploaded audio file, not a phone number.');
                        return;
                      }
                      try {
                        await SupabaseService.addToScamBlacklist(phone, `Flagged in Call History (${confPercent}% AI risk)`);
                        Alert.alert(
                          '🚨 Number Added to Blocked Scam List',
                          `"${phone}" has been successfully added to your Blocked Scam Numbers.`
                        );
                      } catch (err: any) {
                        Alert.alert('Error', err.message || 'Failed to blacklist number');
                      }
                    }}
                  >
                    <Text style={styles.blacklistBtnText}>🚫 Block</Text>
                  </TouchableOpacity>
                </View>
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
    paddingTop: 20,
    paddingBottom: 110,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: C.text,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  filterPillActive: {
    backgroundColor: C.primaryDim,
    borderColor: C.primary,
  },
  filterPillText: {
    fontSize: 12,
    color: C.textSec,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: C.accent,
    fontWeight: '800',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 14,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
  },
  avatarText: {
    fontSize: 18,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
    marginBottom: 2,
  },
  itemSub: {
    fontSize: 11,
    color: C.textMuted,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  riskTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  riskTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pdfExportBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
  },
  pdfExportBtnText: {
    color: C.accentLight,
    fontSize: 10,
    fontWeight: '800',
  },
  blacklistBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    alignItems: 'center',
  },
  blacklistBtnText: {
    color: C.dangerLight,
    fontSize: 10,
    fontWeight: '800',
  },
});
