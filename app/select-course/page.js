'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SelectCoursePage() {
  const router = useRouter()
  const [courses, setCourses] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase.from('courses').select('*').order('name')
      if (data) setCourses(data)
    }
    fetchCourses()
  }, [])

  const handleSave = async () => {
    if (!selected) return alert('코스를 선택해주세요')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('users')
      .update({ default_course_id: selected })
      .eq('id', user.id)

    if (error) {
      alert('오류: ' + error.message)
      setLoading(false)
      return
    }

    router.push('/')
  }

  return (
    <div style={{ padding: '32px 24px', background: '#fff', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>주요 산책 코스를 선택해요</h1>
      <p style={{ fontSize: '13px', color: '#bbb', marginBottom: '28px' }}>설정에서 언제든지 변경할 수 있어요</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
        {courses.map(course => (
          <div
            key={course.id}
            onClick={() => setSelected(course.id)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: '13px', cursor: 'pointer',
              border: selected === course.id ? '1.5px solid #3CC47C' : '1.5px solid #eee',
              background: selected === course.id ? '#F0FBF5' : '#fafafa',
              transition: 'all .15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>📍</span>
              <span style={{ fontSize: '14px', fontWeight: selected === course.id ? '600' : '500', color: selected === course.id ? '#1A7A4E' : '#1a1a1a' }}>
                {course.name}
              </span>
            </div>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
              background: selected === course.id ? '#3CC47C' : '#fff',
              border: selected === course.id ? 'none' : '1.5px solid #ddd',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: '#fff', fontWeight: '700'
            }}>
              {selected === course.id ? '✓' : ''}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={loading || !selected}
        style={{
          width: '100%', background: selected ? '#3CC47C' : '#eee',
          color: selected ? '#fff' : '#bbb', border: 'none',
          borderRadius: '12px', padding: '14px', fontSize: '15px',
          fontWeight: '700', cursor: selected ? 'pointer' : 'default',
          transition: 'all .15s'
        }}
      >
        {loading ? '저장 중...' : '선택 완료'}
      </button>
    </div>
  )
}