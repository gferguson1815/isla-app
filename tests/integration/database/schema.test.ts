import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

beforeAll(async () => {
  prisma = new PrismaClient()
})

afterAll(async () => {
  await prisma.$disconnect()
})

type ColumnInfo = {
  column_name: string
  data_type: string
  is_nullable?: string
  column_default?: string
}

type IndexInfo = {
  indexname: string
  indexdef?: string
}

type ConstraintInfo = {
  conname: string
}

describe('Database Schema Tests', () => {
  describe('Table Creation', () => {
    it('should have users table with correct columns', async () => {
      const result = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `

      expect(result).toBeDefined()
      const columns = result as ColumnInfo[]

      const columnNames = columns.map(col => col.column_name)
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('email')
      expect(columnNames).toContain('name')
      expect(columnNames).toContain('avatar_url')
      expect(columnNames).toContain('is_suspended')
      expect(columnNames).toContain('created_at')
      expect(columnNames).toContain('updated_at')
    })

    it('should have workspaces table with correct columns', async () => {
      const result = await prisma.$queryRaw`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'workspaces'
        ORDER BY ordinal_position
      `

      expect(result).toBeDefined()
      const columns = result as ColumnInfo[]

      const columnNames = columns.map(col => col.column_name)
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('name')
      expect(columnNames).toContain('slug')
      expect(columnNames).toContain('plan')
      expect(columnNames).toContain('stripe_customer_id')
      expect(columnNames).toContain('max_links')
      expect(columnNames).toContain('max_clicks')
    })

    it('should have workspace_memberships junction table', async () => {
      const result = await prisma.$queryRaw`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'workspace_memberships'
        ORDER BY ordinal_position
      `

      expect(result).toBeDefined()
      const columns = result as ColumnInfo[]

      const columnNames = columns.map(col => col.column_name)
      expect(columnNames).toContain('user_id')
      expect(columnNames).toContain('workspace_id')
      expect(columnNames).toContain('role')
    })

    it('should have links table with UTM fields', async () => {
      const result = await prisma.$queryRaw`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'links'
        ORDER BY ordinal_position
      `

      expect(result).toBeDefined()
      const columns = result as ColumnInfo[]

      const columnNames = columns.map(col => col.column_name)
      expect(columnNames).toContain('slug')
      expect(columnNames).toContain('url')
      expect(columnNames).toContain('utm_source')
      expect(columnNames).toContain('utm_medium')
      expect(columnNames).toContain('utm_campaign')
      expect(columnNames).toContain('utm_term')
      expect(columnNames).toContain('utm_content')
    })

    it('should have click_events table for analytics', async () => {
      const result = await prisma.$queryRaw`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'click_events'
        ORDER BY ordinal_position
      `

      expect(result).toBeDefined()
      const columns = result as ColumnInfo[]

      const columnNames = columns.map(col => col.column_name)
      expect(columnNames).toContain('link_id')
      expect(columnNames).toContain('timestamp')
      expect(columnNames).toContain('ip_address')
      expect(columnNames).toContain('country')
      expect(columnNames).toContain('device')
    })
  })

  describe('Indexes', () => {
    it('should have unique index on links.slug', async () => {
      const result = await prisma.$queryRaw`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'links'
        AND indexname = 'links_slug_key'
      `

      expect((result as IndexInfo[]).length).toBe(1)
    })

    it('should have index on links.workspace_id', async () => {
      const result = await prisma.$queryRaw`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'links'
        AND indexname = 'links_workspace_id_idx'
      `

      expect((result as IndexInfo[]).length).toBe(1)
    })

    it('should have index on click_events.link_id', async () => {
      const result = await prisma.$queryRaw`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'click_events'
        AND indexname = 'click_events_link_id_idx'
      `

      expect((result as IndexInfo[]).length).toBe(1)
    })

    it('should have index on click_events.timestamp', async () => {
      const result = await prisma.$queryRaw`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'click_events'
        AND indexname = 'click_events_timestamp_idx'
      `

      expect((result as IndexInfo[]).length).toBe(1)
    })

    it('should have composite unique index on workspace_memberships', async () => {
      const result = await prisma.$queryRaw`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'workspace_memberships'
        AND indexname = 'workspace_memberships_user_id_workspace_id_key'
      `

      expect((result as IndexInfo[]).length).toBe(1)
    })
  })

  describe('Foreign Key Constraints', () => {
    it('should have foreign key from workspace_memberships to users', async () => {
      const result = await prisma.$queryRaw`
        SELECT conname
        FROM pg_constraint
        WHERE contype = 'f'
        AND conrelid = 'workspace_memberships'::regclass
        AND conname = 'workspace_memberships_user_id_fkey'
      `

      expect((result as ConstraintInfo[]).length).toBe(1)
    })

    it('should have foreign key from links to workspaces', async () => {
      const result = await prisma.$queryRaw`
        SELECT conname
        FROM pg_constraint
        WHERE contype = 'f'
        AND conrelid = 'links'::regclass
        AND conname = 'links_workspace_id_fkey'
      `

      expect((result as ConstraintInfo[]).length).toBe(1)
    })

    it('should have foreign key from click_events to links', async () => {
      const result = await prisma.$queryRaw`
        SELECT conname
        FROM pg_constraint
        WHERE contype = 'f'
        AND conrelid = 'click_events'::regclass
        AND conname = 'click_events_link_id_fkey'
      `

      expect((result as ConstraintInfo[]).length).toBe(1)
    })
  })
})