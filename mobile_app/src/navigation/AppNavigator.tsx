import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PermissionScreen } from '../screens/PermissionScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LiveCallScreen } from '../screens/LiveCallScreen';
import { LiveAnalysisScreen } from '../screens/LiveAnalysisScreen';
import { AlertScreen } from '../screens/AlertScreen';
import { SafeResultScreen } from '../screens/SafeResultScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { CallReportScreen } from '../screens/CallReportScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { ScamReportScreen } from '../screens/ScamReportScreen';
import { BlockedContactsScreen } from '../screens/BlockedContactsScreen';
import { EmergencyScreen } from '../screens/EmergencyScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AuthStorage } from '../services/AuthStorage';
import { callInterceptorService } from '../services/CallInterceptorService';
import { C } from '../theme/colors';

export type ScreenState =
  | 'splash'
  | 'onboarding'
  | 'permission'
  | 'login'
  | 'home'
  | 'live_call'
  | 'live_analysis'
  | 'alert'
  | 'safe_result'
  | 'history'
  | 'call_report'
  | 'analytics'
  | 'scam_report'
  | 'blocked'
  | 'emergency'
  | 'settings'
  | 'profile';

export function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('splash');
  const [selectedReportItem, setSelectedReportItem] = useState<any>(null);
  const [userName, setUserName] = useState<string>('Alex Johnson');
  const [activeCallerNumber, setActiveCallerNumber] = useState<string>('Unknown Caller');
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    // Listen for interactive notification "ANALYZE CALL" tap button
    callInterceptorService.setOnAnalyzeClickedListener((callerNumber) => {
      console.log('[AppNavigator] Analyze call notification clicked for:', callerNumber);
      setActiveCallerNumber(callerNumber || 'Unknown Caller');
      setCurrentScreen('live_call');
    });

    async function restoreUserSession() {
      try {
        const session = await AuthStorage.getSession();
        if (session && session.isLoggedIn) {
          if (session.name) {
            setUserName(session.name);
          }
          setCurrentScreen((screen) => (screen === 'live_call' ? 'live_call' : 'home'));
        }
      } catch (err) {
        console.warn('[AppNavigator] Error restoring session:', err);
      } finally {
        setIsCheckingSession(false);
      }
    }
    restoreUserSession();
  }, []);

  // Splash Screen
  if (currentScreen === 'splash') {
    return <SplashScreen onFinish={() => setCurrentScreen('onboarding')} />;
  }

  // Onboarding Screen
  if (currentScreen === 'onboarding') {
    return <OnboardingScreen onFinish={() => setCurrentScreen('permission')} />;
  }

  // Permission Screen
  if (currentScreen === 'permission') {
    return <PermissionScreen onGrant={() => setCurrentScreen('login')} />;
  }

  // Login Screen
  if (currentScreen === 'login') {
    return (
      <LoginScreen
        onLoginSuccess={(name) => {
          if (name) setUserName(name);
          setCurrentScreen('home');
        }}
      />
    );
  }

  // Live Call Screen
  if (currentScreen === 'live_call') {
    return <LiveCallScreen callerNumber={activeCallerNumber} onEndCall={() => setCurrentScreen('live_analysis')} />;
  }

  // Alert Screen
  if (currentScreen === 'alert') {
    return (
      <AlertScreen
        onDismiss={() => setCurrentScreen('home')}
        onBlock={() => setCurrentScreen('blocked')}
      />
    );
  }

  // Safe Result Screen
  if (currentScreen === 'safe_result') {
    return <SafeResultScreen onDone={() => setCurrentScreen('home')} />;
  }

  // Detailed Call Report Screen
  if (currentScreen === 'call_report') {
    return (
      <CallReportScreen
        reportItem={selectedReportItem}
        onBack={() => setCurrentScreen('history')}
      />
    );
  }

  // Scam Report Screen
  if (currentScreen === 'scam_report') {
    return <ScamReportScreen onBack={() => setCurrentScreen('profile')} />;
  }

  // Blocked Contacts Screen
  if (currentScreen === 'blocked') {
    return <BlockedContactsScreen onBack={() => setCurrentScreen('profile')} />;
  }

  // Emergency SOS Screen
  if (currentScreen === 'emergency') {
    return <EmergencyScreen onBack={() => setCurrentScreen('profile')} />;
  }

  // Settings Screen
  if (currentScreen === 'settings') {
    return <SettingsScreen onBack={() => setCurrentScreen('profile')} />;
  }

  // Main Tabbed Navigation Shell
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        {currentScreen === 'home' && (
          <HomeScreen
            userName={userName}
            onStartLiveCall={() => setCurrentScreen('live_call')}
            onUploadSuccess={(result) => {
              const isScam = result.predicted_label === 'ai_generated';
              const rawScore = result.overall_risk_score || result.ai_confidence_percent || (isScam ? 85 : 91);
              const score = Math.round(rawScore);
              setSelectedReportItem({
                prediction_id: result.prediction_id || Date.now(),
                filename: result.filename || 'Uploaded Audio Sample',
                predicted_label: result.predicted_label,
                ai_probability: result.ai_probability,
                confidence_percent: score,
                overall_risk_score: score,
                risk_level: isScam ? 'high' : 'safe',
                created_at: result.created_at || new Date().toISOString(),
                attributed_generator: result.attributed_generator || (isScam ? 'ElevenLabs Neural Voice Clone v2' : 'Authentic Human Vocal Cords'),
                attribution_confidence: result.attribution_confidence || score,
                synthesis_technique: result.synthesis_technique || (isScam ? 'Neural Latent Diffusion TTS' : 'Natural Human Speech'),
              });
              setCurrentScreen('call_report');
            }}
          />
        )}

        {currentScreen === 'live_analysis' && (
          <LiveAnalysisScreen
            onBack={() => setCurrentScreen('home')}
            onTriggerAlert={() => setCurrentScreen('alert')}
            onTriggerSafe={() => setCurrentScreen('safe_result')}
          />
        )}

        {currentScreen === 'history' && (
          <HistoryScreen
            onSelectReport={(item) => {
              setSelectedReportItem(item);
              setCurrentScreen('call_report');
            }}
          />
        )}

        {currentScreen === 'analytics' && <AnalyticsScreen />}

        {currentScreen === 'profile' && (
          <ProfileScreen
            onLogout={async () => {
              await AuthStorage.clearSession();
              setCurrentScreen('login');
            }}
            onNavigateSettings={() => setCurrentScreen('settings')}
            onNavigateBlocked={() => setCurrentScreen('blocked')}
            onNavigateReport={() => setCurrentScreen('scam_report')}
            onNavigateEmergency={() => setCurrentScreen('emergency')}
          />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentScreen('home')}
        >
          <Text style={[styles.tabLabel, currentScreen === 'home' && styles.tabLabelActive]}>
            🛡️ Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentScreen('live_analysis')}
        >
          <Text style={[styles.tabLabel, currentScreen === 'live_analysis' && styles.tabLabelActive]}>
            ⚡ AI Live
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentScreen('history')}
        >
          <Text style={[styles.tabLabel, currentScreen === 'history' && styles.tabLabelActive]}>
            📜 History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentScreen('analytics')}
        >
          <Text style={[styles.tabLabel, currentScreen === 'analytics' && styles.tabLabelActive]}>
            📊 Analytics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentScreen('profile')}
        >
          <Text style={[styles.tabLabel, currentScreen === 'profile' && styles.tabLabelActive]}>
            👤 Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  mainContent: {
    flex: 1,
  },
  tabBar: {
    height: 64,
    backgroundColor: C.bgDeep,
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tabLabel: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: C.accent,
    fontWeight: '800',
  },
});
