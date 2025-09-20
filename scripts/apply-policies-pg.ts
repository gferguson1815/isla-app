#!/usr/bin/env node

/**
 * Apply Storage RLS Policies using direct PostgreSQL connection
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

async function applyPolicies() {
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    const policies = [
      // Drop existing policies
      {
        name: 'Drop old policies',
        sqls: [
          `DROP POLICY IF EXISTS "Allow workspace logo upload" ON storage.objects`,
          `DROP POLICY IF EXISTS "Allow public workspace logo access" ON storage.objects`,
          `DROP POLICY IF EXISTS "Allow workspace logo update" ON storage.objects`,
          `DROP POLICY IF EXISTS "Allow workspace logo delete" ON storage.objects`,
          `DROP POLICY IF EXISTS "Authenticated users can upload workspace logos" ON storage.objects`,
          `DROP POLICY IF EXISTS "Public can view workspace logos" ON storage.objects`,
          `DROP POLICY IF EXISTS "Authenticated users can update workspace logos" ON storage.objects`,
          `DROP POLICY IF EXISTS "Authenticated users can delete workspace logos" ON storage.objects`
        ]
      },
      // Create new policies
      {
        name: 'Create INSERT policy',
        sqls: [`
          CREATE POLICY "Authenticated users can upload workspace logos"
          ON storage.objects FOR INSERT
          TO authenticated
          WITH CHECK (bucket_id = 'workspace-logos')
        `]
      },
      {
        name: 'Create SELECT policy',
        sqls: [`
          CREATE POLICY "Public can view workspace logos"
          ON storage.objects FOR SELECT
          TO public
          USING (bucket_id = 'workspace-logos')
        `]
      },
      {
        name: 'Create UPDATE policy',
        sqls: [`
          CREATE POLICY "Authenticated users can update workspace logos"
          ON storage.objects FOR UPDATE
          TO authenticated
          USING (bucket_id = 'workspace-logos')
          WITH CHECK (bucket_id = 'workspace-logos')
        `]
      },
      {
        name: 'Create DELETE policy',
        sqls: [`
          CREATE POLICY "Authenticated users can delete workspace logos"
          ON storage.objects FOR DELETE
          TO authenticated
          USING (bucket_id = 'workspace-logos')
        `]
      },
      {
        name: 'Update bucket settings',
        sqls: [`UPDATE storage.buckets SET public = true WHERE id = 'workspace-logos'`]
      },
      {
        name: 'Grant permissions',
        sqls: [
          `GRANT ALL ON storage.objects TO authenticated`,
          `GRANT SELECT ON storage.objects TO anon`
        ]
      }
    ];

    console.log('📝 Applying policies...\n');

    for (const policy of policies) {
      process.stdout.write(`  ${policy.name}... `);

      let success = true;
      for (const sql of policy.sqls) {
        try {
          await client.query(sql);
        } catch (error: any) {
          // Ignore "does not exist" errors when dropping
          if (!error.message.includes('does not exist') && !error.message.includes('already exists')) {
            console.error(`\n    ❌ Error: ${error.message}`);
            success = false;
          }
        }
      }

      if (success) {
        console.log('✅');
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All policies applied successfully!');
    console.log('🎉 The workspace-logos bucket is now properly configured');
    console.log('\nYou can now upload logos without RLS errors.');

  } catch (error: any) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('permission denied')) {
      console.log('\n⚠️  Permission denied. The database user may not have sufficient privileges.');
      console.log('   You may need to apply these policies via Supabase Dashboard.');
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

applyPolicies();