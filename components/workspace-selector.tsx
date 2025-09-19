'use client'

import { useWorkspace } from '@/contexts/workspace-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Loader2 } from 'lucide-react'

export function WorkspaceSelector() {
  const { currentWorkspace, workspaces, loading, error, selectWorkspace } = useWorkspace()

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
      <div className="text-sm text-muted-foreground">
        No workspaces available
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
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
              <div className="flex flex-col">
                <span>{workspace.name}</span>
                {workspace.plan && (
                  <span className="text-xs text-muted-foreground">
                    {workspace.plan} plan
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}