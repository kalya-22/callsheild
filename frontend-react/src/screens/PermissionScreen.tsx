import { useState } from 'react'
import { type NavFn, C, GlassCard, StatusBar } from '../shared'

const perms = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeLinecap="round" />
        <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" />
        <line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" />
      </svg>
    ),
    color: C.primary,
    dimColor: C.primaryDim,
    borderColor: 'rgba(37,99,235,0.3)',
    title: 'Microphone Access',
    why: 'Required to analyze live call audio for voice pattern detection. Audio is processed in real-time and never stored or transmitted.',
    badge: 'Core Feature',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    color: C.accent,
    dimColor: C.accentDim,
    borderColor: 'rgba(6,182,212,0.3)',
    title: 'Phone State',
    why: 'Allows CallShield to detect incoming and outgoing calls so AI protection activates at the right moment automatically.',
    badge: 'Required',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" strokeLinecap="round" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" strokeLinecap="round" />
        <line x1="6" y1="1" x2="6" y2="4" strokeLinecap="round" />
        <line x1="10" y1="1" x2="10" y2="4" strokeLinecap="round" />
        <line x1="14" y1="1" x2="14" y2="4" strokeLinecap="round" />
      </svg>
    ),
    color: C.success,
    dimColor: C.successDim,
    borderColor: 'rgba(34,197,94,0.3)',
    title: 'Notifications',
    why: 'Sends instant alerts when a potential scam is detected during a live call, so you can act quickly.',
    badge: 'Recommended',
  },
]

export default function PermissionScreen({ navigate }: { navigate: NavFn }) {
  const [granted, setGranted] = useState<boolean[]>([false, false, false])

  const toggle = (i: number) => {
    const next = [...granted]
    next[i] = !next[i]
    setGranted(next)
  }

  const allGranted = granted[0] && granted[1]

  return (
    <div style={{
      minHeight: '844px',
      background: C.bg,
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 10%, rgba(37,99,235,0.1) 0%, transparent 50%)',
      }} />

      <StatusBar />

      <div style={{ padding: '12px 24px 0', position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'rgba(37,99,235,0.15)',
            border: '1px solid rgba(37,99,235,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(37,99,235,0.2)',
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{
            fontFamily: 'Poppins, Inter, sans-serif',
            fontSize: '24px', fontWeight: 700, color: 'white', margin: '0 0 8px',
          }}>
            Enable Protection
          </h1>
          <p style={{ color: C.textSec, fontSize: '14px', margin: 0, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
            Grant the permissions below to activate AI call protection. You can change these anytime in Settings.
          </p>
        </div>

        {/* Permission cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          {perms.map((p, i) => (
            <GlassCard key={i} style={{
              padding: '18px',
              border: granted[i] ? `1px solid ${p.borderColor}` : `1px solid ${C.cardBorder}`,
              background: granted[i] ? p.dimColor : C.card,
              transition: 'all 0.3s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{
                  width: '52px', height: '52px', flexShrink: 0,
                  borderRadius: '16px',
                  background: granted[i] ? p.dimColor : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${granted[i] ? p.borderColor : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: granted[i] ? p.color : C.textMuted,
                  transition: 'all 0.3s',
                }}>
                  {p.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      color: 'white', fontSize: '15px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                    }}>
                      {p.title}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: '10px',
                      background: granted[i] ? p.dimColor : 'rgba(255,255,255,0.06)',
                      color: granted[i] ? p.color : C.textMuted,
                      fontSize: '10px', fontFamily: 'Inter, sans-serif', fontWeight: 600,
                    }}>
                      {p.badge}
                    </span>
                  </div>
                  <p style={{
                    color: C.textMuted, fontSize: '12px', margin: 0,
                    fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
                  }}>
                    {p.why}
                  </p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggle(i)}
                  style={{
                    flexShrink: 0, width: '48px', height: '28px',
                    borderRadius: '14px',
                    background: granted[i]
                      ? `linear-gradient(135deg, ${p.color}, ${p.color}cc)`
                      : 'rgba(255,255,255,0.1)',
                    border: 'none', cursor: 'pointer',
                    position: 'relative', transition: 'all 0.3s',
                    boxShadow: granted[i] ? `0 4px 12px ${p.color}44` : 'none',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '4px',
                    left: granted[i] ? '24px' : '4px',
                    width: '20px', height: '20px',
                    borderRadius: '50%', background: 'white',
                    transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Privacy notice */}
        <div style={{
          padding: '14px 16px',
          background: 'rgba(6,182,212,0.08)',
          border: '1px solid rgba(6,182,212,0.2)',
          borderRadius: '14px', marginBottom: '24px',
          display: 'flex', gap: '10px', alignItems: 'flex-start',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          <p style={{
            color: 'rgba(6,182,212,0.85)', fontSize: '12px', margin: 0,
            fontFamily: 'Inter, sans-serif', lineHeight: 1.6,
          }}>
            <strong>Privacy Guarantee:</strong> Audio is analyzed in real-time only after you start a detection session. No recordings are made, no data is stored on our servers, and analysis never happens without your explicit permission.
          </p>
        </div>

        <button
          onClick={() => navigate('home')}
          disabled={!allGranted}
          style={{
            width: '100%', padding: '16px',
            background: allGranted
              ? 'linear-gradient(135deg, #2563EB, #06B6D4)'
              : 'rgba(255,255,255,0.08)',
            border: 'none', borderRadius: '16px',
            color: allGranted ? 'white' : C.textMuted,
            fontSize: '16px', fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            cursor: allGranted ? 'pointer' : 'not-allowed',
            boxShadow: allGranted ? '0 8px 32px rgba(37,99,235,0.4)' : 'none',
            transition: 'all 0.3s',
          }}
        >
          {allGranted ? 'Activate Protection' : 'Allow Required Permissions'}
        </button>

        {!allGranted && (
          <p style={{
            textAlign: 'center', marginTop: '12px',
            color: C.textMuted, fontSize: '12px', fontFamily: 'Inter, sans-serif',
          }}>
            Toggle Microphone and Phone State to continue
          </p>
        )}
      </div>
    </div>
  )
}
