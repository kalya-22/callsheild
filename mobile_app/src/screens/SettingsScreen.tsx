import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  TextInput,
} from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { CallShieldApi } from '../../services/CallShieldApi';

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [autoDetect, setAutoDetect] = useState(true);
  const [haptic, setHaptic] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [baseUrlInput, setBaseUrlInput] = useState(CallShieldApi.baseUrl);

  function saveBaseUrl() {
    const normalizedUrl = CallShieldApi.normalizeApiBaseUrl(baseUrlInput);
    CallShieldApi.baseUrl = normalizedUrl;
    setBaseUrlInput(normalizedUrl);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>App Settings</Text>
        </View>

        {/* Backend Host Config */}
        <Text style={styles.sectionHeader}>Backend Server Configuration</Text>
        <GlassCard style={styles.card}>
          <Text style={styles.label}>FastAPI Server URL (add `/api/v1` automatically)</Text>
          <View style={styles.urlInputRow}>
            <TextInput
              style={styles.input}
              value={baseUrlInput}
              onChangeText={setBaseUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveBaseUrl}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* AI Detection & Alerts */}
        <Text style={styles.sectionHeader}>AI Detection & Alerts</Text>
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Auto-Analyze Incoming Calls</Text>
              <Text style={styles.settingSub}>Trigger AI threat model on call connect</Text>
            </View>
            <Switch
              trackColor={{ false: '#334155', true: C.primary }}
              thumbColor={autoDetect ? C.text : '#94A3B8'}
              value={autoDetect}
              onValueChange={setAutoDetect}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Scam Warning Push Alerts</Text>
              <Text style={styles.settingSub}>Show popups on high confidence threat</Text>
            </View>
            <Switch
              trackColor={{ false: '#334155', true: C.primary }}
              thumbColor={notifications ? C.text : '#94A3B8'}
              value={notifications}
              onValueChange={setNotifications}
            />
          </View>

          <View style={styles.settingRowNoBorder}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Haptic Alert Vibration</Text>
              <Text style={styles.settingSub}>Vibrate phone on critical warning</Text>
            </View>
            <Switch
              trackColor={{ false: '#334155', true: C.primary }}
              thumbColor={haptic ? C.text : '#94A3B8'}
              value={haptic}
              onValueChange={setHaptic}
            />
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: C.card,
    marginRight: 12,
  },
  backBtnText: {
    color: C.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
  },
  card: {
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSec,
    marginBottom: 8,
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: C.bgDeep,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    color: C.text,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  saveBtn: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  settingRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 11,
    color: C.textSec,
  },
});
