import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { prisma } from '@/lib/prisma'
import { checkUsageLimitsMiddleware, incrementUsage, decrementUsage } from '../middleware/usage-limits'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const teamsRouter = createTRPCRouter({
  // Invite team member with limit enforcement
  inviteMember: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      email: z.string().email(),
      role: z.enum(['admin', 'editor', 'viewer']).default('viewer'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check user limit before invitation
      await checkUsageLimitsMiddleware({
        ctx,
        metric: 'users',
        incrementAmount: 1,
      })
      
      // Verify user is workspace owner or admin
      const membership = await prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
          role: { in: ['owner', 'admin'] },
        },
      })
      
      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only workspace owners and admins can invite members',
        })
      }
      
      // Check if user is already a member
      const existingUser = await prisma.users.findUnique({
        where: { email: input.email },
      })
      
      if (existingUser) {
        const existingMembership = await prisma.workspace_memberships.findFirst({
          where: {
            workspace_id: input.workspaceId,
            user_id: existingUser.id,
          },
        })
        
        if (existingMembership) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User is already a member of this workspace',
          })
        }
      }
      
      // Check for existing pending invitation
      const existingInvite = await prisma.workspace_invitations.findFirst({
        where: {
          workspace_id: input.workspaceId,
          email: input.email,
          accepted_at: null,
          revoked_at: null,
          expires_at: { gt: new Date() },
        },
      })
      
      if (existingInvite) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An invitation has already been sent to this email',
        })
      }
      
      // Get workspace details for email
      const workspace = await prisma.workspaces.findUnique({
        where: { id: input.workspaceId },
        select: { name: true, slug: true },
      })
      
      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        })
      }
      
      // Get inviter details
      const inviter = await prisma.users.findUnique({
        where: { id: ctx.session.user.id },
        select: { name: true, email: true },
      })
      
      // Create invitation
      const inviteToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry
      
      const invitation = await prisma.workspace_invitations.create({
        data: {
          workspace_id: input.workspaceId,
          email: input.email,
          role: input.role,
          token: inviteToken,
          invited_by: ctx.session.user.id,
          expires_at: expiresAt,
        },
      })
      
      // Note: We don't increment usage here because the user hasn't joined yet
      // We'll increment when they accept the invitation
      
      // Send invitation email
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteToken}`
      
      try {
        await resend.emails.send({
          from: 'Isla <invites@isla.sh>',
          to: input.email,
          subject: `You've been invited to join ${workspace.name} on Isla`,
          html: `
            <h2>You're invited!</h2>
            <p>${inviter?.name || inviter?.email} has invited you to join <strong>${workspace.name}</strong> as a ${input.role}.</p>
            <p>Click the link below to accept the invitation:</p>
            <p><a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
            <p>This invitation will expire in 7 days.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          `,
        })
      } catch (error) {
        console.error('Failed to send invitation email:', error)
        // Don't fail the whole operation if email fails
      }
      
      // Log the action
      await prisma.audit_logs.create({
        data: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
          action: 'member_invited',
          entity_type: 'invitation',
          entity_id: invitation.id,
          metadata: {
            email: input.email,
            role: input.role,
          },
        },
      })
      
      return {
        invitation,
        emailSent: true,
      }
    }),
  
  // Accept invitation (increments usage)
  acceptInvitation: protectedProcedure
    .input(z.object({
      token: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get invitation
      const invitation = await prisma.workspace_invitations.findUnique({
        where: { token: input.token },
        include: {
          workspaces: {
            select: {
              id: true,
              name: true,
              max_users: true,
            },
          },
        },
      })
      
      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid invitation token',
        })
      }
      
      // Check if invitation is valid
      if (invitation.accepted_at) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This invitation has already been accepted',
        })
      }
      
      if (invitation.revoked_at) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This invitation has been revoked',
        })
      }
      
      if (new Date() > invitation.expires_at) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This invitation has expired',
        })
      }
      
      // Check if email matches
      if (invitation.email !== ctx.session.user.email) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This invitation was sent to a different email address',
        })
      }
      
      // Check user limit again before accepting
      const currentMemberCount = await prisma.workspace_memberships.count({
        where: { workspace_id: invitation.workspace_id },
      })
      
      if (invitation.workspaces.max_users !== -1 && currentMemberCount >= invitation.workspaces.max_users) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This workspace has reached its team member limit',
          cause: {
            error: 'LIMIT_EXCEEDED',
            metric: 'users',
            current: currentMemberCount,
            limit: invitation.workspaces.max_users,
            action: 'upgrade',
          },
        })
      }
      
      // Create membership
      const membership = await prisma.workspace_memberships.create({
        data: {
          id: crypto.randomUUID(),
          workspace_id: invitation.workspace_id,
          user_id: ctx.session.user.id,
          role: invitation.role,
        },
      })
      
      // Mark invitation as accepted
      await prisma.workspace_invitations.update({
        where: { id: invitation.id },
        data: { accepted_at: new Date() },
      })
      
      // Increment usage counter
      await incrementUsage(invitation.workspace_id, 'users', 1)
      
      // Log the action
      await prisma.audit_logs.create({
        data: {
          workspace_id: invitation.workspace_id,
          user_id: ctx.session.user.id,
          action: 'invitation_accepted',
          entity_type: 'membership',
          entity_id: membership.id,
          metadata: {
            role: invitation.role,
          },
        },
      })
      
      return {
        membership,
        workspace: invitation.workspaces,
      }
    }),
  
  // Remove team member (decrements usage)
  removeMember: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      userId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is workspace owner or admin
      const requestorMembership = await prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
          role: { in: ['owner', 'admin'] },
        },
      })
      
      if (!requestorMembership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only workspace owners and admins can remove members',
        })
      }
      
      // Get target membership
      const targetMembership = await prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: input.workspaceId,
          user_id: input.userId,
        },
      })
      
      if (!targetMembership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found in this workspace',
        })
      }
      
      // Prevent removing the owner
      if (targetMembership.role === 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot remove the workspace owner',
        })
      }
      
      // Prevent admins from removing other admins
      if (requestorMembership.role === 'admin' && targetMembership.role === 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admins cannot remove other admins',
        })
      }
      
      // Remove membership
      await prisma.workspace_memberships.delete({
        where: { id: targetMembership.id },
      })
      
      // Decrement usage counter
      await decrementUsage(input.workspaceId, 'users', 1)
      
      // Log the action
      await prisma.audit_logs.create({
        data: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
          action: 'member_removed',
          entity_type: 'membership',
          entity_id: targetMembership.id,
          metadata: {
            removedUserId: input.userId,
            removedRole: targetMembership.role,
          },
        },
      })
      
      return { success: true }
    }),
  
  // List team members (no limit enforcement needed)
  listMembers: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify user is a member
      const membership = await prisma.workspace_memberships.findFirst({
        where: {
          workspace_id: input.workspaceId,
          user_id: ctx.session.user.id,
        },
      })
      
      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be a member of this workspace',
        })
      }
      
      // Get all members
      const members = await prisma.workspace_memberships.findMany({
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
        orderBy: [
          { role: 'asc' }, // Owner first, then admins, etc.
          { joined_at: 'asc' },
        ],
      })
      
      // Get pending invitations (only for admins/owners)
      let pendingInvitations = []
      if (membership.role === 'owner' || membership.role === 'admin') {
        pendingInvitations = await prisma.workspace_invitations.findMany({
          where: {
            workspace_id: input.workspaceId,
            accepted_at: null,
            revoked_at: null,
            expires_at: { gt: new Date() },
          },
          select: {
            id: true,
            email: true,
            role: true,
            created_at: true,
            expires_at: true,
          },
          orderBy: { created_at: 'desc' },
        })
      }
      
      return {
        members,
        pendingInvitations,
        total: members.length,
      }
    }),
})