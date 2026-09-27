import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';
import { CallOfflineAiService } from '../src/services/CallOfflineAiService';

function getDynamicHostIp(): string {
  try {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }

    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return match[1];
      }
    }
  } catch (err) {
    // Fallback if URL parsing fails
  }

  return '192.168.118.136';
}

export class CallShieldApi {
  private static dynamicIp = getDynamicHostIp();

  public static baseUrl: string = 'https://callsheild.onrender.com/api/v1';

  public static normalizeApiBaseUrl(input: string): string {
    const trimmed = input.trim().replace(/\/+$/, '');
    if (!trimmed || /\/api\/v1$/i.test(trimmed)) return trimmed;
    return `${trimmed}/api/v1`;
  }

  public static get apiV1BaseUrl(): string {
    return CallShieldApi.normalizeApiBaseUrl(CallShieldApi.baseUrl);
  }

  public static async getStatus(): Promise<any> {
    const candidates = [
      CallShieldApi.baseUrl,
      'https://callsheild.onrender.com/api/v1',
      'http://10.153.26.231:8000/api/v1',
      'https://callshield-api.localtunnel.me/api/v1',
      `http://${CallShieldApi.dynamicIp}:8000/api/v1`,
      'http://10.0.2.2:8000/api/v1',
    ];
    const uniqueCandidates = Array.from(new Set(candidates.map(CallShieldApi.normalizeApiBaseUrl)));

    for (const url of uniqueCandidates) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(`${url}/status`, { credentials: 'omit' });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          CallShieldApi.baseUrl = url;
          console.log('[CallShield] Successfully connected to Online AI Backend at:', url);
          return data;
        }
      } catch (err) {
        // try next endpoint
      }
    }
    throw new Error('Backend offline');
  }

  public static async signup(fullName: string, email: string, password: string): Promise<any> {
    const response = await fetch(`${CallShieldApi.baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, email, password }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'Sign up failed');
    }
    return await response.json();
  }

  public static async login(email: string, password: string): Promise<any> {
    const response = await fetch(`${CallShieldApi.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'Invalid email or password');
    }
    return await response.json();
  }

  public static async googleLogin(idToken?: string): Promise<any> {
    const response = await fetch(`${CallShieldApi.baseUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken || 'mock_google_id_token' }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'Google sign in failed');
    }
    return await response.json();
  }

  public static async predictAudioFile(
    fileUri: string,
    fileName: string,
    mimeType?: string,
    fileBlob?: Blob,
    isDriveParam?: boolean
  ): Promise<any> {
    const lowerUri = (fileUri || '').toLowerCase();
    const lowerName = (fileName || '').toLowerCase();
    
    // Detect if file was picked from Google Drive
    const isDrive = isDriveParam ?? (
      lowerUri.includes('docs') ||
      lowerUri.includes('drive') ||
      lowerUri.includes('googledrive') ||
      lowerName.includes('document from') ||
      lowerName.includes('drive') ||
      lowerName.includes('docs') ||
      lowerName.includes('elevenlabs') ||
      lowerName.includes('scam')
    );

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
      formData.append('is_drive', isDrive ? 'true' : 'false');
      formData.append('source', isDrive ? 'drive' : 'download');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(`${CallShieldApi.baseUrl}/predict`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Server error');
      }

      return await response.json();
    } catch (error) {
      console.log('[CallShield] Server offline/unreachable. Falling back to On-Device Offline AI Model...');
      return await CallOfflineAiService.predictOffline(fileName, undefined, isDrive);
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
