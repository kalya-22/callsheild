import { useState } from 'react'
import React from 'react'
import { type Screen } from './shared'
import type { HistoryItem } from './services/callshieldApi'
import SplashScreen from './screens/SplashScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import LoginScreen from './screens/LoginScreen'
import PermissionScreen from './screens/PermissionScreen'
import HomeScreen from './screens/HomeScreen'
import LiveCallScreen from './screens/LiveCallScreen'
import LiveAnalysisScreen from './screens/LiveAnalysisScreen'
import AlertScreen from './screens/AlertScreen'
import CallReportScreen from './screens/CallReportScreen'
import HistoryScreen from './screens/HistoryScreen'
import AnalyticsScreen from './screens/AnalyticsScreen'
import EmergencyScreen from './screens/EmergencyScreen'
import ScamReportScreen from './screens/ScamReportScreen'
import SettingsScreen from './screens/SettingsScreen'
import ProfileScreen from './screens/ProfileScreen'
import BlockedContactsScreen from './screens/BlockedContactsScreen'
import SafeResultScreen from './screens/SafeResultScreen'

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null)
  const navigate = (s: Screen) => setScreen(s)
  const openHistoryItem = (item: HistoryItem) => {
    setSelectedHistoryItem(item)
    setScreen('call-report')
  }

  const screens: Record<Screen, React.ReactNode> = {
    splash: <SplashScreen navigate={navigate} />,
    onboarding: <OnboardingScreen navigate={navigate} />,
    login: <LoginScreen navigate={navigate} />,
    permission: <PermissionScreen navigate={navigate} />,
    home: <HomeScreen navigate={navigate} />,
    'live-call': <LiveCallScreen navigate={navigate} />,
    'live-analysis': <LiveAnalysisScreen navigate={navigate} />,
    alert: <AlertScreen navigate={navigate} />,
    'call-report': <CallReportScreen navigate={navigate} historyItem={selectedHistoryItem} />,
    history: <HistoryScreen navigate={navigate} onOpenCallReport={openHistoryItem} />,
    analytics: <AnalyticsScreen navigate={navigate} />,
    emergency: <EmergencyScreen navigate={navigate} />,
    'scam-report': <ScamReportScreen navigate={navigate} />,
    settings: <SettingsScreen navigate={navigate} />,
    profile: <ProfileScreen navigate={navigate} />,
    'blocked-contacts': <BlockedContactsScreen navigate={navigate} />,
    'safe-result': <SafeResultScreen navigate={navigate} />,
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg, #020610 0%, #050D1A 40%, #030810 100%)',
      padding: '24px 16px',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Phone bezel glow */}
      <div style={{
        position: 'relative',
        flexShrink: 0,
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          inset: '-40px',
          background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        {/* Phone outer frame */}
        <div style={{
          position: 'relative',
          width: '390px',
          height: '844px',
          borderRadius: '52px',
          background: 'linear-gradient(145deg, #1A1A2E, #0D0D1A)',
          padding: '4px',
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.12),
            0 50px 120px rgba(0,0,0,0.8),
            0 0 80px rgba(37,99,235,0.08),
            inset 0 0 0 1px rgba(255,255,255,0.05)
          `,
        }}>
          {/* Volume buttons (decorative) */}
          <div style={{
            position: 'absolute',
            left: '-3px',
            top: '140px',
            width: '3px',
            height: '32px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px 0 0 2px',
          }} />
          <div style={{
            position: 'absolute',
            left: '-3px',
            top: '188px',
            width: '3px',
            height: '56px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px 0 0 2px',
          }} />
          <div style={{
            position: 'absolute',
            left: '-3px',
            top: '256px',
            width: '3px',
            height: '56px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px 0 0 2px',
          }} />
          {/* Power button */}
          <div style={{
            position: 'absolute',
            right: '-3px',
            top: '188px',
            width: '3px',
            height: '70px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '0 2px 2px 0',
          }} />

          {/* Screen */}
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '48px',
            overflow: 'hidden',
            background: '#0F172A',
            position: 'relative',
          }}>
            {/* Dynamic island */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '34px',
              background: '#000',
              borderRadius: '20px',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}>
              {/* Camera */}
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#111', border: '2px solid #1a1a1a' }} />
              {/* Face ID dot */}
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1a1a1a' }} />
            </div>

            {/* Screen content */}
            <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
              {screens[screen]}
            </div>
          </div>
        </div>

        {/* Reflection */}
        <div style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          right: '4px',
          height: '50%',
          borderRadius: '48px 48px 0 0',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 300,
        }} />
      </div>

      {/* Screen navigation helper - shown on desktop */}
      <div style={{
        position: 'fixed',
        right: '24px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 1000,
      }}>
        {([
          ['splash', 'Splash'],
          ['onboarding', 'Onboarding'],
          ['login', 'Login'],
          ['permission', 'Permissions'],
          ['home', 'Home'],
          ['live-call', 'Live Call'],
          ['live-analysis', 'Analysis'],
          ['alert', 'Alert'],
          ['call-report', 'Report'],
          ['history', 'History'],
          ['analytics', 'Analytics'],
          ['emergency', 'Emergency'],
          ['scam-report', 'Scam Report'],
          ['settings', 'Settings'],
            ['profile', 'Profile'],
            ['blocked-contacts', 'Blocked'],
            ['safe-result', 'Safe'],
          ] as [Screen, string][]).map(([s, label]) => (
          <button
            key={s}
            onClick={() => navigate(s)}
            style={{
              padding: '5px 12px',
              background: screen === s
                ? 'rgba(37,99,235,0.9)'
                : 'rgba(15,23,42,0.85)',
              border: screen === s
                ? '1px solid rgba(37,99,235,0.6)'
                : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: screen === s ? 'white' : 'rgba(255,255,255,0.4)',
              fontSize: '11px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: screen === s ? 600 : 400,
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              textAlign: 'left',
              boxShadow: screen === s ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
