'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DogDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [dog, setDog] = useState(null)
  const [praises, setPraises] = useState([])
  const [myPraise, setMyPraise] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedBadges, setSelectedBadges] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [praiseLoading, setPraiseLoading] = useState(false)

  const badgeOptions = [
    { key: '귀여움 칭찬', emoji: '💛' },
    { key: '산책 매너 칭찬', emoji: '🎀' },
    { key: '멋진 옷차림', emoji: '👗' },
    { key: '친화력 칭찬', emoji: '🤝' },
  ]

  const interactLabel = {
    yes: { emoji: '🥳', text: '환영해요', color: '#1A7A4E', bg: '#E8FAF2' },
    ok: { emoji: '😊', text: '괜찮아요', color: '#7A5A0A', bg: '#FEF6E4' },
    no: { emoji: '😣', text: '비선호', color: '#B71C1C', bg: '#FDECEA' },
  }

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUser(user)

      const { data: dogData } = await supabase
        .from('dogs')
        .select('*, users(nickname)')
        .eq('id', id)
        .single()
      setDog(dogData)

      const { data: praiseData } = await supabase
        .from('praises')
        .select('*')
        .eq('to_dog_id', id)
      if (praiseData) setPraises(praiseData)

      const mine = praiseData?.find(p => p.from_user_id === user.id)
      if (mine) setMyPraise(mine)

      setLoading(false)
    }
    fetch()
  }, [id])

  const handlePraise = async () => {
    if (!selectedBadges.length) return alert('칭찬을 선택해주세요')
    setPraiseLoading(true)

    const { error } = await supabase.from('praises').insert({
      from_user_id: currentUser.id,
      to_dog_id: id,
      badges: selectedBadges,
    })

    if (error) {
      alert('오류: ' + error.message)
      setPraiseLoading(false)
      return
    }

    setMyPraise({ badges: selectedBadges })
    setShowModal(false)
    setSelectedBadges([])
    setPraiseLoading(false)

    // 칭찬 목록 새로고침
    const { data } = await supabase.from('praises').select('*').eq('to_dog_id', id)
    if (data) setPraises(data)
  }

  // 칭찬 뱃지별 개수 집계
  const badgeCounts = {}
  praises.forEach(p => {
    p.badges?.forEach(b => {
      badgeCounts[b] = (badgeCounts[b] || 0) + 1
    })
  })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '32px' }}>🐾</div>
  )
  if (!dog) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#bbb' }}>강아지를 찾을 수 없어요</div>
  )

  return (
    <div style={{background: '#fff', minHeight: '100vh', position: 'relative' }}>

      {/* 상단바 */}
      <div style={{ background: '#3CC47C', padding: '10px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => router.back()} style={{ fontSize: '22px', color: '#fff', cursor: 'pointer' }}>‹</div>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>강아지 프로필</div>
        <div style={{ width: '22px' }} />
      </div>

      {/* 히어로 */}
      <div style={{ background: '#3CC47C', padding: '20px 18px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '38px', border: '3px solid rgba(255,255,255,.4)' }}>
          🐶
        </div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>{dog.name}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.75)' }}>
          {dog.gender === 'female' ? '암컷' : '수컷'}{dog.age ? ` · ${dog.age}살` : ''}{dog.neutered ? ' · 중성화' : ''}
        </div>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* 견주 정보 */}
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '13px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f5f5f5' }}>
            <span style={{ fontSize: '12px', color: '#999' }}>견주</span>
            <span style={{ fontSize: '12px', fontWeight: '600' }}>{dog.users?.nickname || '알 수 없음'}</span>
          </div>
        </div>

        {/* 상호작용 */}
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '13px', padding: '12px 14px' }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#bbb', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>상호작용</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f5f5f5' }}>
            <span style={{ fontSize: '12px', color: '#999' }}>🧑 사람과</span>
            <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: interactLabel[dog.interact_human]?.bg, color: interactLabel[dog.interact_human]?.color }}>
              {interactLabel[dog.interact_human]?.emoji} {interactLabel[dog.interact_human]?.text}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
            <span style={{ fontSize: '12px', color: '#999' }}>🐶 강아지와</span>
            <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: interactLabel[dog.interact_dog]?.bg, color: interactLabel[dog.interact_dog]?.color }}>
              {interactLabel[dog.interact_dog]?.emoji} {interactLabel[dog.interact_dog]?.text}
            </span>
          </div>
        </div>

        {/* 칭찬 뱃지 */}
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '13px', padding: '12px 14px' }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#bbb', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>받은 칭찬</div>
          {Object.keys(badgeCounts).length === 0 ? (
            <div style={{ fontSize: '12px', color: '#bbb' }}>아직 칭찬이 없어요</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {badgeOptions.map(b => badgeCounts[b.key] ? (
                <span key={b.key} style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', background: '#E8FAF2', color: '#1A7A4E' }}>
                  {b.emoji} {b.key} {badgeCounts[b.key]}
                </span>
              ) : null)}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        {dog.owner_id !== currentUser?.id && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <div
              onClick={() => router.push(`/chat/${dog.owner_id}`)}
              style={{ flex: 1, background: '#3CC47C', color: '#fff', borderRadius: '12px', padding: '13px', textAlign: 'center', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              💬 채팅하기
            </div>
            <div
              onClick={() => !myPraise && setShowModal(true)}
              style={{ flex: 1, background: myPraise ? '#f5f5f5' : '#F0FBF5', color: myPraise ? '#bbb' : '#3CC47C', borderRadius: '12px', padding: '13px', textAlign: 'center', fontSize: '14px', fontWeight: '600', cursor: myPraise ? 'default' : 'pointer', border: myPraise ? 'none' : '1.5px solid #3CC47C' }}>
              {myPraise ? '✓ 칭찬 완료' : '🏅 칭찬하기'}
            </div>
          </div>
        )}
      </div>

      {/* 칭찬 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '22px 22px 0 0', padding: '20px 20px 36px' }}>
            <div style={{ width: '34px', height: '4px', borderRadius: '2px', background: '#eee', margin: '0 auto 16px' }} />
            <div style={{ fontSize: '16px', fontWeight: '700', textAlign: 'center', marginBottom: '4px' }}>{dog.name} 칭찬하기 🏅</div>
            <div style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', marginBottom: '16px' }}>마음에 드는 칭찬을 골라주세요 (복수 선택)</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {badgeOptions.map(b => (
                <div key={b.key}
                  onClick={() => setSelectedBadges(prev =>
                    prev.includes(b.key) ? prev.filter(x => x !== b.key) : [...prev, b.key]
                  )}
                  style={{ padding: '14px 8px', borderRadius: '13px', textAlign: 'center', cursor: 'pointer', border: selectedBadges.includes(b.key) ? '2px solid #3CC47C' : '2px solid #eee', background: selectedBadges.includes(b.key) ? '#E8FAF2' : '#fafafa' }}>
                  <div style={{ fontSize: '24px', marginBottom: '5px' }}>{b.emoji}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a' }}>{b.key}</div>
                </div>
              ))}
            </div>

            <button onClick={handlePraise} disabled={praiseLoading || !selectedBadges.length}
              style={{ width: '100%', background: selectedBadges.length ? '#3CC47C' : '#eee', color: selectedBadges.length ? '#fff' : '#bbb', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: '700', cursor: selectedBadges.length ? 'pointer' : 'default' }}>
              {praiseLoading ? '저장 중...' : '칭찬 남기기'}
            </button>

            <div onClick={() => { setShowModal(false); setSelectedBadges([]) }}
              style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: '#bbb', cursor: 'pointer' }}>
              취소
            </div>
          </div>
        </div>
      )}
    </div>
  )
}