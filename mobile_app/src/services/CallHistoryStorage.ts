import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseService } from './SupabaseService';

export interface CallRecord {
  id: string;
  name: string;
  number: string;
  time: string;
  risk: 'safe' | 'suspicious' | 'scam';
  confidence: number;
  predicted_label?: string;
  timestamp?: string;
}

export interface SecurityStats {
  scamsBlocked: number;
  callsAnalyzed: number;
  protectionScore: number;
}

const STORAGE_KEY = 'callshield_real_call_history';

export class CallHistoryStorage {
  public static async getCallHistory(): Promise<CallRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed: CallRecord[] = JSON.parse(data);
        if (parsed && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[CallHistoryStorage] Error reading call history:', err);
    }
    return [];
  }

  public static async syncFromCloud(): Promise<CallRecord[]> {
    try {
      const local = await this.getCallHistory();
      const cloudReports = await SupabaseService.getLiveCallReports(50);
      
      const cloudRecords: CallRecord[] = cloudReports.map((r: any, idx: number) => {
        const isScam = r.risk_level === 'high' || r.final_verdict === 'ai_generated';
        const isSuspicious = r.risk_level === 'medium' || r.final_verdict === 'insufficient_audio';
        return {
          id: `cloud_${r.id || idx}`,
          name: r.phone_number || 'Incoming Call',
          number: r.phone_number || 'Unknown',
          time: r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
          risk: isScam ? 'scam' : isSuspicious ? 'suspicious' : 'safe',
          confidence: Math.round(r.overall_risk_score || 85),
          predicted_label: r.final_verdict || (isScam ? 'ai_generated' : isSuspicious ? 'insufficient_audio' : 'human'),
          timestamp: r.created_at,
        };
      });

      // Merge avoiding duplicate IDs/numbers around same timestamps
      const map = new Map<string, CallRecord>();
      [...local, ...cloudRecords].forEach((item) => {
        if (item.id && !map.has(item.id)) {
          map.set(item.id, item);
        }
      });

      const merged = Array.from(map.values()).slice(0, 50);
      if (merged.length > 0) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    } catch (err) {
      console.warn('[CallHistoryStorage] Cloud sync error:', err);
      return await this.getCallHistory();
    }
  }

  public static async saveCallRecord(record: CallRecord): Promise<CallRecord[]> {
    try {
      const existing = await this.getCallHistory();
      // Filter out duplicate IDs
      const updated = [record, ...existing.filter((item) => item.id !== record.id)].slice(0, 50);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.warn('[CallHistoryStorage] Error saving call record:', err);
      return [];
    }
  }

  public static async getStats(): Promise<SecurityStats> {
    try {
      const records = await this.getCallHistory();
      const scamsCount = records.filter((r) => r.risk === 'scam' || r.predicted_label === 'ai_generated').length;
      const totalCalls = records.length;
      
      // Calculate dynamic protection score
      const protectionScore = totalCalls === 0 ? 99 : Math.max(90, Math.min(100, Math.round(100 - (scamsCount / totalCalls) * 2)));

      return {
        scamsBlocked: scamsCount,
        callsAnalyzed: totalCalls,
        protectionScore,
      };
    } catch {
      return { scamsBlocked: 0, callsAnalyzed: 0, protectionScore: 99 };
    }
  }

  public static async clearCallHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('[CallHistoryStorage] Error clearing call history:', err);
    }
  }
}

