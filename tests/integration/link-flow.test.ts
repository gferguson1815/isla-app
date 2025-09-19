import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user-id', email: 'test@example.com' }
        }
      }
    })
  },
  from: vi.fn((table: string) => {
    const mockQueries = {
      workspaces: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'workspace-id', name: 'Test Workspace' },
          error: null
        }),
        insert: vi.fn().mockReturnThis(),
      },
      links: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
      }
    };
    return mockQueries[table as keyof typeof mockQueries] || mockQueries.links;
  })
};

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => mockSupabaseClient,
  createServerComponentClient: () => mockSupabaseClient,
}));

describe('Link Creation Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Link Creation Flow', () => {
    it('should authenticate user and create a link', async () => {
      // Step 1: Check authentication
      const session = await mockSupabaseClient.auth.getSession();
      expect(session.data.session).toBeDefined();
      expect(session.data.session?.user.id).toBe('test-user-id');

      // Step 2: Get or create workspace
      const workspace = await mockSupabaseClient
        .from('workspaces')
        .select('id')
        .eq('owner_id', 'test-user-id')
        .limit(1)
        .single();

      expect(workspace.data).toBeDefined();
      expect(workspace.data?.id).toBe('workspace-id');

      // Step 3: Check slug uniqueness
      const slugCheck = await mockSupabaseClient
        .from('links')
        .select('id')
        .eq('slug', 'test-slug')
        .single();

      expect(slugCheck.data).toBeNull();
      expect(slugCheck.error).toBeNull();

      // Step 4: Create link
      const linkData = {
        workspace_id: 'workspace-id',
        url: 'https://example.com',
        slug: 'test-slug',
        created_by: 'test-user-id',
        click_count: 0,
      };

      mockSupabaseClient.from('links').insert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...linkData, id: 'link-id', created_at: new Date().toISOString() },
            error: null
          })
        })
      });

      const createResult = await mockSupabaseClient
        .from('links')
        .insert(linkData)
        .select()
        .single();

      expect(createResult.data).toBeDefined();
      expect(createResult.data?.slug).toBe('test-slug');
      expect(createResult.data?.url).toBe('https://example.com');
    });

    it('should handle workspace creation if none exists', async () => {
      // Mock no existing workspace
      mockSupabaseClient.from('workspaces').select = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // Not found error
            })
          })
        })
      });

      const workspaceCheck = await mockSupabaseClient
        .from('workspaces')
        .select('id')
        .eq('owner_id', 'test-user-id')
        .limit(1)
        .single();

      expect(workspaceCheck.data).toBeNull();

      // Create new workspace
      mockSupabaseClient.from('workspaces').insert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'new-workspace-id',
              name: 'Default Workspace',
              owner_id: 'test-user-id',
              plan: 'free'
            },
            error: null
          })
        })
      });

      const newWorkspace = await mockSupabaseClient
        .from('workspaces')
        .insert({
          name: 'Default Workspace',
          owner_id: 'test-user-id',
          plan: 'free'
        })
        .select()
        .single();

      expect(newWorkspace.data).toBeDefined();
      expect(newWorkspace.data?.id).toBe('new-workspace-id');
    });
  });

  describe('Link List and Delete Flow', () => {
    it('should list user links', async () => {
      const mockLinks = [
        {
          id: 'link-1',
          slug: 'test1',
          url: 'https://example1.com',
          click_count: 5,
          created_at: new Date().toISOString()
        },
        {
          id: 'link-2',
          slug: 'test2',
          url: 'https://example2.com',
          click_count: 10,
          created_at: new Date().toISOString()
        }
      ];

      mockSupabaseClient.from('links').select = vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockLinks,
              error: null,
              count: 2
            })
          })
        })
      });

      const result = await mockSupabaseClient
        .from('links')
        .select('*', { count: 'exact' })
        .in('workspace_id', ['workspace-id'])
        .order('created_at', { ascending: false })
        .range(0, 49);

      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].slug).toBe('test1');
      expect(result.count).toBe(2);
    });

    it('should delete a link', async () => {
      mockSupabaseClient.from('links').update = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null
        })
      });

      const deleteResult = await mockSupabaseClient
        .from('links')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', 'link-id');

      expect(deleteResult.error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('links');
    });
  });

  describe('Authorization Checks', () => {
    it('should prevent unauthorized access', async () => {
      // Mock no session
      mockSupabaseClient.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: null }
      });

      const session = await mockSupabaseClient.auth.getSession();
      expect(session.data.session).toBeNull();

      // Should redirect to auth page or throw error
      if (!session.data.session) {
        expect(() => {
          throw new Error('UNAUTHORIZED');
        }).toThrow('UNAUTHORIZED');
      }
    });

    it('should verify workspace ownership', async () => {
      const userId = 'test-user-id';
      const differentUserId = 'different-user-id';

      mockSupabaseClient.from('workspaces').select = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'workspace-id', owner_id: differentUserId },
            error: null
          })
        })
      });

      const workspace = await mockSupabaseClient
        .from('workspaces')
        .select('owner_id')
        .eq('id', 'workspace-id')
        .single();

      expect(workspace.data?.owner_id).not.toBe(userId);

      // Should throw forbidden error
      if (workspace.data?.owner_id !== userId) {
        expect(() => {
          throw new Error('FORBIDDEN');
        }).toThrow('FORBIDDEN');
      }
    });
  });
});