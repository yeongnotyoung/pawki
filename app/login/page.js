'use client'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: '16px',
      background: '#fff'
    }}>
      <div style={{ fontSize: '52px' }}>🐾</div>
      <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em' }}>Pawki</h1>
      <p style={{ color: '#bbb', marginBottom: '24px', fontSize: '13px' }}>함께 걷는 산책 커뮤니티</p>
      <button
        onClick={handleGoogleLogin}
        style={{
          background: '#f5f5f5', border: 'none', borderRadius: '12px',
          padding: '14px 28px', fontSize: '14px', fontWeight: '600',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          color: '#1a1a1a'
        }}
      >
        🔍 구글로 시작하기
      </button>
    </div>
  )
}