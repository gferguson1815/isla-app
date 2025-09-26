import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const linkDraftSchema = z.object({
  destinationUrl: z.string().optional(),
  slug: z.string().optional(),
  domain: z.string().optional(),
  folderId: z.string().uuid().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  tags: z.array(z.string()).optional(),
  comments: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  password: z.string().optional(),
  expiresAt: z.date().optional(),
  clickLimit: z.number().optional(),
  iosUrl: z.string().optional(),
  androidUrl: z.string().optional(),
  geoTargeting: z.any().optional(),
  deviceTargeting: z.any().optional(),
  qrCodeSettings: z.any().optional(),
  conversionTracking: z.any().optional(),
});

export const linkDraftsRouter = router({
  // Save or update a draft
  save: protectedProcedure
    .input(
      z.object({
        draftId: z.string().uuid().optional(),
        workspaceId: z.string().uuid(),
        data: linkDraftSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // Check if user has access to workspace
      const workspace = await ctx.prisma.workspaces.findFirst({
        where: {
          id: input.workspaceId,
          workspace_members: {
            some: {
              user_id: userId,
            },
          },
        },
      });

      if (!workspace) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this workspace",
        });
      }

      // Limit drafts per user (keep only last 10)
      const existingDrafts = await ctx.prisma.link_drafts.findMany({
        where: {
          user_id: userId,
          workspace_id: input.workspaceId,
        },
        orderBy: { updated_at: "desc" },
        select: { id: true },
      });

      if (existingDrafts.length >= 10 && !input.draftId) {
        // Delete oldest drafts if we're creating a new one
        const draftsToDelete = existingDrafts.slice(9);
        await ctx.prisma.link_drafts.deleteMany({
          where: {
            id: { in: draftsToDelete.map((d) => d.id) },
          },
        });
      }

      // Save or update draft
      const draft = await ctx.prisma.link_drafts.upsert({
        where: {
          id: input.draftId || "00000000-0000-0000-0000-000000000000",
        },
        create: {
          workspace_id: input.workspaceId,
          user_id: userId,
          destination_url: input.data.destinationUrl,
          slug: input.data.slug,
          domain: input.data.domain,
          folder_id: input.data.folderId,
          title: input.data.title,
          description: input.data.description,
          image: input.data.image,
          tags: input.data.tags,
          comments: input.data.comments,
          utm_source: input.data.utmSource,
          utm_medium: input.data.utmMedium,
          utm_campaign: input.data.utmCampaign,
          utm_term: input.data.utmTerm,
          utm_content: input.data.utmContent,
          password: input.data.password,
          expires_at: input.data.expiresAt,
          click_limit: input.data.clickLimit,
          ios_url: input.data.iosUrl,
          android_url: input.data.androidUrl,
          geo_targeting: input.data.geoTargeting,
          device_targeting: input.data.deviceTargeting,
          qr_code_settings: input.data.qrCodeSettings,
          conversion_tracking: input.data.conversionTracking,
          form_data: input.data,
        },
        update: {
          destination_url: input.data.destinationUrl,
          slug: input.data.slug,
          domain: input.data.domain,
          folder_id: input.data.folderId,
          title: input.data.title,
          description: input.data.description,
          image: input.data.image,
          tags: input.data.tags,
          comments: input.data.comments,
          utm_source: input.data.utmSource,
          utm_medium: input.data.utmMedium,
          utm_campaign: input.data.utmCampaign,
          utm_term: input.data.utmTerm,
          utm_content: input.data.utmContent,
          password: input.data.password,
          expires_at: input.data.expiresAt,
          click_limit: input.data.clickLimit,
          ios_url: input.data.iosUrl,
          android_url: input.data.androidUrl,
          geo_targeting: input.data.geoTargeting,
          device_targeting: input.data.deviceTargeting,
          qr_code_settings: input.data.qrCodeSettings,
          conversion_tracking: input.data.conversionTracking,
          form_data: input.data,
        },
      });

      return {
        id: draft.id,
        savedAt: draft.updated_at,
      };
    }),

  // List user's drafts
  list: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const drafts = await ctx.prisma.link_drafts.findMany({
        where: {
          user_id: userId,
          workspace_id: input.workspaceId,
        },
        orderBy: { updated_at: "desc" },
        select: {
          id: true,
          destination_url: true,
          slug: true,
          domain: true,
          updated_at: true,
        },
      });

      // Format for display
      return drafts.map((draft) => ({
        id: draft.id,
        url: draft.domain && draft.slug
          ? `${draft.domain}/${draft.slug}`
          : draft.destination_url?.substring(0, 30) || "Untitled draft",
        timeAgo: getTimeAgo(draft.updated_at),
        updatedAt: draft.updated_at,
      }));
    }),

  // Get a specific draft
  get: protectedProcedure
    .input(
      z.object({
        draftId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const draft = await ctx.prisma.link_drafts.findFirst({
        where: {
          id: input.draftId,
          user_id: userId,
        },
      });

      if (!draft) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Draft not found",
        });
      }

      return {
        id: draft.id,
        destinationUrl: draft.destination_url,
        slug: draft.slug,
        domain: draft.domain,
        folderId: draft.folder_id,
        title: draft.title,
        description: draft.description,
        image: draft.image,
        tags: draft.tags,
        comments: draft.comments,
        utmSource: draft.utm_source,
        utmMedium: draft.utm_medium,
        utmCampaign: draft.utm_campaign,
        utmTerm: draft.utm_term,
        utmContent: draft.utm_content,
        password: draft.password,
        expiresAt: draft.expires_at,
        clickLimit: draft.click_limit,
        iosUrl: draft.ios_url,
        androidUrl: draft.android_url,
        geoTargeting: draft.geo_targeting,
        deviceTargeting: draft.device_targeting,
        qrCodeSettings: draft.qr_code_settings,
        conversionTracking: draft.conversion_tracking,
      };
    }),

  // Delete a draft
  delete: protectedProcedure
    .input(
      z.object({
        draftId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const deleted = await ctx.prisma.link_drafts.deleteMany({
        where: {
          id: input.draftId,
          user_id: userId,
        },
      });

      if (deleted.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Draft not found",
        });
      }

      return { success: true };
    }),

  // Clear all drafts for a user in a workspace
  clearAll: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      await ctx.prisma.link_drafts.deleteMany({
        where: {
          user_id: userId,
          workspace_id: input.workspaceId,
        },
      });

      return { success: true };
    }),
});

// Helper function to get time ago string
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}