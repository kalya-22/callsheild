import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, Alert } from 'react-native';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo';

// Safe notification handler configuration for Expo Go & Standalone Builds
try {
  if (!isExpoGo) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (err) {
  console.log('[CallShield Notifications] Notification handler skipped in Expo Go');
}

export class CallNotificationService {
  private static isConfigured = false;

  public static async configure(): Promise<boolean> {
    if (this.isConfigured) return true;
    if (isExpoGo) {
      this.isConfigured = true;
      return true;
    }

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

  public static async sendScamAlertNotification(
    phoneNumber: string,
    riskScore: number,
    reportData: any
  ): Promise<void> {
    if (isExpoGo) {
      Alert.alert(
        `🚨 SCAM THREAT DETECTED (${riskScore}% Risk)`,
        `Incoming call from ${phoneNumber} detected as AI Voice Clone / Vishing Scam.`
      );
      return;
    }

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
      Alert.alert(
        `🚨 SCAM THREAT DETECTED (${riskScore}% Risk)`,
        `Incoming call from ${phoneNumber} detected as AI Voice Clone / Vishing Scam.`
      );
    }
  }

  public static async sendSafeCallNotification(
    phoneNumber: string,
    confidence: number,
    reportData: any
  ): Promise<void> {
    if (isExpoGo) {
      Alert.alert(
        `🛡️ VERIFIED SAFE CALL (${confidence}% Safe)`,
        `Incoming call from ${phoneNumber} verified as authentic Human Voice.`
      );
      return;
    }

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
      Alert.alert(
        `🛡️ VERIFIED SAFE CALL (${confidence}% Safe)`,
        `Incoming call from ${phoneNumber} verified as authentic Human Voice.`
      );
    }
  }
}
