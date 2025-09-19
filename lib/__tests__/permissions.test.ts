import { describe, it, expect } from 'vitest';
import {
  Permission,
  ROLE_PERMISSIONS,
  hasPermission,
  canRemoveMember,
  canChangeRole,
  canUpdateLink,
  canDeleteLink,
  getPermissionErrorMessage,
  type PermissionContext,
} from '../permissions';
import type { WorkspaceRole } from '@/packages/shared/src/types/workspace';

describe('Permission System', () => {
  describe('ROLE_PERMISSIONS', () => {
    it('should define permissions for all roles', () => {
      expect(ROLE_PERMISSIONS.owner).toBeDefined();
      expect(ROLE_PERMISSIONS.admin).toBeDefined();
      expect(ROLE_PERMISSIONS.member).toBeDefined();
    });

    it('owner should have all permissions', () => {
      const ownerPermissions = ROLE_PERMISSIONS.owner;
      const allPermissions = Object.values(Permission);

      allPermissions.forEach(permission => {
        expect(ownerPermissions).toContain(permission);
      });
    });

    it('admin should have most permissions but not owner-only ones', () => {
      const adminPermissions = ROLE_PERMISSIONS.admin;

      expect(adminPermissions).toContain(Permission.WORKSPACE_UPDATE);
      expect(adminPermissions).toContain(Permission.MEMBERS_INVITE);
      expect(adminPermissions).toContain(Permission.LINKS_CREATE);
      expect(adminPermissions).not.toContain(Permission.WORKSPACE_DELETE);
      expect(adminPermissions).not.toContain(Permission.MEMBERS_UPDATE_ROLE);
    });

    it('member should have limited permissions', () => {
      const memberPermissions = ROLE_PERMISSIONS.member;

      expect(memberPermissions).toContain(Permission.WORKSPACE_VIEW);
      expect(memberPermissions).toContain(Permission.LINKS_CREATE);
      expect(memberPermissions).toContain(Permission.LINKS_UPDATE_OWN);
      expect(memberPermissions).not.toContain(Permission.WORKSPACE_UPDATE);
      expect(memberPermissions).not.toContain(Permission.MEMBERS_INVITE);
    });
  });

  describe('hasPermission', () => {
    it('should return true when role has permission', () => {
      const context: PermissionContext = {
        role: 'admin',
        userId: 'user-1',
        workspaceId: 'workspace-1',
      };

      expect(hasPermission(context, Permission.MEMBERS_INVITE)).toBe(true);
      expect(hasPermission(context, Permission.LINKS_CREATE)).toBe(true);
    });

    it('should return false when role lacks permission', () => {
      const context: PermissionContext = {
        role: 'member',
        userId: 'user-1',
        workspaceId: 'workspace-1',
      };

      expect(hasPermission(context, Permission.MEMBERS_INVITE)).toBe(false);
      expect(hasPermission(context, Permission.WORKSPACE_UPDATE)).toBe(false);
    });

    it('should return true for owner for all defined permissions', () => {
      const context: PermissionContext = {
        role: 'owner',
        userId: 'user-1',
        workspaceId: 'workspace-1',
      };

      expect(hasPermission(context, Permission.WORKSPACE_DELETE)).toBe(true);
      expect(hasPermission(context, Permission.WORKSPACE_UPDATE)).toBe(true);
      expect(hasPermission(context, Permission.MEMBERS_INVITE)).toBe(true);
    });
  });

  describe('canRemoveMember', () => {
    it('owner can remove any member except other owners', () => {
      expect(canRemoveMember('owner', 'admin')).toBe(true);
      expect(canRemoveMember('owner', 'member')).toBe(true);
      expect(canRemoveMember('owner', 'owner')).toBe(false);
    });

    it('admin can remove members but not admins or owners', () => {
      expect(canRemoveMember('admin', 'member')).toBe(true);
      expect(canRemoveMember('admin', 'admin')).toBe(false);
      expect(canRemoveMember('admin', 'owner')).toBe(false);
    });

    it('member cannot remove anyone', () => {
      expect(canRemoveMember('member', 'member')).toBe(false);
      expect(canRemoveMember('member', 'admin')).toBe(false);
      expect(canRemoveMember('member', 'owner')).toBe(false);
    });
  });

  describe('canChangeRole', () => {
    it('only owner can change roles', () => {
      expect(canChangeRole('owner', 'admin')).toBe(true);
      expect(canChangeRole('owner', 'member')).toBe(true);
      expect(canChangeRole('owner', 'owner')).toBe(false);
    });

    it('admin cannot change roles', () => {
      expect(canChangeRole('admin', 'member')).toBe(false);
      expect(canChangeRole('admin', 'admin')).toBe(false);
      expect(canChangeRole('admin', 'owner')).toBe(false);
    });

    it('member cannot change roles', () => {
      expect(canChangeRole('member', 'member')).toBe(false);
      expect(canChangeRole('member', 'admin')).toBe(false);
      expect(canChangeRole('member', 'owner')).toBe(false);
    });
  });

  describe('canUpdateLink', () => {
    it('owner can update any link', () => {
      expect(canUpdateLink('owner', 'other-user', 'current-user')).toBe(true);
      expect(canUpdateLink('owner', 'current-user', 'current-user')).toBe(true);
    });

    it('admin can update any link', () => {
      expect(canUpdateLink('admin', 'other-user', 'current-user')).toBe(true);
      expect(canUpdateLink('admin', 'current-user', 'current-user')).toBe(true);
    });

    it('member can only update own links', () => {
      expect(canUpdateLink('member', 'current-user', 'current-user')).toBe(true);
      expect(canUpdateLink('member', 'other-user', 'current-user')).toBe(false);
    });

    it('should handle null/undefined created_by for admin/owner', () => {
      expect(canUpdateLink('owner', null, 'current-user')).toBe(true);
      expect(canUpdateLink('admin', undefined, 'current-user')).toBe(true);
      expect(canUpdateLink('member', null, 'current-user')).toBe(false);
    });
  });

  describe('canDeleteLink', () => {
    it('owner can delete any link', () => {
      expect(canDeleteLink('owner', 'other-user', 'current-user')).toBe(true);
      expect(canDeleteLink('owner', 'current-user', 'current-user')).toBe(true);
    });

    it('admin can delete any link', () => {
      expect(canDeleteLink('admin', 'other-user', 'current-user')).toBe(true);
      expect(canDeleteLink('admin', 'current-user', 'current-user')).toBe(true);
    });

    it('member can only delete own links', () => {
      expect(canDeleteLink('member', 'current-user', 'current-user')).toBe(true);
      expect(canDeleteLink('member', 'other-user', 'current-user')).toBe(false);
    });

    it('should handle null/undefined created_by for admin/owner', () => {
      expect(canDeleteLink('owner', null, 'current-user')).toBe(true);
      expect(canDeleteLink('admin', undefined, 'current-user')).toBe(true);
      expect(canDeleteLink('member', null, 'current-user')).toBe(false);
    });
  });

  describe('getPermissionErrorMessage', () => {
    it('should return appropriate error messages for each permission', () => {
      expect(getPermissionErrorMessage(Permission.WORKSPACE_UPDATE))
        .toBe('You don\'t have permission to update this workspace');

      expect(getPermissionErrorMessage(Permission.LINKS_CREATE))
        .toBe('You don\'t have permission to create links');

      expect(getPermissionErrorMessage(Permission.MEMBERS_INVITE))
        .toBe('You don\'t have permission to invite members');
    });

    it('should return a default message for unknown permissions', () => {
      const unknownPermission = 'unknown:permission' as Permission;
      expect(getPermissionErrorMessage(unknownPermission))
        .toBe('Insufficient permissions');
    });
  });
});