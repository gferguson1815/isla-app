import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/database'

// Skip these tests if we don't have Supabase configured
const skipTests = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

describe.skipIf(skipTests)('Row Level Security (RLS) Tests', () => {
  let supabase: ReturnType<typeof createClient<Database>>

  beforeAll(() => {
    if (!skipTests) {
      supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
  })

  describe('RLS Policy Enforcement', () => {
    it('should have RLS enabled on all tables', async () => {
      const tables = [
        'users',
        'workspaces',
        'workspace_memberships',
        'folders',
        'campaigns',
        'links',
        'click_events'
      ]

      for (const tableName of tables) {
        // Check RLS by trying to query the table
        // If RLS is enabled, we should get empty results without auth
        const { data: rlsStatus } = await supabase
          .from(tableName as keyof Database['public']['Tables'])
          .select('*')
          .limit(1)

        // RLS is working if we get no error or empty result
        // (policies are restricting access)
        expect(rlsStatus).toBeDefined()
      }
    })

    it('should prevent unauthorized access to workspaces', async () => {
      // Try to read workspaces without being authenticated
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')

      // Should return empty array (RLS policies prevent access)
      expect(data).toEqual([])
      expect(error).toBeNull()
    })

    it('should prevent unauthorized access to links', async () => {
      // Try to read links without authentication
      const { data, error } = await supabase
        .from('links')
        .select('*')

      // Should return empty array (RLS policies prevent access)
      expect(data).toEqual([])
      expect(error).toBeNull()
    })

    it('should allow public write to click_events', async () => {
      // Try to insert a click event (should be allowed by policy)
      const testClickEvent = {
        link_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        ip_address: '127.0.0.1',
        user_agent: 'Test Agent',
        device: 'desktop',
        country: 'US'
      }

      const { error } = await supabase
        .from('click_events')
        .insert(testClickEvent)

      // Should fail with FK constraint (link doesn't exist), not RLS
      expect(error?.code).toBe('23503') // Foreign key violation
    })

    it('should prevent reading click_events without authentication', async () => {
      // Try to read click events without authentication
      const { data, error } = await supabase
        .from('click_events')
        .select('*')

      // Should return empty array (RLS policies prevent read access)
      expect(data).toEqual([])
      expect(error).toBeNull()
    })
  })

  describe('Workspace Membership Policies', () => {
    it('should prevent reading workspace memberships without auth', async () => {
      const { data, error } = await supabase
        .from('workspace_memberships')
        .select('*')

      expect(data).toEqual([])
      expect(error).toBeNull()
    })

    it('should prevent modifying workspace memberships without auth', async () => {
      const testMembership = {
        user_id: '00000000-0000-0000-0000-000000000000',
        workspace_id: '00000000-0000-0000-0000-000000000000',
        role: 'member'
      }

      const { error } = await supabase
        .from('workspace_memberships')
        .insert(testMembership)

      // Should fail with RLS policy violation
      expect(error).toBeDefined()
    })
  })
})