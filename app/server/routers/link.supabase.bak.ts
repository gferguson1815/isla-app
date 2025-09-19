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
        // Get user's workspaces through membership
        const { data: memberships, error: membershipError } = await ctx.supabase
          .from('workspace_memberships')
          .select('workspace_id')
          .eq('user_id', ctx.userId)
          .limit(1)
          .single();

        let workspaceId: string;

        if (membershipError || !memberships) {
          // Create default workspace if none exists
          const { data: newWorkspace, error: createError } = await ctx.supabase
            .from('workspaces')
            .insert({
              name: 'Default Workspace',
              slug: `workspace-${ctx.userId.slice(0, 8)}`,
            } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
            .select('id')
            .single();

          if (createError || !newWorkspace) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create workspace',
            });
          }

          // Create workspace membership
          const { error: membershipCreateError } = await ctx.supabase
            .from('workspace_memberships')
            .insert({
              user_id: ctx.userId,
              workspace_id: newWorkspace.id,
              role: 'owner',
            });

          if (membershipCreateError) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create workspace membership',
            });
          }

          workspaceId = newWorkspace.id;
        } else {
          workspaceId = memberships.workspace_id;
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
          const { data: existing } = await ctx.supabase
            .from('links')
            .select('id')
            .eq('slug', sanitized)
            .single();

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
            const { data } = await ctx.supabase
              .from('links')
              .select('id')
              .eq('slug', slug)
              .single();
            return !data;
          });
        }

        // Create link in database
        const { data: link, error: linkError } = await ctx.supabase
          .from('links')
          .insert({
            workspace_id: workspaceId,
            url: input.url,
            slug: finalSlug,
            title: input.title || null,
            description: input.description || null,
          } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          .select()
          .single();

        if (linkError || !link) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create link',
          });
        }

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
      const { data: memberships } = await ctx.supabase
        .from('workspace_memberships')
        .select('workspace_id')
        .eq('user_id', ctx.userId);

      if (!memberships || memberships.length === 0) {
        return { links: [], total: 0 };
      }

      const workspaceIds = memberships.map(m => m.workspace_id);

      // Get links with pagination
      const { data: links, error, count } = await ctx.supabase
        .from('links')
        .select('*', { count: 'exact' })
        .in('workspace_id', workspaceIds)
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch links',
        });
      }

      return {
        links: links?.map(link => ({
          ...link,
          shortUrl: getShortUrl(link.slug),
        })) || [],
        total: count || 0,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through workspace
      const { data: link } = await ctx.supabase
        .from('links')
        .select('workspace_id')
        .eq('id', input.id)
        .single();

      if (!link) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Link not found',
        });
      }

      // Check user has access to this workspace
      const { data: membership } = await ctx.supabase
        .from('workspace_memberships')
        .select('role')
        .eq('workspace_id', link.workspace_id)
        .eq('user_id', ctx.userId)
        .single();

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this link',
        });
      }

      // Delete the link
      const { error } = await ctx.supabase
        .from('links')
        .delete()
        .eq('id', input.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete link',
        });
      }

      return { success: true };
    }),

  update: protectedProcedure
    .input(updateLinkSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const { data: link } = await ctx.supabase
        .from('links')
        .select('workspace_id')
        .eq('id', input.id)
        .single();

      if (!link) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Link not found',
        });
      }

      // Check user has access to this workspace
      const { data: membership } = await ctx.supabase
        .from('workspace_memberships')
        .select('role')
        .eq('workspace_id', link.workspace_id)
        .eq('user_id', ctx.userId)
        .single();

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this link',
        });
      }

      // Update link
      const { data: updatedLink, error } = await ctx.supabase
        .from('links')
        .update({
          ...(input.url && { url: input.url }),
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error || !updatedLink) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update link',
        });
      }

      return {
        ...updatedLink,
        shortUrl: getShortUrl(updatedLink.slug),
      };
    }),

  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data: link, error } = await ctx.supabase
        .from('links')
        .select('*')
        .eq('slug', input.slug)
        .single();

      if (error || !link) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Link not found',
        });
      }

      // Verify user has access to workspace
      const { data: membership } = await ctx.supabase
        .from('workspace_memberships')
        .select('role')
        .eq('workspace_id', link.workspace_id)
        .eq('user_id', ctx.userId)
        .single();

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