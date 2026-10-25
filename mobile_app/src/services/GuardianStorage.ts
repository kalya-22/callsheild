import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform, Alert } from 'react-native';

const GUARDIAN_STORAGE_KEY = '@callshield_guardian_config';

export interface GuardianContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  enabled: boolean; // Choice to notify this contact during alert
}

export interface GuardianConfig {
  enabled: boolean;
  autoAlertOnScam: boolean;
  lastAlertTimestamp?: number;
  contacts: GuardianContact[];
  // Legacy backward-compatibility fields
  guardianName: string;
  guardianPhone: string;
  relationship: string;
}

export const DEFAULT_GUARDIAN_CONTACTS: GuardianContact[] = [
  {
    id: '1',
    name: 'Arjun Kumar',
    phone: '+91 98765 43210',
    relationship: 'Son / Guardian',
    enabled: true,
  },
  {
    id: '2',
    name: 'Priya Sharma',
    phone: '+91 98123 45678',
    relationship: 'Daughter',
    enabled: true,
  },
  {
    id: '3',
    name: 'Sunita Kumar',
    phone: '+91 97654 32109',
    relationship: 'Spouse',
    enabled: false,
  },
];

export const DEFAULT_GUARDIAN_CONFIG: GuardianConfig = {
  enabled: true,
  autoAlertOnScam: true,
  contacts: DEFAULT_GUARDIAN_CONTACTS,
  guardianName: 'Arjun Kumar, Priya Sharma',
  guardianPhone: '+91 98765 43210, +91 98123 45678',
  relationship: 'Family Guardians',
};

export class GuardianStorage {
  /**
   * Retrieve saved Guardian / Family Shield configuration with multi-contact support
   */
  public static async getGuardianConfig(): Promise<GuardianConfig> {
    try {
      const jsonStr = await AsyncStorage.getItem(GUARDIAN_STORAGE_KEY);
      let config: GuardianConfig;
      if (jsonStr) {
        config = { ...DEFAULT_GUARDIAN_CONFIG, ...JSON.parse(jsonStr) };
      } else {
        config = { ...DEFAULT_GUARDIAN_CONFIG };
      }

      // Backward-compatibility migration: ensure contacts array is populated
      if (!config.contacts || !Array.isArray(config.contacts) || config.contacts.length === 0) {
        config.contacts = [
          {
            id: '1',
            name: config.guardianName || 'Arjun Kumar',
            phone: config.guardianPhone || '+91 98765 43210',
            relationship: config.relationship || 'Son / Guardian',
            enabled: true,
          },
          {
            id: '2',
            name: 'Priya Sharma',
            phone: '+91 98123 45678',
            relationship: 'Daughter',
            enabled: true,
          },
        ];
      }

      // Keep legacy fields synchronized to active contacts
      const active = config.contacts.filter((c) => c.enabled);
      if (active.length > 0) {
        config.guardianName = active.map((c) => c.name).join(', ');
        config.guardianPhone = active.map((c) => c.phone).join(', ');
        config.relationship = active.map((c) => c.relationship).join(', ');
      } else if (config.contacts.length > 0) {
        config.guardianName = config.contacts[0].name;
        config.guardianPhone = config.contacts[0].phone;
        config.relationship = config.contacts[0].relationship;
      }

      return config;
    } catch (err) {
      console.warn('[GuardianStorage] Error getting config:', err);
      return DEFAULT_GUARDIAN_CONFIG;
    }
  }

  /**
   * Save Guardian configuration
   */
  public static async saveGuardianConfig(config: GuardianConfig): Promise<void> {
    try {
      // Sync legacy fields before saving
      const active = (config.contacts || []).filter((c) => c.enabled);
      if (active.length > 0) {
        config.guardianName = active.map((c) => c.name).join(', ');
        config.guardianPhone = active.map((c) => c.phone).join(', ');
        config.relationship = active.map((c) => c.relationship).join(', ');
      }
      await AsyncStorage.setItem(GUARDIAN_STORAGE_KEY, JSON.stringify(config));
    } catch (err) {
      console.warn('[GuardianStorage] Error saving config:', err);
    }
  }

  /**
   * Generate standardized emergency warning message
   */
  public static formatAlertMessage(
    userName: string,
    callerNumber: string,
    threatScore: number = 89
  ): string {
    const cleanUser = userName && userName !== 'User' ? userName : 'Your family member';
    return `⚠️ [CallShield Family Alert] ${cleanUser}'s phone is currently receiving a suspected AI voice clone scam call from ${callerNumber} (Threat Risk: ${threatScore}%). We recommend calling them immediately to verify their safety.`;
  }

