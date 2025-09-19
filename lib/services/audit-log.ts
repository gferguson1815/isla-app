import { PrismaClient } from '@prisma/client';

export type AuditAction =
  | 'INVITATION_SENT'
  | 'INVITATION_ACCEPTED'
  | 'INVITATION_REVOKED'
  | 'INVITATION_EXPIRED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_ROLE_CHANGED'
  | 'WORKSPACE_CREATED'
  | 'WORKSPACE_UPDATED'
  | 'WORKSPACE_DELETED';

export type EntityType =
  | 'workspace'
  | 'invitation'
  | 'member'
  | 'user';

export interface AuditLogEntry {
  workspaceId: string;
  userId?: string | null;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  prisma: PrismaClient,
  entry: AuditLogEntry
): Promise<void> {
  try {
    await prisma.audit_logs.create({
      data: {
        workspace_id: entry.workspaceId,
        user_id: entry.userId,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        metadata: entry.metadata,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        created_at: new Date(),
      },
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Batch create multiple audit log entries
 */
export async function createAuditLogs(
  prisma: PrismaClient,
  entries: AuditLogEntry[]
): Promise<void> {
  if (entries.length === 0) return;

  try {
    await prisma.audit_logs.createMany({
      data: entries.map(entry => ({
        workspace_id: entry.workspaceId,
        user_id: entry.userId,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        metadata: entry.metadata,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        created_at: new Date(),
      })),
    });
  } catch (error) {
    console.error('Failed to create audit logs:', error);
  }
}

/**
 * Get audit logs for a workspace
 */
export async function getWorkspaceAuditLogs(
  prisma: PrismaClient,
  workspaceId: string,
  options: {
    limit?: number;
    offset?: number;
    action?: AuditAction;
    entityType?: EntityType;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<any[]> {
  const {
    limit = 100,
    offset = 0,
    action,
    entityType,
    userId,
    startDate,
    endDate,
  } = options;

  const where: any = {
    workspace_id: workspaceId,
  };

  if (action) where.action = action;
  if (entityType) where.entity_type = entityType;
  if (userId) where.user_id = userId;

  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) where.created_at.gte = startDate;
    if (endDate) where.created_at.lte = endDate;
  }

  return prisma.audit_logs.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset,
    include: {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Clean up old audit logs (retention policy)
 */
export async function cleanupOldAuditLogs(
  prisma: PrismaClient,
  retentionDays = 90
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await prisma.audit_logs.deleteMany({
    where: {
      created_at: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`Cleaned up ${result.count} audit log entries older than ${retentionDays} days`);
  return result.count;
}

/**
 * Get audit log statistics for a workspace
 */
export async function getAuditLogStats(
  prisma: PrismaClient,
  workspaceId: string,
  days = 30
): Promise<{
  totalActions: number;
  actionCounts: Record<string, number>;
  userActivity: Array<{ userId: string; email: string; actionCount: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logs = await prisma.audit_logs.findMany({
    where: {
      workspace_id: workspaceId,
      created_at: {
        gte: startDate,
      },
    },
    include: {
      users: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  // Calculate statistics
  const actionCounts: Record<string, number> = {};
  const userActivityMap = new Map<string, { email: string; count: number }>();
  const dailyActivityMap = new Map<string, number>();

  logs.forEach(log => {
    // Action counts
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;

    // User activity
    if (log.user_id && log.users) {
      const existing = userActivityMap.get(log.user_id) || {
        email: log.users.email,
        count: 0,
      };
      existing.count++;
      userActivityMap.set(log.user_id, existing);
    }

    // Daily activity
    const date = log.created_at.toISOString().split('T')[0];
    dailyActivityMap.set(date, (dailyActivityMap.get(date) || 0) + 1);
  });

  // Convert maps to arrays
  const userActivity = Array.from(userActivityMap.entries())
    .map(([userId, data]) => ({
      userId,
      email: data.email,
      actionCount: data.count,
    }))
    .sort((a, b) => b.actionCount - a.actionCount);

  const dailyActivity = Array.from(dailyActivityMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalActions: logs.length,
    actionCounts,
    userActivity,
    dailyActivity,
  };
}