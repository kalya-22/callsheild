import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { CallShieldApi } from '../../services/CallShieldApi';

type FilterType = 'All' | 'Safe' | 'Suspicious' | 'Scam';

interface HistoryItem {
  prediction_id: number;
  filename: string;
  predicted_label: string;
  ai_probability: number;
  risk_level: string;
  created_at: string;
}

interface HistoryScreenProps {
  onSelectReport: (item: HistoryItem) => void;
}

const mockHistory: HistoryItem[] = [
  { prediction_id: 101, filename: 'sample_audio_vishing.wav', predicted_label: 'ai_generated', ai_probability: 0.89, risk_level: 'high', created_at: new Date().toISOString() },
  { prediction_id: 102, filename: 'hdfc_support_call.wav', predicted_label: 'human', ai_probability: 0.04, risk_level: 'low', created_at: new Date(Date.now() - 3600000).toISOString() },
  { prediction_id: 103, filename: 'insurance_inquiry.wav', predicted_label: 'ai_generated', ai_probability: 0.62, risk_level: 'medium', created_at: new Date(Date.now() - 7200000).toISOString() },
  { prediction_id: 104, filename: 'mom_voice_note.wav', predicted_label: 'human', ai_probability: 0.01, risk_level: 'low', created_at: new Date(Date.now() - 14400000).toISOString() },
];

export function HistoryScreen({ onSelectReport }: HistoryScreenProps) {
  const [filter, setFilter] = useState<FilterType>('All');
  const [search, setSearch] = useState('');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(mockHistory);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const data = await CallShieldApi.getHistory(50);
        if (data && data.length > 0) {
          setHistoryItems(data);
        }
      } catch {
        // Fallback to mock data if offline
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const getRiskMeta = (item: HistoryItem) => {
    if (item.risk_level === 'high' || item.ai_probability >= 0.7) {
      return { label: 'Scam', color: C.danger, bg: C.dangerDim };
    }
    if (item.risk_level === 'medium' || item.ai_probability >= 0.4) {
      return { label: 'Suspicious', color: C.warning, bg: C.warningDim };
    }
    return { label: 'Safe', color: C.success, bg: C.successDim };
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
          const confPercent = Math.round(item.ai_probability * 100);

          return (
            <GlassCard
              key={item.prediction_id}
              style={styles.itemCard}
              onPress={() => onSelectReport(item)}
            >
              <View style={styles.itemMain}>
                <View style={[styles.avatarCircle, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.avatarText, { color: meta.color }]}>
                    {meta.label === 'Scam' ? 'AI' : 'OK'}
                  </Text>
                </View>

                <View style={styles.itemDetails}>
                  <Text style={styles.itemTitle}>{item.filename}</Text>
                  <Text style={styles.itemSub}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>

              <View style={styles.itemRight}>
                <View style={[styles.riskTag, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.riskTagText, { color: meta.color }]}>
                    {meta.label} ({confPercent}%)
                  </Text>
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
    paddingBottom: 32,
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
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginBottom: 2,
  },
  itemSub: {
    fontSize: 12,
    color: C.textMuted,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  riskTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  riskTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
