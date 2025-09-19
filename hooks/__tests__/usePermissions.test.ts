import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../usePermissions';
import { Permission } from '@/lib/permissions';
import type { WorkspaceRole } from '@/packages/shared/src/types/workspace';

// Mock the workspace context
vi.mock('@/contexts/workspace-context', () => ({
  useWorkspace: vi.fn(),
}));

// Mock the auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

import { useWorkspace } from '@/contexts/workspace-context';
import { useAuth } from '@/contexts/auth-context';

describe('usePermissions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when workspace is not selected', () => {
    it('should return default permissions (no access)', () => {
      vi.mocked(useWorkspace).mockReturnValue({
        currentWorkspace: null,
        loading: false,
      } as any);

      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'user-1', email: 'user@test.com' },
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.role).toBeNull();
      expect(result.current.hasPermission(Permission.LINKS_CREATE)).toBe(false);
      expect(result.current.isOwner()).toBe(false);
      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.isMember()).toBe(false);
    });
  });

  describe('when user is owner', () => {
    beforeEach(() => {
      vi.mocked(useWorkspace).mockReturnValue({
        currentWorkspace: {
          id: 'workspace-1',
          name: 'Test Workspace',
          membership: { role: 'owner' as WorkspaceRole },
        },
        loading: false,
      } as any);

      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'user-1', email: 'owner@test.com' },
      } as any);
    });

    it('should have all permissions', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.role).toBe('owner');
      expect(result.current.hasPermission(Permission.WORKSPACE_DELETE)).toBe(true);
      expect(result.current.hasPermission(Permission.MEMBERS_UPDATE_ROLE)).toBe(true);
      expect(result.current.hasPermission(Permission.LINKS_CREATE)).toBe(true);
    });

    it('should correctly identify role', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.isOwner()).toBe(true);
      expect(result.current.isAdmin()).toBe(true); // Owner is also admin
      expect(result.current.isMember()).toBe(true); // Owner is also member
    });

    it('should be able to manage all members', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.canRemoveMember('admin')).toBe(true);
      expect(result.current.canRemoveMember('member')).toBe(true);
      expect(result.current.canRemoveMember('owner')).toBe(false);

      expect(result.current.canChangeRole('admin')).toBe(true);
      expect(result.current.canChangeRole('member')).toBe(true);
      expect(result.current.canChangeRole('owner')).toBe(false);
    });
  });

  describe('when user is admin', () => {
    beforeEach(() => {
      vi.mocked(useWorkspace).mockReturnValue({
        currentWorkspace: {
          id: 'workspace-1',
          name: 'Test Workspace',
          membership: { role: 'admin' as WorkspaceRole },
        },
        loading: false,
      } as any);

      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'user-1', email: 'admin@test.com' },
      } as any);
    });

    it('should have admin permissions but not owner permissions', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.role).toBe('admin');
      expect(result.current.hasPermission(Permission.WORKSPACE_UPDATE)).toBe(true);
      expect(result.current.hasPermission(Permission.MEMBERS_INVITE)).toBe(true);
      expect(result.current.hasPermission(Permission.WORKSPACE_DELETE)).toBe(false);
      expect(result.current.hasPermission(Permission.MEMBERS_UPDATE_ROLE)).toBe(false);
    });

    it('should correctly identify role', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.isOwner()).toBe(false);
      expect(result.current.isAdmin()).toBe(true);
      expect(result.current.isMember()).toBe(true); // Admin is also member
    });

    it('should be able to manage members but not admins', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.canRemoveMember('member')).toBe(true);
      expect(result.current.canRemoveMember('admin')).toBe(false);
      expect(result.current.canRemoveMember('owner')).toBe(false);

      expect(result.current.canChangeRole('member')).toBe(false);
      expect(result.current.canChangeRole('admin')).toBe(false);
    });
  });

  describe('when user is member', () => {
    beforeEach(() => {
      vi.mocked(useWorkspace).mockReturnValue({
        currentWorkspace: {
          id: 'workspace-1',
          name: 'Test Workspace',
          membership: { role: 'member' as WorkspaceRole },
        },
        loading: false,
      } as any);

      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'user-1', email: 'member@test.com' },
      } as any);
    });

    it('should have limited permissions', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.role).toBe('member');
      expect(result.current.hasPermission(Permission.LINKS_CREATE)).toBe(true);
      expect(result.current.hasPermission(Permission.LINKS_UPDATE_OWN)).toBe(true);
      expect(result.current.hasPermission(Permission.WORKSPACE_UPDATE)).toBe(false);
      expect(result.current.hasPermission(Permission.MEMBERS_INVITE)).toBe(false);
    });

    it('should correctly identify role', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.isOwner()).toBe(false);
      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.isMember()).toBe(true);
    });

    it('should not be able to manage any members', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.canRemoveMember('member')).toBe(false);
      expect(result.current.canRemoveMember('admin')).toBe(false);
      expect(result.current.canRemoveMember('owner')).toBe(false);

      expect(result.current.canChangeRole('member')).toBe(false);
    });
  });

  describe('link permissions', () => {
    it('should allow member to update/delete own links', () => {
      vi.mocked(useWorkspace).mockReturnValue({
        currentWorkspace: {
          id: 'workspace-1',
          membership: { role: 'member' as WorkspaceRole },
        },
        loading: false,
      } as any);

      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'user-1', email: 'member@test.com' },
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canUpdateLink('user-1')).toBe(true);
      expect(result.current.canUpdateLink('other-user')).toBe(false);
      expect(result.current.canDeleteLink('user-1')).toBe(true);
      expect(result.current.canDeleteLink('other-user')).toBe(false);
    });

    it('should allow admin to update/delete all links', () => {
      vi.mocked(useWorkspace).mockReturnValue({
        currentWorkspace: {
          id: 'workspace-1',
          membership: { role: 'admin' as WorkspaceRole },
        },
        loading: false,
      } as any);

      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'user-1', email: 'admin@test.com' },
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canUpdateLink('user-1')).toBe(true);
      expect(result.current.canUpdateLink('other-user')).toBe(true);
      expect(result.current.canDeleteLink('user-1')).toBe(true);
      expect(result.current.canDeleteLink('other-user')).toBe(true);
    });
  });

  describe('when loading', () => {
    it('should return loading state', () => {
      vi.mocked(useWorkspace).mockReturnValue({
        currentWorkspace: null,
        loading: true,
      } as any);

      vi.mocked(useAuth).mockReturnValue({
        user: null,
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.loading).toBe(true);
      expect(result.current.role).toBeNull();
    });
  });
});