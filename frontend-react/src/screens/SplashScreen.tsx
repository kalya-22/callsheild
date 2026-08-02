import { useEffect } from 'react'
import { type NavFn, ShieldLogo } from '../shared'

export default function SplashScreen({ navigate }: { navigate: NavFn }) {
  useEffect(() => {
    const t = setTimeout(() => navigate('onboarding'), 2800)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div style={{
      height: '844px',
      background: 'linear-gradient(160deg, #070E1A 0%, #0F172A 45%, #0A1A35 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background mesh */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          radial-gradient(circle at 50% 35%, rgba(37,99,235,0.18) 0%, transparent 55%),
          radial-gradient(circle at 80% 80%, rgba(6,182,212,0.08) 0%, transparent 45%)
        `,
      }} />

      {/* Grid pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* Animated rings */}
      {[200, 280, 360, 440].map((size, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: size, height: size,
            borderRadius: '50%',
            border: '1px solid rgba(37,99,235,0.12)',
            animation: `pulse-ring 4s ease-out ${i * 0.8}s infinite`,
          }}
        />
      ))}

      {/* Shield */}
      <div style={{ marginBottom: '28px', position: 'relative', zIndex: 2 }}>
        <div style={{
          position: 'absolute', inset: '-20px',
          background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <ShieldLogo size={110} animate />
      </div>

      {/* Brand */}
      <h1 style={{
        fontFamily: 'Poppins, Inter, sans-serif',
        fontSize: '40px', fontWeight: 800, margin: '0 0 10px',
        letterSpacing: '-1px', position: 'relative', zIndex: 2,
        background: 'linear-gradient(135deg, #FFFFFF 0%, #93C5FD 40%, #06B6D4 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        animation: 'fade-up 0.8s ease 0.3s both',
      }}>
        CallShield
      </h1>

      <p style={{
        color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: 0,
        fontFamily: 'Inter, sans-serif', letterSpacing: '1.5px',
        textTransform: 'uppercase', fontWeight: 500, position: 'relative', zIndex: 2,
        animation: 'fade-up 0.8s ease 0.5s both',
      }}>
        Protecting Every Call with AI
      </p>

      {/* Powered by badge */}
      <div style={{
        marginTop: '40px',
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 16px',
        background: 'rgba(37,99,235,0.1)',
        border: '1px solid rgba(37,99,235,0.25)',
        borderRadius: '30px',
        position: 'relative', zIndex: 2,
        animation: 'fade-up 0.8s ease 0.7s both',
      }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: '#22C55E',
          boxShadow: '0 0 8px #22C55E',
          animation: 'glow-pulse 1.5s ease-in-out infinite',
        }} />
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
          AI Shield Active
        </span>
      </div>

      {/* Loading bar */}
      <div style={{
        position: 'absolute', bottom: '56px', width: '120px', height: '2px',
        background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #2563EB, #06B6D4)',
          borderRadius: '2px',
          animation: 'load-bar 2.5s linear forwards',
        }} />
      </div>

      <p style={{
        position: 'absolute', bottom: '34px',
        color: 'rgba(255,255,255,0.2)', fontSize: '11px', fontFamily: 'Inter, sans-serif',
        margin: 0, letterSpacing: '0.5px',
      }}>
        v2.4.1 · AI Security Suite
      </p>
    </div>
  )
}
