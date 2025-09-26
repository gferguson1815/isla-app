import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { v4 as uuidv4 } from 'uuid';
import { workspaceRateLimiter, checkRateLimit } from '@/lib/rate-limit';
import {
  CreateFolderSchema,
  UpdateFolderSchema,
  DeleteFolderSchema,
  MoveFolderSchema,
  type FolderWithChildren
} from '@/packages/shared/src/types/folder';

const MAX_FOLDER_DEPTH = 3;

async function validateFolderDepth(
  prisma: any,
  parentId: string | null | undefined
): Promise<number> {
  if (!parentId) return 0;

  const parent = await prisma.folders.findUnique({
    where: { id: parentId }
  });

  if (!parent) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Parent folder not found'
    });
  }

  if (parent.level >= MAX_FOLDER_DEPTH - 1) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Maximum folder depth of ${MAX_FOLDER_DEPTH} levels exceeded`
    });
  }

  return parent.level + 1;
}

function buildFolderTree(
  folders: any[],
  parentId: string | null = null
): FolderWithChildren[] {
  return folders
    .filter(folder => folder.parent_id === parentId)
    .map(folder => ({
      ...folder,
      children: buildFolderTree(folders, folder.id)
    }));
}

export const folderRouter: any = router({
  create: protectedProcedure
    .input(CreateFolderSchema)
    .mutation(async ({ ctx, input }) => {
      // Rate limiting check
      await checkRateLimit(workspaceRateLimiter.creation, `folder-create-${ctx.userId}`);

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
          message: 'You are not a member of this workspace'
        });
      }

      // Check if workspace plan allows folder creation
      const workspace = await ctx.prisma.workspaces.findUnique({
        where: { id: input.workspace_id },
        select: { plan: true }
      });

      // Get the folders feature configuration for this plan
      const foldersFeature = await ctx.prisma.features.findUnique({
        where: { key: 'folders' }
      });

      if (foldersFeature) {
        const planFeature = await ctx.prisma.plan_features.findUnique({
          where: {
            plan_feature_id: {
              plan: workspace?.plan || 'free',
              feature_id: foldersFeature.id
            }
          }
        });

        if (!planFeature?.enabled) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: planFeature?.custom_message || 'Folders are not available on your current plan. Please upgrade to Pro.'
          });
        }

        // Check folder limit if applicable
        if (planFeature.limit_value !== null && planFeature.limit_value > 0) {
          const folderCount = await ctx.prisma.folders.count({
            where: { workspace_id: input.workspace_id }
          });

          if (folderCount >= planFeature.limit_value) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: `You have reached the maximum number of folders (${planFeature.limit_value}) for your plan.`
            });
          }
        }
      }

      // Validate folder depth
      const level = await validateFolderDepth(ctx.prisma, input.parent_id);

      const folder = await ctx.prisma.folders.create({
        data: {
          id: uuidv4(),
          workspace_id: input.workspace_id,
          name: input.name,
          description: input.description || null,
          parent_id: input.parent_id || null,
          level,
          updated_at: new Date()
        }
      });

      return folder;
    }),

  list: protectedProcedure
    .input(z.object({
      workspace_id: z.string().uuid()
    }))
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
          message: 'You are not a member of this workspace'
        });
      }

      const folders = await ctx.prisma.folders.findMany({
        where: {
          workspace_id: input.workspace_id
        },
        include: {
          _count: {
            select: { links: true }
          }
        },
        orderBy: [
          { level: 'asc' },
          { name: 'asc' }
        ]
      });

      // Build hierarchical tree structure
      const tree = buildFolderTree(folders);

      return {
        folders,
        tree
      };
    }),

  update: protectedProcedure
    .input(UpdateFolderSchema)
    .mutation(async ({ ctx, input }) => {
      // Get folder to verify ownership
      const folder = await ctx.prisma.folders.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          workspace_id: true,
          name: true,
          description: true,
          parent_id: true,
          level: true,
          created_at: true,
          updated_at: true
        }
      });

      if (!folder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Folder not found'
        });
      }

      // Verify user has access to workspace
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: folder.workspace_id,
          user_id: ctx.userId,
        }
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this folder'
        });
      }

      // If changing parent, validate depth
      if (input.parent_id !== undefined) {
        const level = await validateFolderDepth(ctx.prisma, input.parent_id);

        // Check if moving would create a cycle
        if (input.parent_id) {
          const descendants = await ctx.prisma.$queryRaw`
            WITH RECURSIVE folder_tree AS (
              SELECT id, parent_id FROM folders WHERE id = ${input.id}
              UNION ALL
              SELECT f.id, f.parent_id FROM folders f
              JOIN folder_tree ft ON f.parent_id = ft.id
            )
            SELECT id FROM folder_tree WHERE id = ${input.parent_id}
          `;

          if ((descendants as any[]).length > 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Cannot move folder to its own descendant'
            });
          }
        }

        // Update all descendants' levels
        await ctx.prisma.$executeRaw`
          WITH RECURSIVE folder_tree AS (
            SELECT id, ${level} as new_level FROM folders WHERE id = ${input.id}
            UNION ALL
            SELECT f.id, ft.new_level + 1 FROM folders f
            JOIN folder_tree ft ON f.parent_id = ft.id
          )
          UPDATE folders SET level = folder_tree.new_level
          FROM folder_tree WHERE folders.id = folder_tree.id
        `;
      }

      const updatedFolder = await ctx.prisma.folders.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          parent_id: input.parent_id,
          updated_at: new Date()
        }
      });

      return updatedFolder;
    }),

  delete: protectedProcedure
    .input(DeleteFolderSchema)
    .mutation(async ({ ctx, input }) => {
      // Get folder to verify ownership
      const folder = await ctx.prisma.folders.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          workspace_id: true,
          parent_id: true,
          level: true,
          _count: {
            select: {
              links: true,
              other_folders: true
            }
          }
        }
      });

      if (!folder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Folder not found'
        });
      }

      // Verify user has access to workspace
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: folder.workspace_id,
          user_id: ctx.userId,
        }
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this folder'
        });
      }

      if (!input.cascade) {
        // Move links to parent folder or null
        await ctx.prisma.links.updateMany({
          where: { folder_id: input.id },
          data: { folder_id: folder.parent_id }
        });

        // Move child folders to parent
        await ctx.prisma.folders.updateMany({
          where: { parent_id: input.id },
          data: {
            parent_id: folder.parent_id,
            level: folder.level
          }
        });
      }

      // Delete the folder (cascade will handle children if enabled)
      await ctx.prisma.folders.delete({
        where: { id: input.id }
      });

      return {
        success: true,
        affectedLinks: folder._count.links,
        affectedFolders: folder._count.other_folders
      };
    }),

  move: protectedProcedure
    .input(MoveFolderSchema)
    .mutation(async ({ ctx, input }) => {
      // Reuse update logic for moving folders
      const updateInput = {
        id: input.id,
        parent_id: input.parent_id
      };

      // Call the update mutation with the same context
      const caller = folderRouter.createCaller(ctx);
      return caller.update(updateInput);
    }),

  getPath: protectedProcedure
    .input(z.object({
      folder_id: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      const path = await ctx.prisma.$queryRaw`
        WITH RECURSIVE folder_path AS (
          SELECT id, name, parent_id, 0 as depth
          FROM folders WHERE id = ${input.folder_id}
          UNION ALL
          SELECT f.id, f.name, f.parent_id, fp.depth + 1
          FROM folders f
          JOIN folder_path fp ON f.id = fp.parent_id
        )
        SELECT id, name FROM folder_path ORDER BY depth DESC
      `;

      return path as { id: string; name: string }[];
    })
});