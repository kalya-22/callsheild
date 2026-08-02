import { C, GlassCard, CircularGauge, StatusBar, type NavFn } from '../shared'
import { type CallRiskSummary } from '../services/callshieldApi'

function loadSummary(): CallRiskSummary | null {
  try {
    const raw = localStorage.getItem('callshield_live_call_summary')
    return raw ? JSON.parse(raw) as CallRiskSummary : null
  } catch {
    return null
  }
}

function formatDuration(seconds = 0) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export default function SafeResultScreen({ navigate }: { navigate: NavFn }) {
  const summary = loadSummary()
  const risk = summary?.overallCallRisk ?? 0

  return (
    <div style={{ minHeight: '844px', background: C.bg, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 25%, rgba(34,197,94,0.12) 0%, transparent 55%)' }} />
      <StatusBar />

      <div style={{ padding: '64px 24px 32px', position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', width: '78px', height: '78px', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.18)', border: '2px solid rgba(34,197,94,0.45)', marginBottom: '18px' }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, fontFamily: 'Poppins, Inter, sans-serif', margin: '0 0 8px' }}>
          Human Voice Detected
        </h1>
        <p style={{ color: C.textSec, fontSize: '13px', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: '0 0 22px' }}>
          The completed call analysis indicates low AI/vishing risk. Keep monitoring if the caller asks for OTP, UPI PIN, passwords, or urgent money transfer.
        </p>

        <GlassCard style={{ padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <CircularGauge value={risk} size={132} color={C.success} label={`${risk}`} sublabel="% Risk" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left' }}>
            {[
              ['Final Result', summary?.finalCallVerdict ?? 'human'],
              ['AI Chunks', `${summary?.aiChunks ?? 0}/${summary?.totalChunks ?? 0}`],
              ['Avg Confidence', `${summary?.averageAiConfidence ?? 0}%`],
              ['Duration', formatDuration(summary?.callDurationSeconds)],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                <div style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>{value}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button onClick={() => navigate('home')} style={{ padding: '15px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
            Home
          </button>
          <button onClick={() => navigate('live-call')} style={{ padding: '15px', background: 'linear-gradient(135deg, #2563EB, #06B6D4)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', boxShadow: '0 6px 20px rgba(37,99,235,0.4)' }}>
            New Scan
          </button>
        </div>
      </div>
    </div>
  )
}
