import { C, GlassCard, type NavFn } from '../shared'
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

export default function AlertScreen({ navigate }: { navigate: NavFn }) {
  const summary = loadSummary()
  function addBlockedNumber(reason = 'AI vishing risk detected') {
    const blockedNumber = {
      name: 'Unknown Caller',
      number: '+91 98765 43210',
      reason,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    }
    const existing = JSON.parse(localStorage.getItem('callshield_blocked_contacts') ?? '[]') as typeof blockedNumber[]
    const updated = existing.some(item => item.number === blockedNumber.number)
      ? existing
      : [blockedNumber, ...existing]
    localStorage.setItem('callshield_blocked_contacts', JSON.stringify(updated))
  }

  function blockCurrentNumber() {
    addBlockedNumber()
    navigate('blocked-contacts')
  }

  function markSpam() {
    addBlockedNumber('Marked spam by user')
    navigate('blocked-contacts')
  }

  function saveEvidence() {
    const summary = localStorage.getItem('callshield_live_call_summary')
    const chunks = localStorage.getItem('callshield_live_call_chunks')
    const evidence = {
      saved_at: new Date().toISOString(),
      caller: '+91 98765 43210',
      summary: summary ? JSON.parse(summary) : null,
      chunks: chunks ? JSON.parse(chunks) : [],
    }
    localStorage.setItem('callshield_saved_evidence', JSON.stringify(evidence))
    navigate('call-report')
  }

  function callHelpline() {
    window.location.href = 'tel:1930'
  }

  return (
    <div style={{
      height: '844px',
      background: 'linear-gradient(180deg, #1A0505 0%, #0F172A 40%, #0F0A1A 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Animated danger bg */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 30%, rgba(239,68,68,0.15) 0%, transparent 60%)',
        animation: 'glow-pulse 2s ease-in-out infinite',
      }} />

      {/* Scan line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)',
        animation: 'scan-sweep 3s linear infinite',
        zIndex: 1,
      }} />

      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(239,68,68,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(239,68,68,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '30px 30px',
      }} />

      <div style={{ width: '100%', height: '100%', padding: '60px 24px 28px', position: 'relative', zIndex: 2, overflowY: 'auto', boxSizing: 'border-box' }}>
        {/* Warning icon */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex', width: '80px', height: '80px',
            borderRadius: '50%', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(239,68,68,0.2)',
            border: '2px solid rgba(239,68,68,0.5)',
            animation: 'alert-pulse 1.5s ease-in-out infinite',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill={C.danger}>
              <path d="M12 2L2 20h20L12 2zm0 3.27L20.27 19H3.73L12 5.27zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
            </svg>
          </div>
        </div>

        {/* Main warning card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(185,28,28,0.15) 100%)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: '24px',
          padding: '24px', marginBottom: '20px',
          animation: 'alert-pulse 2s ease-in-out infinite',
          boxShadow: '0 20px 60px rgba(239,68,68,0.25)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '12px',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: C.danger, boxShadow: `0 0 12px ${C.danger}`,
              animation: 'glow-pulse 0.8s ease-in-out infinite',
            }} />
            <span style={{
              color: C.danger, fontSize: '11px', fontWeight: 700,
              fontFamily: 'Inter, sans-serif', letterSpacing: '2px', textTransform: 'uppercase',
            }}>
              Critical Alert
            </span>
          </div>

          <h1 style={{
            color: 'white', fontSize: '22px', fontWeight: 800,
            fontFamily: 'Poppins, Inter, sans-serif',
            margin: '0 0 10px', lineHeight: 1.2,
          }}>
            Potential Vishing Attack Detected
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.65)', fontSize: '13px',
            fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: '0 0 16px',
          }}>
            Our AI has identified this call as a high-probability voice phishing (vishing) attempt. The caller is using social engineering tactics.
          </p>

          {/* Risk stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Overall Risk', value: `${summary?.overallCallRisk ?? 87}%`, color: C.danger },
              { label: 'Avg Confidence', value: `${summary?.averageAiConfidence ?? 94}%`, color: C.warning },
              { label: 'Final Result', value: summary?.finalCallVerdict === 'ai_generated' ? 'AI' : 'High', color: C.danger },
            ].map(s => (
              <div key={s.label} style={{
                padding: '10px 8px', borderRadius: '12px',
                background: 'rgba(0,0,0,0.3)',
                textAlign: 'center',
              }}>
                <div style={{ color: s.color, fontSize: '15px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
                  {s.value}
                </div>
                <div style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'Inter, sans-serif' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detected patterns */}
        <GlassCard style={{ padding: '14px 16px', marginBottom: '16px' }}>
          <p style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 10px' }}>
            Final Call Result
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: C.textSec, fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
            <div>Result: {summary?.finalCallVerdict === 'ai_generated' ? 'AI' : 'AI/Scam Risk'}</div>
            <div>Risk: {summary?.overallCallRisk ?? 87}%</div>
            <div>AI Chunks: {summary?.aiChunks ?? '--'}/{summary?.totalChunks ?? '--'}</div>
            <div>Avg Confidence: {summary?.averageAiConfidence ?? '--'}%</div>
            <div>Duration: {formatDuration(summary?.callDurationSeconds)}</div>
          </div>
        </GlassCard>

        {/* Detected patterns */}
        <GlassCard style={{ padding: '14px 16px', marginBottom: '16px' }}>
          <p style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 10px' }}>
            Detected Threat Patterns
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              'Synthetic/AI-generated voice detected',
              'High-pressure urgency language',
              'Request for sensitive personal information',
              'Spoofed caller ID suspected',
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'rgba(239,68,68,0.2)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill={C.danger}>
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </div>
                <span style={{ color: C.textSec, fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
                  {t}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
          <button onClick={() => navigate('home')} style={{
            width: '100%', padding: '16px',
            background: 'linear-gradient(135deg, #DC2626, #EF4444)',
            border: 'none', borderRadius: '16px',
            color: 'white', fontSize: '16px', fontWeight: 700,
            fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(239,68,68,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>
            </svg>
            End Call Now
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button onClick={blockCurrentNumber} style={{
              padding: '14px',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px', color: 'white', fontSize: '13px', fontWeight: 600,
              fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            }}>
              🚫 Block Number
            </button>
            <button onClick={() => navigate('scam-report')} style={{
              padding: '14px',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px', color: 'white', fontSize: '13px', fontWeight: 600,
              fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            }}>
              📢 Report Scam
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <button onClick={markSpam} style={{
              padding: '12px 8px',
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)',
              borderRadius: '12px', color: '#F59E0B', fontSize: '12px', fontWeight: 600,
              fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            }}>
              Mark Spam
            </button>
            <button onClick={saveEvidence} style={{
              padding: '12px 8px',
              background: 'rgba(37,99,235,0.14)', border: '1px solid rgba(37,99,235,0.32)',
              borderRadius: '12px', color: '#93C5FD', fontSize: '12px', fontWeight: 600,
              fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            }}>
              Save Evidence
            </button>
            <button onClick={callHelpline} style={{
              padding: '12px 8px',
              background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.28)',
              borderRadius: '12px', color: C.success, fontSize: '12px', fontWeight: 600,
              fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            }}>
              Call 1930
            </button>
          </div>

          <button onClick={() => navigate('emergency')} style={{
            width: '100%', padding: '14px',
            background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '14px', color: '#F59E0B', fontSize: '14px', fontWeight: 600,
            fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            🆘 Notify Emergency Contact
          </button>
        </div>

        <button onClick={() => navigate('live-call')} style={{
          width: '100%', padding: '12px',
          background: 'none', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px', color: C.textMuted, fontSize: '13px',
          fontFamily: 'Inter, sans-serif', cursor: 'pointer',
        }}>
          Continue Call (False Alarm)
        </button>
      </div>
    </div>
  )
}
