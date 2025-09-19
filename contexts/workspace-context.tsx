'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './auth-context'
import { trpc } from '@/lib/trpc/client'
import type { WorkspaceWithMembership } from '@/packages/shared/src/types/workspace'

type Workspace = WorkspaceWithMembership

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

  const workspacesQuery = trpc.workspace.list.useQuery(undefined, {
    enabled: !!user,
    onSuccess: (data) => {
      setWorkspaces(data)
      setError(null)

      // Select workspace based on saved preference or first available
      const savedWorkspaceId = localStorage.getItem(SELECTED_WORKSPACE_KEY)

      if (savedWorkspaceId && data.find(w => w.id === savedWorkspaceId)) {
        setCurrentWorkspace(data.find(w => w.id === savedWorkspaceId)!)
      } else if (data.length > 0) {
        setCurrentWorkspace(data[0])
        localStorage.setItem(SELECTED_WORKSPACE_KEY, data[0].id)
      } else {
        setCurrentWorkspace(null)
      }
      setLoading(false)
    },
    onError: (err) => {
      console.error('Error fetching workspaces:', err)
      setError(err.message || 'Failed to fetch workspaces')
      setLoading(false)
    },
  })

  const fetchWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([])
      setCurrentWorkspace(null)
      setLoading(false)
      return
    }

    setLoading(true)
    await workspacesQuery.refetch()
  }, [user, workspacesQuery])

  const selectWorkspace = useCallback((workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId)
    if (workspace) {
      setCurrentWorkspace(workspace)
      localStorage.setItem(SELECTED_WORKSPACE_KEY, workspaceId)
    }
  }, [workspaces])

  const refreshWorkspaces = useCallback(async () => {
    setLoading(true)
    await workspacesQuery.refetch()
  }, [workspacesQuery])

  useEffect(() => {
    if (!user) {
      setWorkspaces([])
      setCurrentWorkspace(null)
      setLoading(false)
    }
  }, [user])

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