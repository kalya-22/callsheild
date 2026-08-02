import { useEffect, useRef, useState } from 'react'
import { C, GlassCard, Waveform, CircularGauge, type NavFn } from '../shared'
import { predictChunk, type CallRiskSummary, type LiveChunkResult } from '../services/callshieldApi'
import { encodeWav, mergeFloatChunks } from '../services/liveAudio'

function useTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [active])

  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return { seconds, label: `${m}:${s}`, reset: () => setSeconds(0) }
}

function getRiskMeta(risk: number) {
  if (risk < 35) return { color: C.success, label: 'Safe', statusText: 'Voice pattern looks human' }
  if (risk < 65) return { color: C.warning, label: 'Caution', statusText: 'Synthetic voice indicators found' }
  return { color: C.danger, label: 'High Risk', statusText: 'AI-generated voice likely' }
}

function riskToPercent(result: LiveChunkResult | null) {
  return Math.round((result?.ai_probability ?? 0) * 100)
}

const LIVE_AI_CHUNK_THRESHOLD = 0.78
const LIVE_OVERALL_WARNING_THRESHOLD = 0.74
const LIVE_AI_RATIO_THRESHOLD = 0.55
const LIVE_STRONG_CHUNK_THRESHOLD = 0.93

function summarizeCall(chunks: LiveChunkResult[], latest: LiveChunkResult | null, callDurationSeconds = 0): CallRiskSummary {
  const totalChunks = chunks.length
  const aiChunks = chunks.filter(chunk => chunk.ai_probability >= LIVE_AI_CHUNK_THRESHOLD).length
  const averageScore = totalChunks
    ? chunks.reduce((sum, chunk) => sum + chunk.ai_probability, 0) / totalChunks
    : 0
  const maxScore = totalChunks
    ? Math.max(...chunks.map(chunk => chunk.ai_probability))
    : 0
  const aiChunkRatio = totalChunks ? aiChunks / totalChunks : 0
  const overallScore = Math.min(1, (0.50 * averageScore) + (0.35 * aiChunkRatio) + (0.15 * maxScore))
  const enoughEvidence = totalChunks >= 2
  const finalCallVerdict = enoughEvidence && (
    overallScore >= LIVE_OVERALL_WARNING_THRESHOLD
    || aiChunkRatio >= LIVE_AI_RATIO_THRESHOLD
    || (maxScore >= LIVE_STRONG_CHUNK_THRESHOLD && averageScore >= 0.55)
  )
    ? 'ai_generated'
    : 'human'

  return {
    currentChunkRisk: riskToPercent(latest),
    overallCallRisk: Math.round(overallScore * 100),
    aiChunks,
    totalChunks,
    averageAiConfidence: Math.round(averageScore * 100),
    finalCallVerdict,
    warning: finalCallVerdict === 'ai_generated',
    callDurationSeconds,
  }
}

