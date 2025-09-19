import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bnhhnhrorrjpavwwxglu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaGhuaHJvcnJqcGF2d3d4Z2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTgyOTMsImV4cCI6MjA3Mzc5NDI5M30.5EnMD_U-lL9OkMC1XFAhpeBwg3MPD7rA11ILwRQqBKg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testMagicLink() {
  // Test magic link with valid email
  const testEmail = `magictest${Date.now()}@gmail.com`

  console.log('Testing magic link with:', testEmail)

  const { data, error } = await supabase.auth.signInWithOtp({
    email: testEmail,
    options: {
      emailRedirectTo: 'http://localhost:3000/auth/confirm',
      shouldCreateUser: true,
    }
  })

  if (error) {
    console.error('Magic link error:', error)
  } else {
    console.log('Magic link sent successfully:', data)
  }

  // Check if user was created
  const { data: userData, error: userError } = await supabase
    .from('auth.users')
    .select('*')
    .eq('email', testEmail)
    .single()

  if (userError) {
    console.log('User lookup error:', userError.message)
  } else {
    console.log('User created:', userData)
  }
}

testMagicLink()