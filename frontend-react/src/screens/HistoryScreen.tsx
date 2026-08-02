import { useEffect, useState } from 'react'
import { C, GlassCard, BottomNav, StatusBar, type NavFn, type Screen } from '../shared'
import { clearHistory, getHistory, type HistoryItem } from '../services/callshieldApi'

type Filter = 'All' | 'Safe' | 'Suspicious' | 'Scam'

type HistoryScreenProps = {
  navigate: NavFn
  onOpenCallReport?: (item: HistoryItem) => void
}

const riskColor = { safe: C.success, suspicious: C.warning, scam: C.danger }
const riskLabel = { safe: 'Safe', suspicious: 'Suspicious', scam: 'Scam' }
const riskBg = { safe: C.successDim, suspicious: C.warningDim, scam: C.dangerDim }

function toCall(item: HistoryItem) {
  const risk = item.risk_level === 'high' ? 'scam' : item.risk_level === 'medium' ? 'suspicious' : 'safe'
  return {
    id: item.prediction_id,
    name: item.predicted_label === 'ai_generated' ? 'AI Voice Sample' : 'Human Voice Sample',
    number: item.filename,
    date: new Date(item.created_at).toLocaleString(),
    duration: `${item.chunk_count} chunks`,
    risk: risk as 'safe' | 'suspicious' | 'scam',
    confidence: Math.round(item.ai_probability * 100),
  }
}

export default function HistoryScreen({ navigate, onOpenCallReport }: HistoryScreenProps) {
  const [filter, setFilter] = useState<Filter>('All')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadHistory() {
    setLoading(true)
    try {
      setItems(await getHistory(100))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load history')
    } finally {
      setLoading(false)
    }
  }

  async function handleClear() {
    await clearHistory()
    setItems([])
  }

  useEffect(() => {
    void loadHistory()
  }, [])

  const filtered = items
    .map(item => ({ item, call: toCall(item) }))
    .filter(({ call }) =>
      (filter === 'All' || riskLabel[call.risk] === filter) &&
      (call.name.toLowerCase().includes(search.toLowerCase()) || call.number.toLowerCase().includes(search.toLowerCase()))
    )

  return (
    <div style={{ height: '844px', background: C.bg, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 10%, rgba(37,99,235,0.06) 0%, transparent 50%)' }} />
      <StatusBar />

      <div style={{ padding: '8px 20px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 700, fontFamily: 'Poppins, Inter, sans-serif', margin: 0 }}>
            Call History
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => void loadHistory()} style={{ padding: '7px 11px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: C.textSec, fontSize: '11px', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
              Refresh
            </button>
            <button onClick={() => void handleClear()} style={{ padding: '7px 11px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.28)', background: 'rgba(239,68,68,0.1)', color: C.danger, fontSize: '11px', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
              Clear
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '0 14px', marginBottom: '14px' }}>
          <input
            style={{ flex: 1, padding: '13px 0', background: 'none', border: 'none', color: 'white', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none' }}
            placeholder="Search prediction files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {(['All', 'Safe', 'Suspicious', 'Scam'] as Filter[]).map(f => {
            const isActive = filter === f
            const fColor = f === 'Safe' ? C.success : f === 'Suspicious' ? C.warning : f === 'Scam' ? C.danger : C.primary
            return (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', borderRadius: '20px', flexShrink: 0, background: isActive ? `${fColor}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${isActive ? fColor + '50' : 'rgba(255,255,255,0.08)'}`, color: isActive ? fColor : C.textMuted, fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
                {f}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', paddingBottom: '80px', position: 'relative', zIndex: 2 }}>
        <p style={{ color: C.textMuted, fontSize: '12px', fontFamily: 'Inter, sans-serif', margin: '0 0 12px' }}>
          {loading ? 'Loading predictions...' : `${filtered.length} ${filter === 'All' ? 'total' : filter.toLowerCase()} results`}
        </p>

        {error && (
          <GlassCard style={{ padding: '14px', color: C.danger, fontSize: '12px', fontFamily: 'Inter, sans-serif', marginBottom: '12px' }}>
            {error}
          </GlassCard>
        )}

        {!loading && !error && filtered.length === 0 && (
          <GlassCard style={{ padding: '18px', textAlign: 'center', color: C.textMuted, fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
            No predictions yet. Upload an audio file or start live detection.
          </GlassCard>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(({ item, call }) => (
            <GlassCard key={call.id} onClick={() => { onOpenCallReport?.(item); navigate('call-report' as Screen) }} style={{ padding: '14px 16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0, background: `${riskColor[call.risk]}18`, border: `1px solid ${riskColor[call.risk]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: riskColor[call.risk], fontSize: '14px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
                  {call.risk === 'scam' ? 'AI' : 'OK'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                      {call.name}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '8px', background: riskBg[call.risk], color: riskColor[call.risk], fontSize: '10px', fontWeight: 600, fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
                      {riskLabel[call.risk]}
                    </span>
                  </div>
                  <div style={{ color: C.textMuted, fontSize: '12px', fontFamily: 'Inter, sans-serif', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {call.number}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                      {call.date}
                    </span>
                    <span style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '6px' }}>
                      AI: {call.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <BottomNav active="history" navigate={navigate} />
    </div>
  )
}
