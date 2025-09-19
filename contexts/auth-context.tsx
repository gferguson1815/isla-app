'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { trackLoginSuccess, trackLogout } from '@/lib/analytics'

type AuthContextType = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null

      // Track auth events
      if (event === 'SIGNED_IN' && newUser) {
        // Determine provider from session metadata
        const provider = session?.user?.app_metadata?.provider || 'email'
        trackLoginSuccess(provider as 'email' | 'google' | 'github', newUser.id)
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
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}