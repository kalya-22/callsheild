import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { C, GlassCard, BottomNav, StatusBar, type NavFn } from '../shared'

const weekData = [
  { day: 'Mon', calls: 18, scams: 2 },
  { day: 'Tue', calls: 24, scams: 3 },
  { day: 'Wed', calls: 14, scams: 1 },
  { day: 'Thu', calls: 31, scams: 5 },
  { day: 'Fri', calls: 27, scams: 4 },
  { day: 'Sat', calls: 9, scams: 1 },
  { day: 'Sun', calls: 6, scams: 0 },
]

const monthData = [
  { day: 'W1', calls: 82, scams: 8 },
  { day: 'W2', calls: 95, scams: 12 },
  { day: 'W3', calls: 71, scams: 7 },
  { day: 'W4', calls: 113, scams: 20 },
]

const pieData = [
  { name: 'Safe', value: 1184, color: C.success },
  { name: 'Suspicious', value: 53, color: C.warning },
  { name: 'Scam', value: 47, color: C.danger },
]

const trendData = [
  { month: 'Feb', accuracy: 94 },
  { month: 'Mar', accuracy: 95.5 },
  { month: 'Apr', accuracy: 96.1 },
  { month: 'May', accuracy: 96.8 },
  { month: 'Jun', accuracy: 97.0 },
  { month: 'Jul', accuracy: 97.2 },
]

const scamCategories = [
  { name: 'Financial/Banking', count: 18, pct: 38 },
  { name: 'IRS/Government', count: 12, pct: 26 },
  { name: 'Tech Support', count: 9, pct: 19 },
  { name: 'Medicare/Health', count: 5, pct: 11 },
  { name: 'Lottery/Prize', count: 3, pct: 6 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px', padding: '10px 14px',
    }}>
      <p style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', margin: '0 0 4px' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color || 'white', fontSize: '12px', fontFamily: 'Inter, sans-serif', margin: '2px 0', fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsScreen({ navigate }: { navigate: NavFn }) {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const data = period === 'week' ? weekData : monthData

  return (
    <div style={{ height: '844px', background: C.bg, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 15%, rgba(6,182,212,0.07) 0%, transparent 50%)' }} />
      <StatusBar />

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px', paddingBottom: '80px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 700, fontFamily: 'Poppins, Inter, sans-serif', margin: 0 }}>
            Analytics
          </h2>
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px', padding: '3px', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {(['week', 'month'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '6px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600,
                background: period === p ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : 'none',
                color: period === p ? 'white' : C.textMuted,
                transition: 'all 0.2s',
              }}>
                {p === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Protected', value: '1,284', color: C.primary },
            { label: 'Blocked', value: '47', color: C.danger },
            { label: 'Accuracy', value: '97.2%', color: C.success },
          ].map(s => (
            <GlassCard key={s.label} style={{ padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ color: s.color, fontSize: '18px', fontWeight: 700, fontFamily: 'Inter, sans-serif', marginBottom: '4px' }}>
                {s.value}
              </div>
              <div style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'Inter, sans-serif' }}>
                {s.label}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Bar chart */}
        <GlassCard style={{ padding: '16px', marginBottom: '14px' }}>
          <div style={{ color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginBottom: '14px' }}>
            Call Volume
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data} barGap={4}>
              <XAxis
                dataKey={period === 'week' ? 'day' : 'day'}
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
                axisLine={false} tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="calls" name="Total" radius={[4, 4, 0, 0]} fill={C.primary} fillOpacity={0.7} />
              <Bar dataKey="scams" name="Scams" radius={[4, 4, 0, 0]} fill={C.danger} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
            {[{ color: C.primary, label: 'Total Calls' }, { color: C.danger, label: 'Scams' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: l.color }} />
                <span style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Pie + trend */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <GlassCard style={{ padding: '16px' }}>
            <div style={{ color: 'white', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginBottom: '10px' }}>
              Call Distribution
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PieChart width={110} height={110}>
                <Pie data={pieData} dataKey="value" cx={55} cy={55} innerRadius={30} outerRadius={50} strokeWidth={0}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.9} />)}
                </Pie>
              </PieChart>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {pieData.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: C.textSec, fontSize: '10px', fontFamily: 'Inter, sans-serif' }}>{p.name}</span>
                  <span style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'Inter, sans-serif' }}>{p.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '16px' }}>
            <div style={{ color: 'white', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginBottom: '10px' }}>
              AI Accuracy Trend
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={trendData}>
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis domain={[92, 100]} hide />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke={C.accent} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <span style={{ color: C.success, fontSize: '14px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>↑ 3.2%</span>
              <span style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'Inter, sans-serif', marginLeft: '4px' }}>vs last month</span>
            </div>
          </GlassCard>
        </div>

        {/* Top scam categories */}
        <GlassCard style={{ padding: '16px', marginBottom: '14px' }}>
          <div style={{ color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', marginBottom: '14px' }}>
            Top Scam Categories
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {scamCategories.map((cat, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: C.textSec, fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>{cat.name}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>{cat.count} calls</span>
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{cat.pct}%</span>
                  </div>
                </div>
                <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${cat.pct}%`, height: '100%',
                    background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
                    borderRadius: '3px',
                    boxShadow: `0 0 6px ${C.primary}66`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* AI Confidence */}
        <GlassCard style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Avg AI Confidence
            </div>
            <div style={{ color: 'white', fontSize: '28px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
              94.8%
            </div>
            <div style={{ color: C.success, fontSize: '12px', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
              ↑ Excellent accuracy
            </div>
          </div>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px',
          }}>
            🎯
          </div>
        </GlassCard>
      </div>

      <BottomNav active="analytics" navigate={navigate} />
    </div>
  )
}
