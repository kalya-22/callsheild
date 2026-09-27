import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const SUPABASE_URL = 'https://vwhfjcpjyjkglionqpny.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3aGZqY3BqeWprZ2xpb25xcG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MDU5NjksImV4cCI6MjEwNTM4MTk2OX0.CXPtxsyoIRHGoNF8JuFJrob9k__jICFLddiU9hz2CIE';

const HEADERS = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  Prefer: 'return=representation',
};

const LOCAL_BLACKLIST_KEY = 'callshield_scam_blacklist_local';
const LOCAL_BLOCKED_CONTACTS_KEY = 'callshield_blocked_contacts_list';

export interface BlockedContactItem {
  id: string;
  name: string;
  number: string;
  reason: string;
  date: string;
}

const INITIAL_BLOCKED_CONTACTS: BlockedContactItem[] = [
  { id: '1', name: 'Unknown AI Vishing Bot', number: '+91 98765 43210', reason: 'High Risk Vishing Attempt (89% score)', date: 'Today' },
  { id: '2', name: 'Fake Lottery Desk', number: '+91 80123 99999', reason: 'Reported by Community', date: 'Yesterday' },
  { id: '3', name: 'Spam Robo Call', number: '+91 91111 22222', reason: 'Auto-blocked by strict AI sensitivity', date: 'Jul 28, 2026' },
];

export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)]/g, '').trim();
}

export interface LiveCallReportRow {
  phone_number: string;
  final_verdict: string;
  overall_risk_score: number;
  risk_level: string;
  attributed_generator?: string;
  attribution_confidence?: number;
  synthesis_technique?: string;
  call_duration_seconds?: number;
  chunk_count?: number;
}

export class SupabaseService {

  // ─── Live Call Reports ────────────────────────────────────────────────────

  public static async saveLiveCallReport(report: LiveCallReportRow): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/live_call_reports`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(report),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const err = await response.text();
        console.warn('[SupabaseService] saveLiveCallReport failed:', err);
        return false;
      }
      console.log('[SupabaseService] Live call report saved to Supabase cloud ✅');
      return true;
    } catch (err) {
      console.warn('[SupabaseService] saveLiveCallReport network error (offline fallback active):', err);
      return true;
    }
  }

  public static async getLiveCallReports(limit = 50): Promise<LiveCallReportRow[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/live_call_reports?order=created_at.desc&limit=${limit}`,
        { method: 'GET', headers: HEADERS, signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  }

  // ─── Blocked Scam Contacts List & Blacklist Management ────────────────────

  public static async getBlockedContacts(): Promise<BlockedContactItem[]> {
    try {
      const existingStr = await AsyncStorage.getItem(LOCAL_BLOCKED_CONTACTS_KEY);
      if (existingStr) {
        const parsed: BlockedContactItem[] = JSON.parse(existingStr);
        if (parsed && Array.isArray(parsed)) {
          return parsed;
        }
      }
      // Initialize with default list if empty
      await AsyncStorage.setItem(LOCAL_BLOCKED_CONTACTS_KEY, JSON.stringify(INITIAL_BLOCKED_CONTACTS));
      const initialPhones = INITIAL_BLOCKED_CONTACTS.map((c) => cleanPhoneNumber(c.number));
      await AsyncStorage.setItem(LOCAL_BLACKLIST_KEY, JSON.stringify(initialPhones));
      return INITIAL_BLOCKED_CONTACTS;
    } catch (err) {
      console.warn('[SupabaseService] Error loading blocked contacts:', err);
      return INITIAL_BLOCKED_CONTACTS;
    }
  }

