import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const featuresRouter = router({
  // Get all features for a workspace's plan
  getWorkspaceFeatures: protectedProcedure
    .input(z.object({ workspace_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get workspace to determine plan
      const workspace = await ctx.prisma.workspaces.findUnique({
        where: { id: input.workspace_id },
        select: { plan: true }
      });

      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found'
        });
      }

      // Get all features for this plan
      const planFeatures = await ctx.prisma.plan_features.findMany({
        where: { plan: workspace.plan },
        include: {
          feature: true
        }
      });

      // Transform to a map for easy access by feature key
      const featuresMap = planFeatures.reduce((acc, pf) => {
        acc[pf.feature.key] = {
          enabled: pf.enabled,
          limit: pf.limit_value,
          message: pf.custom_message,
          metadata: pf.metadata,
          name: pf.feature.name,
          description: pf.feature.description,
          category: pf.feature.category
        };
        return acc;
      }, {} as Record<string, any>);

      return featuresMap;
    }),

  // Check specific feature for a workspace
  checkFeature: protectedProcedure
    .input(z.object({
      workspace_id: z.string().uuid(),
      feature_key: z.string()
    }))
    .query(async ({ ctx, input }) => {
      // Get workspace to determine plan
      const workspace = await ctx.prisma.workspaces.findUnique({
        where: { id: input.workspace_id },
        select: { plan: true }
      });

      // Get the feature
      const feature = await ctx.prisma.features.findUnique({
        where: { key: input.feature_key }
      });

      if (!feature || !workspace) {
        return {
          enabled: false,
          message: 'Feature not found',
          limit: 0
        };
      }

      // Get plan feature settings
      const planFeature = await ctx.prisma.plan_features.findUnique({
        where: {
          plan_feature_id: {
            plan: workspace.plan,
            feature_id: feature.id
          }
        }
      });

      return {
        enabled: planFeature?.enabled || false,
        limit: planFeature?.limit_value,
        message: planFeature?.custom_message || `This feature requires a higher plan. Current plan: ${workspace.plan}`,
        metadata: planFeature?.metadata,
        name: feature.name,
        description: feature.description
      };
    }),

  // Track feature usage
  trackUsage: protectedProcedure
    .input(z.object({
      workspace_id: z.string().uuid(),
      feature_key: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify workspace membership
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: input.workspace_id,
          user_id: ctx.userId,
        }
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a member of this workspace'
        });
      }

      // Get the feature
      const feature = await ctx.prisma.features.findUnique({
        where: { key: input.feature_key }
      });

      if (!feature) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Feature not found'
        });
      }

      // Upsert usage tracking
      await ctx.prisma.feature_usage.upsert({
        where: {
          workspace_id_feature_id: {
            workspace_id: input.workspace_id,
            feature_id: feature.id
          }
        },
        update: {
          usage_count: { increment: 1 },
          last_used_at: new Date()
        },
        create: {
          workspace_id: input.workspace_id,
          feature_id: feature.id,
          usage_count: 1,
          last_used_at: new Date()
        }
      });

      return { success: true };
    }),

  // Get usage statistics for a workspace
  getUsageStats: protectedProcedure
    .input(z.object({ workspace_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify workspace membership
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: input.workspace_id,
          user_id: ctx.userId,
        }
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a member of this workspace'
        });
      }

      const usage = await ctx.prisma.feature_usage.findMany({
        where: { workspace_id: input.workspace_id },
        include: { feature: true }
      });

      return usage.map(u => ({
        feature: u.feature.name,
        key: u.feature.key,
        count: u.usage_count,
        lastUsed: u.last_used_at
      }));
    }),

  // Get all available features (for admin/settings pages)
  getAllFeatures: protectedProcedure
    .query(async ({ ctx }) => {
      const features = await ctx.prisma.features.findMany({
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      });

      return features;
    })
});