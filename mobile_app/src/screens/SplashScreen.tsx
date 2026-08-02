import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, SafeAreaView } from 'react-native';
import { ShieldLogo } from '../components/ShieldLogo';
import { C } from '../theme/colors';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        onFinish();
      }
    });
  }, [fadeAnim, progressAnim, onFinish]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Glow & Logo */}
        <View style={styles.logoWrapper}>
          <View style={styles.glowCircle} />
          <ShieldLogo size={110} animate />
        </View>

        {/* Title */}
        <Text style={styles.title}>CallShield</Text>
        <Text style={styles.subtitle}>PROTECTING EVERY CALL WITH AI</Text>

        {/* Status Badge */}
        <View style={styles.badge}>
          <View style={styles.greenDot} />
          <Text style={styles.badgeText}>AI Shield Active</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>

        <Text style={styles.versionText}>v2.4.1 · AI Security Suite</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bgDeep,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoWrapper: {
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    color: C.textSec,
    fontSize: 12,
    letterSpacing: 1.8,
    fontWeight: '600',
    marginBottom: 36,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: C.primaryDim,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
    marginBottom: 60,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.success,
    marginRight: 8,
  },
  badgeText: {
    color: C.textSec,
    fontSize: 13,
    fontWeight: '500',
  },
  progressTrack: {
    width: 140,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: C.accent,
    borderRadius: 2,
  },
  versionText: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
});
