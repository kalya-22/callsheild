import { PermissionsAndroid, Platform } from 'react-native';

export class CallPermissionHandler {
  /**
   * Dynamically checks and prompts for Microphone & Phone State permissions
   * when an incoming phone call connects.
   */
  public static async ensureMicrophonePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const hasMicPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );

      if (hasMicPermission) return true;

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'CallShield Microphone Permission Needed',
          message:
            'CallShield requires microphone access during incoming phone calls to analyze voice frequencies and detect AI voice cloning in real-time.',
          buttonNeutral: 'Ask Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Grant Permission',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('[CallShield Permissions] Error requesting mic permission:', err);
      return false;
    }
  }

  public static async ensurePhoneStatePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const hasPhoneState = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
      );

      if (hasPhoneState) return true;

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        {
          title: 'CallShield Phone Call Listener Permission',
          message:
            'CallShield needs permission to detect when phone calls ring to provide instant AI protection.',
          buttonNeutral: 'Ask Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('[CallShield Permissions] Error requesting phone state:', err);
      return false;
    }
  }
}
