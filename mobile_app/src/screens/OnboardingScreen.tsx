import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { C } from '../theme/colors';
import { ShieldLogo } from '../components/ShieldLogo';

const { width } = Dimensions.get('window');

const slides = [
  {
    title: 'AI-Powered Scam Detection',
    subtitle: 'Our advanced neural network analyzes voice patterns and speech cadence in real time to identify vishing attacks before you become a victim.',
    badgeColor: C.primary,
    pills: ['Voice AI', 'Real-Time', 'Deepfake Shield'],
  },
  {
    title: 'Privacy First, Always',
    subtitle: 'Audio is analyzed locally during calls. No recordings are stored or shared. Your conversations stay private — we analyze voice features, not content.',
    badgeColor: C.success,
    pills: ['No Recording', 'Zero Storage', 'Encrypted AI'],
  },
  {
    title: 'Instant Threat Protection',
    subtitle: 'Get high-risk alerts with confidence scores when suspicious callers are detected. Hang up or block malicious scammers with one tap.',
    badgeColor: C.warning,
    pills: ['Live Alerts', 'One-Tap Block', 'Emergency SOS'],
  },
];

interface OnboardingScreenProps {
  onFinish: () => void;
}

export function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const [idx, setIdx] = useState(0);
  const slide = slides[idx];
  const isLast = idx === slides.length - 1;

  function handleNext() {
    if (isLast) {
      onFinish();
    } else {
      setIdx((prev) => prev + 1);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Pagination and Skip */}
      <View style={styles.topBar}>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === idx ? { width: 24, backgroundColor: slide.badgeColor } : styles.dotInactive,
              ]}
            />
          ))}
        </View>
        {!isLast && (
          <TouchableOpacity onPress={onFinish}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Hero Illustration */}
      <View style={styles.illustrationContainer}>
        <View style={[styles.cardContainer, { borderColor: `${slide.badgeColor}44` }]}>
          <ShieldLogo size={100} animate />
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        {/* Feature Pills */}
        <View style={styles.pillsRow}>
          {slide.pills.map((pill) => (
            <View key={pill} style={[styles.pill, { borderColor: `${slide.badgeColor}55` }]}>
              <Text style={[styles.pillText, { color: slide.badgeColor }]}>{pill}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity activeOpacity={0.85} style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>{isLast ? 'Get Started' : 'Continue'}</Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    color: C.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: 36,
    backgroundColor: C.card,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  contentContainer: {
    paddingHorizontal: 28,
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: C.textSec,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  primaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: C.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
