import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TRPCError } from '@trpc/server'
import { createInnerTRPCContext } from '../../trpc'
import { tagRouter } from '../tag'
import { v4 as uuidv4 } from 'uuid'

// Mock Prisma client
const mockPrisma = {
  workspace_memberships: {
    findFirst: vi.fn(),
  },
  tags: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  links: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
}

describe('Tag Router', () => {
  const userId = uuidv4()
  const workspaceId = uuidv4()
  const tagId = uuidv4()

  let ctx: ReturnType<typeof createInnerTRPCContext>
  let caller: ReturnType<typeof tagRouter.createCaller>

  beforeEach(() => {
    vi.clearAllMocks()

    ctx = createInnerTRPCContext({
      session: {
        user: { id: userId },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      req: new Request('http://localhost'),
      resHeaders: new Headers(),
      prisma: mockPrisma as any,
    })

    caller = tagRouter.createCaller(ctx)
  })

  describe('list', () => {
    it('should list tags for a workspace', async () => {
      const mockTags = [
        { id: uuidv4(), name: 'tag1', usage_count: 5, color: '#3B82F6', created_at: new Date() },
        { id: uuidv4(), name: 'tag2', usage_count: 3, color: null, created_at: new Date() },
      ]

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        user_id: userId,
        workspace_id: workspaceId,
      })
      mockPrisma.tags.findMany.mockResolvedValue(mockTags)

      const result = await caller.list({ workspaceId })

      expect(result).toEqual(mockTags)
      expect(mockPrisma.tags.findMany).toHaveBeenCalledWith({
        where: { workspace_id: workspaceId },
        orderBy: [{ usage_count: 'desc' }, { name: 'asc' }],
      })
    })

    it('should throw error if user has no access', async () => {
      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(null)

      await expect(caller.list({ workspaceId })).rejects.toThrow(TRPCError)
    })
  })

  describe('create', () => {
    it('should create a new tag', async () => {
      const newTag = {
        id: tagId,
        workspace_id: workspaceId,
        name: 'newtag',
        color: '#3B82F6',
        usage_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        user_id: userId,
        workspace_id: workspaceId,
      })
      mockPrisma.tags.findUnique.mockResolvedValue(null)
      mockPrisma.tags.create.mockResolvedValue(newTag)

      const result = await caller.create({
        workspaceId,
        name: 'NewTag',
        color: '#3B82F6',
      })

      expect(result).toEqual(newTag)
      expect(mockPrisma.tags.create).toHaveBeenCalledWith({
        data: {
          workspace_id: workspaceId,
          name: 'newtag',
          color: '#3B82F6',
        },
      })
    })

    it('should throw error if tag already exists', async () => {
      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        user_id: userId,
        workspace_id: workspaceId,
      })
      mockPrisma.tags.findUnique.mockResolvedValue({ id: tagId, name: 'existing' })

      await expect(
        caller.create({ workspaceId, name: 'existing', color: null })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('rename', () => {
    it('should rename a tag and update all links', async () => {
      const oldTag = { id: tagId, name: 'oldname', workspace_id: workspaceId }
      const mockLinks = [
        { id: uuidv4(), tags: ['oldname', 'other'] },
        { id: uuidv4(), tags: ['oldname'] },
      ]

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        user_id: userId,
        workspace_id: workspaceId,
        role: 'admin',
      })
      mockPrisma.tags.findFirst
        .mockResolvedValueOnce(oldTag) // For checking if tag exists
        .mockResolvedValueOnce(null) // For checking if new name exists
      mockPrisma.links.findMany.mockResolvedValue(mockLinks)
      mockPrisma.tags.update.mockResolvedValue({ ...oldTag, name: 'newname' })

      const result = await caller.rename({
        workspaceId,
        tagId,
        newName: 'NewName',
      })

      expect(result).toEqual({ success: true })
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('should require admin role', async () => {
      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        user_id: userId,
        workspace_id: workspaceId,
        role: 'member',
      })

      await expect(
        caller.rename({ workspaceId, tagId, newName: 'newname' })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('merge', () => {
    it('should merge two tags', async () => {
      const sourceTag = { id: uuidv4(), name: 'source', usage_count: 2 }
      const targetTag = { id: uuidv4(), name: 'target', usage_count: 3 }
      const mockLinks = [
        { id: uuidv4(), tags: ['source', 'other'] },
      ]

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        user_id: userId,
        workspace_id: workspaceId,
        role: 'admin',
      })
      mockPrisma.tags.findFirst
        .mockResolvedValueOnce(sourceTag)
        .mockResolvedValueOnce(targetTag)
      mockPrisma.links.findMany.mockResolvedValue(mockLinks)
      mockPrisma.tags.update.mockResolvedValue({ ...targetTag, usage_count: 5 })
      mockPrisma.tags.delete.mockResolvedValue(sourceTag)

      const result = await caller.merge({
        workspaceId,
        sourceTagId: sourceTag.id,
        targetTagId: targetTag.id,
      })

      expect(result).toEqual({ success: true })
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('should prevent merging tag with itself', async () => {
      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        user_id: userId,
        workspace_id: workspaceId,
        role: 'admin',
      })

      await expect(
        caller.merge({
          workspaceId,
          sourceTagId: tagId,
          targetTagId: tagId,
        })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('delete', () => {
    it('should delete a tag and remove from all links', async () => {
      const tag = { id: tagId, name: 'todelete', workspace_id: workspaceId }
      const mockLinks = [
        { id: uuidv4(), tags: ['todelete', 'other'] },
      ]

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        user_id: userId,
        workspace_id: workspaceId,
        role: 'admin',
      })
      mockPrisma.tags.findFirst.mockResolvedValue(tag)
      mockPrisma.links.findMany.mockResolvedValue(mockLinks)
      mockPrisma.tags.delete.mockResolvedValue(tag)

      const result = await caller.delete({ workspaceId, tagId })

      expect(result).toEqual({ success: true })
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('suggest', () => {
    it('should suggest tags based on query', async () => {
      const mockTags = [
        { id: uuidv4(), name: 'javascript', usage_count: 10 },
        { id: uuidv4(), name: 'java', usage_count: 5 },
      ]

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        user_id: userId,
        workspace_id: workspaceId,
      })
      mockPrisma.tags.findMany.mockResolvedValue(mockTags)

      const result = await caller.suggest({
        workspaceId,
        query: 'jav',
        limit: 10,
      })

      expect(result).toEqual(mockTags)
      expect(mockPrisma.tags.findMany).toHaveBeenCalledWith({
        where: {
          workspace_id: workspaceId,
          name: { contains: 'jav' },
        },
        orderBy: [{ usage_count: 'desc' }, { name: 'asc' }],
        take: 10,
      })
    })
  })

  describe('updateColor', () => {
    it('should update tag color', async () => {
      const tag = {
        id: tagId,
        name: 'tag',
        color: null,
        workspace_id: workspaceId,
      }
      const updatedTag = { ...tag, color: '#3B82F6' }

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        user_id: userId,
        workspace_id: workspaceId,
      })
      mockPrisma.tags.findFirst.mockResolvedValue(tag)
      mockPrisma.tags.update.mockResolvedValue(updatedTag)

      const result = await caller.updateColor({
        workspaceId,
        tagId,
        color: '#3B82F6',
      })

      expect(result).toEqual(updatedTag)
      expect(mockPrisma.tags.update).toHaveBeenCalledWith({
        where: { id: tagId },
        data: { color: '#3B82F6' },
      })
    })
  })
})