  /**
   * Launch native SMS composer with recipient choice or broadcast
   */
  public static async triggerGuardianSms(
    userName: string,
    callerNumber: string,
    threatScore: number = 89,
    targetContactId?: string
  ): Promise<boolean> {
    try {
      const config = await this.getGuardianConfig();
      const activeContacts = (config.contacts || []).filter((c) => c.enabled);

      if (activeContacts.length === 0) {
        Alert.alert(
          'No Family Contacts Selected',
          'Please open Family Shield and enable at least one family member to notify.'
        );
        return false;
      }

      const message = this.formatAlertMessage(userName, callerNumber, threatScore);

      // 1. If a specific contact was explicitly selected
      if (targetContactId) {
        const contact = config.contacts.find((c) => c.id === targetContactId);
        if (contact) {
          return await this.openSmsApp(contact.phone, message, config);
        }
      }

      // 2. If only one contact is enabled, dispatch directly
      if (activeContacts.length === 1) {
        return await this.openSmsApp(activeContacts[0].phone, message, config);
      }

      // 3. If multiple contacts are enabled, present the user with an interactive choice
      return new Promise<boolean>((resolve) => {
        const buttons: any[] = activeContacts.map((contact) => ({
          text: `📱 ${contact.name} (${contact.relationship})`,
          onPress: async () => {
            const ok = await this.openSmsApp(contact.phone, message, config);
            resolve(ok);
          },
        }));

        // Option to broadcast to all enabled family members
        const allPhones = activeContacts.map((c) => c.phone).join(Platform.OS === 'ios' ? '&' : ',');
        buttons.push({
          text: `👨‍👩‍👧‍👦 Broadcast All (${activeContacts.length} Contacts)`,
          onPress: async () => {
            const ok = await this.openSmsApp(allPhones, message, config);
            resolve(ok);
          },
        });

        buttons.push({
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        });

        Alert.alert(
          'Choose Family Member to Alert',
          `You have ${activeContacts.length} family contacts active. Who would you like to notify?`,
          buttons
        );
      });
    } catch (err: any) {
      console.warn('[GuardianStorage] Error triggering SMS:', err);
      Alert.alert('Alert Notice', err.message || 'Failed to dispatch guardian alert.');
      return false;
    }
  }

  /**
   * Helper to open native SMS composer
   */
  private static async openSmsApp(
    phoneString: string,
    message: string,
    config: GuardianConfig
  ): Promise<boolean> {
    const cleanPhones = phoneString.replace(/[\s\(\)]/g, '');
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const smsUrl = `sms:${cleanPhones}${separator}body=${encodeURIComponent(message)}`;

    const canOpen = await Linking.canOpenURL(smsUrl);
    if (canOpen) {
      await Linking.openURL(smsUrl);
      config.lastAlertTimestamp = Date.now();
      await this.saveGuardianConfig(config);
      return true;
    } else {
      Alert.alert('Guardian Alert', `Could not open SMS app. Message:\n\n${message}`);
      return false;
    }
  }

  /**
   * Automated background alert dispatch during active AI voice clone detection
   */
  public static async checkAndAutoAlertGuardian(
    userName: string,
    callerNumber: string,
    threatScore: number = 89
  ): Promise<{ triggered: boolean; guardianName: string; phone: string; count?: number }> {
    try {
      const config = await this.getGuardianConfig();
      const activeContacts = (config.contacts || []).filter((c) => c.enabled);

      if (!config.enabled || !config.autoAlertOnScam || activeContacts.length === 0) {
        return {
          triggered: false,
          guardianName: config.guardianName || 'Family',
          phone: config.guardianPhone || '',
          count: 0,
        };
      }

      // Throttle: don't re-send within 60 seconds for the same call
      const now = Date.now();
      if (config.lastAlertTimestamp && now - config.lastAlertTimestamp < 60000) {
        return {
          triggered: true,
          guardianName: activeContacts.map((c) => c.name).join(', '),
          phone: activeContacts.map((c) => c.phone).join(', '),
          count: activeContacts.length,
        };
      }

      config.lastAlertTimestamp = now;
      await this.saveGuardianConfig(config);

      return {
        triggered: true,
        guardianName: activeContacts.map((c) => c.name).join(', '),
        phone: activeContacts.map((c) => c.phone).join(', '),
        count: activeContacts.length,
      };
    } catch (err) {
      console.warn('[GuardianStorage] checkAndAutoAlertGuardian error:', err);
      return { triggered: false, guardianName: '', phone: '', count: 0 };
    }
  }
}
