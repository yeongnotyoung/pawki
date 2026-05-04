'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function WheelPicker({ value, onChange, options }) {
  const ref = useRef(null)
  const itemHeight = 40

  useEffect(() => {
    const idx = options.indexOf(value)
    if (ref.current) ref.current.scrollTop = idx * itemHeight
  }, [value])

  const handleScroll = () => {
    if (!ref.current) return
    const idx = Math.round(ref.current.scrollTop / itemHeight)
    const clamped = Math.max(0, Math.min(idx, options.length - 1))
    onChange(options[clamped])
  }

  return (
    <div style={{ position: 'relative', width: '72px' }}>
      <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '100%', height: `${itemHeight}px`, background: '#E8FAF2', borderRadius: '8px', pointerEvents: 'none', zIndex: 1 }} />
      <div ref={ref} onScroll={handleScroll}
        style={{ height: `${itemHeight * 5}px`, overflowY: 'scroll', scrollSnapType: 'y mandatory', scrollbarWidth: 'none', position: 'relative', zIndex: 2 }}>
        <div style={{ height: `${itemHeight * 2}px` }} />
        {options.map(opt => (
          <div key={opt}
            onClick={() => { onChange(opt); if (ref.current) ref.current.scrollTop = options.indexOf(opt) * itemHeight }}
            style={{ height: `${itemHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', scrollSnapAlign: 'center', fontSize: '18px', fontWeight: value === opt ? '700' : '400', color: value === opt ? '#1A7A4E' : '#bbb', cursor: 'pointer' }}>
            {opt}
          </div>
        ))}
        <div style={{ height: `${itemHeight * 2}px` }} />
      </div>
      <style>{`div::-webkit-scrollbar{display:none}`}</style>
    </div>
  )
}

function TimePicker({ label, value, onChange, onClose }) {
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutes = ['00', '10', '20', '30', '40', '50']
  const [h, setH] = useState(value.split(':')[0])
  const [m, setM] = useState(value.split(':')[1] || '00')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '22px 22px 0 0', padding: '20px 20px 36px' }}>
        <div style={{ width: '34px', height: '4px', borderRadius: '2px', background: '#eee', margin: '0 auto 16px' }} />
        <div style={{ fontSize: '15px', fontWeight: '700', textAlign: 'center', marginBottom: '20px' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <WheelPicker value={h} onChange={setH} options={hours} />
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a' }}>:</div>
          <WheelPicker value={m} onChange={setM} options={minutes} />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '1.5px solid #eee', background: '#fafafa', fontSize: '14px', fontWeight: '600', color: '#888', cursor: 'pointer' }}>취소</button>
          <button onClick={() => { onChange(`${h}:${m}`); onClose() }} style={{ flex: 1, padding: '13px', borderRadius: '12px', border: 'none', background: '#3CC47C', fontSize: '14px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}>확인</button>
        </div>
      </div>
    </div>
  )
}

export default function WalkSchedulePage() {
  const router = useRouter()
  const [dogs, setDogs] = useState([])
  const [selectedDogIds, setSelectedDogIds] = useState([])
  const [courses, setCourses] = useState([])
  const [patterns, setPatterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [picker, setPicker] = useState(null)

  const DAYS = ['월', '화', '수', '목', '금', '토', '일']

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: dogList } = await supabase
        .from('dogs').select('*').eq('owner_id', user.id)

      const { data: courseData } = await supabase
        .from('courses').select('*').order('name')
      if (courseData) setCourses(courseData)

      if (dogList && dogList.length > 0) {
        setDogs(dogList)
        // 첫 번째 강아지 기본 선택 + 패턴 불러오기
        const firstDog = dogList[0]
        setSelectedDogIds([firstDog.id])
        await loadPatternsForDog(firstDog.id, courseData)
      } else {
        setPatterns([{ days: [], start_time: '07:00', end_time: '08:00', course_id: null }])
      }

      setLoading(false)
    }
    init()
  }, [])

  const loadPatternsForDog = async (dogId, courseData) => {
    const { data: existing } = await supabase
      .from('walk_patterns').select('*').eq('dog_id', dogId)

    if (existing && existing.length > 0) {
      setPatterns(existing.map(p => ({
        id: p.id,
        days: p.days || [],
        start_time: p.start_time || '07:00',
        end_time: p.end_time || '08:00',
        course_id: p.course_id,
      })))
    } else {
      const fallbackCourseId = courseData ? courseData[0]?.id : null
      setPatterns([{ days: [], start_time: '07:00', end_time: '08:00', course_id: fallbackCourseId }])
    }
  }

  const toggleDog = async (dogId) => {
    // 단일 선택으로 바꿀 때 해당 강아지의 패턴 불러오기
    const isAlreadySelected = selectedDogIds.includes(dogId)

    if (isAlreadySelected && selectedDogIds.length === 1) return // 최소 1개 선택 유지

    let newSelected
    if (isAlreadySelected) {
      newSelected = selectedDogIds.filter(id => id !== dogId)
    } else {
      newSelected = [...selectedDogIds, dogId]
    }
    setSelectedDogIds(newSelected)

    // 강아지 1마리만 선택 시 해당 강아지 패턴 불러오기
    if (newSelected.length === 1) {
      await loadPatternsForDog(newSelected[0], courses)
    } else {
      // 복수 선택 시 빈 패턴으로 (공통 패턴 설정 모드)
      setPatterns([{ days: [], start_time: '07:00', end_time: '08:00', course_id: courses[0]?.id || null }])
    }
  }

  const addPattern = () => {
    setPatterns([...patterns, { days: [], start_time: '07:00', end_time: '08:00', course_id: courses[0]?.id || null }])
  }

  const removePattern = (index) => {
    if (patterns.length === 1) return
    setPatterns(patterns.filter((_, i) => i !== index))
  }

  const updatePattern = (index, key, value) => {
    setPatterns(patterns.map((p, i) => i === index ? { ...p, [key]: value } : p))
  }

  const toggleDay = (index, day) => {
    const p = patterns[index]
    const newDays = p.days.includes(day) ? p.days.filter(d => d !== day) : [...p.days, day]
    updatePattern(index, 'days', newDays)
  }

  const getSummary = (p) => {
    if (!p.days.length) return '요일과 시간을 선택해주세요'
    const courseName = courses.find(c => c.id === p.course_id)?.name || ''
    return `📅 ${p.days.join('·')}  ${p.start_time} – ${p.end_time}  ${courseName}`
  }

  const handleSave = async () => {
    if (selectedDogIds.length === 0) { alert('강아지를 선택해주세요'); return }
    const validPatterns = patterns.filter(p => p.days.length > 0)
    if (validPatterns.length === 0) { alert('요일을 하나 이상 선택해주세요'); return }

    setSaving(true)

    for (const dogId of selectedDogIds) {
      await supabase.from('walk_patterns').delete().eq('dog_id', dogId)

      const toInsert = validPatterns.map(p => ({
        dog_id: dogId,
        days: p.days,
        start_time: p.start_time,
        end_time: p.end_time,
        course_id: p.course_id,
      }))

      const { error } = await supabase.from('walk_patterns').insert(toInsert)
      if (error) { alert('저장 오류: ' + error.message); setSaving(false); return }
    }

    setSaving(false)
    router.push('/walk-schedule/view')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '32px' }}>🐾</div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#3CC47C', padding: '10px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div onClick={() => router.back()} style={{ fontSize: '22px', color: '#fff', cursor: 'pointer' }}>‹</div>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>산책 시간 설정</div>
        <div onClick={() => router.push('/walk-schedule/view')}
          style={{ fontSize: '12px', fontWeight: '600', color: '#fff', opacity: .8, cursor: 'pointer' }}>
          저장된 일정
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>

        {/* 강아지 선택 */}
        {dogs.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '13px', padding: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#bbb', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>
              강아지 선택
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {dogs.map(dog => (
                <div key={dog.id} onClick={() => toggleDog(dog.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', border: selectedDogIds.includes(dog.id) ? '1.5px solid #3CC47C' : '1.5px solid #eee', background: selectedDogIds.includes(dog.id) ? '#E8FAF2' : '#fafafa' }}>
                  <span style={{ fontSize: '18px' }}>🐶</span>
                  <span style={{ fontSize: '13px', fontWeight: selectedDogIds.includes(dog.id) ? '600' : '400', color: selectedDogIds.includes(dog.id) ? '#1A7A4E' : '#888' }}>{dog.name}</span>
                  {selectedDogIds.includes(dog.id) && <span style={{ fontSize: '11px', color: '#3CC47C', fontWeight: '700' }}>✓</span>}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '8px' }}>
              {selectedDogIds.length === 1
                ? '저장된 패턴을 불러왔어요. 수정 후 저장해주세요.'
                : `${selectedDogIds.length}마리 선택 — 동일한 패턴이 모두 적용돼요`}
            </div>
          </div>
        )}

        {dogs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#bbb' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🐶</div>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>등록된 강아지가 없어요</div>
            <button onClick={() => router.push('/register-dog')}
              style={{ background: '#3CC47C', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              강아지 등록하기
            </button>
          </div>
        )}

        {/* 패턴 목록 */}
        {dogs.length > 0 && patterns.map((p, index) => (
          <div key={index} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '13px', padding: '14px', position: 'relative' }}>
            {patterns.length > 1 && (
              <div onClick={() => removePattern(index)} style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '16px', color: '#ddd', cursor: 'pointer' }}>✕</div>
            )}
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#bbb', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '12px' }}>패턴 {index + 1}</div>

            {/* 코스 */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#bbb', marginBottom: '6px' }}>코스</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {courses.map(c => (
                  <div key={c.id} onClick={() => updatePattern(index, 'course_id', c.id)}
                    style={{ padding: '5px 11px', borderRadius: '20px', fontSize: '12px', fontWeight: p.course_id === c.id ? '600' : '400', cursor: 'pointer', background: p.course_id === c.id ? '#3CC47C' : '#f5f5f5', color: p.course_id === c.id ? '#fff' : '#bbb' }}>
                    {c.name}
                  </div>
                ))}
              </div>
            </div>

            {/* 요일 */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#bbb', marginBottom: '6px' }}>요일</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {DAYS.map(d => (
                  <div key={d} onClick={() => toggleDay(index, d)}
                    style={{ flex: 1, padding: '7px 2px', borderRadius: '9px', textAlign: 'center', fontSize: '12px', fontWeight: p.days.includes(d) ? '700' : '400', cursor: 'pointer', background: p.days.includes(d) ? '#3CC47C' : '#f5f5f5', color: p.days.includes(d) ? '#fff' : '#bbb' }}>
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* 시간 */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: '#bbb', marginBottom: '6px' }}>시간</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div onClick={() => setPicker({ index, field: 'start_time' })}
                  style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', textAlign: 'center', border: '1.5px solid #eee', background: '#fafafa', cursor: 'pointer' }}>
                  <div style={{ fontSize: '10px', color: '#bbb', marginBottom: '2px' }}>시작</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1A7A4E' }}>{p.start_time}</div>
                </div>
                <div style={{ fontSize: '16px', color: '#bbb' }}>–</div>
                <div onClick={() => setPicker({ index, field: 'end_time' })}
                  style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', textAlign: 'center', border: '1.5px solid #eee', background: '#fafafa', cursor: 'pointer' }}>
                  <div style={{ fontSize: '10px', color: '#bbb', marginBottom: '2px' }}>종료</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1A7A4E' }}>{p.end_time}</div>
                </div>
              </div>
            </div>

            {/* 요약 */}
            <div style={{ padding: '7px 10px', borderRadius: '9px', background: p.days.length ? '#F0FBF5' : '#f5f5f5', fontSize: '11px', fontWeight: '600', color: p.days.length ? '#1A7A4E' : '#bbb' }}>
              {getSummary(p)}
            </div>
          </div>
        ))}

        {dogs.length > 0 && (
          <>
            <div onClick={addPattern}
              style={{ border: '1.5px dashed #3CC47C', borderRadius: '13px', padding: '14px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#3CC47C', cursor: 'pointer' }}>
              ＋ 패턴 추가
            </div>
            <button onClick={handleSave} disabled={saving}
              style={{ background: '#3CC47C', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </>
        )}

        <div style={{ height: '8px' }} />
      </div>

      {picker && (
        <TimePicker
          label={picker.field === 'start_time' ? '시작 시간' : '종료 시간'}
          value={patterns[picker.index][picker.field]}
          onChange={(val) => updatePattern(picker.index, picker.field, val)}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}