import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';

interface BlockedContact {
  id: string;
  name: string;
  number: string;
  reason: string;
  date: string;
}

const initialBlocked: BlockedContact[] = [
  { id: '1', name: 'Unknown AI Vishing Bot', number: '+91 98765 43210', reason: 'High Risk Vishing Attempt (89% score)', date: 'Today' },
  { id: '2', name: 'Fake Lottery Desk', number: '+91 80123 99999', reason: 'Reported by Community', date: 'Yesterday' },
  { id: '3', name: 'Spam Robo Call', number: '+91 91111 22222', reason: 'Auto-blocked by strict AI sensitivity', date: 'Jul 28, 2026' },
];

interface BlockedContactsScreenProps {
  onBack: () => void;
}

export function BlockedContactsScreen({ onBack }: BlockedContactsScreenProps) {
  const [contacts, setContacts] = useState<BlockedContact[]>(initialBlocked);

  function unblock(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Blocked Scam Contacts</Text>
        </View>

        {contacts.map((item) => (
          <GlassCard key={item.id} style={styles.contactCard}>
            <View style={styles.cardInfo}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.number}>{item.number}</Text>
              <Text style={styles.reason}>Reason: {item.reason}</Text>
            </View>

            <TouchableOpacity style={styles.unblockBtn} onPress={() => unblock(item.id)}>
              <Text style={styles.unblockText}>Unblock</Text>
            </TouchableOpacity>
          </GlassCard>
        ))}

        {contacts.length === 0 && (
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
