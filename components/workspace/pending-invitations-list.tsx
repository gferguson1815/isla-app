'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Mail,
  Clock,
  UserCheck,
  XCircle,
  RefreshCw,
  MoreHorizontal,
  Shield,
  User,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/trpc/client';
import type { WorkspaceRole } from '@/packages/shared/src/types/workspace';

interface PendingInvitationsListProps {
  workspaceId: string;
}

export function PendingInvitationsList({ workspaceId }: PendingInvitationsListProps) {
  const { toast } = useToast();
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const utils = api.useUtils();

  const { data: invitations, isLoading } = api.workspace.getPendingInvitations.useQuery({
    workspaceId,
  });

  const revokeInvitation = api.workspace.revokeInvitation.useMutation({
    onSuccess: () => {
      toast({
        title: 'Invitation revoked',
        description: 'The invitation has been revoked successfully',
      });
      utils.workspace.getPendingInvitations.invalidate({ workspaceId });
    },
    onError: (error) => {
      toast({
        title: 'Failed to revoke invitation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resendInvitation = api.workspace.resendInvitation.useMutation({
    onSuccess: () => {
      toast({
        title: 'Invitation resent',
        description: 'The invitation has been resent successfully',
      });
      utils.workspace.getPendingInvitations.invalidate({ workspaceId });
    },
    onError: (error) => {
      toast({
        title: 'Failed to resend invitation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleRevoke = async (invitationId: string) => {
    await revokeInvitation.mutateAsync({
      invitationId,
      workspaceId,
    });
    setRevokeTarget(null);
  };

  const handleResend = async (invitationId: string) => {
    await resendInvitation.mutateAsync({
      invitationId,
      workspaceId,
    });
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <Badge variant="default" className="flex items-center gap-1 w-fit">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
        <User className="h-3 w-3" />
        Member
      </Badge>
    );
  };

  const getExpirationStatus = (expiresAt: Date) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursLeft < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    if (hoursLeft < 24) {
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-300">
          <Clock className="h-3 w-3 mr-1" />
          Expires soon
        </Badge>
      );
    }

    return (
      <span className="text-sm text-muted-foreground">
        Expires {formatDistanceToNow(expiry, { addSuffix: true })}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            Manage pending invitations to your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            Manage pending invitations to your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pending invitations</p>
            <p className="text-sm text-muted-foreground mt-1">
              Invite team members to collaborate on your workspace
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
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            Manage pending invitations to your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Invited By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{invitation.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {invitation.inviter?.name || invitation.inviter?.email || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell>{getExpirationStatus(invitation.expiresAt)}</TableCell>
                  <TableCell>
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
                        <DropdownMenuItem
                          onClick={() => handleResend(invitation.id)}
                          disabled={resendInvitation.isPending}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Resend Invitation
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setRevokeTarget(invitation.id)}
                          className="text-destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Revoke Invitation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke the invitation. The user will no longer be able to
              join the workspace using this invitation link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeTarget && handleRevoke(revokeTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}