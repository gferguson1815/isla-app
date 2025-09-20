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

async function addLogoUrlColumn() {
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Check if column already exists
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'workspaces'
      AND column_name = 'logo_url'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ Column logo_url already exists');
      return;
    }

    // Add the column
    console.log('📝 Adding logo_url column to workspaces table...');
    await client.query(`
      ALTER TABLE workspaces
      ADD COLUMN IF NOT EXISTS logo_url TEXT
    `);

    console.log('✅ Column added successfully!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addLogoUrlColumn();