const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

async function enableRLS() {
  console.log('Connecting to Supabase...')

  // Use fetch to make direct API calls to Supabase
  const tables = [
    'users',
    'workspaces',
    'workspace_memberships',
    'folders',
    'campaigns',
    'links',
    'click_events'
  ]

  for (const table of tables) {
    console.log(`Enabling RLS on ${table}...`)

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        query: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      })
    })

    if (!response.ok) {
      console.log(`Note: Could not enable RLS via API for ${table}. Please enable manually in Supabase Dashboard.`)
    } else {
      console.log(`✓ RLS enabled for ${table}`)
    }
  }

  console.log('\n📋 To enable RLS manually:')
  console.log('1. Go to https://supabase.com/dashboard/project/bnhhnhrorrjpavwwxglu/auth/policies')
  console.log('2. For each table, click the "Enable RLS" button')
  console.log('3. Or go to SQL Editor and run:\n')

  // Generate the SQL for manual execution
  const enableRLSSQL = tables.map(t => `ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`).join('\n')
  console.log(enableRLSSQL)
}

enableRLS().catch(console.error)