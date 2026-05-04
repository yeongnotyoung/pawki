'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function WalkPage() {
  const router = useRouter()
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const [walking, setWalking] = useState(false)
  const [walkId, setWalkId] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [myDog, setMyDog] = useState(null)
  const [nearbyDogs, setNearbyDogs] = useState([])
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const watchId = useRef(null)
  const markersRef = useRef({})

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUser(user)

      const { data: profile } = await supabase
        .from('users').select('*, courses(*)').eq('id', user.id).single()
      setCourse(profile?.courses)

      const { data: dog } = await supabase
        .from('dogs').select('*').eq('owner_id', user.id).single()
      setMyDog(dog)

      setLoading(false)
      loadKakaoMap()
    }
    init()

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [])

  const loadKakaoMap = () => {
    if (window.kakao && window.kakao.maps) {
      initMap()
      return
    }
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`
    script.onload = () => window.kakao.maps.load(initMap)
    document.head.appendChild(script)
  }

  const initMap = () => {
    if (!mapRef.current) return
    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780),
      level: 4
    }
    mapInstance.current = new window.kakao.maps.Map(mapRef.current, options)

    // 현재 위치로 이동
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const latlng = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude)
        mapInstance.current.setCenter(latlng)
        addMyMarker(latlng)
      })
    }
  }

  const addMyMarker = (latlng) => {
    const marker = new window.kakao.maps.Marker({
      position: latlng,
      map: mapInstance.current,
    })
    markersRef.current['me'] = marker
  }

  const startWalk = async () => {
    if (!myDog) {
      alert('강아지를 먼저 등록해주세요')
      router.push('/register-dog')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('users').select('default_course_id').eq('id', user.id).single()

    // 산책 시작 DB 저장
    const { data: walk } = await supabase.from('walks').insert({
      dog_id: myDog.id,
      course_id: profile.default_course_id,
      is_active: true,
    }).select().single()

    setWalkId(walk.id)
    setWalking(true)

    // GPS 추적 시작
    watchId.current = navigator.geolocation.watchPosition(async (pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude

      // DB 위치 업데이트
      await supabase.from('walks').update({ lat, lng }).eq('id', walk.id)

      // 지도 마커 업데이트
      if (mapInstance.current) {
        const latlng = new window.kakao.maps.LatLng(lat, lng)
        if (markersRef.current['me']) {
          markersRef.current['me'].setPosition(latlng)
        } else {
          addMyMarker(latlng)
        }
        mapInstance.current.setCenter(latlng)
      }

      // 근처 산책 중인 강아지 조회
      const { data: activeWalks } = await supabase
        .from('walks')
        .select('*, dogs(*)')
        .eq('is_active', true)
        .eq('course_id', profile.default_course_id)
        .neq('dog_id', myDog.id)

      if (activeWalks) {
        setNearbyDogs(activeWalks)

        // 다른 강아지 마커 추가
        activeWalks.forEach(w => {
          if (!w.lat || !w.lng) return
          const pos = new window.kakao.maps.LatLng(w.lat, w.lng)
          const interact = w.dogs?.interact_human
          const color = interact === 'yes' ? '#3CC47C' : interact === 'ok' ? '#F0B429' : '#E53935'

          if (markersRef.current[w.id]) {
            markersRef.current[w.id].setPosition(pos)
          } else {
            const content = `<div style="background:${color};color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.2)">🐾</div>`
            const overlay = new window.kakao.maps.CustomOverlay({ position: pos, content, map: mapInstance.current })
            markersRef.current[w.id] = overlay
          }
        })
      }
    }, null, { enableHighAccuracy: true, maximumAge: 3000 })
  }

  const stopWalk = async () => {
    if (walkId) {
      await supabase.from('walks').update({ is_active: false, ended_at: new Date().toISOString() }).eq('id', walkId)
    }
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current)
    setWalking(false)
    setWalkId(null)
    setNearbyDogs([])

    // 다른 강아지 마커 제거
    Object.entries(markersRef.current).forEach(([key, marker]) => {
      if (key !== 'me' && marker.setMap) marker.setMap(null)
    })
  }

  const interactLabel = {
    yes: { emoji: '🥳', text: '환영해요', color: '#1A7A4E', bg: '#E8FAF2' },
    ok: { emoji: '😊', text: '괜찮아요', color: '#7A5A0A', bg: '#FEF6E4' },
    no: { emoji: '😣', text: '비선호', color: '#B71C1C', bg: '#FDECEA' },
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '32px' }}>🐾</div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* 상단바 */}
      <div style={{ background: '#3CC47C', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
            🗺️ {walking ? '산책 중' : '산책 지도'}
          </div>
          {walking && course && (
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.75)', marginTop: '1px' }}>
              {course.name} · GPS 공유 중
            </div>
          )}
        </div>
        {walking && (
          <div onClick={stopWalk}
            style={{ background: 'rgba(255,255,255,.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}>
            종료
          </div>
        )}
      </div>

      {/* 지도 */}
      <div ref={mapRef} style={{ flex: 1, minHeight: '340px' }} />

      {/* 하단 패널 */}
      <div style={{ background: '#fff', padding: '14px 16px', flexShrink: 0 }}>
        {!walking ? (
          <button onClick={startWalk}
            style={{ width: '100%', background: '#3CC47C', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
            🐾 산책 시작하기
          </button>
        ) : (
          <>
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#bbb', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '8px' }}>
              근처 강아지 {nearbyDogs.length}마리
            </div>
            {nearbyDogs.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#bbb', textAlign: 'center', padding: '12px 0' }}>
                근처에 산책 중인 강아지가 없어요
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
                {nearbyDogs.map((w, i) => (
                  <div key={i}
                    onClick={() => router.push(`/dog/${w.dog_id}`)}
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '7px', background: '#f5f5f5', padding: '8px 12px', borderRadius: '12px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '18px' }}>🐶</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600' }}>{w.dogs?.name}</div>
                      <span style={{ fontSize: '10px', fontWeight: '600', padding: '1px 6px', borderRadius: '10px', background: interactLabel[w.dogs?.interact_human]?.bg, color: interactLabel[w.dogs?.interact_human]?.color }}>
                        {interactLabel[w.dogs?.interact_human]?.emoji} {interactLabel[w.dogs?.interact_human]?.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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
            <div style={{ fontSize: '9px', fontWeight: '500', color: tab.path === '/walk' ? '#3CC47C' : '#ccc' }}>{tab.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}