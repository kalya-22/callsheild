import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, TouchableOpacity, Platform } from 'react-native';
import { C } from '../theme/colors';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle | (ViewStyle | false | undefined | null)[];
  onPress?: () => void;
  bright?: boolean;
  variant?: 'default' | 'bright' | 'glow' | 'accent' | 'purple' | 'danger';
}

export function GlassCard({
  children,
  style,
  onPress,
  bright = false,
  variant = 'default',
}: GlassCardProps) {
  const isBright = bright || variant === 'bright';

  const cardStyle = [
    styles.card,
    isBright && styles.brightCard,
    variant === 'glow' && styles.glowCard,
    variant === 'accent' && styles.accentCard,
    variant === 'purple' && styles.purpleCard,
    variant === 'danger' && styles.dangerCard,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.78}
        onPress={onPress}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  brightCard: {
    backgroundColor: C.cardBright,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
  },
  glowCard: {
    backgroundColor: C.cardBright,
    borderColor: C.cardBorderGlow,
    borderTopColor: 'rgba(59, 130, 246, 0.5)',
  },
  accentCard: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderColor: C.cardBorderBright,
    borderTopColor: 'rgba(6, 182, 212, 0.5)',
  },
  purpleCard: {
    backgroundColor: 'rgba(168, 85, 247, 0.09)',
    borderColor: C.cardGlowPurple,
    borderTopColor: 'rgba(168, 85, 247, 0.5)',
  },
  dangerCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderTopColor: 'rgba(239, 68, 68, 0.6)',
  },
});
