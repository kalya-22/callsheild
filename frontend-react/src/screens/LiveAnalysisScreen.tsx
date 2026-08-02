import { useMemo } from 'react'
import { C, GlassCard, CircularGauge, BackButton, StatusBar, type NavFn } from '../shared'
import { type CallRiskSummary, type LiveChunkResult } from '../services/callshieldApi'

function loadLatestResult(): LiveChunkResult | null {
  try {
    const raw = localStorage.getItem('callshield_latest_live_result')
    return raw ? JSON.parse(raw) as LiveChunkResult : null
  } catch {
    return null
  }
}

function loadCallSummary(): CallRiskSummary | null {
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

function riskMeta(risk: number) {
  if (risk >= 65) return { color: C.danger, label: 'HIGH RISK', recommendation: 'The model found strong AI-generated voice indicators. Ask the user to end the call and verify using an official contact number.' }
  if (risk >= 35) return { color: C.warning, label: 'CAUTION', recommendation: 'The model found some suspicious voice indicators. Continue monitoring and avoid sharing private information.' }
  return { color: C.success, label: 'LOW RISK', recommendation: 'The latest chunk looks mostly human according to the current baseline model. Keep monitoring during the call.' }
}

export default function LiveAnalysisScreen({ navigate }: { navigate: NavFn }) {
  const latest = loadLatestResult()
  const summary = loadCallSummary()
  const risk = summary?.overallCallRisk ?? Math.round((latest?.ai_probability ?? 0) * 100)
  const currentChunkRisk = summary?.currentChunkRisk ?? Math.round((latest?.ai_probability ?? 0) * 100)
  const averageAiConfidence = summary?.averageAiConfidence ?? Math.round((latest?.ai_probability ?? 0) * 100)
  const aiChunks = summary?.aiChunks ?? (latest && latest.ai_probability >= 0.65 ? 1 : 0)
  const totalChunks = summary?.totalChunks ?? (latest ? 1 : 0)
  const finalVerdict = summary?.finalCallVerdict ?? latest?.final_call_verdict ?? latest?.predicted_label
  const meta = riskMeta(risk)
  const isHighRisk = finalVerdict === 'ai_generated' || risk >= 65
  const scores = useMemo(() => [
    { label: 'Current Chunk Risk', value: currentChunkRisk, color: latest?.warning ? C.danger : C.success, icon: 'CC', sub: latest?.predicted_label ?? 'Waiting for live chunk' },
    { label: 'Overall Call Risk', value: risk, color: meta.color, icon: 'OR', sub: finalVerdict ?? 'No call verdict yet' },
    { label: 'AI Chunks', value: totalChunks ? Math.round((aiChunks / totalChunks) * 100) : 0, color: aiChunks ? C.warning : C.success, icon: 'AC', sub: `${aiChunks}/${totalChunks} chunks` },
    { label: 'Average AI Confidence', value: averageAiConfidence, color: averageAiConfidence >= 65 ? C.danger : averageAiConfidence >= 35 ? C.warning : C.success, icon: 'AV', sub: 'Mean across all chunks' },
  ], [averageAiConfidence, aiChunks, currentChunkRisk, finalVerdict, latest, meta.color, risk, totalChunks])

  function addBlockedNumber(reason = 'AI vishing risk detected') {
    const blockedNumber = {
      name: 'Uploaded Audio / Unknown Caller',
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

  function blockContact() {
    addBlockedNumber()
    navigate('blocked-contacts')
  }

  function markSpam() {
    addBlockedNumber('Marked spam from analysis dashboard')
    navigate('blocked-contacts')
  }

  function saveEvidence() {
    const evidence = {
      saved_at: new Date().toISOString(),
      source: 'analysis_dashboard',
      summary,
      latest,
      chunks: JSON.parse(localStorage.getItem('callshield_live_call_chunks') ?? '[]'),
    }
    localStorage.setItem('callshield_saved_evidence', JSON.stringify(evidence))
    navigate('call-report')
  }

  function callHelpline() {
    window.location.href = 'tel:1930'
  }

  return (
    <div style={{ minHeight: '844px', background: C.bg, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 70% 20%, ${meta.color}12 0%, transparent 50%)` }} />

      <StatusBar />

      <div style={{ padding: '8px 20px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <BackButton navigate={navigate} to="live-call" />
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, fontFamily: 'Poppins, Inter, sans-serif', margin: 0 }}>
              Live Analysis
            </h2>
            <p style={{ color: C.textMuted, fontSize: '12px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Real model output from all call chunks
            </p>
          </div>
          <div style={{ marginLeft: 'auto', padding: '4px 10px', background: `${meta.color}18`, border: `1px solid ${meta.color}50`, borderRadius: '10px' }}>
            <span style={{ color: meta.color, fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{latest ? meta.label : 'NO DATA'}</span>
          </div>
        </div>

        <GlassCard style={{ padding: '20px', marginBottom: '16px', textAlign: 'center' }}>
          <p style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px' }}>
            Overall Threat Assessment
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <CircularGauge value={risk} size={140} color={meta.color} label={`${risk}`} sublabel="% AI Risk" />
          </div>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '12px' }}>
            {[
              { label: 'Current', val: latest ? `${currentChunkRisk}%` : '--' },
              { label: 'AI Chunks', val: `${aiChunks}/${totalChunks}` },
              { label: 'Verdict', val: finalVerdict ?? '--' },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center', minWidth: 68 }}>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: 700, fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.val}</div>
                <div style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'Inter, sans-serif' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          {scores.map(s => (
            <GlassCard key={s.label} style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span style={{ color: s.color, fontSize: '12px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>{s.icon}</span>
                <span style={{ color: C.textSec, fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 500, lineHeight: 1.2 }}>
                  {s.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '6px' }}>
                <span style={{ color: s.color, fontSize: '26px', fontWeight: 700, fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>{s.value}</span>
                <span style={{ color: C.textMuted, fontSize: '12px', fontFamily: 'Inter, sans-serif', marginBottom: '4px' }}>%</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${s.value}%`, height: '100%', background: s.color, borderRadius: '2px', boxShadow: `0 0 6px ${s.color}88` }} />
              </div>
              <div style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'Inter, sans-serif', marginTop: '6px', textTransform: 'capitalize' }}>{s.sub}</div>
            </GlassCard>
          ))}
        </div>

        <GlassCard style={{ padding: '16px', marginBottom: '14px' }}>
          <div style={{ color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginBottom: '10px' }}>
            Latest Chunk Details
          </div>
          <div style={{ display: 'grid', gap: '8px', color: C.textSec, fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
            <div>Latest Chunk ID: {latest?.chunk_id ?? 'No chunk analyzed yet'}</div>
            <div>Current Chunk Risk: {latest ? `${currentChunkRisk}%` : '--'}</div>
            <div>Overall Call Risk: {totalChunks ? `${risk}%` : '--'}</div>
            <div>AI Chunks / Total Chunks: {aiChunks}/{totalChunks}</div>
            <div>Average AI Confidence: {totalChunks ? `${averageAiConfidence}%` : '--'}</div>
            <div>Call Duration: {formatDuration(summary?.callDurationSeconds)}</div>
            <div>Final Call Verdict: {finalVerdict ?? 'Start live detection first'}</div>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '16px', marginBottom: '20px', background: `linear-gradient(135deg, ${meta.color}18 0%, rgba(6,182,212,0.06) 100%)`, border: `1px solid ${meta.color}35` }}>
          <div style={{ color: meta.color, fontSize: '13px', fontWeight: 700, fontFamily: 'Inter, sans-serif', marginBottom: '6px' }}>
            Recommendation
          </div>
          <p style={{ color: C.textSec, fontSize: '12px', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>
            {totalChunks ? meta.recommendation : 'Go back to Live Call, press Start Mic, speak or play an audio sample for a few seconds, then return here.'}
          </p>
        </GlassCard>

        {isHighRisk && (
          <GlassCard style={{ padding: '14px 16px', marginBottom: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div style={{ color: C.danger, fontSize: '13px', fontWeight: 700, fontFamily: 'Inter, sans-serif', marginBottom: '10px' }}>
              High Risk Actions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <button onClick={blockContact} style={{ padding: '11px 8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: 'white', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
                Block Contact
              </button>
              <button onClick={() => navigate('scam-report')} style={{ padding: '11px 8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: 'white', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
                Report Scam
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button onClick={markSpam} style={{ padding: '10px 6px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)', borderRadius: '12px', color: '#F59E0B', fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
                Mark Spam
              </button>
              <button onClick={saveEvidence} style={{ padding: '10px 6px', background: 'rgba(37,99,235,0.14)', border: '1px solid rgba(37,99,235,0.32)', borderRadius: '12px', color: '#93C5FD', fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
                Save Evidence
              </button>
              <button onClick={callHelpline} style={{ padding: '10px 6px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.28)', borderRadius: '12px', color: C.success, fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
                Call 1930
              </button>
            </div>
          </GlassCard>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          <button onClick={() => navigate('live-call')} style={{ padding: '15px', background: 'linear-gradient(135deg, #2563EB, #06B6D4)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', boxShadow: '0 6px 20px rgba(37,99,235,0.4)' }}>
            Live Mic
          </button>
          <button onClick={() => navigate('history')} style={{ padding: '15px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
            History
          </button>
        </div>
      </div>
    </div>
  )
}
