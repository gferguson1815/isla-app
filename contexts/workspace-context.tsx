'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './auth-context'

interface Workspace {
  id: string
  name: string
  slug: string
  domain: string | null
  plan: string
  max_links: number
  max_clicks: number
  max_users: number
  created_at: string
  updated_at: string
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  loading: boolean
  error: string | null
  selectWorkspace: (workspaceId: string) => void
  refreshWorkspaces: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  currentWorkspace: null,
  workspaces: [],
  loading: true,
  error: null,
  selectWorkspace: () => {},
  refreshWorkspaces: async () => {},
})

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return context
}

const SELECTED_WORKSPACE_KEY = 'selected_workspace_id'

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([])
      setCurrentWorkspace(null)
      setLoading(false)
      return
    }

    try {
      setError(null)

      // Fetch workspaces the user is a member of
      const { data: memberships, error: membershipError } = await supabase
        .from('workspace_memberships')
        .select(`
          workspace_id,
          role,
          workspaces (
            id,
            name,
            slug,
            domain,
            plan,
            max_links,
            max_clicks,
            max_users,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)

      if (membershipError) throw membershipError

      const userWorkspaces = memberships
        ?.map(m => m.workspaces)
        .filter(w => w !== null) as Workspace[] || []

      setWorkspaces(userWorkspaces)

      // Select workspace based on saved preference or first available
      const savedWorkspaceId = localStorage.getItem(SELECTED_WORKSPACE_KEY)

      if (savedWorkspaceId && userWorkspaces.find(w => w.id === savedWorkspaceId)) {
        setCurrentWorkspace(userWorkspaces.find(w => w.id === savedWorkspaceId)!)
      } else if (userWorkspaces.length > 0) {
        setCurrentWorkspace(userWorkspaces[0])
        localStorage.setItem(SELECTED_WORKSPACE_KEY, userWorkspaces[0].id)
      } else {
        // No workspaces available - might need to create a default one
        setCurrentWorkspace(null)
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch workspaces')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  const selectWorkspace = useCallback((workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId)
    if (workspace) {
      setCurrentWorkspace(workspace)
      localStorage.setItem(SELECTED_WORKSPACE_KEY, workspaceId)
    }
  }, [workspaces])

  const refreshWorkspaces = useCallback(async () => {
    setLoading(true)
    await fetchWorkspaces()
  }, [fetchWorkspaces])

  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        loading,
        error,
        selectWorkspace,
        refreshWorkspaces
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}