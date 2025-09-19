import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { middleware } from '@/app/server/trpc';
import type { Context } from '@/app/server/trpc';
import {
  Permission,
  requirePermission,
  requireAdminRole,
  requireOwnerRole,
  requireWorkspaceAccess,
  type ServerPermissionContext,
} from '@/lib/permissions/backend';

export interface PermissionMiddlewareContext extends Context {
  permissions: {
    workspaceId: string;
    role: string;
    hasPermission: (permission: Permission) => boolean;
    requirePermission: (permission: Permission) => void;
  };
}

// NOTE: These middleware functions are not currently used but kept for future reference
// The actual permission checking is done directly in the route handlers using the permission backend functions

/*
export const withWorkspaceAccess = middleware(async ({ ctx, next, input }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  // Extract workspaceId from input - it should be a required field
  const workspaceId = (input as any)?.workspaceId;
  if (!workspaceId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Workspace ID is required',
    });
  }

  const serverCtx: ServerPermissionContext = {
    userId: ctx.userId,
    prisma: ctx.prisma,
  };

  const { role } = await requireWorkspaceAccess(serverCtx, workspaceId);

  return next({
    ctx: {
      ...ctx,
      permissions: {
        workspaceId,
        role,
        hasPermission: (permission: Permission) => {
          try {
            requirePermission(serverCtx, workspaceId, permission);
            return true;
          } catch {
            return false;
          }
        },
        requirePermission: async (permission: Permission) => {
          await requirePermission(serverCtx, workspaceId, permission);
        },
      },
    },
  });
});

export const withAdminRole = middleware(async ({ ctx, next, input }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  const workspaceId = (input as any)?.workspaceId;
  if (!workspaceId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Workspace ID is required',
    });
  }

  const serverCtx: ServerPermissionContext = {
    userId: ctx.userId,
    prisma: ctx.prisma,
  };

  const { role } = await requireAdminRole(serverCtx, workspaceId);

  return next({
    ctx: {
      ...ctx,
      permissions: {
        workspaceId,
        role,
        hasPermission: (permission: Permission) => {
          try {
            requirePermission(serverCtx, workspaceId, permission);
            return true;
          } catch {
            return false;
          }
        },
        requirePermission: async (permission: Permission) => {
          await requirePermission(serverCtx, workspaceId, permission);
        },
      },
    },
  });
});

export const withOwnerRole = middleware(async ({ ctx, next, input }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  const workspaceId = (input as any)?.workspaceId;
  if (!workspaceId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Workspace ID is required',
    });
  }

  const serverCtx: ServerPermissionContext = {
    userId: ctx.userId,
    prisma: ctx.prisma,
  };

  const { role } = await requireOwnerRole(serverCtx, workspaceId);

  return next({
    ctx: {
      ...ctx,
      permissions: {
        workspaceId,
        role,
        hasPermission: (permission: Permission) => {
          try {
            requirePermission(serverCtx, workspaceId, permission);
            return true;
          } catch {
            return false;
          }
        },
        requirePermission: async (permission: Permission) => {
          await requirePermission(serverCtx, workspaceId, permission);
        },
      },
    },
  });
});

export const withPermission = (permission: Permission) => {
  return middleware(async ({ ctx, next, input }) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }

    const workspaceId = (input as any)?.workspaceId;
    if (!workspaceId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Workspace ID is required',
      });
    }

    const serverCtx: ServerPermissionContext = {
      userId: ctx.userId,
      prisma: ctx.prisma,
    };

    const { role } = await requirePermission(serverCtx, workspaceId, permission);

    return next({
      ctx: {
        ...ctx,
        permissions: {
          workspaceId,
          role,
          hasPermission: (perm: Permission) => {
            try {
              requirePermission(serverCtx, workspaceId, perm);
              return true;
            } catch {
              return false;
            }
          },
          requirePermission: async (perm: Permission) => {
            await requirePermission(serverCtx, workspaceId, perm);
          },
        },
      },
    });
  });
};

// Helper functions to create procedures with specific permissions
export function createWorkspaceAccessProcedure() {
  return middleware(withWorkspaceAccess);
}

export function createAdminProcedure() {
  return middleware(withAdminRole);
}

export function createOwnerProcedure() {
  return middleware(withOwnerRole);
}

export function createPermissionProcedure(permission: Permission) {
  return middleware(withPermission(permission));
}
*/