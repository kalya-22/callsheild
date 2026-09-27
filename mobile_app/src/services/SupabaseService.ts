import AsyncStorage from '@react-native-async-storage/async-storage';

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

export interface ScamBlacklistRow {
  phone_number: string;
  source?: string;
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
      return true; // Graceful fallback
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

  // ─── Scam Blacklist (Offline-First with Cloud Sync) ──────────────────────────

  public static async addToScamBlacklist(phoneNumber: string): Promise<boolean> {
    if (!phoneNumber || phoneNumber === 'Unknown Caller') return true;
    const cleanNumber = phoneNumber.trim();

    try {
      // 1. Always save to local AsyncStorage blacklist immediately
      const existingStr = await AsyncStorage.getItem(LOCAL_BLACKLIST_KEY);
      const existingList: string[] = existingStr ? JSON.parse(existingStr) : [];
      if (!existingList.includes(cleanNumber)) {
        existingList.push(cleanNumber);
        await AsyncStorage.setItem(LOCAL_BLACKLIST_KEY, JSON.stringify(existingList));
        console.log(`[SupabaseService] Added ${cleanNumber} to local blacklist ✅`);
      }

      // 2. Best-effort cloud sync in background
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        await fetch(`${SUPABASE_URL}/rest/v1/scam_blacklist`, {
          method: 'POST',
          headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({
            phone_number: cleanNumber,
            report_count: 1,
            source: 'callshield_auto',
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (cloudErr) {
        console.warn('[SupabaseService] Cloud blacklist sync silent error:', cloudErr);
      }

      return true;
    } catch (err) {
      console.warn('[SupabaseService] Local blacklist error:', err);
      return true;
    }
  }

  public static async isScamBlacklisted(phoneNumber: string): Promise<boolean> {
    if (!phoneNumber || phoneNumber === 'Unknown Caller') return false;
    const cleanNumber = phoneNumber.trim();

    try {
      // 1. Check local persistent blacklist
      const existingStr = await AsyncStorage.getItem(LOCAL_BLACKLIST_KEY);
      if (existingStr) {
        const existingList: string[] = JSON.parse(existingStr);
        if (existingList.includes(cleanNumber)) {
          return true;
        }
      }

      // 2. Query cloud database
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/scam_blacklist?phone_number=eq.${encodeURIComponent(cleanNumber)}&limit=1`,
        { method: 'GET', headers: HEADERS, signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (!response.ok) return false;
      const data: unknown[] = await response.json();
      return data.length > 0;
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
