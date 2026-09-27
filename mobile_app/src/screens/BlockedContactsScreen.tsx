import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { SupabaseService, BlockedContactItem } from '../services/SupabaseService';

interface BlockedContactsScreenProps {
  onBack: () => void;
}

export function BlockedContactsScreen({ onBack }: BlockedContactsScreenProps) {
  const [contacts, setContacts] = useState<BlockedContactItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    setLoading(true);
    try {
      const list = await SupabaseService.getBlockedContacts();
      setContacts(list);
    } catch (err) {
      console.warn('[BlockedContactsScreen] Error reading blocked contacts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnblock(item: BlockedContactItem) {
    try {
      await SupabaseService.removeFromScamBlacklist(item.number);
      setContacts((prev) => prev.filter((c) => c.id !== item.id && c.number !== item.number));
      Alert.alert(
        '✅ Number Unblocked',
        `"${item.number}" has been removed from the blocked scam list. Future calls from this number will not trigger scam blacklist warnings.`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to unblock number');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Blocked Scam Contacts ({contacts.length})</Text>
        </View>

        {contacts.map((item) => (
          <GlassCard key={item.id} style={styles.contactCard}>
            <View style={styles.cardInfo}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.number}>{item.number}</Text>
              <Text style={styles.reason}>Reason: {item.reason}</Text>
              {item.date ? <Text style={[styles.reason, { marginTop: 2, color: C.textMuted }]}>Added: {item.date}</Text> : null}
            </View>

            <TouchableOpacity style={styles.unblockBtn} onPress={() => handleUnblock(item)}>
              <Text style={styles.unblockText}>Unblock</Text>
            </TouchableOpacity>
          </GlassCard>
        ))}

        {!loading && contacts.length === 0 && (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>No blocked numbers yet.</Text>
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
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 16,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginBottom: 2,
  },
  number: {
    fontSize: 13,
    color: C.accent,
    marginBottom: 4,
  },
  reason: {
    fontSize: 11,
    color: C.textSec,
  },
  unblockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: C.cardBright,
    borderWidth: 1,
    borderColor: C.cardBorderBright,
  },
  unblockText: {
    fontSize: 12,
    color: C.danger,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: C.textMuted,
    fontSize: 14,
  },
});
