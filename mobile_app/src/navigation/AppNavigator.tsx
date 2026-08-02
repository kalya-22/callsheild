import React, { useState } from 'react';
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
  | 'profile';

export function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('splash');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          setCurrentScreen('home');
        }}
      />
    );
  }

  // Live Call Active Screen
  if (currentScreen === 'live_call') {
    return <LiveCallScreen onEndCall={() => setCurrentScreen('live_analysis')} />;
  }

  // Alert Screen (Critical Warning)
  if (currentScreen === 'alert') {
    return (
      <AlertScreen
        onDismiss={() => setCurrentScreen('home')}
        onBlock={() => setCurrentScreen('home')}
      />
    );
  }

  // Safe Result Screen
  if (currentScreen === 'safe_result') {
    return <SafeResultScreen onDone={() => setCurrentScreen('home')} />;
  }

  // Main Authenticated Shell with Bottom Navigation Bar
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        {currentScreen === 'home' && (
          <HomeScreen onStartLiveCall={() => setCurrentScreen('live_call')} />
        )}

        {currentScreen === 'live_analysis' && (
          <LiveAnalysisScreen
            onBack={() => setCurrentScreen('home')}
            onTriggerAlert={() => setCurrentScreen('alert')}
            onTriggerSafe={() => setCurrentScreen('safe_result')}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            onLogout={() => {
              setIsAuthenticated(false);
              setCurrentScreen('login');
            }}
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
            ⚡ AI Analysis
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
    paddingHorizontal: 16,
  },
  tabLabel: {
    color: C.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: C.accent,
    fontWeight: '800',
  },
});
