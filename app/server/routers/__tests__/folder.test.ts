import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { folderRouter } from '../folder';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
vi.mock('@/lib/rate-limit', () => ({
  workspaceRateLimiter: {},
  checkRateLimit: vi.fn()
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-123')
}));

// Mock Prisma client
const mockPrisma = {
  workspace_memberships: {
    findFirst: vi.fn()
  },
  folders: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn()
  },
  links: {
    updateMany: vi.fn()
  },
  $queryRaw: vi.fn(),
  $executeRaw: vi.fn()
};

const mockContext = {
  prisma: mockPrisma,
  session: { user: { id: 'test-user-id', email: 'test@example.com' } },
  userId: 'test-user-id',
  supabase: null as any,
  req: null as any,
  resHeaders: new Headers()
};

describe('Folder Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a folder with valid input', async () => {
      const input = {
        workspace_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Folder',
        description: 'Test Description'
      };

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        workspace_id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'test-user-id',
        is_active: true
      });

      mockPrisma.folders.create.mockResolvedValue({
        id: 'test-uuid-123',
        workspace_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Folder',
        description: 'Test Description',
        parent_id: null,
        level: 0,
        created_at: new Date(),
        updated_at: new Date()
      });

      const caller = folderRouter.createCaller(mockContext as any);
      const result = await caller.create(input);

      expect(result.id).toBe('test-uuid-123');
      expect(result.name).toBe('Test Folder');
      expect(mockPrisma.folders.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Folder',
          description: 'Test Description',
          workspace_id: '550e8400-e29b-41d4-a716-446655440000',
          level: 0
        })
      });
    });

    it('should throw error if user is not a workspace member', async () => {
      const input = {
        workspace_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Folder'
      };

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue(null);

      const caller = folderRouter.createCaller(mockContext as any);

      await expect(caller.create(input)).rejects.toThrow(TRPCError);
      await expect(caller.create(input)).rejects.toThrow('You are not a member of this workspace');
    });

    it('should enforce maximum folder depth', async () => {
      const input = {
        workspace_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Deep Folder',
        parent_id: '550e8400-e29b-41d4-a716-446655440001'
      };

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        workspace_id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'test-user-id',
        is_active: true
      });

      // Parent folder at max depth
      mockPrisma.folders.findUnique.mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440001',
        level: 2 // Max depth - 1
      });

      const caller = folderRouter.createCaller(mockContext as any);

      await expect(caller.create(input)).rejects.toThrow('Maximum folder depth of 3 levels exceeded');
    });
  });

  describe('list', () => {
    it('should return folders in hierarchical structure', async () => {
      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        workspace_id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'test-user-id',
        is_active: true
      });

      const mockFolders = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Parent',
          parent_id: null,
          level: 0,
          _count: { links: 5 }
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Child',
          parent_id: '550e8400-e29b-41d4-a716-446655440001',
          level: 1,
          _count: { links: 3 }
        }
      ];

      mockPrisma.folders.findMany.mockResolvedValue(mockFolders);

      const caller = folderRouter.createCaller(mockContext as any);
      const result = await caller.list({ workspace_id: '550e8400-e29b-41d4-a716-446655440000' });

      expect(result.folders).toHaveLength(2);
      expect(result.tree).toHaveLength(1); // Only root folder
      expect(result.tree[0].children).toHaveLength(1); // Has one child
    });
  });

  describe('delete', () => {
    it('should delete folder and move contents when cascade is false', async () => {
      const folder = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        workspace_id: '550e8400-e29b-41d4-a716-446655440000',
        parent_id: '550e8400-e29b-41d4-a716-446655440002',
        level: 1,
        _count: {
          links: 5,
          other_folders: 2
        }
      };

      mockPrisma.folders.findUnique.mockResolvedValue(folder);
      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        workspace_id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'test-user-id'
      });
      mockPrisma.links.updateMany.mockResolvedValue({ count: 5 });
      mockPrisma.folders.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.folders.delete.mockResolvedValue({});

      const caller = folderRouter.createCaller(mockContext as any);
      const result = await caller.delete({
        id: '550e8400-e29b-41d4-a716-446655440001',
        cascade: false
      });

      expect(result.success).toBe(true);
      expect(result.affectedLinks).toBe(5);
      expect(result.affectedFolders).toBe(2);

      // Verify links were moved to parent
      expect(mockPrisma.links.updateMany).toHaveBeenCalledWith({
        where: { folder_id: '550e8400-e29b-41d4-a716-446655440001' },
        data: { folder_id: '550e8400-e29b-41d4-a716-446655440002' }
      });

      // Verify subfolders were moved to parent
      expect(mockPrisma.folders.updateMany).toHaveBeenCalledWith({
        where: { parent_id: '550e8400-e29b-41d4-a716-446655440001' },
        data: {
          parent_id: '550e8400-e29b-41d4-a716-446655440002',
          level: folder.level
        }
      });
    });

    it('should cascade delete when cascade is true', async () => {
      const folder = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        workspace_id: '550e8400-e29b-41d4-a716-446655440000',
        parent_id: null,
        _count: {
          links: 10,
          other_folders: 3
        }
      };

      mockPrisma.folders.findUnique.mockResolvedValue(folder);
      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        workspace_id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'test-user-id'
      });
      mockPrisma.folders.delete.mockResolvedValue({});

      const caller = folderRouter.createCaller(mockContext as any);
      const result = await caller.delete({
        id: '550e8400-e29b-41d4-a716-446655440001',
        cascade: true
      });

      expect(result.success).toBe(true);
      expect(result.affectedLinks).toBe(10);
      expect(result.affectedFolders).toBe(3);

      // Verify no move operations were performed
      expect(mockPrisma.links.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.folders.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should prevent moving folder to its own descendant', async () => {
      const folder = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        workspace_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Folder',
        description: null,
        parent_id: null,
        level: 0,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPrisma.folders.findUnique
        .mockResolvedValueOnce(folder)
        .mockResolvedValueOnce({ id: '550e8400-e29b-41d4-a716-446655440002', level: 1 });

      mockPrisma.workspace_memberships.findFirst.mockResolvedValue({
        workspace_id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'test-user-id'
      });

      // Simulate cycle detection
      mockPrisma.$queryRaw.mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440002' }]);

      const caller = folderRouter.createCaller(mockContext as any);

      await expect(
        caller.update({
          id: '550e8400-e29b-41d4-a716-446655440001',
          parent_id: '550e8400-e29b-41d4-a716-446655440002'
        })
      ).rejects.toThrow('Cannot move folder to its own descendant');
    });
  });
});