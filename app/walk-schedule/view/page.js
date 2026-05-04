'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function WalkScheduleViewPage() {
  const router = useRouter()
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)

  const DAYS = ['월', '화', '수', '목', '금', '토', '일']

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: dogList } = await supabase
        .from('dogs').select('*').eq('owner_id', user.id)

      if (dogList && dogList.length > 0) {
        const dogsWithPatterns = await Promise.all(
          dogList.map(async (dog) => {
            const { data: patterns } = await supabase
              .from('walk_patterns')
              .select('*, courses(name)')
              .eq('dog_id', dog.id)
            return { ...dog, patterns: patterns || [] }
          })
        )
        setDogs(dogsWithPatterns)
      }
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '32px' }}>🐾</div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#3CC47C', padding: '10px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div onClick={() => router.back()} style={{ fontSize: '22px', color: '#fff', cursor: 'pointer' }}>‹</div>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>저장된 산책 일정</div>
        <div onClick={() => router.push('/walk-schedule')}
          style={{ fontSize: '12px', fontWeight: '600', color: '#fff', opacity: .8, cursor: 'pointer' }}>
          수정
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>

        {dogs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#bbb' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🐾</div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>등록된 강아지가 없어요</div>
          </div>
        )}

        {dogs.map(dog => (
          <div key={dog.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '16px', overflow: 'hidden' }}>

            {/* 강아지 헤더 */}
            <div style={{ background: '#F0FBF5', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #B8EDD4' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#3CC47C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                🐶
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{dog.name}</div>
                <div style={{ fontSize: '11px', color: '#1A7A4E' }}>
                  {dog.gender === 'female' ? '암컷' : '수컷'}{dog.age ? ` · ${dog.age}살` : ''}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: '600', color: dog.patterns.length > 0 ? '#1A7A4E' : '#bbb' }}>
                패턴 {dog.patterns.length}개
              </div>
            </div>

            {/* 패턴 목록 */}
            {dog.patterns.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#bbb', fontSize: '13px' }}>
                설정된 산책 패턴이 없어요
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {dog.patterns.map((p, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderBottom: i < dog.patterns.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                    {/* 요일 */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                      {DAYS.map(d => (
                        <div key={d}
                          style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: p.days?.includes(d) ? '700' : '400', background: p.days?.includes(d) ? '#3CC47C' : '#f5f5f5', color: p.days?.includes(d) ? '#fff' : '#ccc' }}>
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* 시간 + 코스 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#E8FAF2', padding: '5px 10px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '12px' }}>⏰</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1A7A4E' }}>
                          {p.start_time} – {p.end_time || '미설정'}
                        </span>
                      </div>
                      {p.courses?.name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f5f5f5', padding: '5px 10px', borderRadius: '8px' }}>
                          <span style={{ fontSize: '11px' }}>📍</span>
                          <span style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>{p.courses.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* 수정 버튼 */}
        <button onClick={() => router.push('/walk-schedule')}
          style={{ background: '#3CC47C', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '4px' }}>
          산책 패턴 수정하기
        </button>
      </div>
    </div>
  )
}