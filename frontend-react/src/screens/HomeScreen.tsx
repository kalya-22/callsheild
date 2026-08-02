import { useEffect, useState } from 'react'
import { C, GlassCard, BottomNav, Waveform, StatusBar, type NavFn, type Screen } from '../shared'
import { getCurrentUser, getStatus, getHistory, predictAudio, type AuthUser, type BackendStatus, type CallRiskSummary, type HistoryItem, type LiveChunkResult, type PredictionResult } from '../services/callshieldApi'

const recentCalls = [
  { name: 'HDFC Bank', number: '+91 22 6160 6161', time: '2m ago', risk: 'safe' as const, confidence: 96 },
  { name: 'Unknown Caller', number: '+91 98765 43210', time: '1h ago', risk: 'scam' as const, confidence: 91 },
  { name: 'Mom', number: '+91 94440 12345', time: '3h ago', risk: 'safe' as const, confidence: 99 },
  { name: 'Insurance Co.', number: '+91 80123 45678', time: '5h ago', risk: 'suspicious' as const, confidence: 74 },
]

const riskColors = {
  safe: C.success,
  suspicious: C.warning,
  scam: C.danger,
}
const riskLabels = {
  safe: 'Safe',
  suspicious: 'Suspicious',
  scam: 'Scam',
}

function saveUploadForAnalysis(result: PredictionResult) {
  const chunks: LiveChunkResult[] = result.chunk_predictions.map((chunk, index) => ({
    chunk_id: chunk.chunk_id,
    predicted_label: chunk.predicted_label,
    ai_probability: chunk.ai_probability,
    ai_confidence_percent: chunk.ai_confidence_percent ?? Math.round(chunk.ai_probability * 100),
    risk_level: chunk.risk_level ?? (chunk.ai_probability >= 0.75 ? 'high' : chunk.ai_probability >= 0.5 ? 'medium' : 'low'),
    warning: chunk.warning ?? chunk.ai_probability >= 0.7,
    chunk_count: index + 1,
    current_chunk_risk: chunk.ai_probability,
    current_chunk_risk_percent: chunk.ai_confidence_percent ?? Math.round(chunk.ai_probability * 100),
    final_call_verdict: chunk.predicted_label,
  }))
  const latest = chunks.at(-1) ?? null
  const summary: CallRiskSummary = {
    currentChunkRisk: latest ? Math.round(latest.ai_probability * 100) : 0,
    overallCallRisk: Math.round((result.overall_risk_score ?? result.ai_probability) * 100),
    aiChunks: result.ai_chunk_count ?? chunks.filter(chunk => chunk.ai_probability >= 0.65).length,
    totalChunks: result.chunk_count,
    averageAiConfidence: Math.round((result.average_ai_confidence ?? result.ai_probability) * 100),
    finalCallVerdict: result.final_call_verdict ?? result.predicted_label,
    warning: result.warning,
  }

  if (latest) {
    localStorage.setItem('callshield_latest_live_result', JSON.stringify(latest))
  } else {
    localStorage.removeItem('callshield_latest_live_result')
  }
  localStorage.setItem('callshield_live_call_chunks', JSON.stringify(chunks.reverse()))
  localStorage.setItem('callshield_live_call_summary', JSON.stringify(summary))
}

