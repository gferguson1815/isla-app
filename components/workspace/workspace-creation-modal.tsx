'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'

const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').max(50, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
})

type CreateWorkspaceForm = z.infer<typeof createWorkspaceSchema>

interface WorkspaceCreationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function WorkspaceCreationModal({
  open,
  onOpenChange,
  onSuccess,
}: WorkspaceCreationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateWorkspaceForm>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  })

  const createWorkspaceMutation = trpc.workspace.create.useMutation({
    onSuccess: () => {
      toast.success('Workspace created successfully')
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create workspace')
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const checkSlugMutation = trpc.workspace.checkSlug.useMutation()

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 50)

    form.setValue('slug', slug)
  }

  // Check slug availability
  const handleSlugBlur = async (slug: string) => {
    if (!slug) return

    try {
      const result = await checkSlugMutation.mutateAsync({ slug })
      if (!result.available) {
        form.setError('slug', {
          type: 'manual',
          message: 'This slug is already taken',
        })
      }
    } catch (error) {
      // Error checking slug availability
    }
  }

  const onSubmit = async (data: CreateWorkspaceForm) => {
    setIsSubmitting(true)

    // Final slug availability check
    try {
      const slugCheck = await checkSlugMutation.mutateAsync({ slug: data.slug })
      if (!slugCheck.available) {
        form.setError('slug', {
          type: 'manual',
          message: 'This slug is already taken',
        })
        setIsSubmitting(false)
        return
      }
    } catch (error) {
      toast.error('Failed to verify slug availability')
      setIsSubmitting(false)
      return
    }

    createWorkspaceMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your links and collaborate with your team.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Awesome Workspace"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        handleNameChange(e.target.value)
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be displayed throughout the workspace.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="my-awesome-workspace"
                      {...field}
                      onBlur={(e) => handleSlugBlur(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>
                    Used in URLs: app.domain.com/w/your-slug
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this workspace is for..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Workspace
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}