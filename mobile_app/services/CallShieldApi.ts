import { Platform } from 'react-native';
import { CallOfflineAiService } from '../src/services/CallOfflineAiService';

export class CallShieldApi {
  private static defaultBaseUrl = Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api/v1'
    : 'http://localhost:8000/api/v1';

  public static baseUrl: string = CallShieldApi.defaultBaseUrl;

  public static async getStatus(): Promise<any> {
    try {
      const response = await fetch(`${CallShieldApi.baseUrl}/status`);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      return await response.json();
    } catch (error) {
      throw new Error(`Backend offline: ${error}`);
    }
  }

  public static async predictAudioFile(
    fileUri: string,
    fileName: string,
    mimeType?: string,
    fileBlob?: Blob
  ): Promise<any> {
    try {
      const formData = new FormData();
      if (fileBlob) {
        formData.append('file', fileBlob, fileName);
      } else {
        formData.append('file', {
          uri: fileUri,
          name: fileName,
          type: mimeType || 'audio/wav',
        } as any);
      }

      const response = await fetch(`${CallShieldApi.baseUrl}/predict`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Server error');
      }

      return await response.json();
    } catch (error) {
      console.log('[CallShield] Server offline/unreachable. Falling back to On-Device Offline AI Model...');
      return await CallOfflineAiService.predictOffline(fileName);
    }
  }

  public static async getHistory(limit: number = 20): Promise<any[]> {
    try {
      const response = await fetch(`${CallShieldApi.baseUrl}/history?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      return await response.json();
    } catch {
      return [];
    }
  }

  public static async deleteHistoryItem(predictionId: number): Promise<boolean> {
    try {
      const response = await fetch(`${CallShieldApi.baseUrl}/history/${predictionId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch {
      return true;
    }
  }

  public static async clearHistory(): Promise<boolean> {
    try {
      const response = await fetch(`${CallShieldApi.baseUrl}/history`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch {
      return true;
    }
  }
}
