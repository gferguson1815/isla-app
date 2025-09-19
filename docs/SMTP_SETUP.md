# SMTP Email Configuration for Supabase Auth

## Current Issue
Supabase's built-in email service only sends to pre-authorized team member emails and has a 3-4 emails/hour rate limit.

## Quick Solution: Add Team Members
1. Go to: https://supabase.com/dashboard/org/ntamuohhsllzskjetxxr/team
2. Add email addresses you want to test with as team members
3. Emails will now be sent to those addresses

## Permanent Solution: Configure Custom SMTP

### Option 1: Resend (Recommended - Free tier available)

1. **Sign up for Resend**
   - Go to https://resend.com
   - Create an account
   - Verify your domain or use their testing domain

2. **Get SMTP Credentials**
   - Go to https://resend.com/settings/smtp
   - You'll get:
     - SMTP Host: `smtp.resend.com`
     - SMTP Port: `465` (SSL) or `587` (TLS)
     - SMTP User: `resend`
     - SMTP Password: Your API key

3. **Configure in Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/bnhhnhrorrjpavwwxglu/settings/auth
   - Find "SMTP Settings" section
   - Enable "Custom SMTP"
   - Enter:
     ```
     Host: smtp.resend.com
     Port: 587
     Username: resend
     Password: [Your Resend API Key]
     Sender email: noreply@yourdomain.com
     Sender name: Isla App
     ```
   - Save changes

4. **Update Rate Limits**
   - Go to: https://supabase.com/dashboard/project/bnhhnhrorrjpavwwxglu/auth/rate-limits
   - Increase email rate limit from 4 to 30+ per hour

### Option 2: Use Gmail SMTP (For testing only)

1. **Enable 2-Factor Authentication** on your Gmail account

2. **Create App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Generate an app-specific password

3. **Configure in Supabase**
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: your-email@gmail.com
   Password: [Your App Password]
   Sender email: your-email@gmail.com
   Sender name: Isla App
   ```

### Option 3: Other Providers

- **SendGrid**: https://www.twilio.com/docs/sendgrid/for-developers/sending-email/getting-started-smtp
- **AWS SES**: https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html
- **Postmark**: https://postmarkapp.com/developer/user-guide/send-email-with-smtp

## Testing After Configuration

Once configured, test with:

```bash
npx tsx scripts/test-supabase-email.ts
```

Emails should now be sent to any valid email address, not just team members.

## Important Notes

- After configuring custom SMTP, the rate limit increases to 30 emails/hour by default
- You can further increase this in the Rate Limits settings
- For production, always use a dedicated email service provider
- Keep authentication emails separate from marketing emails (use different domains/addresses)