import type { WorkspaceRole } from '@/packages/shared/src/types/workspace';

export enum Permission {
  // Workspace management
  WORKSPACE_UPDATE = 'workspace:update',
  WORKSPACE_DELETE = 'workspace:delete',
  WORKSPACE_VIEW = 'workspace:view',

  // Member management
  MEMBERS_INVITE = 'members:invite',
  MEMBERS_REMOVE = 'members:remove',
  MEMBERS_UPDATE_ROLE = 'members:updateRole',
  MEMBERS_VIEW = 'members:view',

  // Link management
  LINKS_CREATE = 'links:create',
  LINKS_UPDATE_ANY = 'links:updateAny',
  LINKS_UPDATE_OWN = 'links:updateOwn',
  LINKS_DELETE_ANY = 'links:deleteAny',
  LINKS_DELETE_OWN = 'links:deleteOwn',
  LINKS_VIEW = 'links:view',
  LINKS_BULK_OPERATIONS = 'links:bulkOperations',

  // Invitations
  INVITATIONS_SEND = 'invitations:send',
  INVITATIONS_REVOKE = 'invitations:revoke',
  INVITATIONS_VIEW = 'invitations:view',
}

export const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  owner: [
    // All permissions for workspace owners
    Permission.WORKSPACE_UPDATE,
    Permission.WORKSPACE_DELETE,
    Permission.WORKSPACE_VIEW,
    Permission.MEMBERS_INVITE,
    Permission.MEMBERS_REMOVE,
    Permission.MEMBERS_UPDATE_ROLE,
    Permission.MEMBERS_VIEW,
    Permission.LINKS_CREATE,
    Permission.LINKS_UPDATE_ANY,
    Permission.LINKS_UPDATE_OWN,
    Permission.LINKS_DELETE_ANY,
    Permission.LINKS_DELETE_OWN,
    Permission.LINKS_VIEW,
    Permission.LINKS_BULK_OPERATIONS,
    Permission.INVITATIONS_SEND,
    Permission.INVITATIONS_REVOKE,
    Permission.INVITATIONS_VIEW,
  ],
  admin: [
    // Admin permissions - cannot delete workspace or update owner roles
    Permission.WORKSPACE_UPDATE,
    Permission.WORKSPACE_VIEW,
    Permission.MEMBERS_INVITE,
    Permission.MEMBERS_REMOVE, // Can remove members but not other admins/owner
    Permission.MEMBERS_VIEW,
    Permission.LINKS_CREATE,
    Permission.LINKS_UPDATE_ANY,
    Permission.LINKS_UPDATE_OWN,
    Permission.LINKS_DELETE_ANY,
    Permission.LINKS_DELETE_OWN,
    Permission.LINKS_VIEW,
    Permission.LINKS_BULK_OPERATIONS,
    Permission.INVITATIONS_SEND,
    Permission.INVITATIONS_REVOKE,
    Permission.INVITATIONS_VIEW,
  ],
  member: [
    // Member permissions - limited to own content and viewing
    Permission.WORKSPACE_VIEW,
    Permission.MEMBERS_VIEW,
    Permission.LINKS_CREATE,
    Permission.LINKS_UPDATE_OWN,
    Permission.LINKS_DELETE_OWN,
    Permission.LINKS_VIEW,
  ],
};

export interface PermissionContext {
  role: WorkspaceRole;
  userId: string;
  workspaceId: string;
}

export function hasPermission(
  context: PermissionContext,
  permission: Permission
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[context.role];
  return rolePermissions.includes(permission);
}

export function hasAnyPermission(
  context: PermissionContext,
  permissions: Permission[]
): boolean {
  return permissions.some(permission => hasPermission(context, permission));
}

export function hasAllPermissions(
  context: PermissionContext,
  permissions: Permission[]
): boolean {
  return permissions.every(permission => hasPermission(context, permission));
}

export function canManageWorkspace(role: WorkspaceRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canInviteMembers(role: WorkspaceRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canRemoveMember(
  currentUserRole: WorkspaceRole,
  targetUserRole: WorkspaceRole
): boolean {
  if (currentUserRole === 'owner') {
    // Owners can remove anyone except themselves (handled elsewhere)
    return targetUserRole !== 'owner';
  }
  if (currentUserRole === 'admin') {
    // Admins can only remove members
    return targetUserRole === 'member';
  }
  return false;
}

export function canChangeRole(
  currentUserRole: WorkspaceRole,
  targetUserRole: WorkspaceRole
): boolean {
  // Only owners can change roles
  if (currentUserRole !== 'owner') {
    return false;
  }
  // Cannot change owner role
  return targetUserRole !== 'owner';
}

export function canUpdateLink(
  userRole: WorkspaceRole,
  linkOwnerId: string,
  currentUserId: string
): boolean {
  if (userRole === 'owner' || userRole === 'admin') {
    return true; // Can update any link
  }
  if (userRole === 'member') {
    return linkOwnerId === currentUserId; // Can only update own links
  }
  return false;
}

export function canDeleteLink(
  userRole: WorkspaceRole,
  linkOwnerId: string,
  currentUserId: string
): boolean {
  if (userRole === 'owner' || userRole === 'admin') {
    return true; // Can delete any link
  }
  if (userRole === 'member') {
    return linkOwnerId === currentUserId; // Can only delete own links
  }
  return false;
}

export function canPerformBulkOperations(role: WorkspaceRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function getPermissionErrorMessage(permission: Permission): string {
  const messages: Record<Permission, string> = {
    [Permission.WORKSPACE_UPDATE]: 'You don\'t have permission to update this workspace',
    [Permission.WORKSPACE_DELETE]: 'Only workspace owners can delete workspaces',
    [Permission.WORKSPACE_VIEW]: 'You don\'t have permission to view this workspace',
    [Permission.MEMBERS_INVITE]: 'You don\'t have permission to invite members',
    [Permission.MEMBERS_REMOVE]: 'You don\'t have permission to remove members',
    [Permission.MEMBERS_UPDATE_ROLE]: 'You don\'t have permission to update member roles',
    [Permission.MEMBERS_VIEW]: 'You don\'t have permission to view members',
    [Permission.LINKS_CREATE]: 'You don\'t have permission to create links',
    [Permission.LINKS_UPDATE_ANY]: 'You don\'t have permission to update links',
    [Permission.LINKS_UPDATE_OWN]: 'You can only update your own links',
    [Permission.LINKS_DELETE_ANY]: 'You don\'t have permission to delete links',
    [Permission.LINKS_DELETE_OWN]: 'You can only delete your own links',
    [Permission.LINKS_VIEW]: 'You don\'t have permission to view links',
    [Permission.LINKS_BULK_OPERATIONS]: 'You don\'t have permission to perform bulk operations',
    [Permission.INVITATIONS_SEND]: 'You don\'t have permission to send invitations',
    [Permission.INVITATIONS_REVOKE]: 'You don\'t have permission to revoke invitations',
    [Permission.INVITATIONS_VIEW]: 'You don\'t have permission to view invitations',
  };

  return messages[permission] || 'Insufficient permissions';
}