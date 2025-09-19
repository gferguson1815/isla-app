import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { generateUniqueSlug, isValidSlug, sanitizeSlug } from '@/lib/utils/slug';
import { appConfig, getShortUrl } from '@/lib/config/app';

const createLinkSchema = z.object({
  url: z.string().url(),
  slug: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

const updateLinkSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

export const linkRouter = router({
  create: protectedProcedure
    .input(createLinkSchema)
    .mutation(async ({ ctx, input }) => {
      const startTime = Date.now();

      try {
        // Get user's workspace through membership
        const membership = await ctx.prisma.workspaceMembership.findFirst({
          where: { userId: ctx.userId },
          include: { workspace: true },
        });

        let workspaceId: string;

        if (!membership) {
          // Create default workspace and membership
          const newWorkspace = await ctx.prisma.workspace.create({
            data: {
              name: 'Default Workspace',
              slug: `workspace-${ctx.userId.slice(0, 8)}`,
            },
          });

          await ctx.prisma.workspaceMembership.create({
            data: {
              userId: ctx.userId,
              workspaceId: newWorkspace.id,
              role: 'owner',
            },
          });

          workspaceId = newWorkspace.id;
        } else {
          workspaceId = membership.workspaceId;
        }

        // Handle slug generation or validation
        let finalSlug: string;

        if (input.slug) {
          // Sanitize and validate custom slug
          const sanitized = sanitizeSlug(input.slug);
          if (!sanitized || !isValidSlug(sanitized)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid slug format',
            });
          }

          // Check uniqueness
          const existing = await ctx.prisma.link.findUnique({
            where: { slug: sanitized },
          });

          if (existing) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'This slug is already taken',
            });
          }

          finalSlug = sanitized;
        } else {
          // Generate unique slug
          finalSlug = await generateUniqueSlug(async (slug) => {
            const existing = await ctx.prisma.link.findUnique({
              where: { slug },
            });
            return !existing;
          });
        }

        // Create link in database
        const link = await ctx.prisma.link.create({
          data: {
            workspaceId,
            url: input.url,
            slug: finalSlug,
            title: input.title || null,
            description: input.description || null,
          },
        });

        const responseTime = Date.now() - startTime;
        if (responseTime > appConfig.api.performanceThreshold) {
          console.warn(`Link creation took ${responseTime}ms`);
        }

        return {
          ...link,
          shortUrl: getShortUrl(link.slug),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        });
      }
    }),

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get user's workspaces through memberships
      const memberships = await ctx.prisma.workspaceMembership.findMany({
        where: { userId: ctx.userId },
        select: { workspaceId: true },
      });

      if (memberships.length === 0) {
        return { links: [], total: 0 };
      }

      const workspaceIds = memberships.map(m => m.workspaceId);

      // Get total count
      const total = await ctx.prisma.link.count({
        where: {
          workspaceId: { in: workspaceIds },
        },
      });

      // Get links with pagination
      const links = await ctx.prisma.link.findMany({
        where: {
          workspaceId: { in: workspaceIds },
        },
        orderBy: { createdAt: 'desc' },
        skip: input.offset,
        take: input.limit,
      });

      return {
        links: links.map(link => ({
          ...link,
          shortUrl: getShortUrl(link.slug),
        })),
        total,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get the link to verify ownership
      const link = await ctx.prisma.link.findUnique({
        where: { id: input.id },
        select: { workspaceId: true },
      });

      if (!link) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Link not found',
        });
      }

      // Check user has access to this workspace
      const membership = await ctx.prisma.workspaceMembership.findFirst({
        where: {
          workspaceId: link.workspaceId,
          userId: ctx.userId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this link',
        });
      }

      // Delete the link
      await ctx.prisma.link.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  update: protectedProcedure
    .input(updateLinkSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const link = await ctx.prisma.link.findUnique({
        where: { id: input.id },
        select: { workspaceId: true },
      });

      if (!link) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Link not found',
        });
      }

      // Check user has access to this workspace
      const membership = await ctx.prisma.workspaceMembership.findFirst({
        where: {
          workspaceId: link.workspaceId,
          userId: ctx.userId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this link',
        });
      }

      // Update link
      const updatedLink = await ctx.prisma.link.update({
        where: { id: input.id },
        data: {
          ...(input.url && { url: input.url }),
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
        },
      });

      return {
        ...updatedLink,
        shortUrl: getShortUrl(updatedLink.slug),
      };
    }),

  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const link = await ctx.prisma.link.findUnique({
        where: { slug: input.slug },
      });

      if (!link) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Link not found',
        });
      }

      // Verify user has access to workspace
      const membership = await ctx.prisma.workspaceMembership.findFirst({
        where: {
          workspaceId: link.workspaceId,
          userId: ctx.userId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this link',
        });
      }

      return {
        ...link,
        shortUrl: getShortUrl(link.slug),
      };
    }),
});