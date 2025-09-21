import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest'
import { appRouter } from '../index'
import { TRPCError } from '@trpc/server'
import { randomBytes } from 'crypto'

// Mock email sending
vi.mock('@/lib/emails/send-invitation', () => ({
  sendInvitationEmail: vi.fn().mockResolvedValue({ success: true })
}))

// Mock Prisma Client
const mockPrisma = {
  workspaces: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  workspace_memberships: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  workspace_invitations: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  users: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
}

// Mock Supabase Client
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
  },
}

// Mock context for testing
function createMockContext(userId?: string) {
  return {
    supabase: mockSupabase,
    prisma: mockPrisma,
    session: userId ? {
      user: { id: userId },
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
    } : null,
    userId: userId,
    req: new Request('http://localhost:3000'),
    resHeaders: new Headers(),
  }
}

describe('Workspace Router', () => {
  const mockUserId = crypto.randomUUID()
  const mockWorkspaceId = crypto.randomUUID()
  let ctx: any

  beforeEach(() => {
    ctx = createMockContext(mockUserId)
    // Reset all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    test('should create a workspace with valid data', async () => {
      const caller = appRouter.createCaller(ctx)

      const input = {
        name: 'Test Workspace',
        slug: 'test-workspace',
        description: 'A test workspace'
      }

      const mockWorkspace = {
        id: mockWorkspaceId,
        name: 'Test Workspace',
        slug: 'test-workspace',
        domain: null,
        plan: 'free',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        max_links: 50,
        max_clicks: 5000,
        max_users: 1,
        created_at: new Date(),
        updated_at: new Date(),
      }

      // Mock slug uniqueness check
      mockPrisma.workspaces.findFirst.mockResolvedValue(null)
      // Mock workspace creation
      mockPrisma.workspaces.create.mockResolvedValue(mockWorkspace)
      // Mock membership creation
      mockPrisma.workspace_memberships.create.mockResolvedValue({
        id: 'c2d3e4f5-a6b7-89cd-ef12-345678901234',
        user_id: mockUserId,
        workspace_id: mockWorkspaceId,
        role: 'owner',
        joined_at: new Date(),
      })

      const result = await caller.workspace.create(input)

      expect(result).toMatchObject({
        name: 'Test Workspace',
        slug: 'test-workspace',
        plan: 'free',
        maxLinks: 50,
        maxClicks: 5000,
        maxUsers: 1
      })
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
    })

    test('should auto-generate slug if not provided', async () => {
      const caller = appRouter.createCaller(ctx)

      const input = {
        name: 'My Awesome Workspace',
      }

      const mockWorkspace = {
        id: mockWorkspaceId,
        name: 'My Awesome Workspace',
        slug: 'my-awesome-workspace',
        domain: null,
        plan: 'free',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        max_links: 50,
        max_clicks: 5000,
        max_users: 1,
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockPrisma.workspaces.findFirst.mockResolvedValue(null)
      mockPrisma.workspaces.create.mockResolvedValue(mockWorkspace)
      mockPrisma.workspace_memberships.create.mockResolvedValue({
        id: 'membership-id',
        user_id: mockUserId,
        workspace_id: 'workspace-id',
        role: 'owner',
        joined_at: new Date(),
      })

      const result = await caller.workspace.create(input)

      expect(result.slug).toBe('my-awesome-workspace')
    })

    test('should ensure unique slug', async () => {
      const caller = appRouter.createCaller(ctx)

      // Mock first call returns existing workspace, second call returns null
      mockPrisma.workspaces.findFirst
        .mockResolvedValueOnce({ id: 'existing-id', slug: 'test-workspace' })
        .mockResolvedValueOnce(null)

      const mockWorkspace = {
        id: 'workspace-id',
        name: 'Another Workspace',
        slug: 'test-workspace-1',
        domain: null,
        plan: 'free',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        max_links: 50,
        max_clicks: 5000,
        max_users: 1,
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockPrisma.workspaces.create.mockResolvedValue(mockWorkspace)
      mockPrisma.workspace_memberships.create.mockResolvedValue({
        id: 'membership-id',
        user_id: mockUserId,
        workspace_id: 'workspace-id',
        role: 'owner',
        joined_at: new Date(),
      })

      const result = await caller.workspace.create({
        name: 'Another Workspace',
        slug: 'test-workspace'
      })

      expect(result.slug).toBe('test-workspace-1')
    })

    test('should validate input data', async () => {
      const caller = appRouter.createCaller(ctx)

      await expect(caller.workspace.create({
        name: '', // Empty name should fail
      })).rejects.toThrow()
    })
  })

  describe('list', () => {
    test('should return user workspaces', async () => {
      const caller = appRouter.createCaller(ctx)

      const mockMemberships = [{
        id: 'membership-id',
        user_id: mockUserId,
        workspace_id: 'workspace-id',
        role: 'owner',
        joined_at: new Date(),
        workspaces: {
          id: 'workspace-id',
          name: 'Test Workspace',
          slug: 'test-workspace',
          domain: null,
          plan: 'free',
          stripe_customer_id: null,
          stripe_subscription_id: null,
          max_links: 50,
          max_clicks: 5000,
          max_users: 1,
          created_at: new Date(),
          updated_at: new Date(),
          _count: {
            links: 0,
            workspace_memberships: 1,
          },
        },
      }]

      mockPrisma.workspace_memberships.findMany.mockResolvedValue(mockMemberships)

      const result = await caller.workspace.list()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toMatchObject({
        name: 'Test Workspace',
        slug: 'test-workspace',
        membership: {
          role: 'owner',
          userId: mockUserId
        }
      })
    })

    test('should return empty array for user with no workspaces', async () => {
      const newCtx = createMockContext('different-user-id')
      const caller = appRouter.createCaller(newCtx)

      mockPrisma.workspace_memberships.findMany.mockResolvedValue([])

      const result = await caller.workspace.list()

      expect(result).toEqual([])
    })
  })

  describe('getBySlug', () => {
    test('should return workspace by slug for authorized user', async () => {
      const caller = appRouter.createCaller(ctx)

      const mockMembership = {
        id: 'membership-id',
        user_id: mockUserId,
        workspace_id: 'workspace-id',
        role: 'owner',
        joined_at: new Date(),
        workspaces: {
          id: 'workspace-id',
          name: 'Test Workspace',
          slug: 'test-workspace',
          domain: null,
          plan: 'free',
          stripe_customer_id: null,
          stripe_subscription_id: null,
          max_links: 50,
          max_clicks: 5000,
          max_users: 1,
          created_at: new Date(),
          updated_at: new Date(),
          _count: {
            links: 0,
            workspace_memberships: 1,
          },
        },
      }

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(mockMembership)

      const result = await caller.workspace.getBySlug({ slug: 'test-workspace' })

      expect(result).toMatchObject({
        name: 'Test Workspace',
        slug: 'test-workspace'
      })
    })

    test('should throw NOT_FOUND for non-existent workspace', async () => {
      const caller = appRouter.createCaller(ctx)

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(null)

      await expect(caller.workspace.getBySlug({
        slug: 'non-existent-workspace'
      })).rejects.toThrow(TRPCError)
    })

    test('should throw NOT_FOUND for unauthorized access', async () => {
      const unauthorizedCtx = createMockContext('different-user-id')
      const unauthorizedCaller = appRouter.createCaller(unauthorizedCtx)

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(null)

      await expect(unauthorizedCaller.workspace.getBySlug({
        slug: 'private-workspace'
      })).rejects.toThrow(TRPCError)
    })
  })

  describe('update', () => {
    test('should update workspace with valid data for owner', async () => {
      const caller = appRouter.createCaller(ctx)

      const mockMembership = {
        id: 'membership-id',
        user_id: mockUserId,
        workspace_id: 'workspace-id',
        role: 'owner',
        joined_at: new Date(),
      }

      const mockUpdatedWorkspace = {
        id: 'workspace-id',
        name: 'Updated Workspace',
        slug: 'test-workspace',
        domain: 'custom.domain.com',
        plan: 'free',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        max_links: 50,
        max_clicks: 5000,
        max_users: 1,
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(mockMembership)
      mockPrisma.workspaces.update.mockResolvedValue(mockUpdatedWorkspace)

      const result = await caller.workspace.update({
        workspaceId: mockWorkspaceId,
        name: 'Updated Workspace',
        domain: 'custom.domain.com'
      })

      expect(result).toMatchObject({
        name: 'Updated Workspace',
        domain: 'custom.domain.com'
      })
    })

    test('should throw FORBIDDEN for non-admin user', async () => {
      const memberCtx = createMockContext('member-user-id')
      const memberCaller = appRouter.createCaller(memberCtx)

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(null)

      await expect(memberCaller.workspace.update({
        workspaceId: mockWorkspaceId,
        name: 'Unauthorized Update'
      })).rejects.toThrow(TRPCError)
    })
  })

  describe('delete', () => {
    test('should delete workspace for owner', async () => {
      const caller = appRouter.createCaller(ctx)

      const mockMembership = {
        id: 'membership-id',
        user_id: mockUserId,
        workspace_id: 'workspace-id',
        role: 'owner',
        joined_at: new Date(),
      }

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(mockMembership)
      mockPrisma.workspaces.update.mockResolvedValue({
        id: 'workspace-id',
        name: 'Test Workspace',
        slug: 'test-workspace',
        deleted_at: new Date(),
        updated_at: new Date(),
      })

      const result = await caller.workspace.delete({
        workspaceId: mockWorkspaceId
      })

      expect(result).toEqual({ success: true })
    })

    test('should throw FORBIDDEN for non-owner user', async () => {
      const memberCtx = createMockContext('member-user-id')
      const memberCaller = appRouter.createCaller(memberCtx)

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(null)

      await expect(memberCaller.workspace.delete({
        workspaceId: mockWorkspaceId
      })).rejects.toThrow(TRPCError)
    })
  })

  describe('checkSlug', () => {
    test('should return available true for unique slug', async () => {
      const caller = appRouter.createCaller(ctx)

      mockPrisma.workspaces.findFirst.mockResolvedValue(null)

      const result = await caller.workspace.checkSlug({
        slug: 'unique-slug'
      })

      expect(result).toEqual({ available: true })
    })

    test('should return available false for taken slug', async () => {
      const caller = appRouter.createCaller(ctx)

      // Clear previous mocks and set specific mock for this test
      mockPrisma.workspaces.findFirst.mockClear()
      mockPrisma.workspaces.findFirst.mockResolvedValue({
        id: mockWorkspaceId,
        slug: 'taken-slug'
      })

      const result = await caller.workspace.checkSlug({
        slug: 'taken-slug'
      })

      expect(result.available).toBe(false)
    })

    test('should allow excluding current workspace when checking slug', async () => {
      const caller = appRouter.createCaller(ctx)

      mockPrisma.workspaces.findFirst.mockResolvedValue({
        id: mockWorkspaceId,
        slug: 'existing-slug'
      })

      const result = await caller.workspace.checkSlug({
        slug: 'existing-slug',
        excludeWorkspaceId: mockWorkspaceId
      })

      expect(result).toEqual({ available: true })
    })
  })

  describe('sendInvitations', () => {
    test('should send invitations with valid data for admin', async () => {
      const caller = appRouter.createCaller(ctx)

      // Mock admin membership check
      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        id: 'membership-id',
        user_id: mockUserId,
        workspace_id: mockWorkspaceId,
        role: 'admin',
      })

      // Mock workspace lookup
      mockPrisma.workspaces.findUnique.mockResolvedValue({
        id: mockWorkspaceId,
        name: 'Test Workspace',
        slug: 'test-workspace',
        max_users: 10,
      })

      // Mock no existing users/invitations
      mockPrisma.users.findUnique.mockResolvedValue(null)
      mockPrisma.workspace_invitations.findFirst.mockResolvedValue(null)

      // Mock invitation creation
      mockPrisma.workspace_invitations.create.mockResolvedValue({
        id: 'invitation-id',
        workspace_id: mockWorkspaceId,
        email: 'newuser@example.com',
        role: 'member',
        token: randomBytes(32).toString('hex'),
        invited_by: mockUserId,
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      })

      // Mock inviter lookup
      mockPrisma.users.findUnique.mockResolvedValue({
        id: mockUserId,
        email: 'admin@example.com',
        name: 'Admin User',
      })

      const result = await caller.workspace.sendInvitations({
        workspaceId: mockWorkspaceId,
        emails: ['newuser@example.com'],
        role: 'member',
      })

      expect(result.invitations).toBe(1)
      expect(result.skipped).toBe(0)
      expect(mockPrisma.workspace_invitations.create).toHaveBeenCalled()
    })

    test('should skip existing members when sending invitations', async () => {
      const caller = appRouter.createCaller(ctx)

      mockPrisma.workspace_memberships.findFirst
        .mockResolvedValueOnce({ role: 'admin', user_id: mockUserId, workspace_id: mockWorkspaceId })
        .mockResolvedValueOnce({ id: 'existing-member' }) // Existing member

      mockPrisma.workspaces.findUnique.mockResolvedValue({
        id: mockWorkspaceId,
        name: 'Test Workspace',
        max_users: 10,
      })

      mockPrisma.users.findUnique
        .mockResolvedValueOnce({ id: 'existing-user', email: 'existing@example.com' })
        .mockResolvedValueOnce({ id: mockUserId, email: 'admin@example.com', name: 'Admin' })

      const result = await caller.workspace.sendInvitations({
        workspaceId: mockWorkspaceId,
        emails: ['existing@example.com'],
        role: 'member',
      })

      expect(result.invitations).toBe(0)
      expect(result.skipped).toBe(1)
      expect(mockPrisma.workspace_invitations.create).not.toHaveBeenCalled()
    })

    test('should throw FORBIDDEN for non-admin users', async () => {
      const caller = appRouter.createCaller(ctx)

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        role: 'member', // Regular member, not admin
        user_id: mockUserId,
        workspace_id: mockWorkspaceId,
      })

      await expect(caller.workspace.sendInvitations({
        workspaceId: mockWorkspaceId,
        emails: ['newuser@example.com'],
        role: 'member',
      })).rejects.toThrow(TRPCError)
    })

    test('should prevent inviting more users than workspace limit', async () => {
      const caller = appRouter.createCaller(ctx)

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        role: 'admin',
        user_id: mockUserId,
        workspace_id: mockWorkspaceId,
      })

      mockPrisma.workspaces.findUnique.mockResolvedValue({
        id: mockWorkspaceId,
        name: 'Test Workspace',
        max_users: 2, // Low limit
      })

      mockPrisma.workspace_memberships.count.mockResolvedValue(2) // Already at limit

      await expect(caller.workspace.sendInvitations({
        workspaceId: mockWorkspaceId,
        emails: ['newuser@example.com'],
        role: 'member',
      })).rejects.toThrow(TRPCError)
    })

    test('should validate email addresses', async () => {
      const caller = appRouter.createCaller(ctx)

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        role: 'admin',
        user_id: mockUserId,
        workspace_id: mockWorkspaceId,
      })

      await expect(caller.workspace.sendInvitations({
        workspaceId: mockWorkspaceId,
        emails: [], // Empty array should fail validation
        role: 'member',
      })).rejects.toThrow()
    })
  })

  describe('acceptInvitation', () => {
    const mockInvitationToken = randomBytes(32).toString('hex')

    test('should accept valid invitation for new member', async () => {
      const caller = appRouter.createCaller(ctx)

      const mockInvitation = {
        id: 'invitation-id',
        workspace_id: mockWorkspaceId,
        email: 'newuser@example.com',
        role: 'member',
        token: mockInvitationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        accepted_at: null,
        revoked_at: null,
        workspaces: {
          id: mockWorkspaceId,
          name: 'Test Workspace',
          slug: 'test-workspace',
          max_users: 10,
        },
      }

      mockPrisma.workspace_invitations.findUnique.mockResolvedValue(mockInvitation)

      mockPrisma.users.findUnique.mockResolvedValue({
        id: mockUserId,
        email: 'newuser@example.com',
      })

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(null) // Not a member yet
      mockPrisma.workspace_memberships.count.mockResolvedValue(3) // Under limit

      mockPrisma.workspace_memberships.create.mockResolvedValue({
        id: 'new-membership',
        user_id: mockUserId,
        workspace_id: mockWorkspaceId,
        role: 'member',
      })

      mockPrisma.workspace_invitations.update.mockResolvedValue({
        ...mockInvitation,
        accepted_at: new Date(),
      })

      const result = await caller.workspace.acceptInvitation({
        token: mockInvitationToken,
      })

      expect(result.workspace.name).toBe('Test Workspace')
      expect(result.alreadyMember).toBe(false)
      expect(mockPrisma.workspace_memberships.create).toHaveBeenCalled()
    })

    test('should handle already existing member gracefully', async () => {
      const caller = appRouter.createCaller(ctx)

      const mockInvitation = {
        id: 'invitation-id',
        workspace_id: mockWorkspaceId,
        email: 'existing@example.com',
        token: mockInvitationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        accepted_at: null,
        revoked_at: null,
        workspaces: {
          id: mockWorkspaceId,
          name: 'Test Workspace',
          max_users: 10,
        },
      }

      mockPrisma.workspace_invitations.findUnique.mockResolvedValue(mockInvitation)
      mockPrisma.users.findUnique.mockResolvedValue({
        id: mockUserId,
        email: 'existing@example.com',
      })

      // User is already a member
      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        id: 'existing-membership',
        user_id: mockUserId,
        workspace_id: mockWorkspaceId,
      })

      const result = await caller.workspace.acceptInvitation({
        token: mockInvitationToken,
      })

      expect(result.alreadyMember).toBe(true)
      expect(mockPrisma.workspace_memberships.create).not.toHaveBeenCalled()
    })

    test('should reject expired invitations', async () => {
      const caller = appRouter.createCaller(ctx)

      mockPrisma.workspace_invitations.findUnique.mockResolvedValue({
        id: 'invitation-id',
        token: mockInvitationToken,
        expires_at: new Date(Date.now() - 1000), // Expired
        accepted_at: null,
        revoked_at: null,
      })

      await expect(caller.workspace.acceptInvitation({
        token: mockInvitationToken,
      })).rejects.toThrow('This invitation has expired')
    })

    test('should reject revoked invitations', async () => {
      const caller = appRouter.createCaller(ctx)

      mockPrisma.workspace_invitations.findUnique.mockResolvedValue({
        id: 'invitation-id',
        token: mockInvitationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revoked_at: new Date(), // Revoked
        accepted_at: null,
      })

      await expect(caller.workspace.acceptInvitation({
        token: mockInvitationToken,
      })).rejects.toThrow('This invitation has been revoked')
    })

    test('should reject invalid invitation tokens', async () => {
      const caller = appRouter.createCaller(ctx)

      mockPrisma.workspace_invitations.findUnique.mockResolvedValue(null)

      await expect(caller.workspace.acceptInvitation({
        token: 'invalid-token',
      })).rejects.toThrow('Invalid invitation token')
    })

    test('should reject if email does not match', async () => {
      const caller = appRouter.createCaller(ctx)

      mockPrisma.workspace_invitations.findUnique.mockResolvedValue({
        id: 'invitation-id',
        email: 'different@example.com',
        token: mockInvitationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        accepted_at: null,
        revoked_at: null,
      })

      mockPrisma.users.findUnique.mockResolvedValue({
        id: mockUserId,
        email: 'user@example.com', // Different email
      })

      await expect(caller.workspace.acceptInvitation({
        token: mockInvitationToken,
      })).rejects.toThrow('This invitation is for a different email address')
    })
  })

  describe('getPendingInvitations', () => {
    test('should return pending invitations for admin', async () => {
      const caller = appRouter.createCaller(ctx)

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        role: 'admin',
        user_id: mockUserId,
        workspace_id: mockWorkspaceId,
      })

      const mockInvitations = [
        {
          id: 'inv1',
          email: 'user1@example.com',
          role: 'member',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
          created_at: new Date(),
          users: { name: 'Inviter', email: 'admin@example.com' },
        },
        {
          id: 'inv2',
          email: 'user2@example.com',
          role: 'admin',
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          created_at: new Date(),
          users: { name: 'Inviter', email: 'admin@example.com' },
        },
      ]

      mockPrisma.workspace_invitations.findMany.mockResolvedValue(mockInvitations)

      const result = await caller.workspace.getPendingInvitations({
        workspaceId: mockWorkspaceId,
      })

      expect(result).toHaveLength(2)
      expect(result[0].email).toBe('user1@example.com')
    })

    test('should throw FORBIDDEN for non-admin users', async () => {
      const caller = appRouter.createCaller(ctx)

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        role: 'member',
        user_id: mockUserId,
        workspace_id: mockWorkspaceId,
      })

      await expect(caller.workspace.getPendingInvitations({
        workspaceId: mockWorkspaceId,
      })).rejects.toThrow(TRPCError)
    })
  })

  describe('revokeInvitation', () => {
    test('should revoke invitation for admin', async () => {
      const caller = appRouter.createCaller(ctx)

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        role: 'admin',
        user_id: mockUserId,
        workspace_id: mockWorkspaceId,
      })

      mockPrisma.workspace_invitations.findFirst.mockResolvedValue({
        id: 'invitation-id',
        workspace_id: mockWorkspaceId,
      })

      mockPrisma.workspace_invitations.update.mockResolvedValue({
        id: 'invitation-id',
        revoked_at: new Date(),
      })

      const result = await caller.workspace.revokeInvitation({
        invitationId: 'invitation-id',
        workspaceId: mockWorkspaceId,
      })

      expect(result.success).toBe(true)
      expect(mockPrisma.workspace_invitations.update).toHaveBeenCalledWith({
        where: { id: 'invitation-id' },
        data: { revoked_at: expect.any(Date) },
      })
    })

    test('should throw NOT_FOUND for non-existent invitation', async () => {
      const caller = appRouter.createCaller(ctx)

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        role: 'admin',
        user_id: mockUserId,
        workspace_id: mockWorkspaceId,
      })

      mockPrisma.workspace_invitations.findFirst.mockResolvedValue(null)

      await expect(caller.workspace.revokeInvitation({
        invitationId: 'non-existent',
        workspaceId: mockWorkspaceId,
      })).rejects.toThrow(TRPCError)
    })
  })

  describe('removeWorkspaceMember', () => {
    test('should remove member for admin', async () => {
      const caller = appRouter.createCaller(ctx)
      const targetUserId = 'user-to-remove'

      // Admin performing the action
      mockPrisma.workspace_memberships.findFirst
        .mockResolvedValueOnce({
          role: 'admin',
          user_id: mockUserId,
          workspace_id: mockWorkspaceId,
        })
        // Target member exists and is not owner
        .mockResolvedValueOnce({
          id: 'target-membership',
          role: 'member',
          user_id: targetUserId,
          workspace_id: mockWorkspaceId,
        })

      mockPrisma.workspace_memberships.delete.mockResolvedValue({
        id: 'target-membership',
      })

      const result = await caller.workspace.removeWorkspaceMember({
        userId: targetUserId,
        workspaceId: mockWorkspaceId,
      })

      expect(result.success).toBe(true)
      expect(mockPrisma.workspace_memberships.delete).toHaveBeenCalled()
    })

    test('should prevent removing workspace owner', async () => {
      const caller = appRouter.createCaller(ctx)
      const ownerUserId = 'owner-user'

      mockPrisma.workspace_memberships.findFirst
        .mockResolvedValueOnce({
          role: 'admin',
          user_id: mockUserId,
          workspace_id: mockWorkspaceId,
        })
        .mockResolvedValueOnce({
          role: 'owner', // Target is owner
          user_id: ownerUserId,
          workspace_id: mockWorkspaceId,
        })

      await expect(caller.workspace.removeWorkspaceMember({
        userId: ownerUserId,
        workspaceId: mockWorkspaceId,
      })).rejects.toThrow('Cannot remove workspace owner')
    })

    test('should prevent members from removing other members', async () => {
      const caller = appRouter.createCaller(ctx)

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        role: 'member', // Not admin or owner
        user_id: mockUserId,
        workspace_id: mockWorkspaceId,
      })

      await expect(caller.workspace.removeWorkspaceMember({
        userId: 'some-user',
        workspaceId: mockWorkspaceId,
      })).rejects.toThrow(TRPCError)
    })
  })
})