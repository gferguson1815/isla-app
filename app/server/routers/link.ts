import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { generateUniqueSlug, isValidSlug, sanitizeSlug } from '@/lib/utils/slug';
import { appConfig, getShortUrl } from '@/lib/config/app';
import {
  Permission,
  requirePermission,
  requireLinkOwnership,
  type ServerPermissionContext
} from '@/lib/permissions/backend';

const createLinkSchema = z.object({
  workspaceId: z.string().uuid(),
  url: z.string().url(),
  slug: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

const updateLinkSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  url: z.string().url().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  folder_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

const deleteLinkSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
});

const bulkMoveLinkSchema = z.object({
  workspaceId: z.string().uuid(),
  link_ids: z.array(z.string().uuid()),
  folder_id: z.string().uuid().nullable(),
});

const bulkTagSchema = z.object({
  workspaceId: z.string().uuid(),
  linkIds: z.array(z.string().uuid()),
  tags: z.array(z.string()).min(1).max(10),
});

const listLinksSchema = z.object({
  workspaceId: z.string().uuid(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  tags: z.array(z.string()).optional(),
  tagFilterMode: z.enum(['AND', 'OR']).default('AND').optional(),
  search: z.string().optional(),
});

export const linkRouter = router({
  create: protectedProcedure
    .input(createLinkSchema)
    .mutation(async ({ ctx, input }) => {
      const startTime = Date.now();

      try {
        // Check permission to create links in the workspace
        const serverCtx: ServerPermissionContext = {
          userId: ctx.userId,
          prisma: ctx.prisma,
        };

        await requirePermission(serverCtx, input.workspaceId, Permission.LINKS_CREATE);

        const workspaceId = input.workspaceId;

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
          const existing = await ctx.prisma.links.findUnique({
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
            const existing = await ctx.prisma.links.findUnique({
              where: { slug },
            });
            return !existing;
          });
        }

        // Process tags if provided
        const processedTags = input.tags ? input.tags.map(tag => tag.toLowerCase()) : [];

        // Update or create tags in the tags table
        if (processedTags.length > 0) {
          for (const tagName of processedTags) {
            const existingTag = await ctx.prisma.tags.findUnique({
              where: {
                workspace_id_name: {
                  workspace_id: workspaceId,
                  name: tagName,
                },
              },
            });

            if (!existingTag) {
              await ctx.prisma.tags.create({
                data: {
                  workspace_id: workspaceId,
                  name: tagName,
                  usage_count: 1,
                },
              });
            } else {
              await ctx.prisma.tags.update({
                where: { id: existingTag.id },
                data: { usage_count: { increment: 1 } },
              });
            }
          }
        }

        // Create link in database
        const link = await ctx.prisma.links.create({
          data: {
            id: crypto.randomUUID(),
            workspace_id: workspaceId,
            created_by: ctx.userId,
            url: input.url,
            slug: finalSlug,
            title: input.title || null,
            description: input.description || null,
            is_active: true,
            click_count: 0,
            created_at: new Date(),
            updated_at: new Date(),
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
    .input(listLinksSchema)
    .query(async ({ ctx, input }) => {
      // Check permission to view links in the workspace
      const serverCtx: ServerPermissionContext = {
        userId: ctx.userId,
        prisma: ctx.prisma,
      };

      await requirePermission(serverCtx, input.workspaceId, Permission.LINKS_VIEW);

      // Build where clause
      const where: any = {
        workspace_id: input.workspaceId,
      };

      // Add tag filters if provided
      if (input.tags && input.tags.length > 0) {
        const normalizedTags = input.tags.map(tag => tag.toLowerCase());
        if (input.tagFilterMode === 'AND') {
          // All tags must be present
          where.tags = { hasEvery: normalizedTags };
        } else {
          // At least one tag must be present
          where.tags = { hasSome: normalizedTags };
        }
      }

      // Add search filter if provided
      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
          { url: { contains: input.search, mode: 'insensitive' } },
        ];
      }

      // Get total count
      const total = await ctx.prisma.links.count({ where });

      // Get links with pagination
      const links = await ctx.prisma.links.findMany({
        where,
        orderBy: { created_at: 'desc' },
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
    .input(deleteLinkSchema)
    .mutation(async ({ ctx, input }) => {
      const serverCtx: ServerPermissionContext = {
        userId: ctx.userId,
        prisma: ctx.prisma,
      };

      // Check link ownership and delete permissions
      const { link, canDelete } = await requireLinkOwnership(serverCtx, input.id, input.workspaceId);

      if (!canDelete) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this link',
        });
      }

      // Delete the link
      await ctx.prisma.links.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  update: protectedProcedure
    .input(updateLinkSchema)
    .mutation(async ({ ctx, input }) => {
      const serverCtx: ServerPermissionContext = {
        userId: ctx.userId,
        prisma: ctx.prisma,
      };

      // Check link ownership and update permissions
      const { link, canUpdate } = await requireLinkOwnership(serverCtx, input.id, input.workspaceId);

      if (!canUpdate) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this link',
        });
      }

      // Handle tag updates if provided
      if (input.tags !== undefined) {
        // Get current tags
        const currentLink = await ctx.prisma.links.findUnique({
          where: { id: input.id },
          select: { tags: true },
        });

        const oldTags = currentLink?.tags || [];
        const newTags = input.tags.map(tag => tag.toLowerCase());

        // Find tags to add and remove
        const tagsToAdd = newTags.filter(tag => !oldTags.includes(tag));
        const tagsToRemove = oldTags.filter(tag => !newTags.includes(tag));

        // Update usage counts
        for (const tagName of tagsToRemove) {
          const tag = await ctx.prisma.tags.findUnique({
            where: {
              workspace_id_name: {
                workspace_id: link.workspace_id,
                name: tagName,
              },
            },
          });

          if (tag) {
            await ctx.prisma.tags.update({
              where: { id: tag.id },
              data: { usage_count: Math.max(0, tag.usage_count - 1) },
            });
          }
        }

        for (const tagName of tagsToAdd) {
          const existingTag = await ctx.prisma.tags.findUnique({
            where: {
              workspace_id_name: {
                workspace_id: link.workspace_id,
                name: tagName,
              },
            },
          });

          if (!existingTag) {
            await ctx.prisma.tags.create({
              data: {
                workspace_id: link.workspace_id,
                name: tagName,
                usage_count: 1,
              },
            });
          } else {
            await ctx.prisma.tags.update({
              where: { id: existingTag.id },
              data: { usage_count: { increment: 1 } },
            });
          }
        }
      }

      // Update link
      const updatedLink = await ctx.prisma.links.update({
        where: { id: input.id },
        data: {
          ...(input.url && { url: input.url }),
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.folder_id !== undefined && { folder_id: input.folder_id }),
          ...(input.tags !== undefined && { tags: input.tags.map(tag => tag.toLowerCase()) }),
          updated_at: new Date(),
        },
      });

      return {
        ...updatedLink,
        shortUrl: getShortUrl(updatedLink.slug),
      };
    }),

  getBySlug: protectedProcedure
    .input(z.object({
      slug: z.string(),
      workspaceId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const serverCtx: ServerPermissionContext = {
        userId: ctx.userId,
        prisma: ctx.prisma,
      };

      // Check permission to view links in the workspace
      await requirePermission(serverCtx, input.workspaceId, Permission.LINKS_VIEW);

      const link = await ctx.prisma.links.findUnique({
        where: {
          slug: input.slug,
        },
      });

      if (!link) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Link not found',
        });
      }

      // Verify link belongs to the specified workspace
      if (link.workspace_id !== input.workspaceId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Link not found in this workspace',
        });
      }

      return {
        ...link,
        shortUrl: getShortUrl(link.slug),
      };
    }),

  bulkMove: protectedProcedure
    .input(bulkMoveLinkSchema)
    .mutation(async ({ ctx, input }) => {
      const serverCtx: ServerPermissionContext = {
        userId: ctx.userId,
        prisma: ctx.prisma,
      };

      // Check permission for bulk operations
      await requirePermission(serverCtx, input.workspaceId, Permission.LINKS_BULK_OPERATIONS);

      // Get all links to verify they belong to the workspace
      const links = await ctx.prisma.links.findMany({
        where: {
          id: { in: input.link_ids },
          workspace_id: input.workspaceId
        },
        select: { id: true, workspace_id: true }
      });

      if (links.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No links found in this workspace',
        });
      }

      if (links.length !== input.link_ids.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Some links do not belong to this workspace',
        });
      }

      // If moving to a folder, verify it exists and belongs to the workspace
      if (input.folder_id) {
        const folder = await ctx.prisma.folders.findUnique({
          where: { id: input.folder_id },
          select: { workspace_id: true }
        });

        if (!folder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Folder not found',
          });
        }

        if (folder.workspace_id !== input.workspaceId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Folder does not belong to the same workspace',
          });
        }
      }

      // Bulk update all links
      const result = await ctx.prisma.links.updateMany({
        where: {
          id: { in: input.link_ids }
        },
        data: {
          folder_id: input.folder_id,
          updated_at: new Date()
        }
      });

      return {
        success: true,
        count: result.count
      };
    }),

  bulkAddTags: protectedProcedure
    .input(bulkTagSchema)
    .mutation(async ({ ctx, input }) => {
      const serverCtx: ServerPermissionContext = {
        userId: ctx.userId,
        prisma: ctx.prisma,
      };

      // Check permission for bulk operations
      await requirePermission(serverCtx, input.workspaceId, Permission.LINKS_BULK_OPERATIONS);

      // Verify all links belong to the workspace
      const links = await ctx.prisma.links.findMany({
        where: {
          id: { in: input.linkIds },
          workspace_id: input.workspaceId
        },
        select: { id: true, workspace_id: true, tags: true },
      });

      if (links.length !== input.linkIds.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Some links not found in this workspace',
        });
      }

      const normalizedTags = input.tags.map(tag => tag.toLowerCase());

      // Update each link individually to handle tag merging
      await ctx.prisma.$transaction(async (tx) => {
        for (const link of links) {
          const newTags = [...new Set([...link.tags, ...normalizedTags])].slice(0, 10); // Max 10 tags
          await tx.links.update({
            where: { id: link.id },
            data: { tags: newTags },
          });

          // Update tag usage counts
          const tagsToAdd = normalizedTags.filter(tag => !link.tags.includes(tag));
          for (const tagName of tagsToAdd) {
            const existingTag = await tx.tags.findUnique({
              where: {
                workspace_id_name: {
                  workspace_id: link.workspace_id,
                  name: tagName,
                },
              },
            });

            if (!existingTag) {
              await tx.tags.create({
                data: {
                  workspace_id: link.workspace_id,
                  name: tagName,
                  usage_count: 1,
                },
              });
            } else {
              await tx.tags.update({
                where: { id: existingTag.id },
                data: { usage_count: { increment: 1 } },
              });
            }
          }
        }
      });

      return { success: true, count: links.length };
    }),

  bulkRemoveTags: protectedProcedure
    .input(bulkTagSchema)
    .mutation(async ({ ctx, input }) => {
      const serverCtx: ServerPermissionContext = {
        userId: ctx.userId,
        prisma: ctx.prisma,
      };

      // Check permission for bulk operations
      await requirePermission(serverCtx, input.workspaceId, Permission.LINKS_BULK_OPERATIONS);

      // Verify all links belong to the workspace
      const links = await ctx.prisma.links.findMany({
        where: {
          id: { in: input.linkIds },
          workspace_id: input.workspaceId
        },
        select: { id: true, workspace_id: true, tags: true },
      });

      if (links.length !== input.linkIds.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Some links not found in this workspace',
        });
      }

      const normalizedTags = input.tags.map(tag => tag.toLowerCase());

      // Update each link individually
      await ctx.prisma.$transaction(async (tx) => {
        for (const link of links) {
          const tagsToRemove = link.tags.filter(tag => normalizedTags.includes(tag));
          const newTags = link.tags.filter(tag => !normalizedTags.includes(tag));

          await tx.links.update({
            where: { id: link.id },
            data: { tags: newTags },
          });

          // Update tag usage counts
          for (const tagName of tagsToRemove) {
            const tag = await tx.tags.findUnique({
              where: {
                workspace_id_name: {
                  workspace_id: link.workspace_id,
                  name: tagName,
                },
              },
            });

            if (tag) {
              await tx.tags.update({
                where: { id: tag.id },
                data: { usage_count: Math.max(0, tag.usage_count - 1) },
              });
            }
          }
        }
      });

      return { success: true, count: links.length };
    }),
});