export const C = {
  // Base backgrounds
  bg: '#080D1A',          // Deep obsidian navy
  bgDeep: '#040711',      // Pure black-navy base
  bgElevated: '#0E172B',  // Card elevated base
  bgSurface: '#131E38',

  // Cards & Surfaces
  card: 'rgba(15, 23, 42, 0.82)',
  cardBright: 'rgba(23, 37, 68, 0.92)',
  cardGlass: 'rgba(30, 41, 59, 0.55)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  cardBorderBright: 'rgba(6, 182, 212, 0.35)',
  cardBorderGlow: 'rgba(59, 130, 246, 0.3)',
  cardGlowPurple: 'rgba(168, 85, 247, 0.3)',

  // Primary brand (Cobalt / Sapphire)
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDim: 'rgba(37, 99, 235, 0.16)',
  primaryGlow: 'rgba(37, 99, 235, 0.35)',

  // Accent (Electric Cyan / Neon Teal)
  accent: '#06B6D4',
  accentLight: '#22D3EE',
  accentDim: 'rgba(6, 182, 212, 0.16)',
  accentGlow: 'rgba(6, 182, 212, 0.4)',

  // Violet / Family Shield
  purple: '#A855F7',
  purpleLight: '#C084FC',
  purpleDim: 'rgba(168, 85, 247, 0.16)',
  purpleGlow: 'rgba(168, 85, 247, 0.35)',

  // Security Status Accents
  success: '#10B981',     // Modern emerald
  successLight: '#34D399',
  successDim: 'rgba(16, 185, 129, 0.16)',
  successGlow: 'rgba(16, 185, 129, 0.35)',

  warning: '#F59E0B',     // Amber
  warningLight: '#FBBF24',
  warningDim: 'rgba(245, 158, 11, 0.16)',

  danger: '#EF4444',      // Crimson red
  dangerLight: '#F87171',
  dangerDim: 'rgba(239, 68, 68, 0.16)',
  dangerGlow: 'rgba(239, 68, 68, 0.4)',

  // High-contrast modern typography
  text: '#F8FAFC',
  textSec: '#94A3B8',
  textMuted: '#64748B',
  textDim: '#475569',
} as const;
