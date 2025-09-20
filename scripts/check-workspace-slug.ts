#!/usr/bin/env node

import * as dotenv from 'dotenv';
import path from 'path';
import { Client } from 'pg';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

async function checkSlug() {
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();

    // Check for workspaces with slug 'capsule'
    const result = await client.query(`
      SELECT id, name, slug, deleted_at, created_at
      FROM workspaces
      WHERE LOWER(slug) = LOWER('capsule')
      ORDER BY created_at DESC;
    `);

    console.log(`\n📋 Workspaces with slug 'capsule':\n`);

    if (result.rows.length === 0) {
      console.log('✅ No workspaces found with slug "capsule"');
    } else {
      console.log(`Found ${result.rows.length} workspace(s):\n`);
      result.rows.forEach(row => {
        console.log(`  ID: ${row.id}`);
        console.log(`  Name: ${row.name}`);
        console.log(`  Slug: ${row.slug}`);
        console.log(`  Created: ${row.created_at}`);
        console.log(`  Deleted: ${row.deleted_at ? `Yes (${row.deleted_at})` : 'No'}`);
        console.log('  ---');
      });
    }

    // Also check total workspace count
    const countResult = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active,
             COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted
      FROM workspaces;
    `);

    console.log('\n📊 Workspace Statistics:');
    console.log(`  Total: ${countResult.rows[0].total}`);
    console.log(`  Active: ${countResult.rows[0].active}`);
    console.log(`  Deleted: ${countResult.rows[0].deleted}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkSlug();