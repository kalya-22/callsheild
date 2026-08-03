import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class CallNotificationService {
  private static isConfigured = false;

  public static async configure(): Promise<boolean> {
    if (this.isConfigured) return true;

    try {
      const permissionResp: any = await Notifications.getPermissionsAsync();
      let isGranted = permissionResp?.status === 'granted' || permissionResp?.granted === true;

      if (!isGranted) {
        const reqResp: any = await Notifications.requestPermissionsAsync();
        isGranted = reqResp?.status === 'granted' || reqResp?.granted === true;
      }

      if (!isGranted) {
        console.warn('[CallShield Notifications] Permission not granted');
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('callshield_alerts', {
          name: 'CallShield AI Security Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF2E54',
        });
      }

      this.isConfigured = true;
      return true;
    } catch (err) {
      console.warn('[CallShield Notifications] Setup error:', err);
      return false;
    }
  }

  public static async sendScamAlertNotification(phoneNumber: string, riskScore: number, reportData: any): Promise<void> {
    await this.configure();

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🚨 SCAM THREAT DETECTED (${riskScore}% Risk)`,
          body: `Incoming call from ${phoneNumber} detected as AI Voice Clone / Vishing Scam. Tap to view full security report.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { reportData },
        },
        trigger: null,
      });
    } catch (err) {
      console.warn('[CallShield Notifications] Send alert error:', err);
    }
  }

  public static async sendSafeCallNotification(phoneNumber: string, confidence: number, reportData: any): Promise<void> {
    await this.configure();

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🛡️ VERIFIED SAFE CALL (${confidence}% Safe)`,
          body: `Incoming call from ${phoneNumber} verified as authentic Human Voice. Tap to view call report.`,
          sound: false,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          data: { reportData },
        },
        trigger: null,
      });
    } catch (err) {
      console.warn('[CallShield Notifications] Send safe error:', err);
    }
  }
}
