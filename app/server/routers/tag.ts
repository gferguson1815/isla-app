import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const tagRouter = router({
  list: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      const { workspaceId } = input

      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: workspaceId,
          user_id: ctx.userId,
        },
      })

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this workspace',
        })
      }

      const tags = await ctx.prisma.tags.findMany({
        where: {
          workspace_id: workspaceId,
        },
        orderBy: [
          { usage_count: 'desc' },
          { name: 'asc' },
        ],
      })

      return tags
    }),

  create: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      name: z.string().min(1).max(50),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { workspaceId, name, color } = input

      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: workspaceId,
          user_id: ctx.userId,
        },
      })

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this workspace',
        })
      }

      const existingTag = await ctx.prisma.tags.findUnique({
        where: {
          workspace_id_name: {
            workspace_id: workspaceId,
            name: name.toLowerCase(),
          },
        },
      })

      if (existingTag) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Tag already exists',
        })
      }

      const tag = await ctx.prisma.tags.create({
        data: {
          workspace_id: workspaceId,
          name: name.toLowerCase(),
          color,
        },
      })

      return tag
    }),

  rename: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      tagId: z.string().uuid(),
      newName: z.string().min(1).max(50),
    }))
    .mutation(async ({ input, ctx }) => {
      const { workspaceId, tagId, newName } = input

      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: workspaceId,
          user_id: ctx.userId,
          role: { in: ['owner', 'admin'] },
        },
      })

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be an admin to rename tags',
        })
      }

      const tag = await ctx.prisma.tags.findFirst({
        where: {
          id: tagId,
          workspace_id: workspaceId,
        },
      })

      if (!tag) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tag not found',
        })
      }

      const existingTag = await ctx.prisma.tags.findFirst({
        where: {
          workspace_id: workspaceId,
          name: newName.toLowerCase(),
          NOT: { id: tagId },
        },
      })

      if (existingTag) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A tag with this name already exists',
        })
      }

      await ctx.prisma.$transaction(async (tx) => {
        const oldName = tag.name

        await tx.tags.update({
          where: { id: tagId },
          data: { name: newName.toLowerCase() },
        })

        const links = await tx.links.findMany({
          where: {
            workspace_id: workspaceId,
            tags: { has: oldName },
          },
        })

        for (const link of links) {
          const newTags = link.tags.map(t => t === oldName ? newName.toLowerCase() : t)
          await tx.links.update({
            where: { id: link.id },
            data: { tags: newTags },
          })
        }
      })

      return { success: true }
    }),

  merge: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      sourceTagId: z.string().uuid(),
      targetTagId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { workspaceId, sourceTagId, targetTagId } = input

      if (sourceTagId === targetTagId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot merge a tag with itself',
        })
      }

      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: workspaceId,
          user_id: ctx.userId,
          role: { in: ['owner', 'admin'] },
        },
      })

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be an admin to merge tags',
        })
      }

      const [sourceTag, targetTag] = await Promise.all([
        ctx.prisma.tags.findFirst({
          where: { id: sourceTagId, workspace_id: workspaceId },
        }),
        ctx.prisma.tags.findFirst({
          where: { id: targetTagId, workspace_id: workspaceId },
        }),
      ])

      if (!sourceTag || !targetTag) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'One or both tags not found',
        })
      }

      await ctx.prisma.$transaction(async (tx) => {
        const links = await tx.links.findMany({
          where: {
            workspace_id: workspaceId,
            tags: { has: sourceTag.name },
          },
        })

        for (const link of links) {
          const newTags = link.tags.filter(t => t !== sourceTag.name)
          if (!newTags.includes(targetTag.name)) {
            newTags.push(targetTag.name)
          }
          await tx.links.update({
            where: { id: link.id },
            data: { tags: newTags },
          })
        }

        await tx.tags.update({
          where: { id: targetTagId },
          data: {
            usage_count: targetTag.usage_count + sourceTag.usage_count,
          },
        })

        await tx.tags.delete({
          where: { id: sourceTagId },
        })
      })

      return { success: true }
    }),

  delete: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      tagId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { workspaceId, tagId } = input

      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: workspaceId,
          user_id: ctx.userId,
          role: { in: ['owner', 'admin'] },
        },
      })

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be an admin to delete tags',
        })
      }

      const tag = await ctx.prisma.tags.findFirst({
        where: {
          id: tagId,
          workspace_id: workspaceId,
        },
      })

      if (!tag) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tag not found',
        })
      }

      await ctx.prisma.$transaction(async (tx) => {
        const links = await tx.links.findMany({
          where: {
            workspace_id: workspaceId,
            tags: { has: tag.name },
          },
        })

        for (const link of links) {
          const newTags = link.tags.filter(t => t !== tag.name)
          await tx.links.update({
            where: { id: link.id },
            data: { tags: newTags },
          })
        }

        await tx.tags.delete({
          where: { id: tagId },
        })
      })

      return { success: true }
    }),

  suggest: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      query: z.string().optional(),
      limit: z.number().min(1).max(20).default(10),
    }))
    .query(async ({ input, ctx }) => {
      const { workspaceId, query, limit } = input

      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: workspaceId,
          user_id: ctx.userId,
        },
      })

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this workspace',
        })
      }

      const where = {
        workspace_id: workspaceId,
        ...(query && {
          name: {
            contains: query.toLowerCase(),
          },
        }),
      }

      const tags = await ctx.prisma.tags.findMany({
        where,
        orderBy: [
          { usage_count: 'desc' },
          { name: 'asc' },
        ],
        take: limit,
      })

      return tags
    }),

  updateColor: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      tagId: z.string().uuid(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { workspaceId, tagId, color } = input

      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: workspaceId,
          user_id: ctx.userId,
        },
      })

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this workspace',
        })
      }

      const tag = await ctx.prisma.tags.findFirst({
        where: {
          id: tagId,
          workspace_id: workspaceId,
        },
      })

      if (!tag) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tag not found',
        })
      }

      const updatedTag = await ctx.prisma.tags.update({
        where: { id: tagId },
        data: { color },
      })

      return updatedTag
    }),
})