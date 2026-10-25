import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
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
import { FamilyShieldScreen } from '../screens/FamilyShieldScreen';
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
  | 'family_shield'
  | 'settings'
  | 'profile';

export function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('splash');
  const [selectedReportItem, setSelectedReportItem] = useState<any>(null);
  const [userName, setUserName] = useState<string>('User');
  const [userEmail, setUserEmail] = useState<string>('user@callshield.ai');
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
          if (session.email) {
            setUserEmail(session.email);
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
        onLoginSuccess={(name, email) => {
          if (name) setUserName(name);
          if (email) setUserEmail(email);
          setCurrentScreen('home');
        }}
      />
    );
  }

  // Live Call Screen
  if (currentScreen === 'live_call') {
    return (
      <LiveCallScreen
        callerNumber={activeCallerNumber}
        userName={userName}
        onEndCall={() => setCurrentScreen('live_analysis')}
      />
    );
  }

  // Alert Screen
  if (currentScreen === 'alert') {
    return (
      <AlertScreen
        userName={userName}
        callerNumber={activeCallerNumber}
        onDismiss={() => setCurrentScreen('home')}
        onBlock={() => setCurrentScreen('blocked')}
        onNavigateFamilyShield={() => setCurrentScreen('family_shield')}
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
    return (
      <EmergencyScreen
        userName={userName}
        onBack={() => setCurrentScreen('profile')}
        onNavigateFamilyShield={() => setCurrentScreen('family_shield')}
      />
    );
  }

  // Family Shield Screen
  if (currentScreen === 'family_shield') {
    return (
      <FamilyShieldScreen
        userName={userName}
        onBack={() => setCurrentScreen('profile')}
      />
    );
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
            onNavigateFamilyShield={() => setCurrentScreen('family_shield')}
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
            userName={userName}
            onBack={() => setCurrentScreen('home')}
            onNavigateFamilyShield={() => setCurrentScreen('family_shield')}
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
            userName={userName}
            userEmail={userEmail}
            onLogout={async () => {
              await AuthStorage.clearSession();
              setUserName('User');
              setUserEmail('user@callshield.ai');
              setCurrentScreen('login');
            }}
            onNavigateSettings={() => setCurrentScreen('settings')}
            onNavigateBlocked={() => setCurrentScreen('blocked')}
            onNavigateReport={() => setCurrentScreen('scam_report')}
            onNavigateEmergency={() => setCurrentScreen('emergency')}
            onNavigateFamilyShield={() => setCurrentScreen('family_shield')}
          />
        )}
      </View>

      {/* Modern Sleek Glass Tab Dock */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar}>
          {[
            { key: 'home', icon: '🛡️', label: 'Shield' },
            { key: 'live_analysis', icon: '⚡', label: 'AI Live' },
            { key: 'history', icon: '📜', label: 'Logs' },
            { key: 'analytics', icon: '📊', label: 'Insights' },
            { key: 'profile', icon: '👤', label: 'Security' },
          ].map((tab) => {
            const isActive = currentScreen === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.7}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setCurrentScreen(tab.key as ScreenState)}
              >
                <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                  {tab.icon}
                </Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {isActive && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
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
  tabBarWrapper: {
    backgroundColor: C.bgDeep,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
    paddingBottom: Platform.OS === 'ios' ? 12 : 6,
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  tabBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 18,
    marginHorizontal: 2,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.65,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  tabLabel: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: C.accentLight,
    fontWeight: '800',
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.accent,
  },
});
