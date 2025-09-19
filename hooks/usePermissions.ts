import { useMemo } from 'react';
import { useWorkspace } from '@/contexts/workspace-context';
import { useAuth } from '@/contexts/auth-context';
import type { WorkspaceRole } from '@/packages/shared/src/types/workspace';
import {
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canManageWorkspace,
  canInviteMembers,
  canRemoveMember,
  canChangeRole,
  canUpdateLink,
  canDeleteLink,
  canPerformBulkOperations,
  getPermissionErrorMessage,
  type PermissionContext,
} from '@/lib/permissions';

export interface UsePermissionsReturn {
  // Core permission checking
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;

  // Convenience methods for common permissions
  canManageWorkspace: boolean;
  canInviteMembers: boolean;
  canRemoveMember: (targetRole: WorkspaceRole) => boolean;
  canChangeRole: (targetRole: WorkspaceRole) => boolean;
  canUpdateLink: (linkOwnerId: string) => boolean;
  canDeleteLink: (linkOwnerId: string) => boolean;
  canPerformBulkOperations: boolean;

  // Current user context
  currentRole: WorkspaceRole | null;
  role: WorkspaceRole | null; // Alias for currentRole for backwards compatibility
  userId: string | null;
  workspaceId: string | null;

  // Role helpers
  isOwner: () => boolean;
  isAdmin: () => boolean;
  isMember: () => boolean;

  // Error messages
  getPermissionError: (permission: Permission) => string;

  // Loading state
  isLoading: boolean;
  loading: boolean; // Alias for isLoading for backwards compatibility
}

export function usePermissions(): UsePermissionsReturn {
  const { currentWorkspace, loading } = useWorkspace();
  const { user } = useAuth();

  const permissionContext = useMemo((): PermissionContext | null => {
    if (!currentWorkspace?.membership || !user) {
      return null;
    }

    return {
      role: currentWorkspace.membership.role,
      userId: user.id,
      workspaceId: currentWorkspace.id,
    };
  }, [currentWorkspace, user]);

  const currentRole = permissionContext?.role || null;
  const userId = user?.id || null;
  const workspaceId = currentWorkspace?.id || null;

  // Memoized permission functions
  const permissionCheckers = useMemo(() => {
    if (!permissionContext) {
      return {
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasAllPermissions: () => false,
        canManageWorkspace: false,
        canInviteMembers: false,
        canRemoveMember: () => false,
        canChangeRole: () => false,
        canUpdateLink: () => false,
        canDeleteLink: () => false,
        canPerformBulkOperations: false,
      };
    }

    return {
      hasPermission: (permission: Permission) => hasPermission(permissionContext, permission),
      hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(permissionContext, permissions),
      hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(permissionContext, permissions),
      canManageWorkspace: canManageWorkspace(permissionContext.role),
      canInviteMembers: canInviteMembers(permissionContext.role),
      canRemoveMember: (targetRole: WorkspaceRole) => canRemoveMember(permissionContext.role, targetRole),
      canChangeRole: (targetRole: WorkspaceRole) => canChangeRole(permissionContext.role, targetRole),
      canUpdateLink: (linkOwnerId: string) => canUpdateLink(permissionContext.role, linkOwnerId, permissionContext.userId),
      canDeleteLink: (linkOwnerId: string) => canDeleteLink(permissionContext.role, linkOwnerId, permissionContext.userId),
      canPerformBulkOperations: canPerformBulkOperations(permissionContext.role),
    };
  }, [permissionContext]);

  // Role helper functions
  const isOwner = () => currentRole === 'owner';
  const isAdmin = () => currentRole === 'admin' || currentRole === 'owner';
  const isMember = () => currentRole === 'member' || currentRole === 'admin' || currentRole === 'owner';

  return {
    ...permissionCheckers,
    currentRole,
    role: currentRole, // Alias for backwards compatibility
    userId,
    workspaceId,
    isOwner,
    isAdmin,
    isMember,
    getPermissionError: getPermissionErrorMessage,
    isLoading: loading,
    loading, // Alias for backwards compatibility
  };
}

export default usePermissions;