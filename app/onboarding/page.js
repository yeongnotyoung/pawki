'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function OnboardingPage() {
  const [selected, setSelected] = useState('owner')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleNext = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('users')
      .update({ user_type: selected })
      .eq('id', user.id)

    if (selected === 'owner') {
      router.push('/register-dog')
    } else {
      router.push('/')
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', padding: '40px 24px',
      minHeight: '100vh', background: '#fff'
    }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: '#3CC47C',
        letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
        Step 1 of 2
      </div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', lineHeight: '1.3', marginBottom: '6px' }}>
        어떻게 Pawki를<br/>사용하실 건가요?
      </h1>
      <p style={{ fontSize: '13px', color: '#bbb', marginBottom: '32px' }}>
        나중에 설정에서 변경할 수 있어요
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        <div
          onClick={() => setSelected('owner')}
          style={{
            padding: '18px 16px', borderRadius: '16px', cursor: 'pointer',
            border: selected === 'owner' ? '2px solid #3CC47C' : '2px solid #eee',
            background: selected === 'owner' ? '#F0FBF5' : '#fafafa',
            transition: 'all .15s'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <span style={{ fontSize: '28px' }}>🐶</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>견주예요</div>
              <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>강아지와 함께 산책해요</div>
            </div>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: selected === 'owner' ? '#3CC47C' : '#fff',
              border: selected === 'owner' ? 'none' : '2px solid #eee',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: '#fff', fontWeight: '700'
            }}>{selected === 'owner' ? '✓' : ''}</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {['강아지 프로필 등록', '산책 일정 공유', '칭찬 받기'].map(t => (
              <span key={t} style={{ fontSize: '10px', fontWeight: '600', padding: '3px 8px',
                borderRadius: '20px', background: '#E8FAF2', color: '#1A7A4E' }}>{t}</span>
            ))}
          </div>
        </div>

        <div
          onClick={() => setSelected('walker')}
          style={{
            padding: '18px 16px', borderRadius: '16px', cursor: 'pointer',
            border: selected === 'walker' ? '2px solid #3CC47C' : '2px solid #eee',
            background: selected === 'walker' ? '#F0FBF5' : '#fafafa',
            transition: 'all .15s'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <span style={{ fontSize: '28px' }}>🚶</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>산책러예요</div>
              <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>강아지를 좋아하는 사람이에요</div>
            </div>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: selected === 'walker' ? '#3CC47C' : '#fff',
              border: selected === 'walker' ? 'none' : '2px solid #eee',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: '#fff', fontWeight: '700'
            }}>{selected === 'walker' ? '✓' : ''}</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {['강아지 탐색', '견주와 채팅', '칭찬 남기기'].map(t => (
              <span key={t} style={{ fontSize: '10px', fontWeight: '600', padding: '3px 8px',
                borderRadius: '20px', background: '#f5f5f5', color: '#bbb' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={loading}
        style={{
          marginTop: '32px', background: '#3CC47C', color: '#fff',
          border: 'none', borderRadius: '12px', padding: '14px',
          fontSize: '15px', fontWeight: '700', cursor: 'pointer', width: '100%'
        }}>
        {loading ? '저장 중...' : '다음으로'}
      </button>
    </div>
  )
}