export default function HomeScreen({ navigate }: { navigate: NavFn }) {
  const [status, setStatus] = useState<BackendStatus | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [apiError, setApiError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<PredictionResult | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadDashboard() {
      try {
        const [statusData, historyData] = await Promise.all([getStatus(), getHistory(4)])
        if (!mounted) return
        setStatus(statusData)
        setHistory(historyData)
        setApiError('')
      } catch (err) {
        if (!mounted) return
        setApiError(err instanceof Error ? err.message : 'Backend is not reachable')
      }
    }
    setUser(getCurrentUser())
    void loadDashboard()
    const id = setInterval(loadDashboard, 10000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  const modelReady = Boolean(status?.model_ready)
  const databaseReady = Boolean(status?.database_ready)
  const totalCalls = history.length
  const scamCalls = history.filter(item => item.warning).length
  const avgConfidence = history.length
    ? Math.round(history.reduce((sum, item) => sum + item.ai_probability, 0) / history.length * 100)
    : 0
  const recentApiCalls = history.map(item => {
    const risk = item.risk_level === 'high' ? 'scam' : item.risk_level === 'medium' ? 'suspicious' : 'safe'
    return {
      name: item.predicted_label === 'ai_generated' ? 'AI Voice Sample' : 'Human Voice Sample',
      number: item.filename,
      time: new Date(item.created_at).toLocaleString(),
      risk: risk as 'safe' | 'suspicious' | 'scam',
      confidence: Math.round(item.ai_probability * 100),
    }
  })
  const dashboardCalls = recentApiCalls.length ? recentApiCalls : recentCalls

  async function handleFileUpload(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setApiError('')
    try {
      const result = await predictAudio(file)
      setUploadResult(result)
      saveUploadForAnalysis(result)
      await getHistory(4).then(setHistory)
      navigate('live-analysis' as Screen)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Prediction failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      height: '844px', background: C.bg,
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          radial-gradient(circle at 80% 10%, rgba(6,182,212,0.07) 0%, transparent 40%),
          radial-gradient(circle at 20% 90%, rgba(37,99,235,0.07) 0%, transparent 40%)
        `,
      }} />

      <StatusBar />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', paddingBottom: '80px' }}>
        {/* Greeting */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '20px', paddingTop: '4px',
        }}>
          <div>
            <p style={{ color: C.textMuted, fontSize: '13px', margin: '0 0 3px', fontFamily: 'Inter, sans-serif' }}>
              Good morning,
            </p>
            <h2 style={{
              color: 'white', fontSize: '22px', fontWeight: 700,
              fontFamily: 'Poppins, Inter, sans-serif', margin: 0,
            }}>
              {user?.full_name ?? 'Alex Johnson'} 👋
            </h2>
          </div>
          <button
            onClick={() => navigate('profile' as Screen)}
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
              border: '2px solid rgba(37,99,235,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '16px', fontWeight: 700,
              fontFamily: 'Inter, sans-serif', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
            }}
          >
            {(user?.full_name ?? 'Alex Johnson')
              .split(' ')
              .map(part => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </button>
        </div>

        {/* AI Protection Status */}
        <GlassCard style={{
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(6,182,212,0.08) 100%)',
          border: '1px solid rgba(34,197,94,0.25)',
          marginBottom: '16px',
          boxShadow: '0 8px 32px rgba(34,197,94,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: C.success, boxShadow: `0 0 10px ${C.success}`,
                  animation: 'glow-pulse 2s ease-in-out infinite',
                }} />
                <span style={{ color: C.success, fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {modelReady ? 'AI Shield Active' : 'Backend Offline'}
                </span>
              </div>
              <p style={{ color: 'white', fontSize: '17px', fontWeight: 600, margin: '0 0 4px', fontFamily: 'Inter, sans-serif' }}>
                {modelReady ? 'Model Ready for Detection' : 'Start FastAPI to connect model'}
              </p>
              <p style={{ color: C.textSec, fontSize: '12px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                {databaseReady ? 'Database history connected' : apiError || 'Checking backend status'}
              </p>
            </div>
            <div style={{
              width: '56px', height: '56px',
              background: 'rgba(34,197,94,0.15)',
              borderRadius: '18px',
              border: '1px solid rgba(34,197,94,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Mini waveform */}
          <div style={{ marginTop: '14px', opacity: 0.5 }}>
            <Waveform color={C.success} bars={28} height={28} />
          </div>
        </GlassCard>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'API Results', value: `${totalCalls}`, icon: 'API', color: C.primary },
            { label: 'Warnings', value: `${scamCalls}`, icon: 'AI', color: C.danger },
            { label: 'Avg AI Risk', value: `${avgConfidence}%`, icon: '%', color: C.success },
          ].map(s => (
            <GlassCard key={s.label} style={{ padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{
                color: s.color, fontSize: '17px', fontWeight: 700,
                fontFamily: 'Inter, sans-serif', marginBottom: '3px',
              }}>
                {s.value}
              </div>
              <div style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                {s.label}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => navigate('live-call' as Screen)}
          style={{
            width: '100%', padding: '20px',
            background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 40%, #0891B2 100%)',
            border: 'none', borderRadius: '20px', cursor: 'pointer',
            marginBottom: '20px', position: 'relative', overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(37,99,235,0.45)',
          }}
        >
          <div style={{
            position: 'absolute', top: '-30px', right: '-30px',
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-20px', left: '30px',
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(6,182,212,0.2)',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'glow-pulse 2s ease-in-out infinite',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: 'white', fontSize: '17px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
                  Start Live Detection
                </div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
                  Activate AI call shield
                </div>
              </div>
            </div>
          </div>
        </button>

        <GlassCard style={{ padding: '14px 16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginBottom: '4px' }}>
                Test Recorded Audio
              </div>
              <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {uploadResult ? `${uploadResult.filename}: ${Math.round(uploadResult.ai_probability * 100)}% AI` : 'Upload wav, mp3, or flac sample'}
              </div>
            </div>
            <label style={{ padding: '9px 12px', borderRadius: '12px', background: 'rgba(6,182,212,0.14)', border: '1px solid rgba(6,182,212,0.35)', color: C.accent, fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: uploading ? 'wait' : 'pointer', flexShrink: 0 }}>
              {uploading ? 'Checking...' : 'Upload'}
              <input
                type="file"
                accept="audio/*,.flac"
                disabled={uploading}
                onChange={event => void handleFileUpload(event.target.files?.[0])}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </GlassCard>

        {/* Risk Level */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ color: 'white', fontSize: '16px', fontWeight: 600, fontFamily: 'Poppins, Inter, sans-serif' }}>
            Recent Calls
          </span>
          <button onClick={() => navigate('history' as Screen)} style={{
            background: 'none', border: 'none', color: C.primary,
            fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500, cursor: 'pointer',
          }}>
            See all
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dashboardCalls.map((call, i) => (
            <GlassCard
              key={i}
              onClick={() => navigate('call-report' as Screen)}
              style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              {/* Avatar */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${riskColors[call.risk]}22, ${riskColors[call.risk]}11)`,
                border: `1px solid ${riskColors[call.risk]}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                color: riskColors[call.risk], fontWeight: 700,
                fontSize: '14px', fontFamily: 'Inter, sans-serif',
              }}>
                {call.name === 'Unknown Caller' ? '?' : call.name[0]}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: 'white', fontSize: '14px', fontWeight: 600,
                  fontFamily: 'Inter, sans-serif', marginBottom: '3px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {call.name}
                </div>
                <div style={{ color: C.textMuted, fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
                  {call.number} · {call.time}
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  padding: '3px 10px', borderRadius: '10px', marginBottom: '4px',
                  background: `${riskColors[call.risk]}18`,
                  color: riskColors[call.risk],
                  fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                }}>
                  {riskLabels[call.risk]}
                </div>
                <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                  {call.confidence}% AI
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Threat indicator */}
        <GlassCard style={{ padding: '16px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
              Risk Level Today
            </span>
            <span style={{ color: C.success, fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
              Low
            </span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: '18%', height: '100%',
              background: 'linear-gradient(90deg, #22C55E, #06B6D4)',
              borderRadius: '3px',
              boxShadow: '0 0 8px rgba(34,197,94,0.5)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>Safe</span>
            <span style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>High Risk</span>
          </div>
        </GlassCard>
      </div>

      <BottomNav active="home" navigate={navigate} />
    </div>
  )
}
