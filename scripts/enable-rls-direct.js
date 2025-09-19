const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: false
    }
  }
)

async function enableRLS() {
  console.log('📋 Enabling RLS and creating policies...\n')

  // Read the complete SQL file
  const sqlContent = fs.readFileSync(
    path.join(__dirname, 'complete-setup.sql'),
    'utf-8'
  )

  // Split into individual statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]

    // Skip the verification query at the end
    if (statement.includes('SELECT tablename, rowsecurity')) {
      continue
    }

    try {
      // Use the Supabase admin API to execute raw SQL
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          query: statement + ';'
        })
      })

      if (response.ok) {
        console.log(`✅ Statement ${i + 1}/${statements.length}: Success`)
        successCount++
      } else {
        console.log(`⚠️  Statement ${i + 1}/${statements.length}: May need manual execution`)
        errorCount++
      }
    } catch (error) {
      console.log(`⚠️  Statement ${i + 1}/${statements.length}: ${error.message}`)
      errorCount++
    }
  }

  console.log(`\n📊 Summary: ${successCount} successful, ${errorCount} need manual execution`)

  if (errorCount > 0) {
    console.log('\n🔧 To complete setup manually:')
    console.log('1. Go to: https://supabase.com/dashboard/project/bnhhnhrorrjpavwwxglu/sql/new')
    console.log('2. Copy and paste the contents of scripts/complete-setup.sql')
    console.log('3. Click "Run"\n')
    console.log('This will enable RLS on all tables and create the security policies.')
  } else {
    console.log('\n✨ All RLS policies successfully applied!')
  }
}

enableRLS().catch(error => {
  console.error('Error:', error)
  console.log('\n🔧 Please run the SQL manually:')
  console.log('1. Go to: https://supabase.com/dashboard/project/bnhhnhrorrjpavwwxglu/sql/new')
  console.log('2. Copy and paste the contents of scripts/complete-setup.sql')
  console.log('3. Click "Run"')
})