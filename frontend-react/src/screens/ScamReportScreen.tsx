import { useState } from 'react'
import { C, GlassCard, BackButton, StatusBar, type NavFn } from '../shared'

const categories = ['UPI/Banking Fraud', 'KYC Update Scam', 'Aadhaar/PAN Misuse', 'Courier/Police Impersonation', 'Job/Loan Scam', 'Robocall', 'Other']

export default function ScamReportScreen({ navigate }: { navigate: NavFn }) {
  const [number, setNumber] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div style={{
        height: '844px', background: C.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px',
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(34,197,94,0.2)', border: '2px solid rgba(34,197,94,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px', fontSize: '36px',
        }}>
          ✅
        </div>
        <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 700, fontFamily: 'Poppins, Inter, sans-serif', margin: '0 0 12px', textAlign: 'center' }}>
          Report Submitted!
        </h2>
        <p style={{ color: C.textSec, fontSize: '14px', fontFamily: 'Inter, sans-serif', textAlign: 'center', lineHeight: 1.6, margin: '0 0 32px' }}>
          Thank you for helping protect others. Your report has been saved for the CallShield threat database. For real complaints in India, use 1930 or cybercrime.gov.in.
        </p>
        <div style={{
          padding: '12px 20px', borderRadius: '14px',
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
          marginBottom: '24px', textAlign: 'center',
        }}>
          <div style={{ color: C.success, fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Report ID: CS-IN-2026-07-24-4812</div>
        </div>
        <button onClick={() => navigate('profile')} style={{
          padding: '14px 32px', background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
          border: 'none', borderRadius: '14px', color: 'white', fontSize: '15px', fontWeight: 600,
          fontFamily: 'Inter, sans-serif', cursor: 'pointer',
        }}>
          Back to Profile
        </button>
      </div>
    )
  }

  const inputStyle = {
    width: '100%', padding: '13px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '13px', color: 'white', fontSize: '14px',
    fontFamily: 'Inter, sans-serif', outline: 'none',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ minHeight: '844px', background: C.bg, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <StatusBar />

      <div style={{ padding: '8px 20px 32px', overflowY: 'auto', flex: 1, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <BackButton navigate={navigate} to="profile" />
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, fontFamily: 'Poppins, Inter, sans-serif', margin: 0 }}>
              Report a Scam
            </h2>
            <p style={{ color: C.textMuted, fontSize: '12px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Help protect others
            </p>
          </div>
        </div>

        {/* Info */}
        <GlassCard style={{
          padding: '14px 16px', marginBottom: '20px',
          background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)',
          display: 'flex', gap: '10px', alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>🛡️</span>
          <p style={{ color: 'rgba(148,163,184,0.9)', fontSize: '12px', margin: 0, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
            Indian reporting guidance: preserve call screenshots/recordings, do not share OTP/PIN, call 1930 for financial cyber fraud, and file a complaint at the National Cyber Crime Portal under cybercrime.gov.in.
          </p>
        </GlassCard>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 500, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Scam Phone Number *
            </label>
            <input
              style={inputStyle}
              type="tel" placeholder="+91 98765 43210"
              value={number} onChange={e => setNumber(e.target.value)}
            />
          </div>

          <div>
            <label style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 500, display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Scam Category *
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '7px 14px', borderRadius: '20px',
                    background: category === cat ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${category === cat ? 'rgba(37,99,235,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: category === cat ? '#93C5FD' : C.textMuted,
                    fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 500, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Description
            </label>
            <textarea
              style={{ ...inputStyle, height: '100px', resize: 'none' }}
              placeholder="Describe what happened: UPI request, OTP/PIN demand, KYC threat, impersonation, amount lost, or caller details..."
              value={description} onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* AI data toggle */}
          <GlassCard style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: 500, fontFamily: 'Inter, sans-serif', marginBottom: '3px' }}>
                Include AI Analysis Data
              </div>
              <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                Attach voice patterns and detection scores (recommended)
              </div>
            </div>
            <div style={{
              width: '46px', height: '26px', borderRadius: '13px',
              background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
              position: 'relative', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
            }}>
              <div style={{
                position: 'absolute', top: '3px', right: '3px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </div>
          </GlassCard>

          <button
            onClick={() => number && category && setSubmitted(true)}
            disabled={!number || !category}
            style={{
              width: '100%', padding: '16px',
              background: (number && category)
                ? 'linear-gradient(135deg, #2563EB, #06B6D4)'
                : 'rgba(255,255,255,0.08)',
              border: 'none', borderRadius: '16px',
              color: (number && category) ? 'white' : C.textMuted,
              fontSize: '16px', fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              cursor: (number && category) ? 'pointer' : 'not-allowed',
              boxShadow: (number && category) ? '0 8px 32px rgba(37,99,235,0.4)' : 'none',
              transition: 'all 0.3s',
            }}
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  )
}
