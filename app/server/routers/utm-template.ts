import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { UTM_VALIDATION_RULES } from '@/packages/shared/src/types/utm';

const utmTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  utmSource: z
    .string()
    .max(UTM_VALIDATION_RULES.maxLength)
    .regex(UTM_VALIDATION_RULES.pattern)
    .optional()
    .nullable(),
  utmMedium: z
    .string()
    .max(UTM_VALIDATION_RULES.maxLength)
    .regex(UTM_VALIDATION_RULES.pattern)
    .optional()
    .nullable(),
  utmCampaign: z
    .string()
    .max(UTM_VALIDATION_RULES.maxLength)
    .regex(UTM_VALIDATION_RULES.pattern)
    .optional()
    .nullable(),
  utmTerm: z
    .string()
    .max(UTM_VALIDATION_RULES.maxLength)
    .regex(UTM_VALIDATION_RULES.pattern)
    .optional()
    .nullable(),
  utmContent: z
    .string()
    .max(UTM_VALIDATION_RULES.maxLength)
    .regex(UTM_VALIDATION_RULES.pattern)
    .optional()
    .nullable(),
});

export const utmTemplateRouter = router({
  create: protectedProcedure
    .input(utmTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma, userId } = ctx;

      // Get user's workspace
      const membership = await prisma.workspace_memberships.findFirst({
        where: { user_id: userId },
        select: { workspace_id: true },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'User is not a member of any workspace',
        });
      }

      // Create the UTM template
      const template = await prisma.utm_templates.create({
        data: {
          workspace_id: membership.workspace_id,
          name: input.name,
          description: input.description,
          utm_source: input.utmSource,
          utm_medium: input.utmMedium,
          utm_campaign: input.utmCampaign,
          utm_term: input.utmTerm,
          utm_content: input.utmContent,
          created_by: userId,
        },
      });

      return template;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const { prisma, userId } = ctx;

    // Get user's workspace
    const membership = await prisma.workspace_memberships.findFirst({
      where: { user_id: userId },
      select: { workspace_id: true },
    });

    if (!membership) {
      return [];
    }

    // Get all templates for the workspace
    const templates = await prisma.utm_templates.findMany({
      where: { workspace_id: membership.workspace_id },
      orderBy: { created_at: 'desc' },
    });

    return templates;
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        ...utmTemplateSchema.shape,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, userId } = ctx;
      const { id, ...data } = input;

      // Get user's workspace
      const membership = await prisma.workspace_memberships.findFirst({
        where: { user_id: userId },
        select: { workspace_id: true },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'User is not a member of any workspace',
        });
      }

      // Verify template belongs to user's workspace
      const existingTemplate = await prisma.utm_templates.findFirst({
        where: {
          id,
          workspace_id: membership.workspace_id,
        },
      });

      if (!existingTemplate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Template not found',
        });
      }

      // Update the template
      const updatedTemplate = await prisma.utm_templates.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          utm_source: data.utmSource,
          utm_medium: data.utmMedium,
          utm_campaign: data.utmCampaign,
          utm_term: data.utmTerm,
          utm_content: data.utmContent,
          updated_at: new Date(),
        },
      });

      return updatedTemplate;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, userId } = ctx;

      // Get user's workspace
      const membership = await prisma.workspace_memberships.findFirst({
        where: { user_id: userId },
        select: { workspace_id: true },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'User is not a member of any workspace',
        });
      }

      // Verify template belongs to user's workspace
      const existingTemplate = await prisma.utm_templates.findFirst({
        where: {
          id: input.id,
          workspace_id: membership.workspace_id,
        },
      });

      if (!existingTemplate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Template not found',
        });
      }

      // Delete the template
      await prisma.utm_templates.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});