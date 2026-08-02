import { useEffect, useState } from 'react'
import { type NavFn, C, GlassCard, ShieldLogo, StatusBar } from '../shared'
import { googleSignIn, loginUser, readAuthError, signupUser, type AuthResponse } from '../services/callshieldApi'

export default function LoginScreen({ navigate }: { navigate: NavFn }) {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
  const googleConfigured = Boolean(
    googleClientId && !googleClientId.includes('your-google-oauth-client-id'),
  )

  useEffect(() => {
    if (!googleConfigured || typeof window === 'undefined') return
    if ((window as any).google) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [googleConfigured])

  async function handleSubmit() {
    setError('')
    setLoading(true)

    try {
      const response = tab === 'login'
        ? await loginUser(email, password)
        : await signupUser(name, email, password)

      if (!response.ok) {
        localStorage.removeItem('callshield_auth_token')
        setError(await readAuthError(response))
        return
      }

      const data = await response.json() as AuthResponse
      localStorage.setItem('callshield_auth_token', data.token)
      localStorage.setItem('callshield_user', JSON.stringify(data.user))
      navigate('home')
    } catch (err) {
      localStorage.removeItem('callshield_auth_token')
      setError(err instanceof Error ? err.message : 'Could not connect to CallShield API')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    if (!googleConfigured) {
      const demoUser = {
        user_id: Date.now(),
        full_name: name.trim() || 'Google User',
        email: email.trim() || 'google.user@callshield.local',
      }
      localStorage.setItem('callshield_auth_token', `demo-google-${Date.now()}`)
      localStorage.setItem('callshield_user', JSON.stringify(demoUser))
      navigate('home')
      return
    }
    setLoading(true)

    try {
      const clientId = googleClientId
      const googleAccounts = (window as any).google?.accounts
      if (!googleAccounts?.id) {
        throw new Error('Google Sign-In is not loaded yet')
      }

      const credential = await new Promise<string>((resolve, reject) => {
        let settled = false

        const finish = (value: string | Error, isError = false) => {
          if (settled) return
          settled = true
          if (isError) reject(value)
          else resolve(value as string)
        }

        googleAccounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential?: string; error?: string }) => {
            if (response.credential) {
              finish(response.credential)
            } else {
              finish(new Error(response.error || 'Google login failed'), true)
            }
          },
        })

        googleAccounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
            finish(new Error(notification.error || 'Google sign-in was dismissed'), true)
          }
        })
      })

      const response = await googleSignIn(credential, clientId)
      if (!response.ok) {
        localStorage.removeItem('callshield_auth_token')
        localStorage.removeItem('callshield_user')
        setError(await readAuthError(response))
        return
      }

      const data = await response.json() as AuthResponse
      localStorage.setItem('callshield_auth_token', data.token)
      localStorage.setItem('callshield_user', JSON.stringify(data.user))
      navigate('home')
    } catch (err) {
      localStorage.removeItem('callshield_auth_token')
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px', color: 'white', fontSize: '14px',
    fontFamily: 'Inter, sans-serif', outline: 'none',
    boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    color: C.textMuted, fontSize: '12px', fontWeight: 500,
    fontFamily: 'Inter, sans-serif', marginBottom: '6px', display: 'block',
    textTransform: 'uppercase' as const, letterSpacing: '0.8px',
  }

  return (
    <div style={{
      minHeight: '844px',
      background: C.bg,
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 20%, rgba(37,99,235,0.12) 0%, transparent 55%)',
      }} />

      <StatusBar />

      {/* Header */}
      <div style={{
        padding: '16px 24px 24px', textAlign: 'center',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <ShieldLogo size={64} />
        </div>
        <h1 style={{
          fontFamily: 'Poppins, Inter, sans-serif',
          fontSize: '26px', fontWeight: 700, color: 'white', margin: '0 0 6px',
        }}>
          {tab === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p style={{ color: C.textMuted, fontSize: '14px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
          {tab === 'login' ? 'Secure your calls with AI protection' : 'Start protecting your calls today'}
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ padding: '0 24px 24px', position: 'relative', zIndex: 2 }}>
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.05)',
          borderRadius: '14px', padding: '4px', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {(['login', 'signup'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '11px',
                borderRadius: '11px', border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600,
                background: tab === t ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : 'none',
                color: tab === t ? 'white' : C.textMuted,
                boxShadow: tab === t ? '0 4px 16px rgba(37,99,235,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {t === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '0 24px', position: 'relative', zIndex: 2, flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tab === 'signup' && (
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                style={inputStyle} type="text" placeholder="Alex Johnson"
                value={name} onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              style={inputStyle} type="email" placeholder="your@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inputStyle, paddingRight: '48px' }}
                type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
              />
              <button style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          {tab === 'login' && (
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: C.accent, fontSize: '13px', fontFamily: 'Inter, sans-serif', cursor: 'pointer', fontWeight: 500 }}>
                Forgot password?
              </span>
            </div>
          )}

          {error && (
            <GlassCard style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: C.danger, fontSize: '12px', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
              {error}
            </GlassCard>
          )}

          <button
            onClick={() => void handleSubmit()}
            disabled={loading}
            style={{
              width: '100%', padding: '16px',
              background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
              border: 'none', borderRadius: '16px',
              color: 'white', fontSize: '16px', fontWeight: 600,
              fontFamily: 'Inter, sans-serif', cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.75 : 1,
              boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
              marginTop: '4px',
            }}
          >
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In Securely' : 'Create Account'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: C.textMuted, fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <GlassCard
            onClick={() => void handleGoogleSignIn()}
            style={{
              flex: 1, padding: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.75 : 1,
            }}
            role="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span style={{ color: 'white', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              Continue with Google
            </span>
          </GlassCard>

            <GlassCard style={{ flex: 1, padding: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M7 16c.5-2 2.5-3 5-3s4.5 1 5 3" />
                <rect x="3" y="18" width="18" height="2" rx="1" fill="#06B6D4" stroke="none" />
              </svg>
              <span style={{ color: 'white', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Face ID</span>
            </GlassCard>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <p style={{ color: C.textMuted, fontSize: '12px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
          Protected by 256-bit AES encryption •{' '}
          <span style={{ color: C.primary }}>SOC 2 Certified</span>
        </p>
      </div>
    </div>
  )
}

