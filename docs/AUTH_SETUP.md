# Authentication Setup Guide

## Current Status

The authentication system is configured and working, but requires email confirmation before users can sign in.

## Quick Fix for Development

1. **Disable Email Confirmation** (Recommended for development):
   - Go to: https://supabase.com/dashboard/project/bnhhnhrorrjpavwwxglu/auth/configuration
   - Find "Email Auth" section
   - Toggle OFF "Confirm email"
   - Save changes

2. **After disabling email confirmation**:
   - Users can sign up and immediately access the dashboard
   - No email verification required
   - Google OAuth will work without email confirmation

## For Production

You'll need to configure a proper email provider:

### Option A: Use Resend (Recommended)
1. Sign up at https://resend.com
2. Get your API key from https://resend.com/api-keys
3. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_your_actual_api_key_here
   ```

### Option B: Use Supabase SMTP
1. Configure SMTP settings in Supabase Dashboard
2. Go to: Project Settings > Auth > SMTP Settings
3. Add your SMTP credentials

## Testing Authentication

After disabling email confirmation, test with:
```bash
# Test signup with valid domain
curl -X POST http://localhost:3000/api/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "test@gmail.com"}'
```

## Important Notes

- Supabase blocks certain test domains (like @example.com)
- Use real-looking email addresses for testing (@gmail.com, @outlook.com, etc.)
- For production, always enable email confirmation for security
- Google OAuth requires proper redirect URLs configured in Google Console

## Current Configuration

- **Supabase Project**: bnhhnhrorrjpavwwxglu
- **Auth Redirect URL**: http://localhost:3000/auth/confirm
- **Allowed Redirect URLs**: Configure in Dashboard > Authentication > URL Configuration