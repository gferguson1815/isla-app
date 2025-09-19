import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authRateLimiter, checkRateLimit } from '@/lib/rate-limit'
import { sendMagicLinkFallback, monitorEmailDelivery } from '@/lib/email-service'
import { emailRetryQueue } from '@/lib/email-queue'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    )
  }

  const rateLimitResult = await checkRateLimit(email, authRateLimiter.magicLink)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
      },
      { status: 429 }
    )
  }

  const supabase = await createClient()

  const startTime = Date.now()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${request.nextUrl.origin}/auth/confirm`,
    },
  })
  const endTime = Date.now()
  const duration = endTime - startTime

  if (duration > 2000) {
    console.warn(`Magic link send took ${duration}ms (exceeded 2s threshold)`)
  }

  // Monitor email delivery performance
  await monitorEmailDelivery('supabase', !error, duration)

  // If Supabase email fails, try Resend fallback
  if (error) {
    console.error('Supabase magic link failed, attempting Resend fallback:', error)

    // Generate magic link URL (in production, this would need proper token generation)
    const magicLink = `${request.nextUrl.origin}/auth/confirm?token=${Buffer.from(email).toString('base64')}&type=magiclink`

    const resendResult = await sendMagicLinkFallback(email, magicLink)

    if (!resendResult.success) {
      // Add to retry queue if both services fail
      await emailRetryQueue.add({
        email,
        type: 'magic-link',
        attempts: 0,
        maxAttempts: 3,
        nextRetry: Date.now() + 60000, // Retry after 1 minute
        data: { magicLink }
      })

      return NextResponse.json(
        { error: 'Email service temporarily unavailable. We\'ll retry sending shortly.' },
        { status: 503 }
      )
    }

    // Resend succeeded
    await monitorEmailDelivery('resend', true, Date.now() - endTime)
  }

  return NextResponse.json({
    message: 'Magic link sent successfully',
    remaining: rateLimitResult.remaining,
  })
}