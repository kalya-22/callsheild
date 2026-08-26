import AsyncStorage from '@react-native-async-storage/async-storage';

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

const STORAGE_KEY = 'callshield_real_call_history';

export class CallHistoryStorage {
  public static async getCallHistory(): Promise<CallRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn('[CallHistoryStorage] Error reading call history:', err);
    }
    return [];
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

  public static async clearCallHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('[CallHistoryStorage] Error clearing call history:', err);
    }
  }
}
