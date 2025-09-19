interface AuthEvent {
  type: 'login_attempt' | 'login_success' | 'login_failed' |
        'signup_attempt' | 'signup_success' | 'signup_failed' |
        'logout' | 'magic_link_sent' | 'magic_link_clicked' |
        'oauth_attempt' | 'oauth_success' | 'oauth_failed' |
        'session_expired' | 'password_reset'
  provider?: 'email' | 'google' | 'github'
  email?: string
  userId?: string
  error?: string
  metadata?: Record<string, unknown>
  timestamp: number
}

class AuthAnalytics {
  private events: AuthEvent[] = []
  private maxEvents = 1000 // Keep last 1000 events in memory

  track(event: Omit<AuthEvent, 'timestamp'>): void {
    const fullEvent: AuthEvent = {
      ...event,
      timestamp: Date.now()
    }

    // Add to events array
    this.events.push(fullEvent)

    // Trim to max events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', fullEvent)
    }

    // In production, you would send to analytics service
    this.sendToAnalyticsService(fullEvent)
  }

  private async sendToAnalyticsService(event: AuthEvent): Promise<void> {
    // Placeholder for sending to actual analytics service
    // In production, this would send to services like:
    // - Google Analytics
    // - Mixpanel
    // - Amplitude
    // - PostHog
    // - Custom analytics backend

    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true') {
      try {
        // Example: Send to analytics endpoint
        await fetch('/api/analytics/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        }).catch(() => {
          // Fail silently - don't break auth flow for analytics
        })
      } catch {
        // Fail silently
      }
    }
  }

  getRecentEvents(count = 100): AuthEvent[] {
    return this.events.slice(-count)
  }

  getEventStats(): {
    total: number
    byType: Record<string, number>
    successRate: number
    recentErrors: AuthEvent[]
  } {
    const stats = {
      total: this.events.length,
      byType: {} as Record<string, number>,
      successRate: 0,
      recentErrors: [] as AuthEvent[]
    }

    let successCount = 0
    let attemptCount = 0

    for (const event of this.events) {
      // Count by type
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1

      // Calculate success rate
      if (event.type.includes('attempt')) {
        attemptCount++
      } else if (event.type.includes('success')) {
        successCount++
      }

      // Collect recent errors
      if (event.type.includes('failed') && event.error) {
        stats.recentErrors.push(event)
      }
    }

    // Calculate success rate
    if (attemptCount > 0) {
      stats.successRate = (successCount / attemptCount) * 100
    }

    // Keep only last 10 errors
    stats.recentErrors = stats.recentErrors.slice(-10)

    return stats
  }

  clearEvents(): void {
    this.events = []
  }
}

// Create singleton instance
export const authAnalytics = new AuthAnalytics()

// Helper functions for common tracking scenarios
export const trackLoginAttempt = (provider: AuthEvent['provider'], email?: string) => {
  authAnalytics.track({
    type: 'login_attempt',
    provider,
    email: email ? email.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined // Partially mask email
  })
}

export const trackLoginSuccess = (provider: AuthEvent['provider'], userId: string) => {
  authAnalytics.track({
    type: 'login_success',
    provider,
    userId
  })
}

export const trackLoginFailed = (provider: AuthEvent['provider'], error: string, email?: string) => {
  authAnalytics.track({
    type: 'login_failed',
    provider,
    error,
    email: email ? email.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined
  })
}

export const trackMagicLinkSent = (email: string) => {
  authAnalytics.track({
    type: 'magic_link_sent',
    provider: 'email',
    email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
  })
}

export const trackOAuthAttempt = (provider: 'google' | 'github') => {
  authAnalytics.track({
    type: 'oauth_attempt',
    provider
  })
}

export const trackLogout = (userId?: string) => {
  authAnalytics.track({
    type: 'logout',
    userId
  })
}