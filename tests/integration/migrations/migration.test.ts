import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Database Migrations', () => {
  const migrationsPath = path.join(process.cwd(), 'prisma/migrations')

  it('should have initial migration file', () => {
    expect(fs.existsSync(migrationsPath)).toBe(true)

    const migrations = fs.readdirSync(migrationsPath)
    const initialMigration = migrations.find(m => m.includes('initial_setup'))

    expect(initialMigration).toBeDefined()
  })

  it('should have valid SQL in initial migration', () => {
    const migrations = fs.readdirSync(migrationsPath)
    const initialMigration = migrations.find(m => m.includes('initial_setup'))

    if (initialMigration) {
      const sqlPath = path.join(migrationsPath, initialMigration, 'migration.sql')
      const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

      // Check for essential SQL statements
      expect(sqlContent).toContain('CREATE TABLE "users"')
      expect(sqlContent).toContain('CREATE TABLE "workspaces"')
      expect(sqlContent).toContain('CREATE TABLE "workspace_memberships"')
      expect(sqlContent).toContain('CREATE TABLE "links"')
      expect(sqlContent).toContain('CREATE TABLE "click_events"')
      expect(sqlContent).toContain('CREATE TABLE "folders"')
      expect(sqlContent).toContain('CREATE TABLE "campaigns"')

      // Check for indexes
      expect(sqlContent).toContain('CREATE UNIQUE INDEX')
      expect(sqlContent).toContain('CREATE INDEX')

      // Check for foreign keys
      expect(sqlContent).toContain('ADD CONSTRAINT')
      expect(sqlContent).toContain('FOREIGN KEY')

      // Check for RLS
      expect(sqlContent).toContain('ENABLE ROW LEVEL SECURITY')
      expect(sqlContent).toContain('CREATE POLICY')
    }
  })

  it('should have RLS policies in migration', () => {
    const migrations = fs.readdirSync(migrationsPath)
    const initialMigration = migrations.find(m => m.includes('initial_setup'))

    if (initialMigration) {
      const sqlPath = path.join(migrationsPath, initialMigration, 'migration.sql')
      const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

      // Check for specific RLS policies
      expect(sqlContent).toContain('CREATE POLICY "Users can read their own profile"')
      expect(sqlContent).toContain('CREATE POLICY "Users can read workspaces they are members of"')
      expect(sqlContent).toContain('CREATE POLICY "Public can write click events"')
      expect(sqlContent).toContain('CREATE POLICY "Users can read click events for their links"')
    }
  })

  it('should have performance indexes in migration', () => {
    const migrations = fs.readdirSync(migrationsPath)
    const initialMigration = migrations.find(m => m.includes('initial_setup'))

    if (initialMigration) {
      const sqlPath = path.join(migrationsPath, initialMigration, 'migration.sql')
      const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

      // Check for critical performance indexes
      expect(sqlContent).toContain('"links_slug_key"') // Unique index on slug
      expect(sqlContent).toContain('"links_slug_idx"') // Regular index on slug
      expect(sqlContent).toContain('"links_workspace_id_idx"')
      expect(sqlContent).toContain('"click_events_link_id_idx"')
      expect(sqlContent).toContain('"click_events_timestamp_idx"')
      expect(sqlContent).toContain('"workspace_memberships_user_id_workspace_id_key"')
    }
  })
})