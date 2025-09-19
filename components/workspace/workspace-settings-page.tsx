'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Loader2, Trash2, Save, Users, UserPlus } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { useWorkspace } from '@/contexts/workspace-context'
import { InviteMembersModal } from './invite-members-modal'
import { TeamMembersList } from './team-members-list'
import { PendingInvitationsList } from './pending-invitations-list'
import { useAuth } from '@/contexts/auth-context'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/permissions'
import { PermissionGuard } from '@/components/permissions/PermissionGuard'
import type { WorkspaceWithMembership } from '@/packages/shared/src/types/workspace'

const updateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Name too long'),
  domain: z.string().optional(),
})

type UpdateWorkspaceForm = z.infer<typeof updateWorkspaceSchema>

interface WorkspaceSettingsPageProps {
  workspace: WorkspaceWithMembership
}

export function WorkspaceSettingsPage({ workspace }: WorkspaceSettingsPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const { refreshWorkspaces } = useWorkspace()
  const { user } = useAuth()
  const { hasPermission, isOwner: checkIsOwner } = usePermissions()

  const form = useForm<UpdateWorkspaceForm>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      name: workspace.name,
      domain: workspace.domain || '',
    },
  })

  const updateWorkspaceMutation = trpc.workspace.update.useMutation({
    onSuccess: () => {
      toast.success('Workspace updated successfully')
      refreshWorkspaces()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update workspace')
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const deleteWorkspaceMutation = trpc.workspace.delete.useMutation({
    onSuccess: () => {
      toast.success('Workspace deleted successfully')
      refreshWorkspaces()
      // Redirect to dashboard or first available workspace
      window.location.href = '/'
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete workspace')
    },
    onSettled: () => {
      setIsDeleting(false)
    },
  })

  const onSubmit = async (data: UpdateWorkspaceForm) => {
    setIsSubmitting(true)
    updateWorkspaceMutation.mutate({
      workspaceId: workspace.id,
      ...data,
    })
  }

  const handleDeleteWorkspace = async () => {
    setIsDeleting(true)
    deleteWorkspaceMutation.mutate({
      workspaceId: workspace.id,
    })
  }

  const canUpdateWorkspace = hasPermission(Permission.WORKSPACE_UPDATE)
  const canInviteMembers = hasPermission(Permission.MEMBERS_INVITE)
  const canDeleteWorkspace = hasPermission(Permission.WORKSPACE_DELETE)
  const isOwner = checkIsOwner()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Workspace Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your workspace settings and preferences.
        </p>
      </div>
      <Separator />

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Update your workspace name and basic information.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                        disabled={!canUpdateWorkspace}
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
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Domain (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="links.yourdomain.com"
                        {...field}
                        disabled={!canUpdateWorkspace}
                      />
                    </FormControl>
                    <FormDescription>
                      Custom domain for your short links. Contact support to set this up.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {canUpdateWorkspace && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Workspace Info */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Information</CardTitle>
          <CardDescription>
            Read-only information about your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Workspace ID</label>
              <div className="text-sm text-muted-foreground font-mono">{workspace.id}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <div className="text-sm text-muted-foreground font-mono">{workspace.slug}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Plan</label>
              <div className="text-sm text-muted-foreground capitalize">{workspace.plan}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Your Role</label>
              <div className="text-sm text-muted-foreground capitalize">{workspace.membership.role}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Created</label>
              <div className="text-sm text-muted-foreground">
                {new Date(workspace.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Members</label>
              <div className="text-sm text-muted-foreground">
                {workspace._count?.members || 0} / {workspace.maxUsers}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Management
            </span>
            {canInviteMembers && (
              <Button
                onClick={() => setShowInviteModal(true)}
                size="sm"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Members
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Manage team members and pending invitations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <TeamMembersList
            workspaceId={workspace.id}
            currentUserRole={workspace.membership.role}
            currentUserId={user?.id || ''}
          />
          {canInviteMembers && (
            <PendingInvitationsList workspaceId={workspace.id} />
          )}
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>
            Current usage statistics for your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Links Created</label>
              <div className="text-sm text-muted-foreground">
                {workspace._count?.links || 0} / {workspace.maxLinks}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(((workspace._count?.links || 0) / workspace.maxLinks) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Monthly Clicks</label>
              <div className="text-sm text-muted-foreground">
                0 / {workspace.maxClicks}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {canDeleteWorkspace && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that will affect your workspace permanently.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Workspace
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    workspace "{workspace.name}" and all associated data including
                    links, analytics, and team members.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteWorkspace}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete Workspace
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Invite Modal */}
      <InviteMembersModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        workspaceId={workspace.id}
        currentMemberCount={workspace._count?.members || 0}
        maxUsers={workspace.maxUsers}
      />
    </div>
  )
}