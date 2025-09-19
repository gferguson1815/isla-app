import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bnhhnhrorrjpavwwxglu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaGhuaHJvcnJqcGF2d3d4Z2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTgyOTMsImV4cCI6MjA3Mzc5NDI5M30.5EnMD_U-lL9OkMC1XFAhpeBwg3MPD7rA11ILwRQqBKg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testEmailSending() {
  // Use a real email address that you have access to
  const testEmail = `testuser${Date.now()}@gmail.com`

  console.log('Testing Supabase built-in email sending...')
  console.log('Sending magic link to:', testEmail)

  // Test magic link email (OTP)
  const { data, error } = await supabase.auth.signInWithOtp({
    email: testEmail,
    options: {
      emailRedirectTo: 'http://localhost:3000/auth/confirm',
      shouldCreateUser: true, // Create user if doesn't exist
    }
  })

  if (error) {
    console.error('❌ Error sending magic link:', error)
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      code: error.code
    })
  } else {
    console.log('✅ Magic link email sent successfully!')
    console.log('Response:', data)
    console.log('\nNote: Supabase has a rate limit of 3-4 emails per hour for testing.')
    console.log('If you hit the rate limit, you\'ll see a "Rate limit exceeded" error.')
  }

  // Check if user was created
  console.log('\nChecking if user was created in auth.users...')
  const { data: userData, error: userError } = await supabase
    .rpc('get_user_by_email', { email_param: testEmail })
    .single()

  if (userData) {
    console.log('User found in auth.users:', userData)
  } else {
    console.log('User not found or RPC function doesn\'t exist')
  }
}

// Also test signup with password
async function testSignupEmail() {
  const testEmail = `signuptest${Date.now()}@gmail.com`
  const testPassword = 'TestPassword123!'

  console.log('\n--- Testing signup with password ---')
  console.log('Email:', testEmail)

  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      emailRedirectTo: 'http://localhost:3000/auth/confirm',
    }
  })

  if (error) {
    console.error('❌ Error during signup:', error)
  } else {
    console.log('✅ Signup successful!')
    console.log('User:', data.user?.id)
    console.log('Confirmation email should be sent to:', testEmail)

    if (data.user?.confirmed_at) {
      console.log('Email already confirmed at:', data.user.confirmed_at)
    } else {
      console.log('Email confirmation pending - check your inbox')
    }
  }
}

async function main() {
  await testEmailSending()
  await testSignupEmail()

  console.log('\n📧 Email Testing Complete')
  console.log('If emails were sent, they should arrive within a few minutes.')
  console.log('Check the spam folder if you don\'t see them in your inbox.')
}

main()