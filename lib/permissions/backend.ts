import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';
import type { WorkspaceRole } from '@/packages/shared/src/types/workspace';
import {
  Permission,
  hasPermission,
  canRemoveMember,
  canChangeRole,
  canUpdateLink,
  canDeleteLink,
  getPermissionErrorMessage,
  type PermissionContext,
} from './index';

// Re-export Permission for external use
export { Permission } from './index';

export interface ServerPermissionContext {
  userId: string;
  prisma: PrismaClient;
}

export async function getUserWorkspaceMembership(
  ctx: ServerPermissionContext,
  workspaceId: string
) {
  const membership = await ctx.prisma.workspace_memberships.findFirst({
    where: {
      user_id: ctx.userId,
      workspace_id: workspaceId,
      workspaces: {
        deleted_at: null, // Ensure workspace is not soft-deleted
      },
    },
    include: {
      workspaces: {
        select: {
          id: true,
          name: true,
          deleted_at: true,
        },
      },
    },
  });

  return membership;
}

export async function requireWorkspaceAccess(
  ctx: ServerPermissionContext,
  workspaceId: string
): Promise<{ role: WorkspaceRole; membership: any }> {
  const membership = await getUserWorkspaceMembership(ctx, workspaceId);

  if (!membership) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this workspace',
    });
  }

  return {
    role: membership.role as WorkspaceRole,
    membership,
  };
}

export async function requirePermission(
  ctx: ServerPermissionContext,
  workspaceId: string,
  permission: Permission
): Promise<PermissionContext> {
  const { role } = await requireWorkspaceAccess(ctx, workspaceId);

  const permissionContext: PermissionContext = {
    role,
    userId: ctx.userId,
    workspaceId,
  };

  if (!hasPermission(permissionContext, permission)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: getPermissionErrorMessage(permission),
    });
  }

  return permissionContext;
}

export async function requireAnyPermission(
  ctx: ServerPermissionContext,
  workspaceId: string,
  permissions: Permission[]
): Promise<PermissionContext> {
  const { role } = await requireWorkspaceAccess(ctx, workspaceId);

  const permissionContext: PermissionContext = {
    role,
    userId: ctx.userId,
    workspaceId,
  };

  const hasAnyPermission = permissions.some(permission =>
    hasPermission(permissionContext, permission)
  );

  if (!hasAnyPermission) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Insufficient permissions for this operation',
    });
  }

  return permissionContext;
}

export async function requireAdminRole(
  ctx: ServerPermissionContext,
  workspaceId: string
): Promise<PermissionContext> {
  const { role } = await requireWorkspaceAccess(ctx, workspaceId);

  if (role !== 'owner' && role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only workspace owners and admins can perform this action',
    });
  }

  return {
    role,
    userId: ctx.userId,
    workspaceId,
  };
}

export async function requireOwnerRole(
  ctx: ServerPermissionContext,
  workspaceId: string
): Promise<PermissionContext> {
  const { role } = await requireWorkspaceAccess(ctx, workspaceId);

  if (role !== 'owner') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only workspace owners can perform this action',
    });
  }

  return {
    role,
    userId: ctx.userId,
    workspaceId,
  };
}

export async function requireLinkOwnership(
  ctx: ServerPermissionContext,
  linkId: string,
  workspaceId?: string
): Promise<{ link: any; canUpdate: boolean; canDelete: boolean }> {
  const link = await ctx.prisma.links.findFirst({
    where: {
      id: linkId,
      ...(workspaceId && { workspace_id: workspaceId }),
    },
    include: {
      workspaces: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!link) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Link not found',
    });
  }

  // Get user's role in the workspace
  const { role } = await requireWorkspaceAccess(ctx, link.workspace_id);

  // Check permissions based on role and ownership
  const canUpdate = canUpdateLink(role, link.created_by, ctx.userId);
  const canDelete = canDeleteLink(role, link.created_by, ctx.userId);

  return { link, canUpdate, canDelete };
}

export async function requireMemberManagementPermission(
  ctx: ServerPermissionContext,
  workspaceId: string,
  targetUserId: string,
  action: 'remove' | 'changeRole'
): Promise<{ currentRole: WorkspaceRole; targetRole: WorkspaceRole }> {
  // Get current user's role
  const { role: currentRole } = await requireWorkspaceAccess(ctx, workspaceId);

  // Get target user's role
  const targetMembership = await ctx.prisma.workspace_memberships.findFirst({
    where: {
      user_id: targetUserId,
      workspace_id: workspaceId,
    },
  });

  if (!targetMembership) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Target user is not a member of this workspace',
    });
  }

  const targetRole = targetMembership.role as WorkspaceRole;

  // Check permissions based on action
  if (action === 'remove') {
    if (!canRemoveMember(currentRole, targetRole)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to remove this member',
      });
    }
  } else if (action === 'changeRole') {
    if (!canChangeRole(currentRole, targetRole)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to change this member\'s role',
      });
    }
  }

  return { currentRole, targetRole };
}

export function createPermissionCheck(permission: Permission) {
  return async (ctx: ServerPermissionContext, workspaceId: string) => {
    return requirePermission(ctx, workspaceId, permission);
  };
}

export function createAdminCheck() {
  return async (ctx: ServerPermissionContext, workspaceId: string) => {
    return requireAdminRole(ctx, workspaceId);
  };
}

export function createOwnerCheck() {
  return async (ctx: ServerPermissionContext, workspaceId: string) => {
    return requireOwnerRole(ctx, workspaceId);
  };
}