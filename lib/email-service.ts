import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendMagicLinkFallback(
  email: string,
  magicLink: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend API not configured')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Isla <noreply@isla.app>',
      to: email,
      subject: 'Sign in to Isla',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sign in to Isla</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.5; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #000; font-size: 24px; font-weight: 600; margin-bottom: 20px;">Sign in to Isla</h1>

            <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
              Click the button below to sign in to your Isla account. This link will expire in 1 hour.
            </p>

            <a href="${magicLink}"
               style="display: inline-block; background-color: #000; color: #fff; text-decoration: none;
                      padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 16px;">
              Sign in to Isla
            </a>

            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              If you didn't request this email, you can safely ignore it.
            </p>

            <p style="color: #999; font-size: 14px; margin-top: 20px;">
              Or copy and paste this link into your browser:<br>
              <span style="color: #666; word-break: break-all;">${magicLink}</span>
            </p>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log('Email sent via Resend:', data?.id)
    return { success: true }
  } catch (error) {
    console.error('Failed to send email via Resend:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function monitorEmailDelivery(
  emailProvider: 'supabase' | 'resend',
  success: boolean,
  duration: number
) {
  const threshold = 2000
  const isSlowDelivery = duration > threshold

  if (isSlowDelivery) {
    console.warn(`Email delivery slow: ${duration}ms via ${emailProvider}`)
  }

  if (!success) {
    console.error(`Email delivery failed via ${emailProvider}`)
  }

  console.log({
    provider: emailProvider,
    success,
    duration,
    slow: isSlowDelivery,
    timestamp: new Date().toISOString(),
  })
}