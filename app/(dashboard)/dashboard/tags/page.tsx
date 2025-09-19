'use client'

import { useState } from 'react'
import { useWorkspace } from '@/contexts/workspace-context'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  MoreHorizontal,
  Tag,
  Edit,
  Merge,
  Trash,
  Palette,
  Hash,
} from 'lucide-react'
import { TagPill } from '@/components/tags/TagPill'
import { cn } from '@/lib/utils'

interface TagDialogState {
  open: boolean
  mode: 'rename' | 'merge' | 'delete' | 'color' | null
  tag: any | null
  newName?: string
  targetTagId?: string
  newColor?: string | null
}

export default function TagManagementPage() {
  const { currentWorkspace } = useWorkspace()
  const [dialogState, setDialogState] = useState<TagDialogState>({
    open: false,
    mode: null,
    tag: null,
  })
  const [searchQuery, setSearchQuery] = useState('')

  const { data: tags = [], isLoading } = trpc.tag.list.useQuery(
    { workspaceId: currentWorkspace?.id! },
    { enabled: !!currentWorkspace }
  )

  const utils = trpc.useUtils()

  const renameMutation = trpc.tag.rename.useMutation({
    onSuccess: () => {
      toast.success('Tag renamed successfully')
      utils.tag.list.invalidate()
      closeDialog()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const mergeMutation = trpc.tag.merge.useMutation({
    onSuccess: () => {
      toast.success('Tags merged successfully')
      utils.tag.list.invalidate()
      closeDialog()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = trpc.tag.delete.useMutation({
    onSuccess: () => {
      toast.success('Tag deleted successfully')
      utils.tag.list.invalidate()
      closeDialog()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const updateColorMutation = trpc.tag.updateColor.useMutation({
    onSuccess: () => {
      toast.success('Tag color updated')
      utils.tag.list.invalidate()
      closeDialog()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openDialog = (mode: TagDialogState['mode'], tag: any) => {
    setDialogState({
      open: true,
      mode,
      tag,
      newName: mode === 'rename' ? tag.name : undefined,
      newColor: mode === 'color' ? tag.color : undefined,
    })
  }

  const closeDialog = () => {
    setDialogState({
      open: false,
      mode: null,
      tag: null,
    })
  }

  const handleRename = () => {
    if (!dialogState.tag || !dialogState.newName) return

    renameMutation.mutate({
      workspaceId: currentWorkspace?.id!,
      tagId: dialogState.tag.id,
      newName: dialogState.newName,
    })
  }

  const handleMerge = () => {
    if (!dialogState.tag || !dialogState.targetTagId) return

    mergeMutation.mutate({
      workspaceId: currentWorkspace?.id!,
      sourceTagId: dialogState.tag.id,
      targetTagId: dialogState.targetTagId,
    })
  }

  const handleDelete = () => {
    if (!dialogState.tag) return

    deleteMutation.mutate({
      workspaceId: currentWorkspace?.id!,
      tagId: dialogState.tag.id,
    })
  }

  const handleUpdateColor = () => {
    if (!dialogState.tag) return

    updateColorMutation.mutate({
      workspaceId: currentWorkspace?.id!,
      tagId: dialogState.tag.id,
      color: dialogState.newColor || null,
    })
  }

  const isProcessing =
    renameMutation.isPending ||
    mergeMutation.isPending ||
    deleteMutation.isPending ||
    updateColorMutation.isPending

  const colorOptions = [
    { label: 'Default', value: null },
    { label: 'Blue', value: '#3B82F6' },
    { label: 'Green', value: '#10B981' },
    { label: 'Yellow', value: '#F59E0B' },
    { label: 'Red', value: '#EF4444' },
    { label: 'Purple', value: '#8B5CF6' },
    { label: 'Pink', value: '#EC4899' },
    { label: 'Gray', value: '#6B7280' },
  ]

  if (!currentWorkspace) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Please select a workspace</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tag Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Organize and manage your workspace tags
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tags</CardTitle>
          <CardDescription>
            {tags.length} tag{tags.length !== 1 ? 's' : ''} in this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <p className="text-gray-500">Loading tags...</p>
          ) : filteredTags.length === 0 ? (
            <p className="text-gray-500">
              {searchQuery ? 'No tags found matching your search' : 'No tags created yet'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-4">
                    <TagPill tag={tag.name} color={tag.color} removable={false} />
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Hash className="h-3 w-3" />
                      <span>{tag.usage_count} links</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => openDialog('rename', tag)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDialog('color', tag)}
                      >
                        <Palette className="h-4 w-4 mr-2" />
                        Change Color
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDialog('merge', tag)}
                      >
                        <Merge className="h-4 w-4 mr-2" />
                        Merge Into Another
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openDialog('delete', tag)}
                        className="text-red-600"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogState.open} onOpenChange={closeDialog}>
        <DialogContent>
          {dialogState.mode === 'rename' && (
            <>
              <DialogHeader>
                <DialogTitle>Rename Tag</DialogTitle>
                <DialogDescription>
                  Enter a new name for the tag "{dialogState.tag?.name}"
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="new-name">New Name</Label>
                <Input
                  id="new-name"
                  value={dialogState.newName || ''}
                  onChange={(e) =>
                    setDialogState({ ...dialogState, newName: e.target.value })
                  }
                  placeholder="Enter new tag name"
                  className="mt-2"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRename}
                  disabled={
                    isProcessing ||
                    !dialogState.newName ||
                    dialogState.newName === dialogState.tag?.name
                  }
                >
                  Rename Tag
                </Button>
              </DialogFooter>
            </>
          )}

          {dialogState.mode === 'color' && (
            <>
              <DialogHeader>
                <DialogTitle>Change Tag Color</DialogTitle>
                <DialogDescription>
                  Select a new color for "{dialogState.tag?.name}"
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="tag-color">Color</Label>
                <Select
                  value={dialogState.newColor || 'null'}
                  onValueChange={(value) =>
                    setDialogState({
                      ...dialogState,
                      newColor: value === 'null' ? null : value,
                    })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem
                        key={option.value || 'null'}
                        value={option.value || 'null'}
                      >
                        <div className="flex items-center gap-2">
                          {option.value && (
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: option.value }}
                            />
                          )}
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <TagPill
                    tag={dialogState.tag?.name}
                    color={dialogState.newColor}
                    removable={false}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateColor} disabled={isProcessing}>
                  Update Color
                </Button>
              </DialogFooter>
            </>
          )}

          {dialogState.mode === 'merge' && (
            <>
              <DialogHeader>
                <DialogTitle>Merge Tag</DialogTitle>
                <DialogDescription>
                  Merge "{dialogState.tag?.name}" into another tag. All links will be updated.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="target-tag">Target Tag</Label>
                <Select
                  value={dialogState.targetTagId}
                  onValueChange={(value) =>
                    setDialogState({ ...dialogState, targetTagId: value })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a tag to merge into" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags
                      .filter((t) => t.id !== dialogState.tag?.id)
                      .map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          <div className="flex items-center gap-2">
                            <TagPill
                              tag={tag.name}
                              color={tag.color}
                              removable={false}
                              size="sm"
                            />
                            <span className="text-sm text-gray-500">
                              ({tag.usage_count} links)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button
                  onClick={handleMerge}
                  disabled={isProcessing || !dialogState.targetTagId}
                >
                  Merge Tags
                </Button>
              </DialogFooter>
            </>
          )}

          {dialogState.mode === 'delete' && (
            <>
              <DialogHeader>
                <DialogTitle>Delete Tag</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{dialogState.tag?.name}"? This will remove the
                  tag from all {dialogState.tag?.usage_count} linked items.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isProcessing}
                >
                  Delete Tag
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}