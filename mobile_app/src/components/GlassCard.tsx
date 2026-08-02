import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, TouchableOpacity } from 'react-native';
import { C } from '../theme/colors';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  bright?: boolean;
}

export function GlassCard({ children, style, onPress, bright = false }: GlassCardProps) {
  const cardStyle = [
    styles.card,
    bright && styles.brightCard,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 16,
  },
  brightCard: {
    backgroundColor: C.cardBright,
    borderColor: C.cardBorderBright,
  },
});
