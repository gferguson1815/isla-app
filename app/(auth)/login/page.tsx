'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { trackLoginAttempt, trackMagicLinkSent, trackOAuthAttempt, trackLoginFailed } from '@/lib/analytics'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, Mail } from 'lucide-react'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining?: number, reset?: number } | null>(null)
  const supabase = createClient()

  const handleSignInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Track login attempt
    trackLoginAttempt('email', email)

    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error })
        // Track failure
        trackLoginFailed('email', data.error, email)
        // Set rate limit info if available
        if (data.remaining !== undefined) {
          setRateLimitInfo({ remaining: data.remaining, reset: data.reset })
        }
      } else {
        setMessage({ type: 'success', text: 'Check your email for the magic link!' })
        // Track success
        trackMagicLinkSent(email)
        // Update remaining requests
        if (data.remaining !== undefined) {
          setRateLimitInfo({ remaining: data.remaining })
        }
      }
    } catch {
      const errorMsg = 'Failed to send magic link. Please try again.'
      setMessage({ type: 'error', text: errorMsg })
      trackLoginFailed('email', errorMsg, email)
    }

    setLoading(false)
  }

  const handleSignInWithGoogle = async () => {
    setLoading(true)
    setMessage(null)

    // Track OAuth attempt
    trackOAuthAttempt('google')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (error) {
      const errorMsg = 'Google sign in is temporarily unavailable. Please use email sign in.'
      setMessage({ type: 'error', text: errorMsg })
      trackLoginFailed('google', error.message || errorMsg)
      setLoading(false)
    }
    // Success tracking happens after OAuth redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Choose your preferred sign in method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {rateLimitInfo && rateLimitInfo.remaining !== undefined && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Rate Limit Status</span>
                <InfoTooltip
                  content="We limit login attempts to prevent abuse. Remaining attempts will reset after the time shown below."
                  className="inline-block"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining requests:</span>
                  <span className={rateLimitInfo.remaining === 0 ? 'text-destructive' : ''}>
                    {rateLimitInfo.remaining}/10
                  </span>
                </div>
                <Progress value={(rateLimitInfo.remaining / 10) * 100} className="h-2" />
                {rateLimitInfo.reset && (
                  <p className="text-xs text-muted-foreground">
                    Resets in {Math.ceil((rateLimitInfo.reset - Date.now()) / 60000)} minutes
                  </p>
                )}
              </div>
            </div>
          )}

          <Button
            className="w-full"
            variant="outline"
            onClick={handleSignInWithGoogle}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSignInWithEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send magic link
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground text-center w-full">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}