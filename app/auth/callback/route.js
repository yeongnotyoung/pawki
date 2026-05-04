import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/login`)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(function(item) {
              cookieStore.set(item.name, item.value, item.options)
            })
          },
        },
      }
    )

    try {
      const result = await supabase.auth.exchangeCodeForSession(code)
      const user = result.data.user

      if (user) {
        const { data: existing } = await supabase
          .from('users')
          .select('id, user_type')
          .eq('id', user.id)
          .single()

        if (!existing) {
          await supabase.from('users').insert({
            id: user.id,
            email: user.email,
            nickname: user.user_metadata ? user.user_metadata.full_name : '새 사용자',
          })
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        if (!existing.user_type) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        return NextResponse.redirect(`${origin}/`)
      }
    } catch (e) {
      console.log('Auth error:', e.message)
      return NextResponse.redirect(`${origin}/login`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}