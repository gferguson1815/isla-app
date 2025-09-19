import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bnhhnhrorrjpavwwxglu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaGhuaHJvcnJqcGF2d3d4Z2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTgyOTMsImV4cCI6MjA3Mzc5NDI5M30.5EnMD_U-lL9OkMC1XFAhpeBwg3MPD7rA11ILwRQqBKg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testMagicLink() {
  const testEmail = `test${Date.now()}@gmail.com`

  console.log('Testing magic link with Supabase...')
  console.log('Email:', testEmail)
  console.log('---')

  const { data, error } = await supabase.auth.signInWithOtp({
    email: testEmail,
    options: {
      emailRedirectTo: 'http://localhost:3000/auth/confirm',
      shouldCreateUser: true,
    }
  })

  if (error) {
    console.error('❌ Error:', error.message)
    console.error('Error code:', error.code)
    console.error('Full error:', JSON.stringify(error, null, 2))

    // Check if it's a rate limit or SMTP issue
    if (error.message.includes('rate')) {
      console.log('\n📝 This appears to be a rate limit issue.')
      console.log('Supabase has email rate limits:')
      console.log('- Built-in SMTP: 3-4 emails per hour')
      console.log('- Custom SMTP: 30 emails per hour (default)')
    } else if (error.message.includes('SMTP') || error.message.includes('email')) {
      console.log('\n📝 This appears to be an SMTP configuration issue.')
      console.log('Check your SMTP settings in the Supabase dashboard.')
    }
  } else {
    console.log('✅ Magic link sent successfully!')
    console.log('Response:', data)
  }

  // Also test if we can create users at all
  console.log('\n--- Testing if user creation works ---')
  const { data: userData, error: userError } = await supabase.auth.signUp({
    email: `signup${Date.now()}@gmail.com`,
    password: 'TestPassword123!',
    options: {
      emailRedirectTo: 'http://localhost:3000/auth/confirm',
    }
  })

  if (userError) {
    console.error('❌ Signup error:', userError.message)
  } else {
    console.log('✅ User created:', userData.user?.id)
  }
}

testMagicLink()