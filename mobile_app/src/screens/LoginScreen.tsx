import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { C } from '../theme/colors';
import { ShieldLogo } from '../components/ShieldLogo';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [phone, setPhone] = useState('+1 (555) 019-2834');
  const [password, setPassword] = useState('••••••••');
  const [isGuest, setIsGuest] = useState(false);

  function handleLogin() {
    onLoginSuccess();
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <ShieldLogo size={70} animate={false} />
          <Text style={styles.brandTitle}>CallShield</Text>
          <Text style={styles.brandSubtitle}>Sign in to access AI protection suite</Text>
        </View>

        {/* Inputs */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={C.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Password / PIN</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={C.textMuted}
          />
        </View>

        {/* Sign In Button */}
        <TouchableOpacity activeOpacity={0.85} style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Guest Demo Option */}
        <TouchableOpacity
          style={styles.guestButton}
          onPress={() => {
            setIsGuest(true);
            handleLogin();
          }}
        >
          <Text style={styles.guestButtonText}>Continue as Guest Demo</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: C.text,
    marginTop: 12,
  },
  brandSubtitle: {
    fontSize: 14,
    color: C.textSec,
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSec,
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    color: C.text,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  loginButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  loginButtonText: {
    color: C.text,
    fontSize: 16,
    fontWeight: '700',
  },
  guestButton: {
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  guestButtonText: {
    color: C.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
