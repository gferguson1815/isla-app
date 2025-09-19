'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { trackLoginSuccess, trackLogout } from '@/lib/analytics'
import { trpc } from '@/lib/trpc/client'

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const initializeUserMutation = trpc.user.initialize.useMutation()

  const signIn = async (email?: string) => {
    if (email) {
      await supabase.auth.signInWithOtp({ email })
    } else {
      // Default sign in page
      window.location.href = '/auth/login'
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null

      // Track auth events
      if (event === 'SIGNED_IN' && newUser) {
        // Determine provider from session metadata
        const provider = session?.user?.app_metadata?.provider || 'email'
        trackLoginSuccess(provider as 'email' | 'google' | 'github', newUser.id)

        // Initialize user in our database (creates default workspace for new users)
        try {
          await initializeUserMutation.mutateAsync({
            userId: newUser.id,
            email: newUser.email || '',
            name: newUser.user_metadata?.full_name || newUser.user_metadata?.name,
            avatarUrl: newUser.user_metadata?.avatar_url,
          })
        } catch (error) {
          console.error('Failed to initialize user:', error)
        }

        // Check for pending invitation
        const pendingInvitation = localStorage.getItem('pendingInvitation')
        if (pendingInvitation) {
          localStorage.removeItem('pendingInvitation')
          window.location.href = `/invite/${pendingInvitation}`
        }
      } else if (event === 'SIGNED_OUT') {
        // Get current user ID before state change for tracking
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) {
            trackLogout(data.user.id)
          }
        })
      }

      setUser(newUser)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, initializeUserMutation])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}