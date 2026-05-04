'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [dog, setDog] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users').select('*').eq('id', user.id).single()
      setUser(profile)

      if (profile?.user_type === 'owner') {
        const { data: dogData } = await supabase
          .from('dogs').select('*').eq('owner_id', user.id).single()
        setDog(dogData)
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const rowStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '13px 0', borderBottom: '1px solid #f5f5f5', cursor: 'pointer'
  }
  const rowLabelStyle = { display: 'flex', alignItems: 'center', gap: '10px' }
  const sectionLabelStyle = {
    fontSize: '10px', fontWeight: '600', color: '#bbb',
    textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px'
  }
  const cardStyle = {
    background: '#fff', border: '1px solid #eee',
    borderRadius: '13px', padding: '0 14px', marginBottom: '12px'
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '32px' }}>🐾</div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* 상단바 */}
      <div style={{ background: '#3CC47C', padding: '16px 20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>⚙️ 설정</div>
      </div>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>

        {/* 계정 */}
        <div style={sectionLabelStyle}>계정</div>
        <div style={cardStyle}>
          <div style={{ ...rowStyle, borderBottom: '1px solid #f5f5f5' }}>
            <div style={rowLabelStyle}>
              <span style={{ fontSize: '18px' }}>👤</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>닉네임</div>
                <div style={{ fontSize: '11px', color: '#bbb', marginTop: '1px' }}>{user?.nickname}</div>
              </div>
            </div>
            <span style={{ color: '#ddd', fontSize: '16px' }}>›</span>
          </div>
          <div style={{ ...rowStyle, borderBottom: '1px solid #f5f5f5' }}>
            <div style={rowLabelStyle}>
              <span style={{ fontSize: '18px' }}>📧</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>이메일</div>
                <div style={{ fontSize: '11px', color: '#bbb', marginTop: '1px' }}>{user?.email}</div>
              </div>
            </div>
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none' }}
            onClick={() => router.push('/select-course')}>
            <div style={rowLabelStyle}>
              <span style={{ fontSize: '18px' }}>📍</span>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>산책 코스 변경</span>
            </div>
            <span style={{ color: '#ddd', fontSize: '16px' }}>›</span>
          </div>
        </div>

        {/* 내 강아지 — 견주만 */}
        {user?.user_type === 'owner' && (
          <>
            <div style={{ ...sectionLabelStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>내 강아지</span>
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#3CC47C', background: '#E8FAF2', padding: '2px 8px', borderRadius: '10px' }}>견주 전용</span>
            </div>
            <div style={cardStyle}>
              {dog ? (
                <div style={{ ...rowStyle, borderBottom: '1px solid #f5f5f5' }}
                  onClick={() => router.push(`/dog/${dog.id}`)}>
                  <div style={rowLabelStyle}>
                    <span style={{ fontSize: '18px' }}>🐶</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>강아지 프로필</div>
                      <div style={{ fontSize: '11px', color: '#bbb', marginTop: '1px' }}>{dog.name} · {dog.gender === 'female' ? '암컷' : '수컷'}</div>
                    </div>
                  </div>
                  <span style={{ color: '#ddd', fontSize: '16px' }}>›</span>
                </div>
              ) : null}
              <div style={{ ...rowStyle, borderBottom: '1px solid #f5f5f5' }}
                onClick={() => router.push('/walk-schedule')}>
                <div style={rowLabelStyle}>
                  <span style={{ fontSize: '18px' }}>⏰</span>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>산책 시간 설정</span>
                </div>
                <span style={{ color: '#ddd', fontSize: '16px' }}>›</span>
              </div>
              <div style={{ ...rowStyle, borderBottom: 'none' }}
                onClick={() => router.push('/register-dog')}>
                <div style={rowLabelStyle}>
                  <span style={{ fontSize: '18px' }}>➕</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#3CC47C' }}>강아지 추가 등록</span>
                </div>
                <span style={{ color: '#ddd', fontSize: '16px' }}>›</span>
              </div>
            </div>
          </>
        )}

        {/* 알림 */}
        <div style={sectionLabelStyle}>알림</div>
        <div style={cardStyle}>
          {[
            { icon: '💬', label: '채팅 알림' },
            { icon: '🏅', label: '칭찬 알림' },
            { icon: '🐾', label: '근처 강아지 알림', defaultOff: true },
          ].map((item, i, arr) => (
            <NotificationRow key={item.label} icon={item.icon} label={item.label} defaultOn={!item.defaultOff} isLast={i === arr.length - 1} />
          ))}
        </div>

        {/* 기타 */}
        <div style={sectionLabelStyle}>기타</div>
        <div style={cardStyle}>
          <div style={{ ...rowStyle, borderBottom: '1px solid #f5f5f5' }}>
            <div style={rowLabelStyle}>
              <span style={{ fontSize: '18px' }}>📄</span>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>이용약관</span>
            </div>
            <span style={{ color: '#ddd', fontSize: '16px' }}>›</span>
          </div>
          <div style={{ ...rowStyle, borderBottom: '1px solid #f5f5f5' }}>
            <div style={rowLabelStyle}>
              <span style={{ fontSize: '18px' }}>🔐</span>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>개인정보처리방침</span>
            </div>
            <span style={{ color: '#ddd', fontSize: '16px' }}>›</span>
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none' }} onClick={handleLogout}>
            <div style={rowLabelStyle}>
              <span style={{ fontSize: '18px' }}>🚪</span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#E53935' }}>로그아웃</span>
            </div>
          </div>
        </div>

        <div style={{ height: '20px' }} />
      </div>

<div style={{ display: 'flex', borderTop: '1px solid #eee', padding: '8px 0 12px', background: '#fff', flexShrink: 0 }}>
  {[
    { icon: '🏠', label: '홈', path: '/' },
    { icon: '🗺️', label: '지도', path: '/walk' },
    { icon: '⚙️', label: '설정', path: '/settings' },
  ].map(tab => (
    <div key={tab.path} onClick={() => router.push(tab.path)}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
      <div style={{ fontSize: '20px' }}>{tab.icon}</div>
      <div style={{ fontSize: '9px', fontWeight: '500', color: tab.path === '/settings' ? '#3CC47C' : '#ccc' }}>{tab.label}</div>
    </div>
  ))}
</div>
    </div>
  )
}

function NotificationRow({ icon, label, defaultOn, isLast }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: isLast ? 'none' : '1px solid #f5f5f5' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>{label}</span>
      </div>
      <div onClick={() => setOn(!on)}
        style={{ width: '42px', height: '24px', borderRadius: '12px', background: on ? '#3CC47C' : '#ddd', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'all .2s', left: on ? 'auto' : '3px', right: on ? '3px' : 'auto' }} />
      </div>
    </div>
  )
}