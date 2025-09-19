import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const userRouter = router({
  // Get current user profile
  profile: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.users.findUnique({
        where: { id: ctx.userId },
        include: {
          workspace_memberships: {
            include: {
              workspaces: {
                where: {
                  deleted_at: null, // Only include non-deleted workspaces
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        isSuspended: user.is_suspended,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        workspaces: user.workspace_memberships.map((membership) => ({
          id: membership.workspaces.id,
          name: membership.workspaces.name,
          slug: membership.workspaces.slug,
          role: membership.role,
          joinedAt: membership.joined_at,
        })),
      };
    }),

  // Initialize user on first login/signup
  initialize: publicProcedure
    .input(z.object({
      userId: z.string().uuid(),
      email: z.string().email(),
      name: z.string().optional(),
      avatarUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user already exists
        const existingUser = await ctx.prisma.users.findUnique({
          where: { id: input.userId },
        });

        if (existingUser) {
          // User already exists, just return their profile
          return {
            user: existingUser,
            isNewUser: false,
          };
        }

        // Create new user in our database
        const user = await ctx.prisma.users.create({
          data: {
            id: input.userId,
            email: input.email,
            name: input.name,
            avatar_url: input.avatarUrl,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        // Create default workspace for new user
        const workspaceName = input.name ? `${input.name}'s Workspace` : 'My Workspace';
        const workspaceSlug = workspaceName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 50);

        // Ensure unique slug (simplified version)
        let uniqueSlug = workspaceSlug;
        let counter = 1;
        while (true) {
          const existing = await ctx.prisma.workspaces.findFirst({
            where: {
              slug: uniqueSlug,
              deleted_at: null,
            }
          });

          if (!existing) {
            break;
          }

          uniqueSlug = `${workspaceSlug}-${counter}`;
          counter++;
        }

        const workspace = await ctx.prisma.workspaces.create({
          data: {
            id: crypto.randomUUID(),
            name: workspaceName,
            slug: uniqueSlug,
            plan: 'free',
            max_links: 50,
            max_clicks: 5000,
            max_users: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        // Create workspace membership
        await ctx.prisma.workspace_memberships.create({
          data: {
            id: crypto.randomUUID(),
            user_id: user.id,
            workspace_id: workspace.id,
            role: 'owner',
            joined_at: new Date(),
          },
        });

        return {
          user,
          isNewUser: true,
          defaultWorkspace: {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
          },
        };
      } catch (error) {
        console.error('Error initializing user:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to initialize user',
        });
      }
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      avatarUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.users.update({
        where: { id: ctx.userId },
        data: {
          ...input,
          updated_at: new Date(),
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        isSuspended: user.is_suspended,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    }),
});