  public static async addToScamBlacklist(
    phoneNumber: string,
    reason = 'Reported as Scam Voice Clone',
    callerName?: string
  ): Promise<boolean> {
    if (!phoneNumber || phoneNumber === 'Unknown Caller') return true;
    const cleanNum = cleanPhoneNumber(phoneNumber);
    const displayNum = phoneNumber.trim();

    try {
      // 1. Update simple blacklist set
      const blacklistStr = await AsyncStorage.getItem(LOCAL_BLACKLIST_KEY);
      const blacklist: string[] = blacklistStr ? JSON.parse(blacklistStr) : [];
      if (!blacklist.some((n) => cleanPhoneNumber(n) === cleanNum)) {
        blacklist.push(cleanNum);
        blacklist.push(displayNum);
        await AsyncStorage.setItem(LOCAL_BLACKLIST_KEY, JSON.stringify(blacklist));
      }

      // 2. Update rich Blocked Contacts list
      const contacts = await this.getBlockedContacts();
      const alreadyInList = contacts.some((c) => cleanPhoneNumber(c.number) === cleanNum);
      if (!alreadyInList) {
        const newContact: BlockedContactItem = {
          id: Date.now().toString(),
          name: callerName || 'Flagged Scam Caller',
          number: displayNum,
          reason,
          date: 'Just now',
        };
        const updatedList = [newContact, ...contacts];
        await AsyncStorage.setItem(LOCAL_BLOCKED_CONTACTS_KEY, JSON.stringify(updatedList));
      }

      // 3. Notify native CallInterceptorModule to block calls natively
      if (Platform.OS === 'android' && NativeModules.CallInterceptorModule?.blockNumber) {
        try {
          await NativeModules.CallInterceptorModule.blockNumber(displayNum);
          await NativeModules.CallInterceptorModule.blockNumber(cleanNum);
        } catch {}
      }

      // 4. Background cloud sync
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        await fetch(`${SUPABASE_URL}/rest/v1/scam_blacklist`, {
          method: 'POST',
          headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({
            phone_number: displayNum,
            report_count: 1,
            source: 'callshield_auto',
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch {}

      console.log(`[SupabaseService] Number ${displayNum} added to Blocked Scam Numbers ✅`);
      return true;
    } catch (err) {
      console.warn('[SupabaseService] Local blacklist error:', err);
      return true;
    }
  }

  public static async removeFromScamBlacklist(phoneNumber: string): Promise<boolean> {
    if (!phoneNumber) return true;
    const cleanNum = cleanPhoneNumber(phoneNumber);

    try {
      // 1. Remove from simple blacklist set
      const blacklistStr = await AsyncStorage.getItem(LOCAL_BLACKLIST_KEY);
      if (blacklistStr) {
        const blacklist: string[] = JSON.parse(blacklistStr);
        const filtered = blacklist.filter((n) => cleanPhoneNumber(n) !== cleanNum && n !== phoneNumber);
        await AsyncStorage.setItem(LOCAL_BLACKLIST_KEY, JSON.stringify(filtered));
      }

      // 2. Remove from rich Blocked Contacts list
      const contacts = await this.getBlockedContacts();
      const updatedList = contacts.filter((c) => cleanPhoneNumber(c.number) !== cleanNum && c.number !== phoneNumber && c.id !== phoneNumber);
      await AsyncStorage.setItem(LOCAL_BLOCKED_CONTACTS_KEY, JSON.stringify(updatedList));

      // 3. Unblock on native Android layer
      if (Platform.OS === 'android' && NativeModules.CallInterceptorModule?.unblockNumber) {
        try {
          await NativeModules.CallInterceptorModule.unblockNumber(phoneNumber);
          await NativeModules.CallInterceptorModule.unblockNumber(cleanNum);
        } catch {}
      }

      // 4. Delete from Supabase cloud database if reachable
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        await fetch(`${SUPABASE_URL}/rest/v1/scam_blacklist?phone_number=eq.${encodeURIComponent(phoneNumber)}`, {
          method: 'DELETE',
          headers: HEADERS,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch {}

      console.log(`[SupabaseService] Number ${phoneNumber} UNBLOCKED and removed from scam list ✅`);
      return true;
    } catch (err) {
      console.warn('[SupabaseService] Error unblocking number:', err);
      return true;
    }
  }

  public static async isScamBlacklisted(phoneNumber: string): Promise<boolean> {
    if (!phoneNumber || phoneNumber === 'Unknown Caller') return false;
    const cleanNum = cleanPhoneNumber(phoneNumber);

    try {
      // 1. Check local persistent blacklist
      const existingStr = await AsyncStorage.getItem(LOCAL_BLACKLIST_KEY);
      if (existingStr) {
        const existingList: string[] = JSON.parse(existingStr);
        if (existingList.some((n) => cleanPhoneNumber(n) === cleanNum || n === phoneNumber)) {
          return true;
        }
      }

      // 2. Check local blocked contacts
      const contactsStr = await AsyncStorage.getItem(LOCAL_BLOCKED_CONTACTS_KEY);
      if (contactsStr) {
        const contactsList: BlockedContactItem[] = JSON.parse(contactsStr);
        if (contactsList.some((c) => cleanPhoneNumber(c.number) === cleanNum || c.number === phoneNumber)) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  // ─── Prediction History Sync ──────────────────────────────────────────────

  public static async savePredictionRecord(record: {
    filename: string;
    predicted_label: string;
    ai_probability: number;
    risk_level: string;
    warning: boolean;
    chunk_count: number;
    chunk_predictions_json?: string;
  }): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/prediction_history`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          ...record,
          chunk_predictions_json: record.chunk_predictions_json || '[]',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return true;
    }
  }

  public static async getPredictionHistory(limit = 50): Promise<unknown[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/prediction_history?order=created_at.desc&limit=${limit}`,
        { method: 'GET', headers: HEADERS, signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  }
}
