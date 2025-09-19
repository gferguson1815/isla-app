import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bnhhnhrorrjpavwwxglu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaGhuaHJvcnJqcGF2d3d4Z2x1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIxODI5MywiZXhwIjoyMDczNzk0MjkzfQ.ONx4ShuyZXvqbuAADMRe5lTizlEO5KFfPYv11y8fiwA'

// Use service role key to bypass email confirmation
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  const email = 'test@isla.so'
  const password = 'TestPassword123!'

  console.log('Creating test user:', email)

  // Create user in auth.users with admin privileges (bypasses email confirmation)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      full_name: 'Test User'
    }
  })

  if (authError) {
    console.error('Error creating auth user:', authError)
    return
  }

  console.log('Auth user created:', authData.user?.id)

  // Now create the corresponding record in public.users table
  if (authData.user) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        name: 'Test User',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating public user:', userError)
    } else {
      console.log('Public user created:', userData)
    }

    // Create a default workspace for the user
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: 'Test Workspace',
        slug: 'test-workspace',
        created_by: authData.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (workspaceError) {
      console.error('Error creating workspace:', workspaceError)
    } else {
      console.log('Workspace created:', workspace)

      // Add user to workspace
      const { error: membershipError } = await supabase
        .from('workspace_memberships')
        .insert({
          workspace_id: workspace.id,
          user_id: authData.user.id,
          role: 'owner',
          created_at: new Date().toISOString()
        })

      if (membershipError) {
        console.error('Error creating membership:', membershipError)
      } else {
        console.log('Workspace membership created')
      }
    }
  }

  console.log('\n✅ Test user created successfully!')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('\nYou can now log in at http://localhost:3000/login')
}

createTestUser()