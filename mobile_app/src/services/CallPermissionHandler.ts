import { PermissionsAndroid, Platform } from 'react-native';

export class CallPermissionHandler {
  /**
   * Dynamically requests all required permissions for live phone call interception:
   * RECORD_AUDIO, READ_PHONE_STATE, READ_CALL_LOG, and POST_NOTIFICATIONS.
   */
  public static async requestAllCallPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const permissionsToRequest = [
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      ];

      // Add Android 13+ POST_NOTIFICATIONS permission if available
      if (Platform.Version >= 33 && PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }

      const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);

      const micGranted = results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      const phoneStateGranted = results[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED;

      return micGranted && phoneStateGranted;
    } catch (err) {
      console.warn('[CallShield Permissions] Error requesting permissions:', err);
      return false;
    }
  }

  public static async ensureMicrophonePermission(): Promise<boolean> {
    return this.requestAllCallPermissions();
  }

  public static async ensurePhoneStatePermission(): Promise<boolean> {
    return this.requestAllCallPermissions();
  }
}
