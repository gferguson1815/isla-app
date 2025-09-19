import { describe, it, expect, beforeEach, vi } from 'vitest';
import { utmTemplateRouter } from '../utm-template';
import { TRPCError } from '@trpc/server';

// Mock the Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    workspace_memberships: {
      findFirst: vi.fn(),
    },
    utm_templates: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Import the mocked prisma
import { prisma } from '@/lib/prisma';

describe('UTM Template Router', () => {
  const mockUserId = 'user-123';
  const mockWorkspaceId = 'workspace-456';
  const mockCtx = {
    prisma,
    userId: mockUserId,
    session: { user: { id: mockUserId } },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new UTM template', async () => {
      const mockTemplate = {
        id: 'template-789',
        workspace_id: mockWorkspaceId,
        name: 'Facebook Campaign',
        description: 'Template for Facebook ads',
        utm_source: 'facebook',
        utm_medium: 'paid-social',
        utm_campaign: 'summer-sale',
        utm_term: null,
        utm_content: null,
        created_by: mockUserId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(prisma.workspace_memberships.findFirst).mockResolvedValue({
        workspace_id: mockWorkspaceId,
      } as never);

      vi.mocked(prisma.utm_templates.create).mockResolvedValue(mockTemplate as any);

      const input = {
        name: 'Facebook Campaign',
        description: 'Template for Facebook ads',
        utmSource: 'facebook',
        utmMedium: 'paid-social',
        utmCampaign: 'summer-sale',
      };

      const caller = utmTemplateRouter.createCaller(mockCtx);
      const result = await caller.create(input);

      expect(result).toEqual(mockTemplate);
      expect(prisma.utm_templates.create).toHaveBeenCalledWith({
        data: {
          workspace_id: mockWorkspaceId,
          name: input.name,
          description: input.description,
          utm_source: input.utmSource,
          utm_medium: input.utmMedium,
          utm_campaign: input.utmCampaign,
          utm_term: undefined,
          utm_content: undefined,
          created_by: mockUserId,
        },
      });
    });

    it('should throw error if user has no workspace', async () => {
      vi.mocked(prisma.workspace_memberships.findFirst).mockResolvedValue(null);

      const input = {
        name: 'Test Template',
      };

      const caller = utmTemplateRouter.createCaller(mockCtx);

      await expect(caller.create(input)).rejects.toThrow(TRPCError);
      await expect(caller.create(input)).rejects.toThrow('User is not a member of any workspace');
    });
  });

  describe('list', () => {
    it('should return all templates for workspace', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          workspace_id: mockWorkspaceId,
          name: 'Google Ads',
          utm_source: 'google',
          utm_medium: 'cpc',
        },
        {
          id: 'template-2',
          workspace_id: mockWorkspaceId,
          name: 'Newsletter',
          utm_source: 'newsletter',
          utm_medium: 'email',
        },
      ];

      vi.mocked(prisma.workspace_memberships.findFirst).mockResolvedValue({
        workspace_id: mockWorkspaceId,
      } as never);

      vi.mocked(prisma.utm_templates.findMany).mockResolvedValue(mockTemplates as any);

      const caller = utmTemplateRouter.createCaller(mockCtx);
      const result = await caller.list();

      expect(result).toEqual(mockTemplates);
      expect(prisma.utm_templates.findMany).toHaveBeenCalledWith({
        where: { workspace_id: mockWorkspaceId },
        orderBy: { created_at: 'desc' },
      });
    });

    it('should return empty array if user has no workspace', async () => {
      vi.mocked(prisma.workspace_memberships.findFirst).mockResolvedValue(null);

      const caller = utmTemplateRouter.createCaller(mockCtx);
      const result = await caller.list();

      expect(result).toEqual([]);
      expect(prisma.utm_templates.findMany).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing template', async () => {
      const templateId = 'template-123';
      const mockExistingTemplate = {
        id: templateId,
        workspace_id: mockWorkspaceId,
      };
      const mockUpdatedTemplate = {
        ...mockExistingTemplate,
        name: 'Updated Name',
        utm_source: 'twitter',
      };

      vi.mocked(prisma.workspace_memberships.findFirst).mockResolvedValue({
        workspace_id: mockWorkspaceId,
      } as never);

      vi.mocked(prisma.utm_templates.findFirst).mockResolvedValue(mockExistingTemplate as any);
      vi.mocked(prisma.utm_templates.update).mockResolvedValue(mockUpdatedTemplate as any);

      const input = {
        id: templateId,
        name: 'Updated Name',
        utmSource: 'twitter',
      };

      const caller = utmTemplateRouter.createCaller(mockCtx);
      const result = await caller.update(input);

      expect(result).toEqual(mockUpdatedTemplate);
      expect(prisma.utm_templates.update).toHaveBeenCalledWith({
        where: { id: templateId },
        data: expect.objectContaining({
          name: 'Updated Name',
          utm_source: 'twitter',
        }),
      });
    });

    it('should throw error if template not found', async () => {
      vi.mocked(prisma.workspace_memberships.findFirst).mockResolvedValue({
        workspace_id: mockWorkspaceId,
      } as never);

      vi.mocked(prisma.utm_templates.findFirst).mockResolvedValue(null);

      const input = {
        id: 'non-existent',
        name: 'Test',
      };

      const caller = utmTemplateRouter.createCaller(mockCtx);

      await expect(caller.update(input)).rejects.toThrow('Template not found');
    });
  });

  describe('delete', () => {
    it('should delete a template', async () => {
      const templateId = 'template-123';
      const mockTemplate = {
        id: templateId,
        workspace_id: mockWorkspaceId,
      };

      vi.mocked(prisma.workspace_memberships.findFirst).mockResolvedValue({
        workspace_id: mockWorkspaceId,
      } as never);

      vi.mocked(prisma.utm_templates.findFirst).mockResolvedValue(mockTemplate as any);
      vi.mocked(prisma.utm_templates.delete).mockResolvedValue(mockTemplate as any);

      const caller = utmTemplateRouter.createCaller(mockCtx);
      const result = await caller.delete({ id: templateId });

      expect(result).toEqual({ success: true });
      expect(prisma.utm_templates.delete).toHaveBeenCalledWith({
        where: { id: templateId },
      });
    });

    it('should throw error if template not found', async () => {
      vi.mocked(prisma.workspace_memberships.findFirst).mockResolvedValue({
        workspace_id: mockWorkspaceId,
      } as never);

      vi.mocked(prisma.utm_templates.findFirst).mockResolvedValue(null);

      const caller = utmTemplateRouter.createCaller(mockCtx);

      await expect(caller.delete({ id: 'non-existent' })).rejects.toThrow('Template not found');
    });
  });
});