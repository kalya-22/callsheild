import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, Alert } from 'react-native';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo';

function getNotificationsModule(): any {
  if (isExpoGo) return null;
  try {
    return require('expo-notifications');
  } catch (err) {
    return null;
  }
}

export class CallNotificationService {
  private static isConfigured = false;

  public static async configure(): Promise<boolean> {
    if (this.isConfigured) return true;
    if (isExpoGo) {
      this.isConfigured = true;
      return true;
    }

    const Notifications = getNotificationsModule();
    if (!Notifications) {
      this.isConfigured = true;
      return true;
    }

    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

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

    const Notifications = getNotificationsModule();
    if (!Notifications) {
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

  public static async sendBlacklistWarningNotification(
    phoneNumber: string,
    reportData?: any
  ): Promise<void> {
    const title = `⛔ BLACKLISTED SCAM CALLER: ${phoneNumber}`;
    const body = `WARNING: ${phoneNumber} is on the CallShield Global Scam Blacklist! High-risk vishing fraud caller.`;

    if (isExpoGo) {
      Alert.alert(title, body);
      return;
    }

    const Notifications = getNotificationsModule();
    if (!Notifications) {
      Alert.alert(title, body);
      return;
    }

    await this.configure();

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { reportData: reportData || { phoneNumber, isBlacklisted: true, verdict: 'ai_generated', riskScore: 99 } },
        },
        trigger: null,
      });
    } catch {
      Alert.alert(title, body);
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

    const Notifications = getNotificationsModule();
    if (!Notifications) {
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
