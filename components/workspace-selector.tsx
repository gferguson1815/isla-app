'use client'

import { useState } from 'react'
import { useWorkspace } from '@/contexts/workspace-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Building2, Loader2, Plus } from 'lucide-react'
import { WorkspaceCreationModal } from '@/components/workspace/workspace-creation-modal'

export function WorkspaceSelector() {
  const { currentWorkspace, workspaces, loading, error, selectWorkspace, refreshWorkspaces } = useWorkspace()
  const [showCreateModal, setShowCreateModal] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading workspaces...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Error loading workspaces
      </div>
    )
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          No workspaces available
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Create Workspace
        </Button>
        <WorkspaceCreationModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSuccess={refreshWorkspaces}
        />
      </div>
    )
  }

  // Helper function to render workspace avatar
  const renderWorkspaceAvatar = (workspace: typeof currentWorkspace) => {
    if (!workspace) return null

    if (workspace.logo_url) {
      return (
        <img
          src={workspace.logo_url}
          alt={workspace.name}
          className="h-6 w-6 rounded-md object-cover"
        />
      )
    }

    // Default avatar with first letter
    const firstLetter = workspace.name.charAt(0).toUpperCase()
    return (
      <div className="h-6 w-6 rounded-md bg-purple-600 flex items-center justify-center">
        <span className="text-xs font-medium text-white">{firstLetter}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {currentWorkspace && renderWorkspaceAvatar(currentWorkspace)}
      <Select
        value={currentWorkspace?.id}
        onValueChange={selectWorkspace}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select workspace" />
        </SelectTrigger>
        <SelectContent>
          {workspaces.map((workspace) => (
            <SelectItem key={workspace.id} value={workspace.id}>
              <div className="flex items-center gap-2">
                {renderWorkspaceAvatar(workspace)}
                <div className="flex flex-col">
                  <span>{workspace.name}</span>
                  {workspace.plan && (
                    <span className="text-xs text-muted-foreground">
                      {workspace.plan} plan
                    </span>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
          <div className="border-t mt-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Workspace
            </Button>
          </div>
        </SelectContent>
      </Select>

      <WorkspaceCreationModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={refreshWorkspaces}
      />
    </div>
  )
}