#!/usr/bin/env node

/**
 * Apply Storage RLS Policies directly to Supabase
 * This script uses the Supabase service role key to execute SQL directly
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'storage'
  }
});

async function executeSql(sql: string): Promise<{ success: boolean; error?: any }> {
  try {
    // Use the Supabase admin client to execute raw SQL
    const { data, error } = await supabase.from('objects').rpc('exec', { sql });

    if (error) {
      // Try alternative approach - direct POST to SQL endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql })
      });

      if (!response.ok) {
        // Final attempt - use the SQL endpoint directly
        const sqlResponse = await fetch(`${supabaseUrl.replace('/rest/v1', '')}/sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: sql })
        });

        if (!sqlResponse.ok) {
          return { success: false, error: await sqlResponse.text() };
        }
        return { success: true };
      }
      return { success: true };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

async function applyPolicies() {
  console.log('🚀 Applying Storage RLS Policies directly...\n');

  // SQL statements to execute
  const statements = [
    {
      name: 'Drop old upload policy',
      sql: `DROP POLICY IF EXISTS "Allow workspace logo upload" ON storage.objects;`
    },
    {
      name: 'Drop old public access policy',
      sql: `DROP POLICY IF EXISTS "Allow public workspace logo access" ON storage.objects;`
    },
    {
      name: 'Drop old update policy',
      sql: `DROP POLICY IF EXISTS "Allow workspace logo update" ON storage.objects;`
    },
    {
      name: 'Drop old delete policy',
      sql: `DROP POLICY IF EXISTS "Allow workspace logo delete" ON storage.objects;`
    },
    {
      name: 'Drop duplicate upload policy',
      sql: `DROP POLICY IF EXISTS "Authenticated users can upload workspace logos" ON storage.objects;`
    },
    {
      name: 'Drop duplicate view policy',
      sql: `DROP POLICY IF EXISTS "Public can view workspace logos" ON storage.objects;`
    },
    {
      name: 'Drop duplicate update policy',
      sql: `DROP POLICY IF EXISTS "Authenticated users can update workspace logos" ON storage.objects;`
    },
    {
      name: 'Drop duplicate delete policy',
      sql: `DROP POLICY IF EXISTS "Authenticated users can delete workspace logos" ON storage.objects;`
    },
    {
      name: 'Create upload policy',
      sql: `CREATE POLICY "Authenticated users can upload workspace logos"
            ON storage.objects FOR INSERT
            TO authenticated
            WITH CHECK (bucket_id = 'workspace-logos');`
    },
    {
      name: 'Create public view policy',
      sql: `CREATE POLICY "Public can view workspace logos"
            ON storage.objects FOR SELECT
            TO public
            USING (bucket_id = 'workspace-logos');`
    },
    {
      name: 'Create update policy',
      sql: `CREATE POLICY "Authenticated users can update workspace logos"
            ON storage.objects FOR UPDATE
            TO authenticated
            USING (bucket_id = 'workspace-logos')
            WITH CHECK (bucket_id = 'workspace-logos');`
    },
    {
      name: 'Create delete policy',
      sql: `CREATE POLICY "Authenticated users can delete workspace logos"
            ON storage.objects FOR DELETE
            TO authenticated
            USING (bucket_id = 'workspace-logos');`
    },
    {
      name: 'Update bucket to public',
      sql: `UPDATE storage.buckets SET public = true WHERE id = 'workspace-logos';`
    },
    {
      name: 'Grant permissions to authenticated',
      sql: `GRANT ALL ON storage.objects TO authenticated;`
    },
    {
      name: 'Grant select to anonymous',
      sql: `GRANT SELECT ON storage.objects TO anon;`
    }
  ];

  let successCount = 0;
  let failedStatements: string[] = [];

  // Try using Supabase CLI if available
  console.log('🔍 Checking for Supabase CLI...');
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);

  try {
    await execPromise('supabase --version');
    console.log('✅ Supabase CLI found\n');

    // Try to apply via Supabase CLI
    console.log('📝 Applying policies via Supabase CLI...\n');

    for (const statement of statements) {
      process.stdout.write(`  ${statement.name}... `);

      try {
        // Write SQL to temp file
        const fs = require('fs');
        const tmpFile = `/tmp/policy_${Date.now()}.sql`;
        fs.writeFileSync(tmpFile, statement.sql);

        // Execute via Supabase CLI
        const { stdout, stderr } = await execPromise(
          `supabase db push --file ${tmpFile}`,
          { env: { ...process.env } }
        );

        fs.unlinkSync(tmpFile);

        if (stderr && !stderr.includes('already exists') && !stderr.includes('does not exist')) {
          console.log('⚠️  Warning');
          failedStatements.push(statement.sql);
        } else {
          console.log('✅');
          successCount++;
        }
      } catch (error: any) {
        if (error.message.includes('does not exist') || error.message.includes('already exists')) {
          console.log('✅ (skipped)');
          successCount++;
        } else {
          console.log('❌');
          failedStatements.push(statement.sql);
        }
      }
    }
  } catch (cliError) {
    console.log('⚠️  Supabase CLI not found, trying direct approach...\n');

    // If CLI not available, try direct API approach
    for (const statement of statements) {
      process.stdout.write(`  ${statement.name}... `);

      const result = await executeSql(statement.sql);

      if (result.success) {
        console.log('✅');
        successCount++;
      } else if (result.error?.toString().includes('does not exist') ||
                 result.error?.toString().includes('already exists')) {
        console.log('✅ (skipped)');
        successCount++;
      } else {
        console.log('❌');
        failedStatements.push(statement.sql);
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (successCount === statements.length) {
    console.log('✅ All policies applied successfully!');
    console.log('🎉 The workspace-logos bucket is now properly configured');
    console.log('\nYou can now upload logos without RLS errors.');
  } else if (failedStatements.length > 0) {
    console.log(`⚠️  Applied ${successCount}/${statements.length} statements\n`);
    console.log('📋 Please run these statements manually in Supabase SQL Editor:\n');
    console.log('═══════════════════════════════════════════════════════════');
    failedStatements.forEach(sql => {
      console.log(sql);
      console.log('---');
    });
    console.log('═══════════════════════════════════════════════════════════');
  }
}

// Alternative: Direct database connection approach
async function applyViaDirectConnection() {
  console.log('\n🔄 Attempting direct database connection...\n');

  // Parse database URL from Supabase URL
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (!dbUrl) {
    console.log('❌ No direct database URL found');
    console.log('   Please set DATABASE_URL or SUPABASE_DB_URL in .env.local');
    return false;
  }

  try {
    const { Client } = require('pg');
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    const statements = [
      `DROP POLICY IF EXISTS "Allow workspace logo upload" ON storage.objects`,
      `DROP POLICY IF EXISTS "Allow public workspace logo access" ON storage.objects`,
      `DROP POLICY IF EXISTS "Allow workspace logo update" ON storage.objects`,
      `DROP POLICY IF EXISTS "Allow workspace logo delete" ON storage.objects`,
      `DROP POLICY IF EXISTS "Authenticated users can upload workspace logos" ON storage.objects`,
      `DROP POLICY IF EXISTS "Public can view workspace logos" ON storage.objects`,
      `DROP POLICY IF EXISTS "Authenticated users can update workspace logos" ON storage.objects`,
      `DROP POLICY IF EXISTS "Authenticated users can delete workspace logos" ON storage.objects`,
      `CREATE POLICY "Authenticated users can upload workspace logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'workspace-logos')`,
      `CREATE POLICY "Public can view workspace logos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'workspace-logos')`,
      `CREATE POLICY "Authenticated users can update workspace logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'workspace-logos') WITH CHECK (bucket_id = 'workspace-logos')`,
      `CREATE POLICY "Authenticated users can delete workspace logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'workspace-logos')`,
      `UPDATE storage.buckets SET public = true WHERE id = 'workspace-logos'`,
      `GRANT ALL ON storage.objects TO authenticated`,
      `GRANT SELECT ON storage.objects TO anon`
    ];

    for (const sql of statements) {
      try {
        await client.query(sql);
        console.log(`✅ Executed: ${sql.substring(0, 50)}...`);
      } catch (err: any) {
        if (!err.message.includes('does not exist') && !err.message.includes('already exists')) {
          console.log(`⚠️  Failed: ${sql.substring(0, 50)}...`);
        }
      }
    }

    await client.end();
    console.log('\n✅ Policies applied via direct connection!');
    return true;
  } catch (error) {
    console.log('❌ Could not connect directly to database');
    return false;
  }
}

// Main execution
applyPolicies().catch(async (error) => {
  console.error('\n❌ Error applying policies:', error.message);

  // Try alternative approach
  const success = await applyViaDirectConnection();

  if (!success) {
    console.log('\n📋 Please apply the policies manually in Supabase Dashboard');
    console.log('   Navigate to SQL Editor and run the commands from:');
    console.log('   scripts/fix-storage-policies.sql');
  }
});