'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RegisterDogPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    age: '',
    agePrivate: false,
    gender: 'female',
    neutered: false,
    interact_human: 'yes',
    interact_dog: 'yes',
  })

  const handleSubmit = async () => {
    if (!form.name) return alert('강아지 이름을 입력해주세요')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('dogs').insert({
      owner_id: user.id,
      name: form.name,
      age: form.agePrivate ? null : (form.age ? parseInt(form.age) : null),
      gender: form.gender,
      neutered: form.neutered,
      interact_human: form.interact_human,
      interact_dog: form.interact_dog,
    })

    if (error) {
      alert('오류가 발생했어요: ' + error.message)
      setLoading(false)
      return
    }

   router.push('/select-course')
  }

  const interactOptions = [
    { value: 'no', emoji: '😣', label: '비선호' },
    { value: 'ok', emoji: '😊', label: '괜찮아요' },
    { value: 'yes', emoji: '🥳', label: '환영해요' },
  ]

  const cardStyle = {
    background: '#fff', border: '1px solid #eee', borderRadius: '13px',
    padding: '16px', marginBottom: '12px', display: 'flex',
    flexDirection: 'column', gap: '12px'
  }

  const labelStyle = { fontSize: '11px', color: '#bbb' }
  const inputStyle = {
    padding: '10px 12px', borderRadius: '10px',
    border: '1.5px solid #eee', fontSize: '13px', outline: 'none', width: '100%'
  }

  return (
    <div style={{ padding: '32px 24px', background: '#fff', minHeight: '100vh' }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: '#3CC47C', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
        Step 2 of 2
      </div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>강아지를 등록해요</h1>
      <p style={{ fontSize: '13px', color: '#bbb', marginBottom: '32px' }}>나중에 설정에서 수정할 수 있어요</p>

      {/* 사진 (미구현) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '22px', background: '#F0FBF5', border: '2px dashed #3CC47C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '24px', cursor: 'not-allowed', opacity: 0.5 }}>
          📷
        </div>
        <div style={{ fontSize: '11px', color: '#bbb', marginTop: '6px' }}>사진 추가 (추후 지원 예정)</div>
      </div>

      {/* 기본 정보 */}
      <div style={cardStyle}>
        <div style={{ fontSize: '10px', fontWeight: '600', color: '#bbb', textTransform: 'uppercase', letterSpacing: '.06em' }}>기본 정보</div>

        {/* 이름 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={labelStyle}>이름 *</div>
          <input
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            placeholder="강아지 이름"
            style={inputStyle}
          />
        </div>

        {/* 나이 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={labelStyle}>나이</div>
          <input
            value={form.agePrivate ? '' : form.age}
            onChange={e => setForm({...form, age: e.target.value})}
            placeholder={form.agePrivate ? '비공개' : '예: 3'}
            type="number"
            disabled={form.agePrivate}
            style={{ ...inputStyle, background: form.agePrivate ? '#f5f5f5' : '#fff', color: form.agePrivate ? '#bbb' : '#1a1a1a' }}
          />
          {/* 밝히고 싶지 않음 체크박스 */}
          <div
            onClick={() => setForm({...form, agePrivate: !form.agePrivate, age: ''})}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', marginTop: '2px' }}
          >
            <div style={{
              width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
              border: form.agePrivate ? 'none' : '1.5px solid #ddd',
              background: form.agePrivate ? '#3CC47C' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', color: '#fff', fontWeight: '700'
            }}>
              {form.agePrivate ? '✓' : ''}
            </div>
            <span style={{ fontSize: '12px', color: '#888' }}>밝히고 싶지 않아요</span>
          </div>
        </div>

        {/* 성별 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={labelStyle}>성별</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[{ value: 'female', label: '🙆‍♀️ 암컷' }, { value: 'male', label: '🙆‍♂️ 수컷' }].map(g => (
              <div key={g.value} onClick={() => setForm({...form, gender: g.value})}
                style={{
                  flex: 1, padding: '10px', borderRadius: '11px', textAlign: 'center', cursor: 'pointer',
                  fontSize: '13px', fontWeight: form.gender === g.value ? '600' : '500',
                  border: form.gender === g.value ? '1.5px solid #3CC47C' : '1.5px solid #eee',
                  background: form.gender === g.value ? '#E8FAF2' : '#fafafa',
                  color: form.gender === g.value ? '#1A7A4E' : '#bbb'
                }}>
                {g.label}
              </div>
            ))}
          </div>
        </div>

        {/* 중성화 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: '#1a1a1a' }}>중성화 완료</span>
          <div onClick={() => setForm({...form, neutered: !form.neutered})}
            style={{ width: '42px', height: '24px', borderRadius: '12px', background: form.neutered ? '#3CC47C' : '#ddd', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
            <div style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'all .2s', left: form.neutered ? 'auto' : '3px', right: form.neutered ? '3px' : 'auto' }} />
          </div>
        </div>
      </div>

      {/* 상호작용 */}
      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <div style={{ fontSize: '10px', fontWeight: '600', color: '#bbb', textTransform: 'uppercase', letterSpacing: '.06em' }}>상호작용 설정</div>
        {[{ key: 'interact_human', label: '🧑 사람과의 상호작용' }, { key: 'interact_dog', label: '🐶 강아지와의 상호작용' }].map(axis => (
          <div key={axis.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a' }}>{axis.label}</div>
            <div style={{ display: 'flex', gap: '5px' }}>
              {interactOptions.map(opt => (
                <div key={opt.value} onClick={() => setForm({...form, [axis.key]: opt.value})}
                  style={{
                    flex: 1, padding: '9px 4px', borderRadius: '11px', textAlign: 'center', cursor: 'pointer',
                    border: form[axis.key] === opt.value ? '1.5px solid #3CC47C' : '1.5px solid #eee',
                    background: form[axis.key] === opt.value ? '#E8FAF2' : '#fafafa'
                  }}>
                  <div style={{ fontSize: '19px' }}>{opt.emoji}</div>
                  <div style={{ fontSize: '10px', fontWeight: form[axis.key] === opt.value ? '600' : '500', color: form[axis.key] === opt.value ? '#1A7A4E' : '#bbb', marginTop: '3px' }}>{opt.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={loading}
        style={{ width: '100%', background: '#3CC47C', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
        {loading ? '저장 중...' : '등록 완료'}
      </button>
    </div>
  )
}