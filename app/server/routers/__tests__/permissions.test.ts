import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import {
  getUserWorkspaceMembership,
  requireWorkspaceAccess,
  requirePermission,
  requireAdminRole,
  requireOwnerRole,
  requireLinkOwnership,
  requireMemberManagementPermission,
  Permission,
  type ServerPermissionContext,
} from '@/lib/permissions/backend';

// Mock Prisma Client
const mockPrisma = {
  workspace_memberships: {
    findFirst: vi.fn(),
  },
  links: {
    findFirst: vi.fn(),
  },
};

describe('Backend Permission Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserWorkspaceMembership', () => {
    it('should fetch user workspace membership', async () => {
      const mockMembership = {
        id: 'membership-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'admin',
        workspaces: { id: 'workspace-1', name: 'Test Workspace', deleted_at: null },
      };

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(mockMembership);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      const membership = await getUserWorkspaceMembership(ctx, 'workspace-1');

      expect(membership).toEqual(mockMembership);
      expect(mockPrisma.workspace_memberships.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: 'user-1',
          workspace_id: 'workspace-1',
          workspaces: { deleted_at: null },
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
    });

    it('should return null if membership not found', async () => {
      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(null);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      const membership = await getUserWorkspaceMembership(ctx, 'workspace-1');

      expect(membership).toBeNull();
    });
  });

  describe('requireWorkspaceAccess', () => {
    it('should return role and membership when user has access', async () => {
      const mockMembership = {
        id: 'membership-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'admin',
        workspaces: { id: 'workspace-1', name: 'Test Workspace', deleted_at: null },
      };

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(mockMembership);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      const result = await requireWorkspaceAccess(ctx, 'workspace-1');

      expect(result.role).toBe('admin');
      expect(result.membership).toEqual(mockMembership);
    });

    it('should throw error when user lacks access', async () => {
      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(null);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      await expect(requireWorkspaceAccess(ctx, 'workspace-1'))
        .rejects
        .toThrow(TRPCError);

      await expect(requireWorkspaceAccess(ctx, 'workspace-1'))
        .rejects
        .toMatchObject({
          code: 'FORBIDDEN',
          message: 'You do not have access to this workspace',
        });
    });
  });

  describe('requirePermission', () => {
    it('should pass when user has required permission', async () => {
      const mockMembership = {
        id: 'membership-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'admin',
        workspaces: { id: 'workspace-1', name: 'Test Workspace', deleted_at: null },
      };

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(mockMembership);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      const result = await requirePermission(ctx, 'workspace-1', Permission.MEMBERS_INVITE);

      expect(result.role).toBe('admin');
      expect(result.userId).toBe('user-1');
      expect(result.workspaceId).toBe('workspace-1');
    });

    it('should throw error when user lacks required permission', async () => {
      const mockMembership = {
        id: 'membership-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'member',
        workspaces: { id: 'workspace-1', name: 'Test Workspace', deleted_at: null },
      };

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(mockMembership);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      await expect(requirePermission(ctx, 'workspace-1', Permission.MEMBERS_INVITE))
        .rejects
        .toThrow(TRPCError);

      await expect(requirePermission(ctx, 'workspace-1', Permission.MEMBERS_INVITE))
        .rejects
        .toMatchObject({
          code: 'FORBIDDEN',
        });
    });
  });

  describe('requireAdminRole', () => {
    it('should pass for owner', async () => {
      const mockMembership = {
        id: 'membership-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'owner',
        workspaces: { id: 'workspace-1', name: 'Test Workspace', deleted_at: null },
      };

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(mockMembership);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      const result = await requireAdminRole(ctx, 'workspace-1');

      expect(result.role).toBe('owner');
    });

    it('should pass for admin', async () => {
      const mockMembership = {
        id: 'membership-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'admin',
        workspaces: { id: 'workspace-1', name: 'Test Workspace', deleted_at: null },
      };

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(mockMembership);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      const result = await requireAdminRole(ctx, 'workspace-1');

      expect(result.role).toBe('admin');
    });

    it('should throw error for member', async () => {
      const mockMembership = {
        id: 'membership-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'member',
        workspaces: { id: 'workspace-1', name: 'Test Workspace', deleted_at: null },
      };

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(mockMembership);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      await expect(requireAdminRole(ctx, 'workspace-1'))
        .rejects
        .toThrow(TRPCError);

      await expect(requireAdminRole(ctx, 'workspace-1'))
        .rejects
        .toMatchObject({
          code: 'FORBIDDEN',
          message: 'Only workspace owners and admins can perform this action',
        });
    });
  });

  describe('requireOwnerRole', () => {
    it('should pass for owner', async () => {
      const mockMembership = {
        id: 'membership-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'owner',
        workspaces: { id: 'workspace-1', name: 'Test Workspace', deleted_at: null },
      };

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(mockMembership);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      const result = await requireOwnerRole(ctx, 'workspace-1');

      expect(result.role).toBe('owner');
    });

    it('should throw error for admin', async () => {
      const mockMembership = {
        id: 'membership-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'admin',
        workspaces: { id: 'workspace-1', name: 'Test Workspace', deleted_at: null },
      };

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(mockMembership);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      await expect(requireOwnerRole(ctx, 'workspace-1'))
        .rejects
        .toThrow(TRPCError);

      await expect(requireOwnerRole(ctx, 'workspace-1'))
        .rejects
        .toMatchObject({
          code: 'FORBIDDEN',
          message: 'Only workspace owners can perform this action',
        });
    });
  });

  describe('requireLinkOwnership', () => {
    beforeEach(() => {
      const mockMembership = {
        id: 'membership-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'member',
        workspaces: { id: 'workspace-1', name: 'Test Workspace', deleted_at: null },
      };

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(mockMembership);
    });

    it('should return link and permissions for link owner', async () => {
      const mockLink = {
        id: 'link-1',
        workspace_id: 'workspace-1',
        created_by: 'user-1',
        url: 'https://example.com',
        slug: 'test',
        workspaces: { id: 'workspace-1', name: 'Test Workspace' },
      };

      mockPrisma.links.findFirst.mockResolvedValue(mockLink);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      const result = await requireLinkOwnership(ctx, 'link-1', 'workspace-1');

      expect(result.link).toEqual(mockLink);
      expect(result.canUpdate).toBe(true);
      expect(result.canDelete).toBe(true);
    });

    it('should deny update/delete for non-owner member', async () => {
      const mockLink = {
        id: 'link-1',
        workspace_id: 'workspace-1',
        created_by: 'other-user',
        url: 'https://example.com',
        slug: 'test',
        workspaces: { id: 'workspace-1', name: 'Test Workspace' },
      };

      mockPrisma.links.findFirst.mockResolvedValue(mockLink);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      const result = await requireLinkOwnership(ctx, 'link-1', 'workspace-1');

      expect(result.link).toEqual(mockLink);
      expect(result.canUpdate).toBe(false);
      expect(result.canDelete).toBe(false);
    });

    it('should allow admin to update/delete any link', async () => {
      const mockLink = {
        id: 'link-1',
        workspace_id: 'workspace-1',
        created_by: 'other-user',
        url: 'https://example.com',
        slug: 'test',
        workspaces: { id: 'workspace-1', name: 'Test Workspace' },
      };

      const adminMembership = {
        id: 'membership-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'admin',
        workspaces: { id: 'workspace-1', name: 'Test Workspace', deleted_at: null },
      };

      mockPrisma.links.findFirst.mockResolvedValue(mockLink);
      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(adminMembership);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      const result = await requireLinkOwnership(ctx, 'link-1', 'workspace-1');

      expect(result.link).toEqual(mockLink);
      expect(result.canUpdate).toBe(true);
      expect(result.canDelete).toBe(true);
    });

    it('should throw error if link not found', async () => {
      mockPrisma.links.findFirst.mockResolvedValue(null);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      await expect(requireLinkOwnership(ctx, 'link-1', 'workspace-1'))
        .rejects
        .toThrow(TRPCError);

      await expect(requireLinkOwnership(ctx, 'link-1', 'workspace-1'))
        .rejects
        .toMatchObject({
          code: 'NOT_FOUND',
          message: 'Link not found',
        });
    });
  });

  describe('requireMemberManagementPermission', () => {
    it('should allow owner to remove admin', async () => {
      const ownerMembership = {
        id: 'membership-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'owner',
        workspaces: { id: 'workspace-1', name: 'Test Workspace', deleted_at: null },
      };

      const targetMembership = {
        id: 'membership-2',
        user_id: 'user-2',
        workspace_id: 'workspace-1',
        role: 'admin',
      };

      mockPrisma.workspace_memberships.findFirst
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(targetMembership);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      const result = await requireMemberManagementPermission(
        ctx,
        'workspace-1',
        'user-2',
        'remove'
      );

      expect(result.currentRole).toBe('owner');
      expect(result.targetRole).toBe('admin');
    });

    it('should deny admin removing another admin', async () => {
      const adminMembership = {
        id: 'membership-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'admin',
        workspaces: { id: 'workspace-1', name: 'Test Workspace', deleted_at: null },
      };

      const targetMembership = {
        id: 'membership-2',
        user_id: 'user-2',
        workspace_id: 'workspace-1',
        role: 'admin',
      };

      mockPrisma.workspace_memberships.findFirst
        .mockResolvedValueOnce(adminMembership)
        .mockResolvedValueOnce(targetMembership);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      await expect(
        requireMemberManagementPermission(ctx, 'workspace-1', 'user-2', 'remove')
      ).rejects.toThrow(TRPCError);
    });

    it('should allow admin to remove member', async () => {
      const adminMembership = {
        id: 'membership-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'admin',
        workspaces: { id: 'workspace-1', name: 'Test Workspace', deleted_at: null },
      };

      const targetMembership = {
        id: 'membership-2',
        user_id: 'user-2',
        workspace_id: 'workspace-1',
        role: 'member',
      };

      mockPrisma.workspace_memberships.findFirst
        .mockResolvedValueOnce(adminMembership)
        .mockResolvedValueOnce(targetMembership);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      const result = await requireMemberManagementPermission(
        ctx,
        'workspace-1',
        'user-2',
        'remove'
      );

      expect(result.currentRole).toBe('admin');
      expect(result.targetRole).toBe('member');
    });

    it('should deny admin changing roles', async () => {
      const adminMembership = {
        id: 'membership-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'admin',
        workspaces: { id: 'workspace-1', name: 'Test Workspace', deleted_at: null },
      };

      const targetMembership = {
        id: 'membership-2',
        user_id: 'user-2',
        workspace_id: 'workspace-1',
        role: 'member',
      };

      mockPrisma.workspace_memberships.findFirst
        .mockResolvedValueOnce(adminMembership)
        .mockResolvedValueOnce(targetMembership);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      await expect(
        requireMemberManagementPermission(ctx, 'workspace-1', 'user-2', 'changeRole')
      ).rejects.toThrow(TRPCError);
    });

    it('should allow owner to change roles', async () => {
      const ownerMembership = {
        id: 'membership-1',
        user_id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'owner',
        workspaces: { id: 'workspace-1', name: 'Test Workspace', deleted_at: null },
      };

      const targetMembership = {
        id: 'membership-2',
        user_id: 'user-2',
        workspace_id: 'workspace-1',
        role: 'member',
      };

      mockPrisma.workspace_memberships.findFirst
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(targetMembership);

      const ctx: ServerPermissionContext = {
        userId: 'user-1',
        prisma: mockPrisma as any,
      };

      const result = await requireMemberManagementPermission(
        ctx,
        'workspace-1',
        'user-2',
        'changeRole'
      );

      expect(result.currentRole).toBe('owner');
      expect(result.targetRole).toBe('member');
    });
  });
});