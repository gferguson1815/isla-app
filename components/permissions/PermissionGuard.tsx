import React from 'react';
import { Permission } from '@/lib/permissions';
import { usePermissions } from '@/hooks/usePermissions';

export interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  requireOwner?: boolean;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  onUnauthorized?: () => void;
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  requireOwner = false,
  requireAdmin = false,
  fallback = null,
  loading = null,
  onUnauthorized,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading, isOwner, isAdmin } = usePermissions();

  // Show loading state while permissions are being fetched
  if (isLoading) {
    if (loading) {
      return <>{loading}</>;
    }
    // Don't render children while loading
    return null;
  }

  // Determine which permission check to use
  let hasRequiredPermission = false;

  // Check role requirements first
  if (requireOwner) {
    hasRequiredPermission = isOwner();
  } else if (requireAdmin) {
    hasRequiredPermission = isAdmin();
  } else if (permission) {
    hasRequiredPermission = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    if (requireAll) {
      hasRequiredPermission = hasAllPermissions(permissions);
    } else {
      hasRequiredPermission = hasAnyPermission(permissions);
    }
  } else {
    // No permissions specified, always allow
    hasRequiredPermission = true;
  }

  // If both role and permission requirements are specified, check both
  if ((requireOwner || requireAdmin) && (permission || permissions)) {
    const roleCheck = requireOwner ? isOwner() : isAdmin();
    const permissionCheck = permission
      ? hasPermission(permission)
      : permissions && permissions.length > 0
        ? (requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions))
        : true;
    hasRequiredPermission = roleCheck && permissionCheck;
  }

  // Handle unauthorized access
  if (!hasRequiredPermission) {
    if (onUnauthorized) {
      onUnauthorized();
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGuard;