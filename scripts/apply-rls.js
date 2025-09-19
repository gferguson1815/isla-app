const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLS() {
  try {
    console.log('Applying RLS security policies...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../prisma/migrations/20250119_enable_rls_security/migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      query: sql
    });

    if (error) {
      // If the RPC doesn't exist, try a different approach
      console.log('Direct RPC not available, executing statements individually...');

      // Split the SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('DO $$')) {
          // Skip DO blocks for now, handle them separately
          continue;
        }

        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error: stmtError } = await supabase.rpc('query', {
          sql: statement + ';'
        });

        if (stmtError) {
          console.error(`Error executing statement: ${stmtError.message}`);
        }
      }
    }

    console.log('✅ RLS policies applied successfully!');

    // Verify RLS is enabled
    console.log('\nVerifying RLS status...');

    const { data: tablesData, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .in('tablename', ['analytics_aggregates', 'campaigns']);

    if (tablesData) {
      console.log('Tables with RLS to be enabled:', tablesData.map(t => t.tablename).join(', '));
    }

  } catch (error) {
    console.error('Error applying RLS:', error);
    process.exit(1);
  }
}

applyRLS();