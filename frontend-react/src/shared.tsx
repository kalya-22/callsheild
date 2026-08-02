import { type ReactNode, type CSSProperties } from 'react'

export type Screen =
  | 'splash' | 'onboarding' | 'login' | 'permission'
  | 'home' | 'live-call' | 'live-analysis' | 'alert' | 'call-report'
  | 'history' | 'analytics' | 'emergency' | 'scam-report' | 'settings' | 'profile'
  | 'blocked-contacts' | 'safe-result'

export type NavFn = (screen: Screen) => void

export const C = {
  bg: '#0F172A',
  bgDeep: '#070E1A',
  card: 'rgba(30, 41, 59, 0.75)',
  cardBright: 'rgba(37, 51, 74, 0.85)',
  cardBorder: 'rgba(255,255,255,0.08)',
  cardBorderBright: 'rgba(255,255,255,0.14)',
  primary: '#2563EB',
  primaryDim: 'rgba(37,99,235,0.15)',
  accent: '#06B6D4',
  accentDim: 'rgba(6,182,212,0.15)',
  success: '#22C55E',
  successDim: 'rgba(34,197,94,0.15)',
  warning: '#F59E0B',
  warningDim: 'rgba(245,158,11,0.15)',
  danger: '#EF4444',
  dangerDim: 'rgba(239,68,68,0.15)',
  text: '#FFFFFF',
  textSec: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.38)',
} as const

export function GlassCard({
  children, style, onClick, className,
}: {
  children: ReactNode
  style?: CSSProperties
  onClick?: () => void
  className?: string
}) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: C.card,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${C.cardBorder}`,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function CircularGauge({
  value, size = 160, color, label, sublabel,
}: {
  value: number; size?: number; color: string; label?: string; sublabel?: string
}) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 14
  const circ = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circ * (1 - clamped / 100)
  const id = `g${color.replace(/[^a-z0-9]/gi, '')}`

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id={id}>
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        filter={`url(#${id})`}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {label && (
        <text x={cx} y={sublabel ? cy - 6 : cy + 6} textAnchor="middle"
          fill="white" fontSize={size > 120 ? '26' : '18'} fontWeight="700" fontFamily="Inter, sans-serif">
          {label}
        </text>
      )}
      {sublabel && (
        <text x={cx} y={cy + 16} textAnchor="middle"
          fill="rgba(255,255,255,0.45)" fontSize="11" fontFamily="Inter, sans-serif">
          {sublabel}
        </text>
      )}
    </svg>
  )
}

export function ShieldLogo({ size = 80, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 100 110"
      style={{ animation: animate ? 'shield-float 3s ease-in-out infinite, shield-pulse 3s ease-in-out infinite' : undefined }}
    >
      <defs>
        <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="si" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>
        <filter id="sf">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M50 4 L88 18 L88 52 C88 78 72 96 50 107 C28 96 12 78 12 52 L12 18 Z"
        fill="url(#sg)" opacity="0.25" filter="url(#sf)" />
      <path d="M50 4 L88 18 L88 52 C88 78 72 96 50 107 C28 96 12 78 12 52 L12 18 Z"
        fill="url(#sg)" />
      <path d="M50 4 L88 18 L88 52 C88 78 72 96 50 107 C28 96 12 78 12 52 L12 18 Z"
        fill="url(#si)" />
      <path d="M33 55 L45 67 L67 41"
        stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function Waveform({
  color = '#2563EB', bars = 22, active = true, height = 56,
}: {
  color?: string; bars?: number; active?: boolean; height?: number
}) {
  const hs = Array.from({ length: bars }, (_, i) =>
    18 + Math.abs(Math.sin(i * 0.75)) * 75
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height }}>
      {hs.map((h, i) => (
        <div
          key={i}
          style={{
            width: '3px',
            height: `${h}%`,
            background: `linear-gradient(to top, ${color}, ${color}66)`,
            borderRadius: '2px',
            transformOrigin: 'center',
            animation: active
              ? `bar-wave ${0.35 + (i % 6) * 0.08}s ease-in-out ${i * 0.04}s infinite alternate`
              : 'none',
          }}
        />
      ))}
    </div>
  )
}

export function BottomNav({ active, navigate }: { active: Screen; navigate: NavFn }) {
  const tabs: { id: Screen; label: string; path: string; filled?: boolean }[] = [
    {
      id: 'home', label: 'Home',
      path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
      filled: true,
    },
    {
      id: 'history', label: 'History',
      path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z',
      filled: true,
    },
    {
      id: 'analytics', label: 'Analytics',
      path: 'M3 13h4v7H3v-7zm7-6h4v13h-4V7zm7 3h4v10h-4V10z',
      filled: true,
    },
    {
      id: 'profile', label: 'Profile',
      path: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
      filled: true,
    },
  ]

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: '72px',
      background: 'rgba(7,14,26,0.97)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '0 0 6px',
      zIndex: 100,
    }}>
      {tabs.map(tab => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              padding: '8px 18px',
              color: isActive ? C.primary : 'rgba(255,255,255,0.28)',
              background: 'none', border: 'none', cursor: 'pointer',
              position: 'relative', transition: 'color 0.2s',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {isActive && (
              <span style={{
                position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
                width: '30px', height: '2px',
                background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
                borderRadius: '0 0 3px 3px',
                boxShadow: `0 0 10px ${C.primary}`,
              }} />
            )}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d={tab.path} />
            </svg>
            <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400 }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function RiskBadge({ level }: { level: 'safe' | 'suspicious' | 'scam' }) {
  const map = {
    safe: { color: C.success, bg: C.successDim, label: 'Safe' },
    suspicious: { color: C.warning, bg: C.warningDim, label: 'Suspicious' },
    scam: { color: C.danger, bg: C.dangerDim, label: 'Scam' },
  }
  const { color, bg, label } = map[level]
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px',
      background: bg, color, border: `1px solid ${color}44`,
      fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
    }}>
      {label}
    </span>
  )
}

export function BackButton({ navigate, to }: { navigate: NavFn; to: Screen }) {
  return (
    <button
      onClick={() => navigate(to)}
      style={{
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px', width: '38px', height: '38px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'white',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export function StatusBar() {
  return (
    <div style={{
      height: '44px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 20px',
      flexShrink: 0,
    }}>
      <span style={{ color: 'white', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
        9:41
      </span>
      <div style={{ width: '90px', height: '16px', background: 'rgba(255,255,255,0.08)', borderRadius: '8px' }} />
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="white" opacity="0.8">
          <rect x="0" y="5" width="3" height="7" rx="0.5" />
          <rect x="4.5" y="3.5" width="3" height="8.5" rx="0.5" />
          <rect x="9" y="1.5" width="3" height="10.5" rx="0.5" />
          <rect x="13.5" y="0" width="2.5" height="12" rx="0.5" />
        </svg>
        <svg width="20" height="12" viewBox="0 0 22 12" fill="none">
          <rect x="0.5" y="0.5" width="18" height="11" rx="2.5" stroke="white" strokeOpacity="0.5" />
          <rect x="2" y="2" width="13" height="8" rx="1.5" fill="white" />
          <path d="M20 4v4a2 2 0 0 0 0-4z" fill="white" fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  )
}
