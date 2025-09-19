'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TagInput } from './TagInput'
import { TagPill } from './TagPill'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { Plus, Minus } from 'lucide-react'

interface BulkTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  linkIds: string[]
  workspaceId: string
  mode: 'add' | 'remove'
  onSuccess?: () => void
}

export function BulkTagDialog({
  open,
  onOpenChange,
  linkIds,
  workspaceId,
  mode,
  onSuccess,
}: BulkTagDialogProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const utils = trpc.useUtils()

  const bulkAddTags = trpc.link.bulkAddTags.useMutation({
    onSuccess: () => {
      toast.success(`Tags added to ${linkIds.length} links`)
      utils.link.list.invalidate()
      onOpenChange(false)
      setSelectedTags([])
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const bulkRemoveTags = trpc.link.bulkRemoveTags.useMutation({
    onSuccess: () => {
      toast.success(`Tags removed from ${linkIds.length} links`)
      utils.link.list.invalidate()
      onOpenChange(false)
      setSelectedTags([])
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = () => {
    if (selectedTags.length === 0) {
      toast.error('Please select at least one tag')
      return
    }

    if (mode === 'add') {
      bulkAddTags.mutate({
        linkIds,
        tags: selectedTags,
      })
    } else {
      bulkRemoveTags.mutate({
        linkIds,
        tags: selectedTags,
      })
    }
  }

  const isLoading = bulkAddTags.isPending || bulkRemoveTags.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? (
              <>
                <Plus className="inline h-4 w-4 mr-2" />
                Add Tags to {linkIds.length} Links
              </>
            ) : (
              <>
                <Minus className="inline h-4 w-4 mr-2" />
                Remove Tags from {linkIds.length} Links
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Select tags to add to the selected links. Duplicate tags will be ignored.'
              : 'Select tags to remove from the selected links.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <TagInput
            workspaceId={workspaceId}
            value={selectedTags}
            onChange={setSelectedTags}
            placeholder={mode === 'add' ? 'Add tags...' : 'Select tags to remove...'}
            disabled={isLoading}
          />

          {selectedTags.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Selected tags ({selectedTags.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <TagPill
                    key={tag}
                    tag={tag}
                    onRemove={(t) =>
                      setSelectedTags(selectedTags.filter((tag) => tag !== t))
                    }
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || selectedTags.length === 0}>
            {isLoading
              ? 'Processing...'
              : mode === 'add'
              ? `Add ${selectedTags.length} Tag${selectedTags.length !== 1 ? 's' : ''}`
              : `Remove ${selectedTags.length} Tag${selectedTags.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}