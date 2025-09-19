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
  tags: z.array(z.string()).max(10).optional(),
});

const updateLinkSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  folder_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

const bulkMoveLinkSchema = z.object({
  link_ids: z.array(z.string().uuid()),
  folder_id: z.string().uuid().nullable(),
});

export const linkRouter = router({
  create: protectedProcedure
    .input(createLinkSchema)
    .mutation(async ({ ctx, input }) => {
      const startTime = Date.now();

      try {
        // Get user's workspace through membership
        const membership = await ctx.prisma.workspace_memberships.findFirst({
          where: { user_id: ctx.userId },
          include: { workspaces: true },
        });

        let workspaceId: string;

        if (!membership) {
          // Create default workspace and membership
          const newWorkspace = await ctx.prisma.workspaces.create({
            data: {
              id: crypto.randomUUID(),
              name: 'Default Workspace',
              slug: `workspace-${ctx.userId.slice(0, 8)}`,
              plan: 'free',
              max_links: 50,
              max_clicks: 5000,
              max_users: 1,
              created_at: new Date(),
              updated_at: new Date(),
            },
          });

          await ctx.prisma.workspace_memberships.create({
            data: {
              id: crypto.randomUUID(),
              user_id: ctx.userId,
              workspace_id: newWorkspace.id,
              role: 'owner',
              joined_at: new Date(),
            },
          });

          workspaceId = newWorkspace.id;
        } else {
          workspaceId = membership.workspace_id;
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
            url: input.url,
            slug: finalSlug,
            title: input.title || null,
            description: input.description || null,
            tags: processedTags,
            created_by: ctx.userId,
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
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        tags: z.array(z.string()).optional(),
        tagFilterMode: z.enum(['AND', 'OR']).default('AND').optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get user's workspaces through memberships
      const memberships = await ctx.prisma.workspace_memberships.findMany({
        where: { user_id: ctx.userId },
        select: { workspace_id: true },
      });

      if (memberships.length === 0) {
        return { links: [], total: 0 };
      }

      const workspaceIds = memberships.map(m => m.workspace_id);

      // Build where clause
      const where: any = {
        workspace_id: { in: workspaceIds },
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
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get the link to verify ownership
      const link = await ctx.prisma.links.findUnique({
        where: { id: input.id },
        select: { workspace_id: true },
      });

      if (!link) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Link not found',
        });
      }

      // Check user has access to this workspace
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: link.workspace_id,
          user_id: ctx.userId,
        },
      });

      if (!membership) {
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
      // Verify ownership
      const link = await ctx.prisma.links.findUnique({
        where: { id: input.id },
        select: { workspace_id: true },
      });

      if (!link) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Link not found',
        });
      }

      // Check user has access to this workspace
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: link.workspace_id,
          user_id: ctx.userId,
        },
      });

      if (!membership) {
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
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const link = await ctx.prisma.links.findUnique({
        where: { slug: input.slug },
      });

      if (!link) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Link not found',
        });
      }

      // Verify user has access to workspace
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: link.workspace_id,
          user_id: ctx.userId,
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

  bulkMove: protectedProcedure
    .input(bulkMoveLinkSchema)
    .mutation(async ({ ctx, input }) => {
      // Get all links to verify they belong to the same workspace
      const links = await ctx.prisma.links.findMany({
        where: {
          id: { in: input.link_ids }
        },
        select: { id: true, workspace_id: true }
      });

      if (links.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No links found',
        });
      }

      // Verify all links are from the same workspace
      const workspaceIds = [...new Set(links.map(l => l.workspace_id))];
      if (workspaceIds.length > 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Links must belong to the same workspace',
        });
      }

      const workspaceId = workspaceIds[0];

      // Check user has access to this workspace
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: workspaceId,
          user_id: ctx.userId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this workspace',
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

        if (folder.workspace_id !== workspaceId) {
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
    .input(z.object({
      linkIds: z.array(z.string().uuid()),
      tags: z.array(z.string()).min(1).max(10),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify all links belong to user's workspaces
      const links = await ctx.prisma.links.findMany({
        where: { id: { in: input.linkIds } },
        select: { id: true, workspace_id: true, tags: true },
      });

      if (links.length !== input.linkIds.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Some links not found',
        });
      }

      // Check user has access to all workspaces
      const workspaceIds = [...new Set(links.map(l => l.workspace_id))];
      const memberships = await ctx.prisma.workspace_memberships.findMany({
        where: {
          workspace_id: { in: workspaceIds },
          user_id: ctx.userId,
        },
      });

      if (memberships.length !== workspaceIds.length) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify some of these links',
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
    .input(z.object({
      linkIds: z.array(z.string().uuid()),
      tags: z.array(z.string()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify all links belong to user's workspaces
      const links = await ctx.prisma.links.findMany({
        where: { id: { in: input.linkIds } },
        select: { id: true, workspace_id: true, tags: true },
      });

      if (links.length !== input.linkIds.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Some links not found',
        });
      }

      // Check user has access to all workspaces
      const workspaceIds = [...new Set(links.map(l => l.workspace_id))];
      const memberships = await ctx.prisma.workspace_memberships.findMany({
        where: {
          workspace_id: { in: workspaceIds },
          user_id: ctx.userId,
        },
      });

      if (memberships.length !== workspaceIds.length) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify some of these links',
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

  getImportHistory: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify user has access to workspace
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: input.workspaceId,
          user_id: ctx.userId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view import history for this workspace',
        });
      }

      const imports = await ctx.prisma.link_imports.findMany({
        where: {
          workspace_id: input.workspaceId,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 50,
      });

      // Get user details for each import
      const userIds = [...new Set(imports.map(i => i.created_by))];
      const users = await ctx.prisma.users.findMany({
        where: {
          id: { in: userIds },
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      const userMap = new Map(users.map(u => [u.id, u]));

      return imports.map(imp => ({
        id: imp.id,
        fileName: imp.file_name,
        totalRows: imp.total_rows,
        successCount: imp.success_count,
        errorCount: imp.error_count,
        status: imp.status as "processing" | "completed" | "partial" | "failed",
        createdAt: imp.created_at,
        createdBy: userMap.get(imp.created_by) || {
          email: 'unknown',
          name: null,
        },
      }));
    }),

  validateCsvFile: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileType: z.string(),
      fileSize: z.number(),
      firstBytes: z.string().optional(), // Base64 encoded first 512 bytes for MIME checking
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate file size (5MB limit)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (input.fileSize > MAX_FILE_SIZE) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File size exceeds 5MB limit',
        });
      }

      // Validate file extension
      if (!input.fileName.toLowerCase().endsWith('.csv')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only CSV files are allowed',
        });
      }

      // Validate MIME type
      const allowedMimeTypes = [
        'text/csv',
        'text/plain',
        'application/csv',
        'application/vnd.ms-excel',
      ];

      if (!allowedMimeTypes.includes(input.fileType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid file type. Only CSV files are allowed',
        });
      }

      // Additional check using file magic bytes if provided
      if (input.firstBytes) {
        const bytes = Buffer.from(input.firstBytes, 'base64');
        // CSV files typically start with printable ASCII characters
        // Check if first bytes are reasonable for CSV
        const isLikelyText = bytes.every(byte => 
          (byte >= 0x20 && byte <= 0x7E) || // Printable ASCII
          byte === 0x09 || // Tab
          byte === 0x0A || // Line feed
          byte === 0x0D    // Carriage return
        );

        if (!isLikelyText) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'File content does not appear to be valid CSV',
          });
        }
      }

      return { valid: true };
    }),

  bulkImportCsv: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      links: z.array(z.object({
        url: z.string().url(),
        slug: z.string().optional(),
        title: z.string().optional(),
        tags: z.array(z.string()).optional(),
        folderId: z.string().uuid().optional(),
      })),
      importId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to workspace
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: input.workspaceId,
          user_id: ctx.userId,
        },
        include: {
          workspaces: true,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to import links to this workspace',
        });
      }

      const workspace = membership.workspaces;

      // Check plan limits
      const currentLinkCount = await ctx.prisma.links.count({
        where: { workspace_id: input.workspaceId },
      });

      const planLimits = {
        free: 10,
        starter: 100,
        growth: 1000,
      };

      const maxImportSize = planLimits[workspace.plan as keyof typeof planLimits] || 10;
      const remainingQuota = workspace.max_links - currentLinkCount;

      if (input.links.length > maxImportSize) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Your ${workspace.plan} plan allows importing up to ${maxImportSize} links at once`,
        });
      }

      if (input.links.length > remainingQuota) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Importing ${input.links.length} links would exceed your workspace limit of ${workspace.max_links} links`,
        });
      }

      // Process links in batches
      const batchSize = 10;
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as Array<{ index: number; error: string }>,
      };

      // Get existing slugs for duplicate checking
      const existingSlugs = await ctx.prisma.links.findMany({
        where: { workspace_id: input.workspaceId },
        select: { slug: true },
      });
      const existingSlugSet = new Set(existingSlugs.map(l => l.slug));

      // Process in transaction with timeout and rollback on failure
      const TRANSACTION_TIMEOUT = 30000; // 30 seconds timeout
      
      try {
        await ctx.prisma.$transaction(async (tx) => {
        // Create import record
        await tx.link_imports.create({
          data: {
            id: input.importId,
            workspace_id: input.workspaceId,
            file_name: 'csv_import',
            total_rows: input.links.length,
            success_count: 0,
            error_count: 0,
            status: 'processing',
            created_by: ctx.userId,
            created_at: new Date(),
          },
        });

        for (let i = 0; i < input.links.length; i += batchSize) {
          const batch = input.links.slice(i, Math.min(i + batchSize, input.links.length));
          
          for (const [index, linkData] of batch.entries()) {
            const globalIndex = i + index;
            
            try {
              let finalSlug: string;

              if (linkData.slug) {
                const sanitized = sanitizeSlug(linkData.slug);
                if (!sanitized || !isValidSlug(sanitized)) {
                  throw new Error('Invalid slug format');
                }

                if (existingSlugSet.has(sanitized)) {
                  throw new Error('Slug already exists');
                }

                finalSlug = sanitized;
                existingSlugSet.add(finalSlug);
              } else {
                // Generate unique slug with proper uniqueness check
                finalSlug = await generateUniqueSlug(async (slug: string) => {
                  // Check if slug already exists in database or in current import batch
                  if (existingSlugSet.has(slug)) {
                    return false;
                  }
                  
                  const existing = await tx.links.findFirst({
                    where: {
                      workspace_id: input.workspaceId,
                      slug: slug,
                    },
                  });
                  
                  return !existing;
                });
                existingSlugSet.add(finalSlug);
              }

              // Handle folder lookup if provided
              let folderId = null;
              if (linkData.folderId) {
                const folder = await tx.folders.findFirst({
                  where: {
                    id: linkData.folderId,
                    workspace_id: input.workspaceId,
                  },
                });
                if (folder) {
                  folderId = folder.id;
                }
              }

              // Create the link
              const newLink = await tx.links.create({
                data: {
                  id: crypto.randomUUID(),
                  workspace_id: input.workspaceId,
                  url: linkData.url,
                  slug: finalSlug,
                  title: linkData.title || null,
                  folder_id: folderId,
                  tags: linkData.tags || [],
                  import_id: input.importId,
                  created_by: ctx.userId,
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              });

              // Update tag usage counts
              if (linkData.tags && linkData.tags.length > 0) {
                for (const tagName of linkData.tags) {
                  const normalizedTag = tagName.toLowerCase();
                  const existingTag = await tx.tags.findUnique({
                    where: {
                      workspace_id_name: {
                        workspace_id: input.workspaceId,
                        name: normalizedTag,
                      },
                    },
                  });

                  if (!existingTag) {
                    await tx.tags.create({
                      data: {
                        workspace_id: input.workspaceId,
                        name: normalizedTag,
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

              results.successful++;
            } catch (error) {
              results.failed++;
              results.errors.push({
                index: globalIndex,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }
        }

        // Update import record with results
        await tx.link_imports.update({
          where: { id: input.importId },
          data: {
            success_count: results.successful,
            error_count: results.failed,
            status: results.failed === 0 ? 'completed' : 'partial',
          },
        });
      }, {
        timeout: TRANSACTION_TIMEOUT,
        maxWait: 5000, // Max time to wait for connection from pool
      });
    } catch (error) {
      // On transaction failure, mark import as failed
      try {
        await ctx.prisma.link_imports.update({
          where: { id: input.importId },
          data: {
            status: 'failed',
            error_count: input.links.length,
          },
        });
      } catch (updateError) {
        // Log but don't throw if we can't update the import record
        console.error('Failed to update import status:', updateError);
      }
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

      return results;
    }),

  undoImport: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      importId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to workspace
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: input.workspaceId,
          user_id: ctx.userId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to undo imports in this workspace',
        });
      }

      // Check if import exists and was created recently (within 5 minutes)
      const importRecord = await ctx.prisma.link_imports.findFirst({
        where: {
          id: input.importId,
          workspace_id: input.workspaceId,
        },
      });

      if (!importRecord) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Import not found',
        });
      }

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (importRecord.created_at < fiveMinutesAgo) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Undo window has expired (5 minutes)',
        });
      }

      // Soft delete all links from this import
      const result = await ctx.prisma.links.updateMany({
        where: {
          import_id: input.importId,
          workspace_id: input.workspaceId,
          deleted_at: null, // Only undo non-deleted links
        },
        data: {
          deleted_at: new Date(),
        },
      });

      // Update import record to mark as undone
      await ctx.prisma.link_imports.update({
        where: { id: input.importId },
        data: {
          status: 'undone',
        },
      });

      return {
        success: true,
        undoneCount: result.count,
      };
    }),
});