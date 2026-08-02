import { useState } from 'react'
import { type NavFn, C } from '../shared'

const slides = [
  {
    title: 'AI-Powered Scam Detection',
    sub: 'Our advanced neural network analyzes voice patterns, speech cadence, and emotional cues in real time to identify vishing attacks before you become a victim.',
    gradient: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(6,182,212,0.1) 100%)',
    border: 'rgba(37,99,235,0.3)',
    accent: C.primary,
    Illustration: () => (
      <svg width="200" height="160" viewBox="0 0 200 160">
        <defs>
          <linearGradient id="ob1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {/* Brain circuit */}
        <ellipse cx="100" cy="80" rx="50" ry="45" fill="url(#ob1)" stroke="#2563EB" strokeWidth="1.5" strokeOpacity="0.6" />
        <ellipse cx="100" cy="80" rx="35" ry="30" fill="none" stroke="#06B6D4" strokeWidth="1" strokeOpacity="0.4" />
        {/* Circuit lines */}
        {[[60,60],[80,45],[120,45],[140,60],[145,80],[140,100],[120,115],[80,115],[60,100],[55,80]].map(([x,y],i,arr) => {
          const next = arr[(i+1)%arr.length]
          return <line key={i} x1={x} y1={y} x2={next[0]} y2={next[1]} stroke="#2563EB" strokeWidth="1" strokeOpacity="0.5" />
        })}
        {/* Nodes */}
        {[[100,35],[148,80],[100,125],[52,80]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="5" fill="#2563EB" opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin={`${i*0.5}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        {/* Wave lines */}
        {[0,1,2].map(i => (
          <path key={i} d={`M 20 ${70+i*12} Q 40 ${60+i*12} 60 ${70+i*12} Q 80 ${80+i*12} 100 ${70+i*12}`}
            fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity={0.3+i*0.2}
            strokeDasharray="4 3">
            <animate attributeName="stroke-dashoffset" from="0" to="-14" dur={`${1+i*0.3}s`} repeatCount="indefinite"/>
          </path>
        ))}
        {/* Center icon */}
        <circle cx="100" cy="80" r="16" fill="rgba(37,99,235,0.3)" stroke="#2563EB" strokeWidth="1.5" />
        <path d="M92 80 L98 86 L108 74" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    title: 'Privacy First, Always',
    sub: 'Audio is analyzed only after you explicitly grant microphone permission. Nothing is stored or shared. Your conversations stay private — we analyze patterns, not content.',
    gradient: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(6,182,212,0.1) 100%)',
    border: 'rgba(34,197,94,0.3)',
    accent: C.success,
    Illustration: () => (
      <svg width="200" height="160" viewBox="0 0 200 160">
        <defs>
          <linearGradient id="ob2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {/* Lock body */}
        <rect x="65" y="78" width="70" height="58" rx="12" fill="url(#ob2)" stroke="#22C55E" strokeWidth="1.5" strokeOpacity="0.7" />
        {/* Lock shackle */}
        <path d="M78 78 L78 58 A22 22 0 0 1 122 58 L122 78" fill="none" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" />
        {/* Keyhole */}
        <circle cx="100" cy="106" r="9" fill="rgba(0,0,0,0.4)" stroke="#22C55E" strokeWidth="1" />
        <rect x="97" y="109" width="6" height="12" rx="3" fill="rgba(0,0,0,0.4)" />
        {/* Glow */}
        <ellipse cx="100" cy="107" rx="35" ry="30" fill="none" stroke="#22C55E" strokeWidth="8" strokeOpacity="0.08" />
        {/* Shield check marks around */}
        {[[-40,0],[40,0],[0,-50]].map(([dx,dy],i) => (
          <g key={i} transform={`translate(${100+dx} ${80+dy})`}>
            <circle r="12" fill="rgba(34,197,94,0.15)" stroke="#22C55E" strokeWidth="1" strokeOpacity="0.5" />
            <path d="M-5 0 L-1 4 L6 -4" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        ))}
      </svg>
    ),
  },
  {
    title: 'Real-Time Protection',
    sub: 'When a call begins, tap the shield to activate AI listening. Get instant alerts with confidence scores if suspicious patterns are detected — stay one step ahead of scammers.',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(239,68,68,0.1) 100%)',
    border: 'rgba(245,158,11,0.3)',
    accent: C.warning,
    Illustration: () => (
      <svg width="200" height="160" viewBox="0 0 200 160">
        {/* Phone */}
        <rect x="70" y="20" width="60" height="110" rx="12" fill="rgba(15,23,42,0.8)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        <rect x="75" y="30" width="50" height="85" rx="6" fill="rgba(37,99,235,0.15)" />
        {/* Waveform on screen */}
        {[0,1,2,3,4,5,6,7].map(i => {
          const h = [20,35,55,40,65,30,50,25][i]
          return (
            <rect key={i} x={80+i*6} y={72-h/2} width="4" height={h} rx="2" fill="#2563EB" opacity={0.4+i*0.07}>
              <animate attributeName="height" values={`${h};${h*0.4};${h}`} dur={`${0.5+i*0.1}s`} repeatCount="indefinite"/>
              <animate attributeName="y" values={`${72-h/2};${72-h*0.2};${72-h/2}`} dur={`${0.5+i*0.1}s`} repeatCount="indefinite"/>
            </rect>
          )
        })}
        {/* Alert ring */}
        <circle cx="100" cy="72" r="55" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="6 4">
          <animateTransform attributeName="transform" type="rotate" from="0 100 72" to="360 100 72" dur="8s" repeatCount="indefinite"/>
        </circle>
        {/* Warning badge */}
        <circle cx="140" cy="30" r="18" fill="rgba(245,158,11,0.2)" stroke="#F59E0B" strokeWidth="1.5" />
        <text x="140" y="35" textAnchor="middle" fill="#F59E0B" fontSize="18" fontWeight="700">!</text>
        {/* Scanning line */}
        <rect x="75" y="30" width="50" height="2" rx="1" fill="#06B6D4" opacity="0.8">
          <animate attributeName="y" values="30;115;30" dur="2.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;0.8;0" dur="2.5s" repeatCount="indefinite"/>
        </rect>
      </svg>
    ),
  },
]

export default function OnboardingScreen({ navigate }: { navigate: NavFn }) {
  const [idx, setIdx] = useState(0)
  const slide = slides[idx]
  const isLast = idx === slides.length - 1

  return (
    <div style={{
      height: '844px',
      background: C.bg,
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 30%, rgba(37,99,235,0.08) 0%, transparent 60%)',
      }} />

      {/* Skip */}
      <div style={{
        padding: '56px 24px 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {slides.map((_, i) => (
            <div key={i} style={{
              width: i === idx ? '24px' : '6px', height: '6px',
              borderRadius: '3px',
              background: i === idx ? slide.accent : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
        {!isLast && (
          <button onClick={() => navigate('login')} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
            fontSize: '14px', fontFamily: 'Inter, sans-serif', cursor: 'pointer',
          }}>
            Skip
          </button>
        )}
      </div>

      {/* Illustration */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px 24px', position: 'relative', zIndex: 2,
      }}>
        <div style={{
          width: '240px', height: '240px',
          background: slide.gradient,
          borderRadius: '40px',
          border: `1px solid ${slide.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '40px',
          boxShadow: `0 20px 60px ${slide.accent}22`,
        }}>
          <slide.Illustration />
        </div>

        <h2 style={{
          fontFamily: 'Poppins, Inter, sans-serif',
          fontSize: '26px', fontWeight: 700, color: 'white',
          textAlign: 'center', margin: '0 0 16px', lineHeight: 1.2,
        }}>
          {slide.title}
        </h2>

        <p style={{
          color: C.textSec, fontSize: '14px', lineHeight: 1.7,
          textAlign: 'center', fontFamily: 'Inter, sans-serif',
          maxWidth: '320px', margin: 0,
        }}>
          {slide.sub}
        </p>

        {/* Feature pills */}
        {idx === 0 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Voice AI', 'Real-time', 'Deepfake Detection'].map(f => (
              <span key={f} style={{
                padding: '5px 12px', borderRadius: '20px',
                background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)',
                color: '#93C5FD', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 500,
              }}>
                {f}
              </span>
            ))}
          </div>
        )}
        {idx === 1 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {['No Recording', 'End-to-End', 'GDPR Compliant'].map(f => (
              <span key={f} style={{
                padding: '5px 12px', borderRadius: '20px',
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                color: '#86EFAC', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 500,
              }}>
                {f}
              </span>
            ))}
          </div>
        )}
        {idx === 2 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Instant Alerts', 'Block Callers', 'Emergency SOS'].map(f => (
              <span key={f} style={{
                padding: '5px 12px', borderRadius: '20px',
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                color: '#FDE68A', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 500,
              }}>
                {f}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div style={{ padding: '0 24px 48px', position: 'relative', zIndex: 2 }}>
        <button
          onClick={() => isLast ? navigate('login') : setIdx(idx + 1)}
          style={{
            width: '100%', padding: '17px',
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
            border: 'none', borderRadius: '16px',
            color: 'white', fontSize: '16px', fontWeight: 600,
            fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            boxShadow: `0 8px 32px rgba(37,99,235,0.4)`,
            letterSpacing: '0.3px',
          }}
        >
          {isLast ? 'Get Started' : 'Continue'}
        </button>

        {isLast && (
          <p style={{
            textAlign: 'center', marginTop: '16px', marginBottom: 0,
            color: C.textMuted, fontSize: '12px', fontFamily: 'Inter, sans-serif',
          }}>
            By continuing you agree to our{' '}
            <span style={{ color: C.accent, cursor: 'pointer' }}>Terms</span>
            {' & '}
            <span style={{ color: C.accent, cursor: 'pointer' }}>Privacy Policy</span>
          </p>
        )}
      </div>
    </div>
  )
}
