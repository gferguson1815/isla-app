import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { randomBytes } from 'crypto';
import { sendInvitationEmail } from '@/lib/emails/send-invitation';
import { workspaceRateLimiter, checkRateLimit } from '@/lib/rate-limit';
import { generateSecureToken, verifyToken } from '@/lib/utils/secure-token';
import { sendEmailWithRetry } from '@/lib/utils/email-retry';
import { createAuditLog, createAuditLogs } from '@/lib/services/audit-log';
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspacePlan,
  WorkspaceRole,
  WorkspaceInvitation,
  SendInvitationsInput,
  AcceptInvitationInput,
  RevokeInvitationInput,
  RemoveMemberInput
} from '@/packages/shared/src/types/workspace';

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50);
}

// Helper function to ensure unique slug
async function ensureUniqueSlug(prisma: any, baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.workspaces.findFirst({
      where: {
        slug,
        deleted_at: null, // Only check non-deleted workspaces
      }
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export const workspaceRouter = router({
  // Create workspace
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      slug: z.string().min(1).max(50).optional(),
      description: z.string().optional(),
      logoUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log('[workspace.create] Starting with input:', input);
      console.log('[workspace.create] User ID:', ctx.userId);

      // Simple implementation for debugging
      const { name, slug: inputSlug, logoUrl } = input;
      const slug = inputSlug || generateSlug(name);

      // Create workspace with logo URL
      const workspace = await ctx.prisma.workspaces.create({
        data: {
          id: crypto.randomUUID(),
          name,
          slug,
          logo_url: logoUrl || null,
          plan: 'free',
          max_links: 50,
          max_clicks: 5000,
          max_users: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Create membership
      await ctx.prisma.workspace_memberships.create({
        data: {
          id: crypto.randomUUID(),
          user_id: ctx.userId,
          workspace_id: workspace.id,
          role: 'owner',
          joined_at: new Date(),
        },
      });

      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        domain: workspace.domain,
        plan: workspace.plan as WorkspacePlan,
        stripeCustomerId: workspace.stripe_customer_id,
        stripeSubscriptionId: workspace.stripe_subscription_id,
        maxLinks: workspace.max_links,
        maxClicks: workspace.max_clicks,
        maxUsers: workspace.max_users,
        createdAt: workspace.created_at,
        updatedAt: workspace.updated_at,
      };
    }),

  // List user's workspaces
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const memberships = await ctx.prisma.workspace_memberships.findMany({
        where: {
          user_id: ctx.userId,
          workspaces: {
            deleted_at: null, // Exclude soft-deleted workspaces
          },
        },
        include: {
          workspaces: {
            include: {
              _count: {
                select: {
                  links: true,
                  workspace_memberships: true,
                },
              },
            },
          },
        },
        orderBy: { joined_at: 'desc' },
      });

      return memberships.map((membership) => ({
        id: membership.workspaces.id,
        name: membership.workspaces.name,
        slug: membership.workspaces.slug,
        domain: membership.workspaces.domain,
        plan: membership.workspaces.plan as WorkspacePlan,
        stripeCustomerId: membership.workspaces.stripe_customer_id,
        stripeSubscriptionId: membership.workspaces.stripe_subscription_id,
        maxLinks: membership.workspaces.max_links,
        maxClicks: membership.workspaces.max_clicks,
        maxUsers: membership.workspaces.max_users,
        onboarding_completed: membership.workspaces.onboarding_completed,
        onboarding_steps: membership.workspaces.onboarding_steps,
        getting_started_dismissed: membership.workspaces.getting_started_dismissed,
        createdAt: membership.workspaces.created_at,
        updatedAt: membership.workspaces.updated_at,
        membership: {
          id: membership.id,
          userId: membership.user_id,
          workspaceId: membership.workspace_id,
          role: membership.role as WorkspaceRole,
          joinedAt: membership.joined_at,
          createdAt: membership.joined_at,
          updatedAt: membership.joined_at,
        },
        _count: {
          links: membership.workspaces._count.links,
          members: membership.workspaces._count.workspace_memberships,
        },
      }));
    }),

  // Get workspace by slug
  getBySlug: protectedProcedure
    .input(z.object({
      slug: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          user_id: ctx.userId,
          workspaces: {
            slug: input.slug,
            deleted_at: null, // Exclude soft-deleted workspaces
          },
        },
        include: {
          workspaces: {
            include: {
              _count: {
                select: {
                  links: true,
                  workspace_memberships: true,
                },
              },
            },
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found or access denied',
        });
      }

      return {
        id: membership.workspaces.id,
        name: membership.workspaces.name,
        slug: membership.workspaces.slug,
        logo_url: membership.workspaces.logo_url,
        domain: membership.workspaces.domain,
        plan: membership.workspaces.plan as WorkspacePlan,
        stripeCustomerId: membership.workspaces.stripe_customer_id,
        stripeSubscriptionId: membership.workspaces.stripe_subscription_id,
        maxLinks: membership.workspaces.max_links,
        maxClicks: membership.workspaces.max_clicks,
        maxUsers: membership.workspaces.max_users,
        onboarding_completed: membership.workspaces.onboarding_completed,
        onboarding_completed_at: membership.workspaces.onboarding_completed_at,
        onboarding_steps: membership.workspaces.onboarding_steps,
        getting_started_dismissed: membership.workspaces.getting_started_dismissed,
        createdAt: membership.workspaces.created_at,
        updatedAt: membership.workspaces.updated_at,
        membership: {
          id: membership.id,
          userId: membership.user_id,
          workspaceId: membership.workspace_id,
          role: membership.role as WorkspaceRole,
          joinedAt: membership.joined_at,
          createdAt: membership.joined_at,
          updatedAt: membership.joined_at,
        },
        _count: {
          links: membership.workspaces._count.links,
          members: membership.workspaces._count.workspace_memberships,
        },
      };
    }),

  // Update workspace
  update: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      domain: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { workspaceId, ...updateData } = input;

      // Check if user has admin/owner permissions
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          user_id: ctx.userId,
          workspace_id: workspaceId,
          role: { in: ['owner', 'admin'] },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to update workspace',
        });
      }

      const workspace = await ctx.prisma.workspaces.update({
        where: { id: workspaceId },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });

      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        domain: workspace.domain,
        plan: workspace.plan as WorkspacePlan,
        stripeCustomerId: workspace.stripe_customer_id,
        stripeSubscriptionId: workspace.stripe_subscription_id,
        maxLinks: workspace.max_links,
        maxClicks: workspace.max_clicks,
        maxUsers: workspace.max_users,
        createdAt: workspace.created_at,
        updatedAt: workspace.updated_at,
      };
    }),

  // Delete workspace (soft delete)
  delete: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is owner
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          user_id: ctx.userId,
          workspace_id: input.workspaceId,
          role: 'owner',
          workspaces: {
            deleted_at: null, // Ensure workspace isn't already deleted
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only workspace owners can delete workspaces',
        });
      }

      // Implement soft delete by setting deleted_at timestamp
      await ctx.prisma.workspaces.update({
        where: { id: input.workspaceId },
        data: {
          deleted_at: new Date(),
          updated_at: new Date(),
        },
      });

      return { success: true };
    }),

  // Check slug availability
  checkSlug: protectedProcedure
    .input(z.object({
      slug: z.string().min(1).max(50),
      excludeWorkspaceId: z.string().uuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.prisma.workspaces.findFirst({
        where: {
          slug: input.slug.toLowerCase(), // Ensure case-insensitive comparison
          deleted_at: null, // Only check non-deleted workspaces for slug conflicts
        },
        select: { id: true },
      });

      const isAvailable = !existing ||
        (input.excludeWorkspaceId && existing.id === input.excludeWorkspaceId);

      return { available: isAvailable };
    }),

  // Send workspace invitations
  sendInvitations: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      emails: z.array(z.string().email()).min(1).max(10),
      role: z.enum(['admin', 'member']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Apply rate limiting
      const rateLimitResult = await checkRateLimit(
        `${ctx.userId}:${input.workspaceId}`,
        workspaceRateLimiter.invitations
      );

      if (!rateLimitResult.success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Too many invitation requests. Please try again later. Remaining: ${rateLimitResult.remaining}, Reset at: ${new Date(rateLimitResult.reset || 0).toISOString()}`,
        });
      }

      // Check if user has admin/owner permissions
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          user_id: ctx.userId,
          workspace_id: input.workspaceId,
          role: { in: ['owner', 'admin'] },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only workspace owners and admins can send invitations',
        });
      }

      // Get workspace details for the invitation
      const workspace = await ctx.prisma.workspaces.findUnique({
        where: { id: input.workspaceId },
      });

      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        });
      }

      // Check workspace member limit
      const currentMemberCount = await ctx.prisma.workspace_memberships.count({
        where: { workspace_id: input.workspaceId },
      });

      const pendingInvitationCount = await ctx.prisma.workspace_invitations.count({
        where: {
          workspace_id: input.workspaceId,
          revoked_at: null,
          accepted_at: null,
          expires_at: { gte: new Date() },
        },
      });

      const totalPotentialMembers = currentMemberCount + pendingInvitationCount + input.emails.length;

      if (totalPotentialMembers > workspace.max_users) {
        // Provide clear, actionable error messages based on plan
        let message = '';
        if (workspace.max_users === 1) {
          message = `The free plan is for solo use only. Upgrade to a paid plan to invite team members.`;
        } else if (workspace.plan === 'pro') {
          message = `You've reached the ${workspace.max_users} member limit for the Pro plan. Upgrade to Business for unlimited team members.`;
        } else {
          message = `Cannot send invitations. Your workspace has reached its ${workspace.max_users} member limit.`;
        }

        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message,
        });
      }

      // Create invitations
      const invitations = [];
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

      for (const email of input.emails) {
        // Check if user is already a member
        const existingUser = await ctx.prisma.users.findUnique({
          where: { email },
        });

        if (existingUser) {
          const existingMembership = await ctx.prisma.workspace_memberships.findFirst({
            where: {
              user_id: existingUser.id,
              workspace_id: input.workspaceId,
            },
          });

          if (existingMembership) {
            continue; // Skip if already a member
          }
        }

        // Check for existing pending invitation
        const existingInvitation = await ctx.prisma.workspace_invitations.findFirst({
          where: {
            workspace_id: input.workspaceId,
            email,
            revoked_at: null,
            accepted_at: null,
            expires_at: { gte: new Date() },
          },
        });

        if (existingInvitation) {
          continue; // Skip if already invited
        }

        // Generate secure token with hashing
        const { plainToken, hashedToken } = await generateSecureToken();

        const invitation = await ctx.prisma.workspace_invitations.create({
          data: {
            workspace_id: input.workspaceId,
            email,
            role: input.role,
            token: hashedToken, // Store the hashed version
            invited_by: ctx.userId,
            expires_at: expiresAt,
          },
        });

        invitations.push(invitation);

        // Create audit log for invitation sent
        await createAuditLog(ctx.prisma, {
          workspaceId: input.workspaceId,
          userId: ctx.userId,
          action: 'INVITATION_SENT',
          entityType: 'invitation',
          entityId: invitation.id,
          metadata: {
            email,
            role: input.role,
            expiresAt: expiresAt.toISOString(),
          },
          ipAddress: ctx.req.headers.get('x-forwarded-for') || undefined,
          userAgent: ctx.req.headers.get('user-agent') || undefined,
        });

        // Send invitation email
        const inviter = await ctx.prisma.users.findUnique({
          where: { id: ctx.userId },
        });

        if (inviter && process.env.RESEND_API_KEY) {
          // Use retry mechanism for email sending
          await sendEmailWithRetry(
            sendInvitationEmail,
            {
              to: email,
              workspaceName: workspace.name,
              inviterName: inviter.name || '',
              inviterEmail: inviter.email,
              invitationToken: plainToken, // Send the plain token in email
              userRole: input.role,
            },
            {
              maxAttempts: 3,
              initialDelay: 2000,
              maxDelay: 30000,
              backoffFactor: 2,
            }
          ).catch(error => {
            // Log but don't fail - invitation is still created
            console.error('Failed to send invitation email after retries:', email, error);
          });
        }
      }

      return { invitations: invitations.length, skipped: input.emails.length - invitations.length };
    }),

  // Accept workspace invitation
  acceptInvitation: protectedProcedure
    .input(z.object({
      token: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Find all non-expired, non-revoked invitations to check against
      const activeInvitations = await ctx.prisma.workspace_invitations.findMany({
        where: {
          revoked_at: null,
          accepted_at: null,
          expires_at: { gte: new Date() },
        },
        include: {
          workspaces: true,
        },
      });

      // Find the matching invitation by verifying the token hash
      let invitation = null;
      for (const inv of activeInvitations) {
        const isValid = await verifyToken(input.token, inv.token);
        if (isValid) {
          invitation = inv;
          break;
        }
      }

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid invitation token',
        });
      }

      // Check if invitation is valid
      if (invitation.revoked_at) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'This invitation has been revoked',
        });
      }

      if (invitation.accepted_at) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'This invitation has already been accepted',
        });
      }

      if (invitation.expires_at < new Date()) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'This invitation has expired',
        });
      }

      // Check if user's email matches the invitation
      const user = await ctx.prisma.users.findUnique({
        where: { id: ctx.userId },
      });

      if (user?.email !== invitation.email) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This invitation is for a different email address',
        });
      }

      // Check if user is already a member
      const existingMembership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          user_id: ctx.userId,
          workspace_id: invitation.workspace_id,
        },
      });

      if (existingMembership) {
        // Mark invitation as accepted anyway
        await ctx.prisma.workspace_invitations.update({
          where: { id: invitation.id },
          data: { accepted_at: new Date() },
        });

        return { workspace: invitation.workspaces, alreadyMember: true };
      }

      // Check workspace member limit
      const currentMemberCount = await ctx.prisma.workspace_memberships.count({
        where: { workspace_id: invitation.workspace_id },
      });

      if (currentMemberCount >= invitation.workspaces.max_users) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Workspace has reached its member limit',
        });
      }

      // Create membership
      await ctx.prisma.workspace_memberships.create({
        data: {
          id: crypto.randomUUID(),
          user_id: ctx.userId,
          workspace_id: invitation.workspace_id,
          role: invitation.role,
          joined_at: new Date(),
        },
      });

      // Mark invitation as accepted
      await ctx.prisma.workspace_invitations.update({
        where: { id: invitation.id },
        data: { accepted_at: new Date() },
      });

      // Create audit log for invitation accepted
      await createAuditLog(ctx.prisma, {
        workspaceId: invitation.workspace_id,
        userId: ctx.userId,
        action: 'INVITATION_ACCEPTED',
        entityType: 'invitation',
        entityId: invitation.id,
        metadata: {
          email: invitation.email,
          role: invitation.role,
        },
        ipAddress: ctx.req.headers.get('x-forwarded-for') || undefined,
        userAgent: ctx.req.headers.get('user-agent') || undefined,
      });

      // Create audit log for member added
      await createAuditLog(ctx.prisma, {
        workspaceId: invitation.workspace_id,
        userId: ctx.userId,
        action: 'MEMBER_ADDED',
        entityType: 'member',
        entityId: ctx.userId,
        metadata: {
          role: invitation.role,
          addedVia: 'invitation',
        },
        ipAddress: ctx.req.headers.get('x-forwarded-for') || undefined,
        userAgent: ctx.req.headers.get('user-agent') || undefined,
      });

      return { workspace: invitation.workspaces, alreadyMember: false };
    }),

  // Get pending invitations for a workspace
  getPendingInvitations: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Check if user has admin/owner permissions
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          user_id: ctx.userId,
          workspace_id: input.workspaceId,
          role: { in: ['owner', 'admin'] },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only workspace owners and admins can view invitations',
        });
      }

      const invitations = await ctx.prisma.workspace_invitations.findMany({
        where: {
          workspace_id: input.workspaceId,
          revoked_at: null,
          accepted_at: null,
          expires_at: { gte: new Date() },
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return invitations.map(inv => ({
        id: inv.id,
        workspaceId: inv.workspace_id,
        email: inv.email,
        role: inv.role as WorkspaceRole,
        token: inv.token,
        invitedBy: inv.invited_by,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
        updatedAt: inv.created_at,
        inviter: inv.users,
      }));
    }),

  // Revoke invitation
  revokeInvitation: protectedProcedure
    .input(z.object({
      invitationId: z.string().uuid(),
      workspaceId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin/owner permissions
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          user_id: ctx.userId,
          workspace_id: input.workspaceId,
          role: { in: ['owner', 'admin'] },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only workspace owners and admins can revoke invitations',
        });
      }

      // Revoke invitation
      await ctx.prisma.workspace_invitations.update({
        where: { id: input.invitationId },
        data: { revoked_at: new Date() },
      });

      return { success: true };
    }),

  // Resend invitation
  resendInvitation: protectedProcedure
    .input(z.object({
      invitationId: z.string().uuid(),
      workspaceId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin/owner permissions
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          user_id: ctx.userId,
          workspace_id: input.workspaceId,
          role: { in: ['owner', 'admin'] },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only workspace owners and admins can resend invitations',
        });
      }

      // Get invitation
      const invitation = await ctx.prisma.workspace_invitations.findUnique({
        where: { id: input.invitationId },
        include: {
          workspaces: true,
        },
      });

      if (!invitation || invitation.workspace_id !== input.workspaceId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        });
      }

      if (invitation.revoked_at || invitation.accepted_at) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot resend a revoked or accepted invitation',
        });
      }

      // Update expiration date
      const newExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
      await ctx.prisma.workspace_invitations.update({
        where: { id: input.invitationId },
        data: { expires_at: newExpiresAt },
      });

      // Resend invitation email
      const inviter = await ctx.prisma.users.findUnique({
        where: { id: ctx.userId },
      });

      if (inviter && process.env.RESEND_API_KEY) {
        try {
          await sendInvitationEmail({
            to: invitation.email,
            workspaceName: invitation.workspaces.name,
            inviterName: inviter.name || '',
            inviterEmail: inviter.email,
            invitationToken: invitation.token,
            userRole: invitation.role as 'admin' | 'member',
          });
        } catch (error) {
          console.error('Failed to resend invitation email to', invitation.email, error);
          // Continue even if email fails - expiration is updated
        }
      }

      return { success: true };
    }),

  // Get workspace members
  getMembers: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Check if user is a member
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          user_id: ctx.userId,
          workspace_id: input.workspaceId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this workspace',
        });
      }

      const members = await ctx.prisma.workspace_memberships.findMany({
        where: { workspace_id: input.workspaceId },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar_url: true,
            },
          },
        },
        orderBy: { joined_at: 'asc' },
      });

      return members.map(member => ({
        id: member.id,
        userId: member.user_id,
        workspaceId: member.workspace_id,
        role: member.role as WorkspaceRole,
        joinedAt: member.joined_at,
        createdAt: member.joined_at,
        updatedAt: member.joined_at,
        user: member.users ? {
          id: member.users.id,
          email: member.users.email,
          name: member.users.name,
          avatarUrl: member.users.avatar_url,
        } : undefined,
      }));
    }),

  // Remove member from workspace
  removeMember: protectedProcedure
    .input(z.object({
      userId: z.string().uuid(),
      workspaceId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin/owner permissions
      const currentMembership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          user_id: ctx.userId,
          workspace_id: input.workspaceId,
          role: { in: ['owner', 'admin'] },
        },
      });

      if (!currentMembership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only workspace owners and admins can remove members',
        });
      }

      // Get target member's role
      const targetMembership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          user_id: input.userId,
          workspace_id: input.workspaceId,
        },
      });

      if (!targetMembership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      }

      // Prevent removing workspace owner
      if (targetMembership.role === 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot remove workspace owner',
        });
      }

      // Prevent admins from removing other admins (only owners can)
      if (currentMembership.role === 'admin' && targetMembership.role === 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admins cannot remove other admins',
        });
      }

      // Remove member
      await ctx.prisma.workspace_memberships.delete({
        where: {
          id: targetMembership.id,
        },
      });

      return { success: true };
    }),

  // Update member role
  updateMemberRole: protectedProcedure
    .input(z.object({
      userId: z.string().uuid(),
      workspaceId: z.string().uuid(),
      role: z.enum(['admin', 'member']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is owner
      const currentMembership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          user_id: ctx.userId,
          workspace_id: input.workspaceId,
          role: 'owner',
        },
      });

      if (!currentMembership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only workspace owners can change member roles',
        });
      }

      // Get target membership
      const targetMembership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          user_id: input.userId,
          workspace_id: input.workspaceId,
        },
      });

      if (!targetMembership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      }

      // Cannot change owner role
      if (targetMembership.role === 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot change workspace owner role',
        });
      }

      // Update role
      await ctx.prisma.workspace_memberships.update({
        where: { id: targetMembership.id },
        data: { role: input.role },
      });

      return { success: true };
    }),

  // Dismiss Getting Started widget
  dismissGettingStarted: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is member of workspace
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: input.workspaceId,
          user_id: ctx.user.id,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this workspace',
        });
      }

      // Update workspace to dismiss getting started
      await ctx.prisma.workspaces.update({
        where: { id: input.workspaceId },
        data: { getting_started_dismissed: true },
      });

      return { success: true };
    }),
});