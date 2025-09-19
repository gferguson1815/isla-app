import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { prisma } from '@/lib/prisma'
import { checkUsageLimitsMiddleware, incrementUsage, decrementUsage } from '../middleware/usage-limits'
import { trackClick } from '../services/usage-tracking'

export const linksRouter = createTRPCRouter({
  // Create a new link with limit enforcement
  create: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      url: z.string().url(),
      slug: z.string().min(1).optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      folderId: z.string().uuid().optional(),
      expiresAt: z.date().optional(),
      password: z.string().optional(),
      clickLimit: z.number().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check link creation limit
      await checkUsageLimitsMiddleware({
        ctx,
        metric: 'links',
        incrementAmount: 1,
      })
      
      // Verify workspace membership
      const membership = await prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
        },
      })
      
      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be a member of this workspace',
        })
      }
      
      // Generate slug if not provided
      const slug = input.slug || generateRandomSlug()
      
      // Check if slug is already taken
      const existingLink = await prisma.links.findUnique({
        where: { slug },
      })
      
      if (existingLink) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This slug is already in use',
        })
      }
      
      // Create the link
      const link = await prisma.links.create({
        data: {
          id: crypto.randomUUID(),
          workspace_id: input.workspaceId,
          url: input.url,
          slug,
          title: input.title,
          description: input.description,
          folder_id: input.folderId,
          expires_at: input.expiresAt,
          password: input.password,
          click_limit: input.clickLimit,
          created_at: new Date(),
          updated_at: new Date(),
        },
      })
      
      // Increment usage counter
      await incrementUsage(input.workspaceId, 'links', 1)
      
      // Log the action
      await prisma.audit_logs.create({
        data: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
          action: 'link_created',
          entity_type: 'link',
          entity_id: link.id,
          metadata: {
            slug: link.slug,
            url: link.url,
          },
        },
      })
      
      return link
    }),
  
  // Delete a link (decrements usage)
  delete: protectedProcedure
    .input(z.object({
      linkId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get the link to verify ownership
      const link = await prisma.links.findUnique({
        where: { id: input.linkId },
        select: {
          workspace_id: true,
          slug: true,
        },
      })
      
      if (!link) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Link not found',
        })
      }
      
      // Verify workspace membership
      const membership = await prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: link.workspace_id,
          user_id: ctx.session.user.id,
          role: { in: ['owner', 'admin', 'editor'] },
        },
      })
      
      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this link',
        })
      }
      
      // Delete the link
      await prisma.links.delete({
        where: { id: input.linkId },
      })
      
      // Decrement usage counter
      await decrementUsage(link.workspace_id, 'links', 1)
      
      // Log the action
      await prisma.audit_logs.create({
        data: {
          workspace_id: link.workspace_id,
          user_id: ctx.session.user.id,
          action: 'link_deleted',
          entity_type: 'link',
          entity_id: input.linkId,
          metadata: {
            slug: link.slug,
          },
        },
      })
      
      return { success: true }
    }),
  
  // List links (with graceful degradation for analytics)
  list: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      includeAnalytics: z.boolean().default(true),
    }))
    .query(async ({ ctx, input }) => {
      // Verify workspace membership
      const membership = await prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
        },
      })
      
      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be a member of this workspace',
        })
      }
      
      // Check if analytics should be limited (graceful degradation)
      let includeAnalytics = input.includeAnalytics
      if (includeAnalytics) {
        const analyticsCheck = await checkUsageLimitsMiddleware({
          ctx,
          metric: 'clicks',
          incrementAmount: 0,
          gracefulDegradation: true,
        })
        
        // If over limit, set to read-only mode
        if (analyticsCheck.readOnly) {
          includeAnalytics = false
        }
      }
      
      // Get links
      const links = await prisma.links.findMany({
        where: {
          workspace_id: input.workspaceId,
        },
        include: includeAnalytics ? {
          _count: {
            select: {
              click_events: true,
            },
          },
        } : undefined,
        orderBy: { created_at: 'desc' },
        take: input.limit,
        skip: input.offset,
      })
      
      const total = await prisma.links.count({
        where: {
          workspace_id: input.workspaceId,
        },
      })
      
      return {
        links,
        total,
        hasMore: input.offset + links.length < total,
        analyticsLimited: !includeAnalytics && input.includeAnalytics,
      }
    }),
  
  // Track click (always succeeds, never blocks)
  trackClick: protectedProcedure
    .input(z.object({
      linkId: z.string().uuid(),
      metadata: z.object({
        ip: z.string().optional(),
        userAgent: z.string().optional(),
        referer: z.string().optional(),
        country: z.string().optional(),
        device: z.string().optional(),
        browser: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      // Get link and workspace
      const link = await prisma.links.findUnique({
        where: { id: input.linkId },
        select: {
          id: true,
          workspace_id: true,
          click_count: true,
          click_limit: true,
        },
      })
      
      if (!link) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Link not found',
        })
      }
      
      // Check if link has reached its own click limit
      if (link.click_limit && link.click_count >= link.click_limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This link has reached its click limit',
        })
      }
      
      // Create click event (always succeeds)
      const clickEvent = await prisma.click_events.create({
        data: {
          id: crypto.randomUUID(),
          link_id: input.linkId,
          timestamp: new Date(),
          ip_address: input.metadata?.ip,
          user_agent: input.metadata?.userAgent,
          referer: input.metadata?.referer,
          country: input.metadata?.country,
          device: input.metadata?.device,
          browser: input.metadata?.browser,
        },
      })
      
      // Update link click count
      await prisma.links.update({
        where: { id: input.linkId },
        data: {
          click_count: { increment: 1 },
          last_clicked_at: new Date(),
        },
      })
      
      // Track click in usage metrics (never blocks, handles errors internally)
      await trackClick(input.linkId, link.workspace_id)
      
      return {
        success: true,
        clickId: clickEvent.id,
      }
    }),
})

// Helper function to generate random slug
function generateRandomSlug(length = 7): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let slug = ''
  for (let i = 0; i < length; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return slug
}