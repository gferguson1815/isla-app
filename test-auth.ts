import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bnhhnhrorrjpavwwxglu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaGhuaHJvcnJqcGF2d3d4Z2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTgyOTMsImV4cCI6MjA3Mzc5NDI5M30.5EnMD_U-lL9OkMC1XFAhpeBwg3MPD7rA11ILwRQqBKg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  // Test signing up a new user
  const testEmail = `test${Date.now()}@gmail.com`
  const testPassword = 'TestPassword123!'

  console.log('Testing signup with:', testEmail)

  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      emailRedirectTo: 'http://localhost:3000/auth/confirm',
    }
  })

  if (error) {
    console.error('Signup error:', error)
  } else {
    console.log('Signup successful:', data)
  }

  // Check if user was created
  console.log('\nChecking current session...')
  const { data: session } = await supabase.auth.getSession()
  console.log('Current session:', session)
}

testAuth()