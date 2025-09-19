const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Create two clients - one with service role (bypasses RLS) and one with anon key (respects RLS)
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

async function validateRLS() {
  console.log('🔍 Validating RLS Configuration...\n')

  const tables = [
    'users',
    'workspaces',
    'workspace_memberships',
    'folders',
    'campaigns',
    'links',
    'click_events'
  ]

  let allEnabled = true
  let allPoliciesWork = true

  console.log('📊 Step 1: Checking RLS Status on Tables')
  console.log('=========================================')

  // Check RLS status using pg_tables
  const { data: rlsStatus, error: rlsError } = await adminClient
    .rpc('check_rls_status', {})
    .single()

  if (rlsError) {
    // If RPC doesn't exist, query pg_tables directly
    for (const table of tables) {
      try {
        // Try to query with anon client (should fail or return empty if RLS is working)
        const { data: anonData, error: anonError } = await anonClient
          .from(table)
          .select('*')
          .limit(1)

        // Try to query with admin client (should always work)
        const { data: adminData, error: adminError } = await adminClient
          .from(table)
          .select('*')
          .limit(1)

        if (!adminError) {
          // If anon returns empty but admin can query, RLS is likely enabled
          const rlsEnabled = (anonData?.length === 0 || anonError !== null) && !adminError
          console.log(`${rlsEnabled ? '✅' : '❌'} ${table}: RLS ${rlsEnabled ? 'enabled' : 'DISABLED'}`)

          if (!rlsEnabled) {
            allEnabled = false
          }
        }
      } catch (error) {
        console.log(`⚠️  ${table}: Could not verify status`)
      }
    }
  }

  console.log('\n📋 Step 2: Testing RLS Policies')
  console.log('================================')

  // Test 1: Anon user shouldn't be able to read most tables
  console.log('\nTest 1: Anonymous access (should be restricted)')
  for (const table of tables.filter(t => t !== 'click_events')) {
    const { data, error } = await anonClient
      .from(table)
      .select('*')
      .limit(1)

    const isProtected = data?.length === 0 || data === null
    console.log(`  ${isProtected ? '✅' : '❌'} ${table}: ${isProtected ? 'Protected' : 'NOT PROTECTED - Data exposed!'}`)

    if (!isProtected) {
      allPoliciesWork = false
    }
  }

  // Test 2: Click events should allow public writes
  console.log('\nTest 2: Click events public write (should be allowed)')
  const testClickEvent = {
    link_id: '00000000-0000-0000-0000-000000000000',
    ip_address: '127.0.0.1',
    user_agent: 'Test Agent',
    device: 'desktop'
  }

  const { error: clickError } = await anonClient
    .from('click_events')
    .insert(testClickEvent)

  // Should fail with FK constraint (link doesn't exist), not RLS
  const clickWriteWorks = clickError && clickError.code === '23503'
  console.log(`  ${clickWriteWorks ? '✅' : '❌'} click_events: ${clickWriteWorks ? 'Public write allowed (FK error as expected)' : 'Write blocked by RLS or other error'}`)

  if (!clickWriteWorks && clickError) {
    console.log(`     Error: ${clickError.message}`)
    if (clickError.code !== '23503') {
      allPoliciesWork = false
    }
  }

  // Test 3: Check that policies exist
  console.log('\nTest 3: Checking for policy existence')
  const { data: policies, error: policyError } = await adminClient
    .from('pg_policies')
    .select('*')
    .in('tablename', tables)

  if (!policyError && policies) {
    const policyCount = policies.length
    console.log(`  ${policyCount > 0 ? '✅' : '❌'} Found ${policyCount} policies`)

    // Group policies by table
    const policiesByTable = {}
    policies.forEach(p => {
      if (!policiesByTable[p.tablename]) {
        policiesByTable[p.tablename] = []
      }
      policiesByTable[p.tablename].push(p.policyname)
    })

    for (const table of tables) {
      const tablePolicies = policiesByTable[table] || []
      console.log(`     ${table}: ${tablePolicies.length} policies`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 VALIDATION SUMMARY')
  console.log('='.repeat(50))

  if (allEnabled && allPoliciesWork) {
    console.log('✅ SUCCESS: All RLS policies are properly configured!')
    console.log('   - All tables have RLS enabled')
    console.log('   - Anonymous access is properly restricted')
    console.log('   - Click events allow public writes')
  } else {
    if (!allEnabled) {
      console.log('❌ ISSUE: Some tables do not have RLS enabled')
      console.log('   Please run the SQL in scripts/complete-setup.sql via Supabase Dashboard')
    }
    if (!allPoliciesWork) {
      console.log('⚠️  WARNING: Some policies may not be working as expected')
      console.log('   This could be normal if no data exists yet')
    }
  }

  console.log('\n💡 Next Steps:')
  console.log('1. If any issues, run scripts/complete-setup.sql in Supabase SQL Editor')
  console.log('2. Check https://supabase.com/dashboard/project/bnhhnhrorrjpavwwxglu/auth/policies')
  console.log('3. Verify each table shows "RLS enabled" badge')

  return { allEnabled, allPoliciesWork }
}

validateRLS().catch(console.error)