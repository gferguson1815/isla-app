import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  // Handle OAuth callback (Google, GitHub, etc.)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${error.name}&error_description=${error.message}`, requestUrl.origin)
      )
    }

    // OAuth successful, redirect to dashboard
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // Handle OTP verification (magic links, email confirmation)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change' | 'email',
      token_hash,
    })

    if (error) {
      return NextResponse.redirect(
        new URL(`/error?error=${error.name}&error_description=${error.message}`, requestUrl.origin)
      )
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}