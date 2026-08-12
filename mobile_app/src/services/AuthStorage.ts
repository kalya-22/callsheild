import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_SESSION_KEY = '@callshield_user_session';

export interface UserSession {
  isLoggedIn: boolean;
  name: string;
  email?: string;
  loginTimestamp: number;
}

export class AuthStorage {
  /**
   * Save user session upon successful login
   */
  public static async saveSession(name: string, email?: string): Promise<void> {
    try {
      const session: UserSession = {
        isLoggedIn: true,
        name: name || 'Alex Johnson',
        email: email || 'user@callshield.ai',
        loginTimestamp: Date.now(),
      };
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
    } catch (err) {
      console.warn('[AuthStorage] Error saving session:', err);
    }
  }

  /**
   * Load stored user session on app launch
   */
  public static async getSession(): Promise<UserSession | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(USER_SESSION_KEY);
      if (jsonValue != null) {
        return JSON.parse(jsonValue) as UserSession;
      }
    } catch (err) {
      console.warn('[AuthStorage] Error getting session:', err);
    }
    return null;
  }

  /**
   * Clear user session on logout
   */
  public static async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_SESSION_KEY);
    } catch (err) {
      console.warn('[AuthStorage] Error clearing session:', err);
    }
  }
}
