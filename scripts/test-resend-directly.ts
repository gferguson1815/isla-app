import { Resend } from 'resend'

// Using the Resend API key from your .env.local
const resend = new Resend('re_CDnKAJQh_FcJB5GZcjzWBS1f3KMdqoqVD')

async function testResendDirectly() {
  console.log('Testing Resend API directly...')
  console.log('---')

  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev', // Using Resend's test domain
      to: 'test@example.com', // Change this to your email
      subject: 'Test Email from Isla App',
      html: '<p>If you receive this, Resend is working!</p>',
    })

    console.log('✅ Email sent successfully!')
    console.log('Response:', data)
  } catch (error: any) {
    console.error('❌ Resend error:', error.message)

    if (error.message.includes('domain')) {
      console.log('\n📝 Domain verification required:')
      console.log('1. Go to https://resend.com/domains')
      console.log('2. Add and verify your domain')
      console.log('3. Update the "from" address to use your verified domain')
    } else if (error.message.includes('API')) {
      console.log('\n📝 API key issue:')
      console.log('1. Check if the API key is valid')
      console.log('2. Ensure it has send permissions')
      console.log('3. Generate a new key at https://resend.com/api-keys')
    }

    console.log('\nFull error:', error)
  }
}

testResendDirectly()