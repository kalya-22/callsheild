import { C, GlassCard, CircularGauge, BackButton, StatusBar, type NavFn } from '../shared'
import type { HistoryItem } from '../services/callshieldApi'

const timeline = [
  { time: '00:04', event: 'Call connected', type: 'info' },
  { time: '00:12', event: 'AI detection activated', type: 'info' },
  { time: '00:38', event: 'Synthetic voice markers detected', type: 'warning' },
  { time: '01:05', event: 'Pressure language identified: "Act now"', type: 'warning' },
  { time: '01:44', event: 'SSN request detected — Critical alert', type: 'danger' },
  { time: '02:01', event: 'Scam probability exceeded 75%', type: 'danger' },
  { time: '02:18', event: 'User ended call', type: 'info' },
]

export default function CallReportScreen({ navigate, historyItem }: { navigate: NavFn; historyItem?: HistoryItem | null }) {
  const isAi = historyItem?.predicted_label === 'ai_generated'
  const score = Math.max(0, Math.min(100, Math.round((historyItem?.ai_probability ?? 0.78) * 100)))
  const riskLevel = historyItem?.risk_level === 'high' ? 'SCAM' : historyItem?.risk_level === 'medium' ? 'SUSPICIOUS' : 'SAFE'
  const riskColor = historyItem?.risk_level === 'high' ? C.danger : historyItem?.risk_level === 'medium' ? C.warning : C.success
  const callerLabel = isAi ? 'AI Voice Sample' : 'Human Voice Sample'
  const summaryText = isAi
    ? 'This sample was flagged as AI-generated with strong evidence from the playback analysis and is consistent with a high-risk call profile.'
    : 'This sample was classified as human speech and did not meet the threshold for a suspicious or scam-style call.'
  const subtitle = historyItem?.filename ? historyItem.filename : 'Recorded audio'
  const detectedAt = historyItem?.created_at ? new Date(historyItem.created_at).toLocaleString() : 'Recently reviewed'
  const suspiciousPhrases = isAi
    ? [
        { phrase: 'Urgency language detected', time: '0:38' },
        { phrase: 'Synthetic voice markers identified', time: '1:05' },
        { phrase: 'Requested sensitive information', time: '1:44' },
      ]
    : [
        { phrase: 'No decisive scam phrases detected', time: '0:00' },
        { phrase: 'Speech pattern remained consistent', time: '0:25' },
      ]

  return (
    <div style={{ minHeight: '844px', background: C.bg, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 10%, rgba(37,99,235,0.08) 0%, transparent 50%)' }} />
      <StatusBar />

      <div style={{ padding: '8px 20px 32px', position: 'relative', zIndex: 2, overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <BackButton navigate={navigate} to="history" />
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, fontFamily: 'Poppins, Inter, sans-serif', margin: 0 }}>
              Call Report
            </h2>
            <p style={{ color: C.textMuted, fontSize: '12px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              {subtitle} · {detectedAt}
            </p>
          </div>
          <div style={{
            marginLeft: 'auto', padding: '4px 10px', borderRadius: '10px',
            background: historyItem?.risk_level === 'high' ? C.dangerDim : historyItem?.risk_level === 'medium' ? C.warningDim : C.successDim,
            border: `1px solid ${riskColor}44`,
          }}>
            <span style={{ color: riskColor, fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{riskLevel}</span>
          </div>
        </div>

        {/* Caller + Score */}
        <GlassCard style={{ padding: '20px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '24px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
            }}>?</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontSize: '17px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{callerLabel}</div>
              <div style={{ color: C.textMuted, fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>{subtitle}</div>
              <div style={{ color: C.textMuted, fontSize: '12px', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                {detectedAt}
              </div>
            </div>
            <CircularGauge value={score} size={80} color={riskColor} label={score.toString()} sublabel="%" />
          </div>
        </GlassCard>

        {/* AI Summary */}
        <GlassCard style={{
          padding: '16px', marginBottom: '14px',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(6,182,212,0.05) 100%)',
          border: '1px solid rgba(37,99,235,0.2)',
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>🤖</span>
            <div>
              <div style={{ color: C.accent, fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                AI-Generated Summary
              </div>
              <p style={{ color: C.textSec, fontSize: '13px', lineHeight: 1.7, margin: 0, fontFamily: 'Inter, sans-serif' }}>
                {summaryText}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Score breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          {[
            { label: 'Voice Authenticity', val: Math.max(0, 100 - score), color: isAi ? C.danger : C.success },
            { label: 'Scam Probability', val: score, color: riskColor },
            { label: 'Deepfake Score', val: isAi ? Math.max(60, score - 10) : 24, color: C.warning },
            { label: 'Speech Confidence', val: isAi ? Math.max(70, 100 - score + 10) : 91, color: C.primary },
          ].map(s => (
            <GlassCard key={s.label} style={{ padding: '14px' }}>
              <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', marginBottom: '6px' }}>{s.label}</div>
              <div style={{ color: s.color, fontSize: '22px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>{s.val}%</div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${s.val}%`, height: '100%', background: s.color, borderRadius: '2px' }} />
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Suspicious phrases */}
        <GlassCard style={{ padding: '16px', marginBottom: '14px' }}>
          <div style={{ color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginBottom: '12px' }}>
            Suspicious Phrases Detected
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {suspiciousPhrases.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '12px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.15)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={C.danger}>
                  <path d="M12 2L2 20h20L12 2zm0 3.27L20.27 19H3.73L12 5.27zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
                </svg>
                <span style={{ flex: 1, color: C.textSec, fontSize: '12px', fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
                  {p.phrase}
                </span>
                <span style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
                  {p.time}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Timeline */}
        <GlassCard style={{ padding: '16px', marginBottom: '20px' }}>
          <div style={{ color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginBottom: '16px' }}>
            Detection Timeline
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: '19px', top: 0, bottom: 0,
              width: '1px', background: 'rgba(255,255,255,0.06)',
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {timeline.map((e, i) => {
                const c = e.type === 'danger' ? C.danger : e.type === 'warning' ? C.warning : C.accent
                return (
                  <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: c, flexShrink: 0, marginTop: '4px',
                      boxShadow: `0 0 6px ${c}88`,
                      position: 'relative', zIndex: 1, marginLeft: '16px',
                    }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                        {e.time}
                      </span>
                      <div style={{ color: C.textSec, fontSize: '12px', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
                        {e.event}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </GlassCard>

        {/* Export buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Save', icon: '💾' },
            { label: 'Share', icon: '📤' },
            { label: 'Export PDF', icon: '📄' },
          ].map(b => (
            <button key={b.label} style={{
              padding: '13px 8px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              color: 'white', fontSize: '12px', fontWeight: 500,
              fontFamily: 'Inter, sans-serif', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            }}>
              <span style={{ fontSize: '18px' }}>{b.icon}</span>
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
