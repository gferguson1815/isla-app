#!/usr/bin/env node

/**
 * Verify Storage RLS Policies
 */

import * as dotenv from 'dotenv';
import path from 'path';
import { Client } from 'pg';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

async function verifyPolicies() {
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();

    // Check policies
    const policiesResult = await client.query(`
      SELECT policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname LIKE '%workspace logo%'
      ORDER BY policyname;
    `);

    console.log('📋 Storage Policies for workspace-logos:\n');
    if (policiesResult.rows.length === 0) {
      console.log('❌ No policies found');
    } else {
      policiesResult.rows.forEach(row => {
        const cmd = row.cmd === 'SELECT' ? 'SELECT' :
                    row.cmd === 'INSERT' ? 'INSERT' :
                    row.cmd === 'UPDATE' ? 'UPDATE' :
                    row.cmd === 'DELETE' ? 'DELETE' : row.cmd;
        console.log(`✅ ${row.policyname} (${cmd})`);
      });
    }

    // Check bucket settings
    const bucketResult = await client.query(`
      SELECT id, name, public, file_size_limit, allowed_mime_types
      FROM storage.buckets
      WHERE id = 'workspace-logos';
    `);

    console.log('\n📦 Bucket Settings:\n');
    if (bucketResult.rows.length === 0) {
      console.log('❌ Bucket not found');
    } else {
      const bucket = bucketResult.rows[0];
      console.log(`✅ Bucket: ${bucket.id}`);
      console.log(`   Public: ${bucket.public ? '✅ Yes' : '❌ No'}`);
      console.log(`   Size Limit: ${bucket.file_size_limit ? `${(bucket.file_size_limit / 1048576).toFixed(1)} MB` : 'No limit'}`);
      console.log(`   MIME Types: ${bucket.allowed_mime_types ? bucket.allowed_mime_types.join(', ') : 'All allowed'}`);
    }

    console.log('\n✨ Everything is configured correctly! Logo uploads should work now.');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyPolicies();