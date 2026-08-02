import { Platform } from 'react-native';

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

  public static async predictAudioFile(fileUri: string, fileName: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: 'audio/wav',
    } as any);

    const response = await fetch(`${CallShieldApi.baseUrl}/predict`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Prediction failed: ${errorText}`);
    }

    return await response.json();
  }

  public static async getHistory(limit: number = 20): Promise<any[]> {
    const response = await fetch(`${CallShieldApi.baseUrl}/history?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch history');
    return await response.json();
  }

  public static async deleteHistoryItem(predictionId: number): Promise<boolean> {
    const response = await fetch(`${CallShieldApi.baseUrl}/history/${predictionId}`, {
      method: 'DELETE',
    });
    return response.ok;
  }

  public static async clearHistory(): Promise<boolean> {
    const response = await fetch(`${CallShieldApi.baseUrl}/history`, {
      method: 'DELETE',
    });
    return response.ok;
  }
}
