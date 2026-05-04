'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [course, setCourse] = useState(null)
  const [myDogs, setMyDogs] = useState([])
  const [nearbyDogs, setNearbyDogs] = useState([])
  const [loading, setLoading] = useState(true)

  const interactLabel = {
    yes: { emoji: '🥳', text: '환영해요', color: '#1A7A4E', bg: '#E8FAF2' },
    ok:  { emoji: '😊', text: '괜찮아요', color: '#7A5A0A', bg: '#FEF6E4' },
    no:  { emoji: '😣', text: '비선호',   color: '#B71C1C', bg: '#FDECEA' },
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users')
        .select('*, courses(*)')
        .eq('id', user.id)
        .single()

      if (!profile) { router.push('/login'); return }
      if (!profile.user_type) { router.push('/onboarding'); return }
      if (!profile.default_course_id) { router.push('/select-course'); return }

      setUser(profile)
      setCourse(profile.courses)

      // 내 강아지 목록
      const { data: myDogList } = await supabase
        .from('dogs')
        .select('*')
        .eq('owner_id', user.id)
      if (myDogList) setMyDogs(myDogList)

      // 같은 코스 강아지 목록
      const { data: walkDogs } = await supabase
        .from('walk_patterns')
        .select('*, dogs(*, users(nickname))')
        .eq('course_id', profile.default_course_id)

      if (walkDogs) {
        const unique = walkDogs
          .map(w => w.dogs)
          .filter(d => d && d.owner_id !== user.id)
        setNearbyDogs(unique)
      }

      setLoading(false)
    }
    init()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '32px' }}>
      🐾
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* 상단바 */}
      <div style={{ background: '#3CC47C', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>🐾 Pawki</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.7)', marginTop: '1px' }}>좋은 하루예요!</div>
        </div>
        <div style={{ fontSize: '22px', cursor: 'pointer' }}>🔔</div>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>

        {/* 산책 시작 버튼 */}
        <div onClick={() => router.push('/walk')}
          style={{ background: '#3CC47C', color: '#fff', borderRadius: '14px', padding: '16px', textAlign: 'center', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          🐾 산책 시작하기
        </div>

        {/* 현재 코스 */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#E8FAF2', borderRadius: '20px', padding: '7px 13px', fontSize: '12px', fontWeight: '600', color: '#1A7A4E', alignSelf: 'flex-start', border: '1px solid #B8EDD4' }}>
          📍 {course?.name || '코스 미설정'}
        </div>

        {/* 내 강아지 */}
        {myDogs.length > 0 && (
          <>
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#ccc', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              내 강아지
            </div>
            {myDogs.map((dog) => (
              <div key={dog.id} onClick={() => router.push(`/dog/${dog.id}`)}
                style={{ background: '#F0FBF5', borderRadius: '13px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #B8EDD4', cursor: 'pointer' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#3CC47C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                  🐶
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>{dog.name}</div>
                  <div style={{ fontSize: '11px', color: '#1A7A4E', marginTop: '1px' }}>
                    {dog.gender === 'female' ? '암컷' : '수컷'}{dog.age ? ` · ${dog.age}살` : ''}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '5px' }}>
                    {dog.interact_human && (
                      <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '20px', background: interactLabel[dog.interact_human]?.bg, color: interactLabel[dog.interact_human]?.color }}>
                        {interactLabel[dog.interact_human]?.emoji} 사람 {interactLabel[dog.interact_human]?.text}
                      </span>
                    )}
                    {dog.interact_dog && (
                      <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '20px', background: interactLabel[dog.interact_dog]?.bg, color: interactLabel[dog.interact_dog]?.color }}>
                        {interactLabel[dog.interact_dog]?.emoji} 강아지 {interactLabel[dog.interact_dog]?.text}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ color: '#3CC47C', fontSize: '16px' }}>›</span>
              </div>
            ))}
          </>
        )}

        {/* 같은 코스 강아지 */}
        <div style={{ fontSize: '10px', fontWeight: '600', color: '#ccc', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          같은 코스 강아지 {nearbyDogs.length > 0 ? `· ${nearbyDogs.length}마리` : ''}
        </div>

        {nearbyDogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: '#bbb' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🐾</div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>아직 등록된 강아지가 없어요</div>
            <div style={{ fontSize: '12px', marginTop: '6px' }}>같은 코스 견주들이 등록되면 여기 보여요</div>
          </div>
        ) : (
          nearbyDogs.map((dog, i) => (
            <div key={i} onClick={() => router.push(`/dog/${dog.id}`)}
              style={{ background: '#fff', borderRadius: '13px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #eee', cursor: 'pointer' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#E8FAF2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                🐶
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>{dog.name}</div>
                <div style={{ fontSize: '11px', color: '#bbb', marginTop: '1px' }}>
                  {dog.gender === 'female' ? '암컷' : '수컷'}{dog.age ? ` · ${dog.age}살` : ''}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '5px' }}>
                  {dog.interact_human && (
                    <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '20px', background: interactLabel[dog.interact_human]?.bg, color: interactLabel[dog.interact_human]?.color }}>
                      {interactLabel[dog.interact_human]?.emoji} 사람 {interactLabel[dog.interact_human]?.text}
                    </span>
                  )}
                  {dog.interact_dog && (
                    <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '20px', background: interactLabel[dog.interact_dog]?.bg, color: interactLabel[dog.interact_dog]?.color }}>
                      {interactLabel[dog.interact_dog]?.emoji} 강아지 {interactLabel[dog.interact_dog]?.text}
                    </span>
                  )}
                </div>
              </div>
              <span style={{ color: '#ddd', fontSize: '16px' }}>›</span>
            </div>
          ))
        )}
      </div>

      {/* 하단 탭바 */}
      <div style={{ display: 'flex', borderTop: '1px solid #eee', padding: '8px 0 12px', background: '#fff', flexShrink: 0 }}>
        {[
          { icon: '🏠', label: '홈', path: '/' },
          { icon: '🗺️', label: '지도', path: '/walk' },
          { icon: '⚙️', label: '설정', path: '/settings' },
        ].map(tab => (
          <div key={tab.path} onClick={() => router.push(tab.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
            <div style={{ fontSize: '20px' }}>{tab.icon}</div>
            <div style={{ fontSize: '9px', fontWeight: '500', color: tab.path === '/' ? '#3CC47C' : '#ccc' }}>{tab.label}</div>
          </div>
        ))}
      </div>

    </div>
  )
}