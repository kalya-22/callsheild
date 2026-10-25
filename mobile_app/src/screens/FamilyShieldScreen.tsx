import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { C } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import {
  GuardianStorage,
  GuardianConfig,
  GuardianContact,
  DEFAULT_GUARDIAN_CONTACTS,
} from '../services/GuardianStorage';

interface FamilyShieldScreenProps {
  userName?: string;
  onBack: () => void;
}

const RELATIONSHIP_PRESETS = ['Son', 'Daughter', 'Spouse', 'Parent', 'Caregiver', 'Brother/Sister'];

export function FamilyShieldScreen({ userName = 'User', onBack }: FamilyShieldScreenProps) {
  const [enabled, setEnabled] = useState(true);
  const [autoAlertOnScam, setAutoAlertOnScam] = useState(true);
  const [contacts, setContacts] = useState<GuardianContact[]>(DEFAULT_GUARDIAN_CONTACTS);
  const [isSaving, setIsSaving] = useState(false);

  // New Contact Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelationship, setNewRelationship] = useState('Son');

  useEffect(() => {
    async function loadConfig() {
      const config = await GuardianStorage.getGuardianConfig();
      setEnabled(config.enabled);
      setAutoAlertOnScam(config.autoAlertOnScam);
      if (config.contacts && config.contacts.length > 0) {
        setContacts(config.contacts);
      }
    }
    loadConfig();
  }, []);

  // Toggle individual contact's alert notification preference
  const toggleContactNotification = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  // Quick select all or deselect all
  const selectAllContacts = (status: boolean) => {
    setContacts((prev) => prev.map((c) => ({ ...c, enabled: status })));
  };

  // Delete a contact
  const handleDeleteContact = (id: string, name: string) => {
    if (contacts.length <= 1) {
      Alert.alert('Cannot Remove', 'You must maintain at least one family contact in Family Shield.');
      return;
    }
    Alert.alert(
      'Remove Family Contact',
      `Are you sure you want to remove ${name} from Family Shield?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setContacts((prev) => prev.filter((c) => c.id !== id));
          },
        },
      ]
    );
  };

  // Add new family contact
  const handleAddNewContact = () => {
    if (!newName.trim()) {
      Alert.alert('Missing Name', 'Please enter a family member name.');
      return;
    }
    if (!newPhone.trim() || newPhone.trim().length < 8) {
      Alert.alert('Invalid Number', 'Please enter a valid mobile number with country code (e.g. +91 98765 43210).');
      return;
    }

    const newContactItem: GuardianContact = {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: newPhone.trim(),
      relationship: newRelationship.trim() || 'Family',
      enabled: true,
    };

    setContacts((prev) => [...prev, newContactItem]);
    setNewName('');
    setNewPhone('');
    setShowAddForm(false);
    Alert.alert('Contact Added', `${newContactItem.name} has been added to Family Shield.`);
  };

  // Save full configuration
  const handleSave = async () => {
    const active = contacts.filter((c) => c.enabled);
    if (enabled && active.length === 0) {
      Alert.alert(
        'No Active Recipients',
        'Please enable notification for at least one family member so CallShield knows who to alert.'
      );
      return;
    }

    setIsSaving(true);
    const config: GuardianConfig = {
      enabled,
      autoAlertOnScam,
      contacts,
      guardianName: active.map((c) => c.name).join(', ') || contacts[0]?.name || 'Guardian',
      guardianPhone: active.map((c) => c.phone).join(', ') || contacts[0]?.phone || '',
      relationship: active.map((c) => c.relationship).join(', ') || 'Family',
      lastAlertTimestamp: Date.now(),
    };

    await GuardianStorage.saveGuardianConfig(config);
    setIsSaving(false);
    Alert.alert(
      'Family Shield Saved ✅',
      `Configuration updated! ${active.length} family member(s) will be notified during AI scam threats.`
    );
  };

  // Send Test Alert (triggers recipient choice modal)
  const handleSendTestAlert = async () => {
    await GuardianStorage.triggerGuardianSms(userName, '+91 98765 43210', 89);
  };

  const activeContacts = contacts.filter((c) => c.enabled);
  const sampleMessage = GuardianStorage.formatAlertMessage(userName, '+91 98765 43210', 89);

  const getRelationshipIcon = (rel: string) => {
    const r = rel.toLowerCase();
    if (r.includes('son')) return '👨‍👦';
    if (r.includes('daughter')) return '👧';
    if (r.includes('spouse') || r.includes('wife') || r.includes('husband')) return '👫';
    if (r.includes('parent') || r.includes('mother') || r.includes('father')) return '👵';
    if (r.includes('care')) return '🩺';
    if (r.includes('brother') || r.includes('sister')) return '👥';
    return '👤';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Family Shield</Text>
        </View>

        {/* Feature Hero Card */}
        <GlassCard variant="purple" style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIconCircle}>
              <Text style={styles.heroIconText}>👨‍👩‍👧‍👦</Text>
            </View>
            <View style={styles.heroText}>
              <View style={styles.heroBadgeRow}>
                <Text style={styles.heroTitle}>Multi-Family Sentinel</Text>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>{enabled ? 'ARMED' : 'STANDBY'}</Text>
                </View>
              </View>
              <Text style={styles.heroSub}>
                Save multiple family numbers (son, daughter, spouse). You can choose exactly who gets notified when an AI voice clone or digital arrest scam strikes.
              </Text>
            </View>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Enable Family Shield Sentinel</Text>
            <Switch
              trackColor={{ false: '#334155', true: '#A855F7' }}
              thumbColor={enabled ? C.text : '#94A3B8'}
              value={enabled}
              onValueChange={setEnabled}
            />
          </View>
        </GlassCard>

        {/* Family Contacts Header & Quick Choice Actions */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeader}>Trusted Family Contacts</Text>
            <Text style={styles.sectionSub}>
              {activeContacts.length} of {contacts.length} chosen for emergency alerts
            </Text>
          </View>
          <View style={styles.quickChoiceRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.quickBtn}
              onPress={() => selectAllContacts(true)}
            >
              <Text style={styles.quickBtnText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.quickBtn, { borderColor: 'rgba(255,255,255,0.1)' }]}
              onPress={() => selectAllContacts(false)}
            >
              <Text style={styles.quickBtnTextMuted}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Cards List */}
        {contacts.map((contact) => (
          <GlassCard
            key={contact.id}
            bright={contact.enabled}
            style={[
              styles.contactCard,
              contact.enabled ? styles.contactCardActive : styles.contactCardInactive,
            ]}
          >
            <View style={styles.contactTopRow}>
              <View style={styles.contactAvatar}>
                <Text style={{ fontSize: 22 }}>{getRelationshipIcon(contact.relationship)}</Text>
              </View>

              <View style={styles.contactInfo}>
                <View style={styles.contactTitleRow}>
                  <Text style={styles.contactName} numberOfLines={1}>{contact.name}</Text>
                  <View
                    style={[
                      styles.notifyStatusBadge,
                      {
                        backgroundColor: contact.enabled
                          ? 'rgba(168, 85, 247, 0.25)'
                          : 'rgba(100, 116, 139, 0.2)',
                        borderColor: contact.enabled ? '#C084FC' : '#475569',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.notifyStatusText,
                        { color: contact.enabled ? '#D8B4FE' : '#94A3B8' },
                      ]}
                    >
                      {contact.enabled ? '✓ NOTIFY' : 'MUTED'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.contactRelation}>{contact.relationship}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
            </View>

            <View style={styles.contactActionRow}>
              <View style={styles.notifyToggleWrap}>
                <Text style={styles.notifyToggleLabel}>Notify on Scam Alert</Text>
                <Switch
                  trackColor={{ false: '#334155', true: '#9333EA' }}
                  thumbColor={contact.enabled ? C.text : '#94A3B8'}
                  value={contact.enabled}
                  onValueChange={() => toggleContactNotification(contact.id)}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.deleteContactBtn}
                onPress={() => handleDeleteContact(contact.id, contact.name)}
              >
                <Text style={styles.deleteContactIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}

        {/* Add New Contact Form / Button */}
        {!showAddForm ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.addContactBtn}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.addContactBtnText}>➕ Add Another Family Member</Text>
          </TouchableOpacity>
        ) : (
          <GlassCard bright style={styles.addFormCard}>
            <View style={styles.addFormHeader}>
              <Text style={styles.addFormTitle}>Add New Family Member</Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <Text style={styles.addFormClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Priya Sharma"
                placeholderTextColor={C.textMuted}
                value={newName}
                onChangeText={setNewName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MOBILE NUMBER (WITH COUNTRY CODE)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. +91 98123 45678"
                placeholderTextColor={C.textMuted}
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
              />
            </View>

            <Text style={styles.inputLabel}>RELATIONSHIP</Text>
            <View style={styles.presetsRow}>
              {RELATIONSHIP_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    newRelationship === preset && styles.presetChipActive,
                  ]}
                  onPress={() => setNewRelationship(preset)}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      newRelationship === preset && styles.presetChipTextActive,
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formButtonRow}>
              <TouchableOpacity
                style={[styles.formBtn, styles.formBtnCancel]}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.formBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formBtn, styles.formBtnSave]}
                onPress={handleAddNewContact}
              >
                <Text style={styles.formBtnSaveText}>Add Contact</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {/* Auto Alert Setting Card */}
        <GlassCard bright style={styles.settingsCard}>
          <View style={styles.toggleRowNoBorder}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.toggleTitle}>Auto-Send Emergency Alert</Text>
              <Text style={styles.toggleSub}>
                Immediately prepares dispatch when AI threat risk crosses 75% or caller is on blacklist
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#334155', true: C.accent }}
              thumbColor={autoAlertOnScam ? C.text : '#94A3B8'}
              value={autoAlertOnScam}
              onValueChange={setAutoAlertOnScam}
            />
          </View>
        </GlassCard>

        {/* Live SMS Preview Card */}
        <Text style={styles.sectionHeader}>Emergency Alert Message Preview</Text>
        <GlassCard variant="danger" style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={styles.previewTagBadge}>
              <Text style={styles.previewTag}>SMS / PUSH DISPATCH FORMAT</Text>
            </View>
            <Text style={styles.previewRecipient} numberOfLines={1}>
              To: {activeContacts.map((c) => c.name).join(', ') || 'No recipient chosen'}
            </Text>
          </View>
          <View style={styles.previewMessageBox}>
            <Text style={styles.previewMessageText}>{sampleMessage}</Text>
          </View>
        </GlassCard>

        {/* Action Buttons */}
        <View style={styles.buttonStack}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveBtnText}>
              {isSaving ? 'Saving...' : '💾 Save Family Shield Configuration'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.testBtn}
            onPress={handleSendTestAlert}
          >
            <Text style={styles.testBtnText}>📱 Test Dispatch (Choose Recipient)</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 110,
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
    flex: 1,
  },
  heroCard: {
    padding: 18,
    marginBottom: 20,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  heroIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  heroIconText: {
    fontSize: 24,
  },
  heroText: {
    flex: 1,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  activePill: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C084FC',
  },
  activePillText: {
    color: '#D8B4FE',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroSub: {
    fontSize: 12,
    color: C.textSec,
    lineHeight: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    letterSpacing: 0.3,
  },
  sectionSub: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },
  quickChoiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  quickBtnText: {
    color: '#D8B4FE',
    fontSize: 11,
    fontWeight: '700',
  },
  quickBtnTextMuted: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  contactCard: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 16,
  },
  contactCardActive: {
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  contactCardInactive: {
    opacity: 0.65,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  contactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    flexShrink: 1,
  },
  notifyStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  notifyStatusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  contactRelation: {
    fontSize: 12,
    color: '#C084FC',
    fontWeight: '700',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 12,
    color: C.textSec,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  contactActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  notifyToggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifyToggleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text,
  },
  deleteContactBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  deleteContactIcon: {
    fontSize: 14,
  },
  addContactBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.5)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addContactBtnText: {
    color: '#D8B4FE',
    fontSize: 13,
    fontWeight: '800',
  },
  addFormCard: {
    padding: 16,
    marginBottom: 20,
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
  addFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  addFormTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
  },
  addFormClose: {
    color: C.textMuted,
    fontSize: 16,
    padding: 4,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    color: C.text,
    fontSize: 13,
    fontWeight: '600',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    marginTop: 4,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetChipActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    borderColor: '#C084FC',
  },
  presetChipText: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#D8B4FE',
    fontWeight: '800',
  },
  formButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formBtnCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  formBtnCancelText: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  formBtnSave: {
    backgroundColor: '#9333EA',
  },
  formBtnSaveText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  settingsCard: {
    padding: 16,
    marginBottom: 20,
  },
  toggleRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    marginBottom: 2,
  },
  toggleSub: {
    fontSize: 11,
    color: C.textSec,
    lineHeight: 16,
  },
  previewCard: {
    padding: 16,
    marginBottom: 20,
  },
  previewHeader: {
    marginBottom: 10,
  },
  previewTagBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  previewTag: {
    color: C.dangerLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  previewRecipient: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text,
  },
  previewMessageBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  previewMessageText: {
    color: C.textSec,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  buttonStack: {
    gap: 12,
  },
  saveBtn: {
    height: 52,
    backgroundColor: '#7E22CE',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '800',
  },
  testBtn: {
    height: 50,
    backgroundColor: C.card,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  testBtnText: {
    color: C.accentLight,
    fontSize: 13,
    fontWeight: '700',
  },
});
