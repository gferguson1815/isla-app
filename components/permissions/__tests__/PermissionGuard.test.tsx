import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PermissionGuard } from '../PermissionGuard';
import { Permission } from '@/lib/permissions';
import type { WorkspaceRole } from '@/packages/shared/src/types/workspace';

// Mock the usePermissions hook
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: vi.fn(),
}));

import { usePermissions } from '@/hooks/usePermissions';

describe('PermissionGuard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('permission-based rendering', () => {
    it('should render children when user has required permission', () => {
      vi.mocked(usePermissions).mockReturnValue({
        hasPermission: (permission: Permission) => permission === Permission.LINKS_CREATE,
        isOwner: () => false,
        isAdmin: () => false,
        isMember: () => true,
        role: 'member' as WorkspaceRole,
        loading: false,
        canRemoveMember: () => false,
        canChangeRole: () => false,
        canUpdateLink: () => false,
        canDeleteLink: () => false,
      });

      render(
        <PermissionGuard permission={Permission.LINKS_CREATE}>
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not render children when user lacks required permission', () => {
      vi.mocked(usePermissions).mockReturnValue({
        hasPermission: (permission: Permission) => false,
        isOwner: () => false,
        isAdmin: () => false,
        isMember: () => true,
        role: 'member' as WorkspaceRole,
        loading: false,
        canRemoveMember: () => false,
        canChangeRole: () => false,
        canUpdateLink: () => false,
        canDeleteLink: () => false,
      });

      render(
        <PermissionGuard permission={Permission.WORKSPACE_UPDATE}>
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should render fallback when provided and user lacks permission', () => {
      vi.mocked(usePermissions).mockReturnValue({
        hasPermission: () => false,
        isOwner: () => false,
        isAdmin: () => false,
        isMember: () => true,
        role: 'member' as WorkspaceRole,
        loading: false,
        canRemoveMember: () => false,
        canChangeRole: () => false,
        canUpdateLink: () => false,
        canDeleteLink: () => false,
      });

      render(
        <PermissionGuard
          permission={Permission.WORKSPACE_UPDATE}
          fallback={<div>No Access</div>}
        >
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('No Access')).toBeInTheDocument();
    });
  });

  describe('role-based rendering', () => {
    it('should render children when requireAdmin is true and user is admin', () => {
      vi.mocked(usePermissions).mockReturnValue({
        hasPermission: () => true,
        isOwner: () => false,
        isAdmin: () => true,
        isMember: () => true,
        role: 'admin' as WorkspaceRole,
        loading: false,
        canRemoveMember: () => true,
        canChangeRole: () => false,
        canUpdateLink: () => true,
        canDeleteLink: () => true,
      });

      render(
        <PermissionGuard requireAdmin>
          <div>Admin Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    it('should not render children when requireAdmin is true and user is member', () => {
      vi.mocked(usePermissions).mockReturnValue({
        hasPermission: () => true,
        isOwner: () => false,
        isAdmin: () => false,
        isMember: () => true,
        role: 'member' as WorkspaceRole,
        loading: false,
        canRemoveMember: () => false,
        canChangeRole: () => false,
        canUpdateLink: () => false,
        canDeleteLink: () => false,
      });

      render(
        <PermissionGuard requireAdmin>
          <div>Admin Content</div>
        </PermissionGuard>
      );

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should render children when requireOwner is true and user is owner', () => {
      vi.mocked(usePermissions).mockReturnValue({
        hasPermission: () => true,
        isOwner: () => true,
        isAdmin: () => true,
        isMember: () => true,
        role: 'owner' as WorkspaceRole,
        loading: false,
        canRemoveMember: () => true,
        canChangeRole: () => true,
        canUpdateLink: () => true,
        canDeleteLink: () => true,
      });

      render(
        <PermissionGuard requireOwner>
          <div>Owner Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('Owner Content')).toBeInTheDocument();
    });

    it('should not render children when requireOwner is true and user is admin', () => {
      vi.mocked(usePermissions).mockReturnValue({
        hasPermission: () => true,
        isOwner: () => false,
        isAdmin: () => true,
        isMember: () => true,
        role: 'admin' as WorkspaceRole,
        loading: false,
        canRemoveMember: () => true,
        canChangeRole: () => false,
        canUpdateLink: () => true,
        canDeleteLink: () => true,
      });

      render(
        <PermissionGuard requireOwner>
          <div>Owner Content</div>
        </PermissionGuard>
      );

      expect(screen.queryByText('Owner Content')).not.toBeInTheDocument();
    });
  });

  describe('combined conditions', () => {
    it('should require both permission and role when both are specified', () => {
      vi.mocked(usePermissions).mockReturnValue({
        hasPermission: (permission: Permission) => permission === Permission.MEMBERS_INVITE,
        isOwner: () => false,
        isAdmin: () => true,
        isMember: () => true,
        role: 'admin' as WorkspaceRole,
        loading: false,
        canRemoveMember: () => true,
        canChangeRole: () => false,
        canUpdateLink: () => true,
        canDeleteLink: () => true,
      });

      // Should render: has permission AND is admin
      render(
        <PermissionGuard permission={Permission.MEMBERS_INVITE} requireAdmin>
          <div>Combined Content</div>
        </PermissionGuard>
      );

      expect(screen.getByText('Combined Content')).toBeInTheDocument();

      // Should not render: has permission but not owner
      render(
        <PermissionGuard permission={Permission.MEMBERS_INVITE} requireOwner>
          <div>Owner Only Content</div>
        </PermissionGuard>
      );

      expect(screen.queryByText('Owner Only Content')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should not render children while loading', () => {
      vi.mocked(usePermissions).mockReturnValue({
        hasPermission: () => true,
        hasAnyPermission: () => true,
        hasAllPermissions: () => true,
        isOwner: () => false,
        isAdmin: () => true,
        isMember: () => true,
        role: 'admin' as WorkspaceRole,
        currentRole: 'admin' as WorkspaceRole,
        userId: 'user-1',
        workspaceId: 'workspace-1',
        loading: true,
        isLoading: true, // This is what the component checks
        canManageWorkspace: true,
        canInviteMembers: true,
        canRemoveMember: () => true,
        canChangeRole: () => false,
        canUpdateLink: () => true,
        canDeleteLink: () => true,
        canPerformBulkOperations: true,
        getPermissionError: () => 'Permission denied',
      } as any);

      render(
        <PermissionGuard permission={Permission.LINKS_CREATE}>
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should render loading fallback if provided', () => {
      vi.mocked(usePermissions).mockReturnValue({
        hasPermission: () => true,
        hasAnyPermission: () => true,
        hasAllPermissions: () => true,
        isOwner: () => false,
        isAdmin: () => true,
        isMember: () => true,
        role: 'admin' as WorkspaceRole,
        currentRole: 'admin' as WorkspaceRole,
        userId: 'user-1',
        workspaceId: 'workspace-1',
        loading: true,
        isLoading: true, // This is what the component checks
        canManageWorkspace: true,
        canInviteMembers: true,
        canRemoveMember: () => true,
        canChangeRole: () => false,
        canUpdateLink: () => true,
        canDeleteLink: () => true,
        canPerformBulkOperations: true,
        getPermissionError: () => 'Permission denied',
      } as any);

      render(
        <PermissionGuard
          permission={Permission.LINKS_CREATE}
          loading={<div>Loading...</div>}
        >
          <div>Protected Content</div>
        </PermissionGuard>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('no conditions', () => {
    it('should render children when no conditions are specified', () => {
      vi.mocked(usePermissions).mockReturnValue({
        hasPermission: () => false,
        isOwner: () => false,
        isAdmin: () => false,
        isMember: () => true,
        role: 'member' as WorkspaceRole,
        loading: false,
        canRemoveMember: () => false,
        canChangeRole: () => false,
        canUpdateLink: () => false,
        canDeleteLink: () => false,
      });

      render(
        <PermissionGuard>
          <div>Always Visible</div>
        </PermissionGuard>
      );

      expect(screen.getByText('Always Visible')).toBeInTheDocument();
    });
  });
});