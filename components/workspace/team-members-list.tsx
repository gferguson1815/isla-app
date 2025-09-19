'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  User,
  Shield,
  Crown,
  MoreHorizontal,
  UserMinus,
  ChevronUp,
  ChevronDown,
  Users,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/trpc/client';
import type { WorkspaceRole } from '@/packages/shared/src/types/workspace';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/lib/permissions';

interface TeamMembersListProps {
  workspaceId: string;
  currentUserRole: WorkspaceRole;
  currentUserId: string;
}

export function TeamMembersList({
  workspaceId,
  currentUserRole,
  currentUserId,
}: TeamMembersListProps) {
  const { toast } = useToast();
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    userId: string;
    currentRole: WorkspaceRole;
    name: string;
  } | null>(null);
  const utils = api.useUtils();

  const { data: members, isLoading } = api.workspace.getMembers.useQuery({
    workspaceId,
  });

  const removeMember = api.workspace.removeMember.useMutation({
    onSuccess: () => {
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the workspace',
      });
      utils.workspace.getMembers.invalidate({ workspaceId });
    },
    onError: (error) => {
      toast({
        title: 'Failed to remove member',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMemberRole = api.workspace.updateMemberRole.useMutation({
    onSuccess: () => {
      toast({
        title: 'Role updated',
        description: 'The member\'s role has been updated successfully',
      });
      utils.workspace.getMembers.invalidate({ workspaceId });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleRemove = async (userId: string) => {
    await removeMember.mutateAsync({
      userId,
      workspaceId,
    });
    setRemoveTarget(null);
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member') => {
    await updateMemberRole.mutateAsync({
      userId,
      workspaceId,
      role: newRole,
    });
    setRoleChangeTarget(null);
  };

  const getRoleBadge = (role: WorkspaceRole) => {
    switch (role) {
      case 'owner':
        return (
          <Badge variant="default" className="flex items-center gap-1 w-fit bg-purple-600">
            <Crown className="h-3 w-3" />
            Owner
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="default" className="flex items-center gap-1 w-fit">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <User className="h-3 w-3" />
            Member
          </Badge>
        );
    }
  };

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || 'U';
  };

  const permissions = usePermissions();
  const canManageMembers = permissions.hasPermission(Permission.MEMBERS_INVITE) ||
                          permissions.hasPermission(Permission.MEMBERS_REMOVE);
  const canChangeRoles = permissions.hasPermission(Permission.MEMBERS_UPDATE_ROLE);
  const canRemoveMember = (targetRole: WorkspaceRole) => permissions.canRemoveMember(targetRole);
  const canChangeRole = (targetRole: WorkspaceRole) => permissions.canChangeRole(targetRole);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your workspace team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!members || members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your workspace team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No team members yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              You're the only member of this workspace
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Team Members</span>
            <Badge variant="secondary" className="ml-2">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Manage your workspace team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {canManageMembers && (
                  <TableHead className="w-[50px]"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isCurrentUser = member.userId === currentUserId;
                const canRemove = canManageMembers &&
                  !isCurrentUser &&
                  member.role !== 'owner' &&
                  (currentUserRole === 'owner' || member.role === 'member');

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.user?.avatarUrl || undefined} />
                          <AvatarFallback>
                            {getInitials(member.user?.name, member.user?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {member.user?.name || member.user?.email}
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </p>
                          {member.user?.name && (
                            <p className="text-sm text-muted-foreground">{member.user.email}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                      </span>
                    </TableCell>
                    {canManageMembers && (
                      <TableCell>
                        {(canRemove || (canChangeRoles && member.role !== 'owner')) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {canChangeRoles && member.role !== 'owner' && (
                                <DropdownMenuItem
                                  onClick={() => setRoleChangeTarget({
                                    userId: member.userId,
                                    currentRole: member.role,
                                    name: member.user?.name || member.user?.email || 'this member',
                                  })}
                                >
                                  {member.role === 'admin' ? (
                                    <>
                                      <ChevronDown className="mr-2 h-4 w-4" />
                                      Change to Member
                                    </>
                                  ) : (
                                    <>
                                      <ChevronUp className="mr-2 h-4 w-4" />
                                      Promote to Admin
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              {canRemove && (
                                <DropdownMenuItem
                                  onClick={() => setRemoveTarget({
                                    id: member.userId,
                                    name: member.user?.name || member.user?.email || 'this member',
                                  })}
                                  className="text-destructive"
                                >
                                  <UserMinus className="mr-2 h-4 w-4" />
                                  Remove from Workspace
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removeTarget?.name} from the workspace?
              They will lose access to all workspace resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeTarget && handleRemove(removeTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!roleChangeTarget} onOpenChange={() => setRoleChangeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Member Role?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change {roleChangeTarget?.name}'s role from{' '}
              {roleChangeTarget?.currentRole} to{' '}
              {roleChangeTarget?.currentRole === 'admin' ? 'member' : 'admin'}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => roleChangeTarget && handleRoleChange(
                roleChangeTarget.userId,
                roleChangeTarget.currentRole === 'admin' ? 'member' : 'admin'
              )}
            >
              Change Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}