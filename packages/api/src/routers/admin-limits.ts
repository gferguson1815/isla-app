import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { prisma } from '@/lib/prisma'
import { recalculateUsage } from '../services/usage-tracking'
import { UsageCounter, RedisKeys } from '@/lib/redis'

// Schema for custom limits
const customLimitsSchema = z.object({
  beta_user: z.boolean().optional(),
  vip_customer: z.boolean().optional(),
  temp_increases: z.object({
    links: z.number().optional(),
    clicks: z.number().optional(),
    users: z.number().optional(),
    expires: z.string().optional(),
  }).optional(),
})

export const adminLimitsRouter = createTRPCRouter({
  // Get workspace limits and overrides
  getWorkspaceLimits: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      const membership = await prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
          role: { in: ['owner', 'admin'] },
        },
      })
      
      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be an admin to view workspace limits',
        })
      }
      
      const workspace = await prisma.workspaces.findUnique({
        where: { id: input.workspaceId },
        select: {
          id: true,
          name: true,
          plan: true,
          max_links: true,
          max_clicks: true,
          max_users: true,
          custom_limits: true,
          _count: {
            select: {
              links: true,
              workspace_memberships: true,
            },
          },
        },
      })
      
      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        })
      }
      
      // Get current month's click count
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const clickCount = await prisma.click_events.count({
        where: {
          links: { workspace_id: input.workspaceId },
          timestamp: { gte: startOfMonth },
        },
      })
      
      return {
        workspace: {
          ...workspace,
          currentUsage: {
            links: workspace._count.links,
            clicks: clickCount,
            users: workspace._count.workspace_memberships,
          },
        },
      }
    }),
  
  // Update workspace base limits
  updateBaseLimits: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      maxLinks: z.number().min(-1).optional(),
      maxClicks: z.number().min(-1).optional(),
      maxUsers: z.number().min(-1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is system admin (you might want to add a system admin check here)
      const isSystemAdmin = ctx.session.user.email?.endsWith('@isla.sh') || false
      
      if (!isSystemAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only system administrators can update base limits',
        })
      }
      
      const { workspaceId, ...limits } = input
      
      const workspace = await prisma.workspaces.update({
        where: { id: workspaceId },
        data: {
          ...(limits.maxLinks !== undefined && { max_links: limits.maxLinks }),
          ...(limits.maxClicks !== undefined && { max_clicks: limits.maxClicks }),
          ...(limits.maxUsers !== undefined && { max_users: limits.maxUsers }),
          updated_at: new Date(),
        },
      })
      
      // Log the action
      await prisma.audit_logs.create({
        data: {
          workspace_id: workspaceId,
          user_id: ctx.session.user.id,
          action: 'limits_updated',
          entity_type: 'workspace',
          entity_id: workspaceId,
          metadata: {
            changes: limits,
            updatedBy: ctx.session.user.email,
          },
        },
      })
      
      // Recalculate usage to ensure Redis is in sync
      await recalculateUsage(workspaceId)
      
      return workspace
    }),
  
  // Set custom overrides (beta, VIP, temporary increases)
  setCustomOverrides: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      customLimits: customLimitsSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is system admin
      const isSystemAdmin = ctx.session.user.email?.endsWith('@isla.sh') || false
      
      if (!isSystemAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only system administrators can set custom overrides',
        })
      }
      
      const workspace = await prisma.workspaces.update({
        where: { id: input.workspaceId },
        data: {
          custom_limits: input.customLimits as any,
          updated_at: new Date(),
        },
      })
      
      // Log the action
      await prisma.audit_logs.create({
        data: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
          action: 'custom_limits_set',
          entity_type: 'workspace',
          entity_id: input.workspaceId,
          metadata: {
            customLimits: input.customLimits,
            setBy: ctx.session.user.email,
          },
        },
      })
      
      return workspace
    }),
  
  // Grant temporary increase
  grantTemporaryIncrease: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      metric: z.enum(['links', 'clicks', 'users']),
      increaseAmount: z.number().positive(),
      daysValid: z.number().min(1).max(90).default(30),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is system admin
      const isSystemAdmin = ctx.session.user.email?.endsWith('@isla.sh') || false
      
      if (!isSystemAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only system administrators can grant temporary increases',
        })
      }
      
      const workspace = await prisma.workspaces.findUnique({
        where: { id: input.workspaceId },
        select: {
          custom_limits: true,
          max_links: true,
          max_clicks: true,
          max_users: true,
        },
      })
      
      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        })
      }
      
      // Calculate new limits
      const currentCustomLimits = (workspace.custom_limits as any) || {}
      const currentTempIncreases = currentCustomLimits.temp_increases || {}
      
      const baseLimit = workspace[`max_${input.metric}` as keyof typeof workspace] as number
      const newLimit = baseLimit + input.increaseAmount
      
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + input.daysValid)
      
      const updatedCustomLimits = {
        ...currentCustomLimits,
        temp_increases: {
          ...currentTempIncreases,
          [input.metric]: newLimit,
          expires: expiryDate.toISOString(),
        },
      }
      
      const updatedWorkspace = await prisma.workspaces.update({
        where: { id: input.workspaceId },
        data: {
          custom_limits: updatedCustomLimits,
          updated_at: new Date(),
        },
      })
      
      // Log the action
      await prisma.audit_logs.create({
        data: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
          action: 'temporary_increase_granted',
          entity_type: 'workspace',
          entity_id: input.workspaceId,
          metadata: {
            metric: input.metric,
            increaseAmount: input.increaseAmount,
            newLimit,
            expiresAt: expiryDate.toISOString(),
            reason: input.reason,
            grantedBy: ctx.session.user.email,
          },
        },
      })
      
      return {
        workspace: updatedWorkspace,
        increase: {
          metric: input.metric,
          newLimit,
          expiresAt: expiryDate,
        },
      }
    }),
  
  // Remove all custom overrides
  removeCustomOverrides: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is system admin
      const isSystemAdmin = ctx.session.user.email?.endsWith('@isla.sh') || false
      
      if (!isSystemAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only system administrators can remove custom overrides',
        })
      }
      
      const workspace = await prisma.workspaces.update({
        where: { id: input.workspaceId },
        data: {
          custom_limits: null,
          updated_at: new Date(),
        },
      })
      
      // Log the action
      await prisma.audit_logs.create({
        data: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
          action: 'custom_limits_removed',
          entity_type: 'workspace',
          entity_id: input.workspaceId,
          metadata: {
            removedBy: ctx.session.user.email,
          },
        },
      })
      
      return workspace
    }),
  
  // Get audit logs for limit changes
  getLimitAuditLogs: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      const membership = await prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
          role: { in: ['owner', 'admin'] },
        },
      })
      
      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be an admin to view audit logs',
        })
      }
      
      const logs = await prisma.audit_logs.findMany({
        where: {
          workspace_id: input.workspaceId,
          action: {
            in: [
              'limits_updated',
              'custom_limits_set',
              'custom_limits_removed',
              'temporary_increase_granted',
              'usage_alert_sent',
            ],
          },
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: input.limit,
        skip: input.offset,
      })
      
      const total = await prisma.audit_logs.count({
        where: {
          workspace_id: input.workspaceId,
          action: {
            in: [
              'limits_updated',
              'custom_limits_set',
              'custom_limits_removed',
              'temporary_increase_granted',
              'usage_alert_sent',
            ],
          },
        },
      })
      
      return {
        logs,
        total,
        hasMore: input.offset + logs.length < total,
      }
    }),

  // Additional endpoints for admin UI compatibility
  getWorkspace: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Reuse logic from getWorkspaceLimits
      const membership = await prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
          role: { in: ['owner', 'admin'] },
        },
      })
      
      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be an admin to view workspace limits',
        })
      }
      
      const workspace = await prisma.workspaces.findUnique({
        where: { id: input.workspaceId },
        select: {
          id: true,
          name: true,
          plan: true,
          max_links: true,
          max_clicks: true,
          max_users: true,
          custom_limits: true,
        },
      })
      
      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        })
      }
      
      return workspace
    }),

  getUsageMetrics: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Get current usage from Redis or database
      const linksKey = RedisKeys.workspaceLinks(input.workspaceId)
      const clicksKey = RedisKeys.workspaceClicks(input.workspaceId)
      const membersKey = RedisKeys.workspaceMembers(input.workspaceId)
      
      const links = await UsageCounter.get(linksKey) ?? 0
      const clicks = await UsageCounter.get(clicksKey) ?? 0
      const users = await UsageCounter.get(membersKey) ?? 0
      
      return {
        links,
        clicks,
        users,
      }
    }),

  updateLimits: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      customLimits: customLimitsSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is system admin
      const isSystemAdmin = ctx.session.user.email?.endsWith('@isla.sh') || false
      
      if (!isSystemAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only system administrators can set custom overrides',
        })
      }
      
      const workspace = await prisma.workspaces.update({
        where: { id: input.workspaceId },
        data: {
          custom_limits: input.customLimits as any,
          updated_at: new Date(),
        },
      })
      
      // Log the action
      await prisma.audit_logs.create({
        data: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
          action: 'custom_limits_set',
          entity_type: 'workspace',
          entity_id: input.workspaceId,
          metadata: {
            customLimits: input.customLimits,
            setBy: ctx.session.user.email,
          },
        },
      })
      
      return workspace
    }),

  removeOverrides: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is system admin
      const isSystemAdmin = ctx.session.user.email?.endsWith('@isla.sh') || false
      
      if (!isSystemAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only system administrators can remove custom overrides',
        })
      }
      
      const workspace = await prisma.workspaces.update({
        where: { id: input.workspaceId },
        data: {
          custom_limits: null,
          updated_at: new Date(),
        },
      })
      
      // Log the action
      await prisma.audit_logs.create({
        data: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
          action: 'custom_limits_removed',
          entity_type: 'workspace',
          entity_id: input.workspaceId,
          metadata: {
            removedBy: ctx.session.user.email,
          },
        },
      })
      
      return workspace
    }),

  resetUsage: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      metric: z.enum(['links', 'clicks', 'users', 'all']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is system admin
      const isSystemAdmin = ctx.session.user.email?.endsWith('@isla.sh') || false
      
      if (!isSystemAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only system administrators can reset usage',
        })
      }
      
      const metrics = input.metric === 'all' 
        ? ['links', 'clicks', 'users'] 
        : [input.metric]
      
      for (const metric of metrics) {
        let key: string
        switch (metric) {
          case 'links':
            key = RedisKeys.workspaceLinks(input.workspaceId)
            break
          case 'clicks':
            key = RedisKeys.workspaceClicks(input.workspaceId)
            break
          case 'users':
            key = RedisKeys.workspaceMembers(input.workspaceId)
            break
          default:
            continue
        }
        
        await UsageCounter.set(key, 0)
      }
      
      // Log the action
      await prisma.audit_logs.create({
        data: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
          action: 'usage_reset',
          entity_type: 'workspace',
          entity_id: input.workspaceId,
          metadata: {
            metric: input.metric,
            resetBy: ctx.session.user.email,
          },
        },
      })
      
      return { success: true }
    }),
})