export default function LiveCallScreen({ navigate }: { navigate: NavFn }) {
  const [active, setActive] = useState(false)
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState('')
  const [latest, setLatest] = useState<LiveChunkResult | null>(null)
  const [timeline, setTimeline] = useState<LiveChunkResult[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null)
  const mediaElementRef = useRef<HTMLMediaElement | null>(null)
  const samplesRef = useRef<Float32Array[]>([])
  const sendingRef = useRef(false)
  const stoppingRef = useRef(false)
  const pausedRef = useRef(false)
  const timelineRef = useRef<LiveChunkResult[]>([])
  const latestRef = useRef<LiveChunkResult | null>(null)
  const sampleRateRef = useRef(16000)
  const timer = useTimer(active && !paused)
  const risk = riskToPercent(latest)
  const callSummary = summarizeCall(timeline, latest, timer.seconds)
  const { color, label, statusText } = getRiskMeta(risk)

  function saveFinalSummary(chunks = timelineRef.current, latestChunk = latestRef.current) {
    const summary = summarizeCall(chunks, latestChunk, timer.seconds)
    localStorage.setItem('callshield_live_call_chunks', JSON.stringify(chunks))
    localStorage.setItem('callshield_live_call_summary', JSON.stringify(summary))
    if (latestChunk) localStorage.setItem('callshield_latest_live_result', JSON.stringify(latestChunk))
    return summary
  }

  async function sendCurrentChunk(sampleRate: number) {
    if (sendingRef.current || samplesRef.current.length === 0) return
    sendingRef.current = true
    const samples = mergeFloatChunks(samplesRef.current)
    const hopSamples = Math.floor(sampleRate * 1.5)
    samplesRef.current = samples.length > hopSamples
      ? [samples.slice(samples.length - hopSamples)]
      : []

    try {
      const wav = encodeWav(samples, sampleRate)
      const result = await predictChunk(wav, `live_chunk_${Date.now()}.wav`)
      setLatest(result)
      latestRef.current = result
      setTimeline(items => {
        const nextItems = [result, ...items]
        timelineRef.current = nextItems
        localStorage.setItem('callshield_live_call_chunks', JSON.stringify(nextItems))
        localStorage.setItem('callshield_live_call_summary', JSON.stringify(summarizeCall(nextItems, result, timer.seconds)))
        return nextItems
      })
      localStorage.setItem('callshield_latest_live_result', JSON.stringify(result))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not analyze audio chunk')
    } finally {
      sendingRef.current = false
    }
  }

  async function startMonitoring() {
    setError('')
    setLatest(null)
    latestRef.current = null
    setTimeline([])
    timelineRef.current = []
    timer.reset()
    stoppingRef.current = false
    localStorage.removeItem('callshield_latest_live_result')
    localStorage.removeItem('callshield_live_call_chunks')
    localStorage.removeItem('callshield_live_call_summary')

    try {
      const audioContext = new AudioContext()
      sampleRateRef.current = audioContext.sampleRate
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      const samplesNeeded = audioContext.sampleRate * 3
      const outputGain = audioContext.createGain()
      outputGain.gain.value = 0

      processor.onaudioprocess = event => {
        if (pausedRef.current || stoppingRef.current) return
        samplesRef.current.push(new Float32Array(event.inputBuffer.getChannelData(0)))
        const sampleCount = samplesRef.current.reduce((total, chunk) => total + chunk.length, 0)
        if (sampleCount >= samplesNeeded) {
          void sendCurrentChunk(audioContext.sampleRate)
        }
      }

      const mediaElements = Array.from(document.querySelectorAll<HTMLAudioElement | HTMLVideoElement>('audio, video'))
      const playingElement = mediaElements.find(element => !element.paused && element.readyState >= 2)

      if (playingElement) {
        const mediaSource = audioContext.createMediaElementSource(playingElement)
        mediaSource.connect(processor)
        processor.connect(outputGain)
        outputGain.connect(audioContext.destination)
        sourceRef.current = mediaSource
        mediaElementRef.current = playingElement
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const source = audioContext.createMediaStreamSource(stream)
        source.connect(processor)
        processor.connect(outputGain)
        outputGain.connect(audioContext.destination)
        streamRef.current = stream
        sourceRef.current = source
      }

      audioContextRef.current = audioContext
      processorRef.current = processor
      setActive(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone permission was not granted')
    }
  }

  function stopMonitoring(clearSamples = true) {
    stoppingRef.current = true
    processorRef.current?.disconnect()
    sourceRef.current?.disconnect()
    mediaElementRef.current = null
    streamRef.current?.getTracks().forEach(track => track.stop())
    void audioContextRef.current?.close()
    processorRef.current = null
    sourceRef.current = null
    streamRef.current = null
    audioContextRef.current = null
    if (clearSamples) samplesRef.current = []
    setActive(false)
    setPaused(false)
    pausedRef.current = false
  }

  async function stopAndFinishMonitoring() {
    if (stoppingRef.current) return
    setError('')
    stopMonitoring(false)

    const sampleCount = samplesRef.current.reduce((total, chunk) => total + chunk.length, 0)
    const minSamples = Math.floor(sampleRateRef.current * 0.75)
    if (sampleCount >= minSamples) {
      await sendCurrentChunk(sampleRateRef.current)
    } else {
      samplesRef.current = []
    }

    const summary = saveFinalSummary()
    navigate(summary.warning || summary.overallCallRisk >= 65 ? 'alert' : 'safe-result')
  }

  useEffect(() => stopMonitoring, [])
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  return (
    <div style={{
      height: '844px',
      background: `linear-gradient(180deg, #070E1A 0%, #0F172A 40%, #0A1628 100%)`,
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 40%, ${color}10 0%, transparent 55%)`, transition: 'background 1s ease' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '48px 24px 20px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: active ? C.danger : C.textMuted, boxShadow: active ? `0 0 8px ${C.danger}` : 'none', animation: active ? 'glow-pulse 1s ease-in-out infinite' : 'none' }} />
          <span style={{ color: active ? C.danger : C.textMuted, fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', letterSpacing: '1px' }}>
            {active ? 'LIVE' : 'READY'}
          </span>
        </div>
        <div style={{ padding: '6px 16px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: '16px', fontWeight: 600, fontFamily: 'Inter, sans-serif', letterSpacing: '2px' }}>
          {timer.label}
        </div>
        <button
          aria-label="Close live monitoring"
          title="Back to Home"
          onClick={() => { stopMonitoring(); navigate('home') }}
          style={{
            width: '36px', height: '36px',
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '12px', color: C.danger,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div style={{ textAlign: 'center', padding: '0 24px 20px', position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
          {[80, 110, 140].map((size, i) => (
            <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: size, height: size, borderRadius: '50%', border: `1.5px solid ${color}`, opacity: 0, animation: active ? `ripple-out 2.5s ease-out ${i * 0.6}s infinite` : 'none' }} />
          ))}
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `linear-gradient(135deg, ${color}33, ${color}11)`, border: `2px solid ${color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: 'white', fontFamily: 'Inter, sans-serif', boxShadow: `0 0 24px ${color}44`, position: 'relative', zIndex: 1 }}>
            ?
          </div>
        </div>
        <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 700, fontFamily: 'Poppins, Inter, sans-serif', margin: '0 0 6px' }}>
          Live Call Preview
        </h2>
        <p style={{ color: C.textMuted, fontSize: '14px', margin: '0 0 4px', fontFamily: 'Inter, sans-serif' }}>
          Captures browser audio when a media element is playing, and falls back to the microphone.
        </p>
      </div>

      <div style={{ flex: 1, padding: '0 24px 150px', position: 'relative', zIndex: 2, overflowY: 'auto', minHeight: 0 }}>
        <GlassCard style={{ padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: C.textSec, fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              {active ? (paused ? 'Paused' : 'Sending 3-second audio chunks') : 'Tap Start to begin live detection'}
            </span>
            <span style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
              {callSummary.aiChunks}/{callSummary.totalChunks} AI chunks
            </span>
          </div>
          <Waveform color={!active || paused ? 'rgba(255,255,255,0.2)' : C.accent} bars={26} height={52} active={active && !paused} />
        </GlassCard>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <GlassCard style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 500, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Current Chunk Risk
            </span>
            <CircularGauge value={risk} size={110} color={color} label={`${risk}`} sublabel="%" />
            <span style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color }}>
              {latest ? label : 'Waiting'}
            </span>
          </GlassCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <GlassCard style={{ padding: '14px', flex: 1 }}>
              <div style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                Model Result
              </div>
              <div style={{ color: C.accent, fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
                {latest?.predicted_label ?? 'No chunk analyzed yet'}
              </div>
              <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>
                {latest ? statusText : 'Speak for a few seconds after starting'}
              </div>
            </GlassCard>
            <GlassCard style={{ padding: '14px', flex: 1 }}>
              <div style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                Overall Call Risk
              </div>
              <div style={{ color: 'white', fontSize: '22px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
                {callSummary.totalChunks ? `${callSummary.overallCallRisk}%` : '--'}
              </div>
              <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>
                Avg AI: {callSummary.totalChunks ? `${callSummary.averageAiConfidence}%` : '--'}
              </div>
            </GlassCard>
          </div>
        </div>

        <GlassCard style={{ padding: '12px 14px', marginBottom: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: C.textSec, fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
            <div>AI Chunks: {callSummary.aiChunks}/{callSummary.totalChunks}</div>
            <div>Avg AI Confidence: {callSummary.totalChunks ? `${callSummary.averageAiConfidence}%` : '--'}</div>
            <div>Overall Risk: {callSummary.totalChunks ? `${callSummary.overallCallRisk}%` : '--'}</div>
            <div style={{ color: callSummary.warning ? C.danger : C.success }}>
              Verdict: {callSummary.totalChunks ? callSummary.finalCallVerdict : 'waiting'}
            </div>
          </div>
        </GlassCard>

        {error && (
          <GlassCard style={{ padding: '12px 14px', marginBottom: '14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: C.danger, fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
            {error}
          </GlassCard>
        )}

        {callSummary.warning && (
          <GlassCard style={{ padding: '14px 16px', marginBottom: '14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ color: C.danger, fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', flex: 1 }}>
              Warning: overall call risk indicates possible AI-generated voice
            </div>
            <button onClick={() => navigate('alert')} style={{ padding: '6px 12px', borderRadius: '10px', background: C.danger, border: 'none', color: 'white', fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
              View
            </button>
          </GlassCard>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '132px', overflowY: 'auto' }}>
          {timeline.slice(0, 8).map((item, index) => (
            <GlassCard key={index} style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', color: C.textSec, fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
              <span>Chunk {timeline.length - index}</span>
              <span style={{ color: item.ai_probability >= LIVE_AI_CHUNK_THRESHOLD ? C.danger : C.success }}>{Math.round(item.ai_probability * 100)}% AI</span>
            </GlassCard>
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 24px 30px', zIndex: 20, background: 'linear-gradient(180deg, rgba(7,14,26,0), rgba(7,14,26,0.98) 28%)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => void stopAndFinishMonitoring()} disabled={!active && timeline.length === 0} style={{ width: '100%', padding: '14px', marginBottom: '10px', background: 'linear-gradient(135deg, #DC2626, #EF4444)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '15px', fontWeight: 700, fontFamily: 'Inter, sans-serif', cursor: (!active && timeline.length === 0) ? 'not-allowed' : 'pointer', opacity: (!active && timeline.length === 0) ? 0.55 : 1, boxShadow: '0 8px 28px rgba(239,68,68,0.35)' }}>
          Stop Monitoring
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button onClick={active ? () => setPaused(value => !value) : startMonitoring} style={{ padding: '14px', background: active ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg, #2563EB, #06B6D4)', border: active ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
            {active ? (paused ? 'Resume' : 'Pause') : 'Start Mic'}
          </button>
          <button onClick={() => navigate('live-analysis')} style={{ padding: '14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
            View Analysis
          </button>
        </div>
      </div>
    </div>
  )
}
