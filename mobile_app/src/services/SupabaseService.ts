/**
 * SupabaseService.ts
 * Lightweight Supabase REST client for React Native.
 * Saves live call reports & history to Supabase PostgreSQL cloud database.
 * Uses the anon/public key — safe for mobile apps.
 */

const SUPABASE_URL = 'https://vwhfjcpjyjkglionqpny.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3aGZqY3BqeWprZ2xpb25xcG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MDU5NjksImV4cCI6MjEwNTM4MTk2OX0.CXPtxsyoIRHGoNF8JuFJrob9k__jICFLddiU9hz2CIE';

const HEADERS = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  Prefer: 'return=representation',
};

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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/live_call_reports`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(report),
      });
      if (!response.ok) {
        const err = await response.text();
        console.warn('[SupabaseService] saveLiveCallReport failed:', err);
        return false;
      }
      console.log('[SupabaseService] Live call report saved to Supabase cloud ✅');
      return true;
    } catch (err) {
      console.warn('[SupabaseService] saveLiveCallReport network error:', err);
      return false;
    }
  }

  public static async getLiveCallReports(limit = 50): Promise<LiveCallReportRow[]> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/live_call_reports?order=created_at.desc&limit=${limit}`,
        { method: 'GET', headers: HEADERS }
      );
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  }

  // ─── Scam Blacklist ───────────────────────────────────────────────────────

  public static async addToScamBlacklist(phoneNumber: string): Promise<boolean> {
    try {
      // Upsert: if number exists, increment report_count
      const response = await fetch(`${SUPABASE_URL}/rest/v1/scam_blacklist`, {
        method: 'POST',
        headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({
          phone_number: phoneNumber,
          report_count: 1,
          source: 'callshield_auto',
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  public static async isScamBlacklisted(phoneNumber: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/scam_blacklist?phone_number=eq.${encodeURIComponent(phoneNumber)}&limit=1`,
        { method: 'GET', headers: HEADERS }
      );
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/prediction_history`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          ...record,
          chunk_predictions_json: record.chunk_predictions_json || '[]',
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  public static async getPredictionHistory(limit = 50): Promise<unknown[]> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/prediction_history?order=created_at.desc&limit=${limit}`,
        { method: 'GET', headers: HEADERS }
      );
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  }
}
