import React, { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

const DEFAULT_PORT = '5174';
const DEFAULT_LAPTOP_IP = '10.251.165.231';

function normalizeHost(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `http://${trimmed}:${DEFAULT_PORT}`;
}

export default function App() {
  const defaultHost = Platform.OS === 'android' ? DEFAULT_LAPTOP_IP : 'localhost';
  const [hostInput, setHostInput] = useState(defaultHost);
  const [webUrl, setWebUrl] = useState(normalizeHost(defaultHost));
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [key, setKey] = useState(0);

  const helperText = useMemo(() => {
    if (Platform.OS === 'android') {
      return 'For a real phone, enter your laptop Wi-Fi IPv4 address, for example 192.168.1.10.';
    }
    return 'Use localhost for simulator, or your laptop Wi-Fi IPv4 address for a real phone.';
  }, []);

  function loadApp() {
    const nextUrl = normalizeHost(hostInput);
    if (!nextUrl) return;
    setWebUrl(nextUrl);
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    setIsConfigured(true);
    setKey((value) => value + 1);
  }

  if (!isConfigured || hasError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.errorContainer}
        >
          <Text style={styles.brand}>CallShield</Text>
          <Text style={styles.errorTitle}>
            {hasError ? 'Web app is not reachable' : 'Connect to CallShield'}
          </Text>
          <Text style={styles.errorDesc}>
            Start the React frontend on your laptop, then confirm the URL or laptop IP.
          </Text>
          {hasError ? <Text style={styles.currentUrl}>Tried: {webUrl}</Text> : null}
          {errorMessage ? <Text style={styles.errorSmall}>{errorMessage}</Text> : null}

          <View style={styles.codeBox}>
            <Text style={styles.codeText}>cd C:/Users/kalya/Documents/Codex/2026-07-03/su/CallShield/frontend-react</Text>
            <Text style={styles.codeText}>npm run dev -- --host 0.0.0.0</Text>
          </View>

          <Text style={styles.label}>Frontend URL or laptop IP</Text>
          <TextInput
            value={hostInput}
            onChangeText={setHostInput}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="192.168.1.10 or http://192.168.1.10:5174"
            placeholderTextColor="#64748B"
            style={styles.input}
          />
          <Text style={styles.helper}>{helperText}</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={loadApp}>
            <Text style={styles.primaryText}>
              {hasError ? 'Reload CallShield App' : 'Open CallShield App'}
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#38BDF8" size="large" />
          <Text style={styles.loadingText}>Opening CallShield...</Text>
        </View>
      )}
      <WebView
        key={key}
        source={{ uri: webUrl }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserGesture={false}
        originWhitelist={['*']}
        mixedContentMode="always"
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setErrorMessage('The WebView could not load the frontend URL. Check that the phone and laptop are on the same network.');
          setHasError(true);
        }}
        onHttpError={(event) => {
          setIsLoading(false);
          setErrorMessage(`HTTP ${event.nativeEvent.statusCode}: ${event.nativeEvent.description}`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070E1A',
  },
  webview: {
    flex: 1,
    backgroundColor: '#070E1A',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#070E1A',
  },
  loadingText: {
    marginTop: 12,
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#070E1A',
  },
  brand: {
    color: '#38BDF8',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  errorDesc: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  currentUrl: {
    color: '#67E8F9',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  errorSmall: {
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  codeBox: {
    backgroundColor: '#0F172A',
    padding: 14,
    borderRadius: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  codeText: {
    color: '#67E8F9',
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 14,
  },
  helper: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    marginBottom: 18,
  },
  primaryButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
