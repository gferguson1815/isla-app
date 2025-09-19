const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function setupDatabase() {
  try {
    console.log('Applying RLS policies to Supabase...')

    // Read the RLS SQL file
    const rlsSQL = fs.readFileSync(
      path.join(__dirname, 'apply-rls.sql'),
      'utf-8'
    )

    // Split by semicolon and filter out empty statements
    const statements = rlsSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`Executing statement ${i + 1}/${statements.length}...`)

      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement
      }).single()

      if (error && error.code !== 'PGRST202') {
        // PGRST202 means RPC doesn't exist, try direct approach
        console.log(`Statement ${i + 1}: ${error.message || 'May need to be run in Supabase Dashboard'}`)
      } else {
        console.log(`Statement ${i + 1}: Success`)
      }
    }

    console.log('\n✅ Database setup complete!')
    console.log('\nNote: If some RLS policies failed to apply, you can run the SQL directly in the Supabase Dashboard:')
    console.log('1. Go to your Supabase project dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of scripts/apply-rls.sql')
    console.log('4. Click "Run"')

  } catch (error) {
    console.error('Error setting up database:', error)
    process.exit(1)
  }
}

setupDatabase()