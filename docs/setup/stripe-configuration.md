# Stripe Configuration Guide

## Overview

This guide walks you through setting up Stripe for the Isla link shortener billing system. Follow these steps to configure Stripe for both development and production environments.

## Prerequisites

- Node.js 18+ and pnpm installed
- Access to Stripe Dashboard (create account at https://stripe.com)
- PostgreSQL database configured (via Supabase)
- Application deployed or running locally

## Step 1: Create Stripe Account

### Development Account
1. Go to https://dashboard.stripe.com/register
2. Create a new account or use existing
3. Keep in **Test Mode** (toggle in dashboard)

### Production Account
1. Complete Stripe account activation
2. Provide business details and bank information
3. Enable **Live Mode** when ready

## Step 2: Obtain API Keys

### Test Keys (Development)
1. Navigate to [Stripe Dashboard → Developers → API Keys](https://dashboard.stripe.com/test/apikeys)
2. Copy your keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...` (keep secure!)

### Live Keys (Production)
1. Switch to Live Mode in dashboard
2. Navigate to [API Keys](https://dashboard.stripe.com/apikeys)
3. Copy your keys:
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...` (keep secure!)

## Step 3: Configure Products and Pricing

### Create Products in Stripe Dashboard

1. Go to [Products](https://dashboard.stripe.com/test/products)
2. Create three products:

#### Free Tier
```
Name: Isla Free
Description: Perfect for personal use
Price: $0/month
Price ID: Save this ID for STRIPE_PRICE_FREE
Features:
- 3 team members
- 100 links
- 1,000 clicks/month
- Basic analytics
```

#### Starter Tier
```
Name: Isla Starter  
Description: Great for small teams
Price: $19/month
Price ID: Save this ID for STRIPE_PRICE_STARTER
Features:
- 10 team members
- 1,000 links
- 10,000 clicks/month
- Advanced analytics
- Custom domains
```

#### Growth Tier
```
Name: Isla Growth
Description: Scale without limits
Price: $49/month
Price ID: Save this ID for STRIPE_PRICE_GROWTH
Features:
- Unlimited team members
- 10,000 links
- 100,000 clicks/month
- Advanced analytics
- Custom domains
- Priority support
```

### Configure Billing Portal

1. Go to [Settings → Billing → Customer Portal](https://dashboard.stripe.com/test/settings/billing/portal)
2. Enable features:
   - ✅ Customers can update payment methods
   - ✅ Customers can update subscriptions
   - ✅ Customers can cancel subscriptions
   - ✅ Customers can view billing history
3. Set cancellation policy:
   - Choose "Cancel at end of billing period"
4. Save changes

## Step 4: Set Up Webhooks

### Local Development (Using Stripe CLI)

1. Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from https://stripe.com/docs/stripe-cli
```

2. Login to Stripe:
```bash
stripe login
```

3. Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. Copy the webhook signing secret displayed (starts with `whsec_`)

### Production Webhook

1. Go to [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Configure:
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/stripe`
   - **Events to send**: Select the following:
     - `customer.subscription.created`
     - `customer.subscription.updated`  
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `payment_method.attached`
     - `payment_method.detached`
4. After creation, reveal and copy the "Signing secret" (starts with `whsec_`)

## Step 5: Environment Configuration

### Create `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Stripe Price IDs (from Step 3)
STRIPE_PRICE_FREE=price_FREE_ID_FROM_DASHBOARD
STRIPE_PRICE_STARTER=price_STARTER_ID_FROM_DASHBOARD  
STRIPE_PRICE_GROWTH=price_GROWTH_ID_FROM_DASHBOARD

# Other required variables
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Optional but recommended
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

### Production Environment Variables

Set these in your hosting provider (Vercel, Railway, etc.):

```bash
# Use live keys for production
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
# ... rest of configuration
```

## Step 6: Database Setup

Run migrations to create billing tables:

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Or for production
pnpm prisma migrate deploy
```

## Step 7: Test Your Setup

### Test Webhook Connection

```bash
# In one terminal, start your app
pnpm dev

# In another terminal, forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In a third terminal, trigger a test event
stripe trigger payment_intent.succeeded
```

### Test Payment Flow

1. Navigate to your billing page
2. Click "Upgrade" on a paid plan
3. Use test card: `4242 4242 4242 4242`
4. Any future expiry date and any CVC
5. Complete checkout
6. Verify subscription created in:
   - Stripe Dashboard
   - Your database
   - Application UI

### Test Card Numbers

| Scenario | Card Number | CVC | Date |
|----------|------------|-----|------|
| Success | 4242 4242 4242 4242 | Any | Any future |
| Decline | 4000 0000 0000 9995 | Any | Any future |
| Requires Auth | 4000 0025 0000 3155 | Any | Any future |
| Insufficient Funds | 4000 0000 0000 9995 | Any | Any future |

## Step 8: Monitor and Maintain

### Regular Checks

1. **Webhook Health**:
   - Check [Webhook Logs](https://dashboard.stripe.com/test/webhooks/events)
   - Monitor for failed deliveries
   - Review response times

2. **Payment Failures**:
   - Monitor failed payments in dashboard
   - Set up email alerts for failures
   - Configure retry logic

3. **API Version**:
   - Check current API version in code
   - Review [API Changelog](https://stripe.com/docs/upgrades)
   - Update as needed

### Debugging Tools

```bash
# View webhook events
stripe events list

# Inspect specific event
stripe events retrieve evt_xxx

# Check customer details
stripe customers retrieve cus_xxx

# View subscription
stripe subscriptions retrieve sub_xxx
```

## Troubleshooting

### Common Issues

#### Webhook Signature Verification Fails
- Ensure you're using raw request body (not parsed JSON)
- Verify webhook secret matches environment variable
- Check for trailing whitespace in secret

#### Subscription Not Created
- Verify price IDs match Stripe Dashboard
- Check customer has valid payment method
- Review webhook logs for errors

#### Rate Limiting Issues
- Ensure Upstash Redis is configured
- Check rate limit configuration in `lib/rate-limit.ts`
- Monitor rate limit headers in responses

#### Environment Variable Issues
- Run validation: `pnpm tsx lib/env-validation.ts`
- Check for typos in variable names
- Ensure all required variables are set

## Security Best Practices

1. **Never commit secrets**:
   - Use `.env.local` for local development
   - Use environment variables in production
   - Add `.env*` to `.gitignore`

2. **Rotate keys regularly**:
   - Rotate webhook secrets quarterly
   - Update API keys if compromised
   - Use restricted keys when possible

3. **Monitor for anomalies**:
   - Set up Stripe Radar rules
   - Monitor unusual payment patterns
   - Review audit logs regularly

4. **Test in Test Mode**:
   - Always use test keys for development
   - Never use live keys in development
   - Thoroughly test before going live

## Going Live Checklist

- [ ] Stripe account activated and verified
- [ ] Live API keys configured in production
- [ ] Production webhook endpoint configured
- [ ] Products and prices created in live mode
- [ ] Customer portal configured
- [ ] Email notifications configured
- [ ] Error monitoring set up
- [ ] PCI compliance documented
- [ ] Terms of Service updated
- [ ] Privacy Policy updated

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Security Guide](https://stripe.com/docs/security)
- [PCI Compliance Guide](./pci-compliance.md)

## Support

For Stripe-specific issues:
- [Stripe Support](https://support.stripe.com)
- [Stripe Status](https://status.stripe.com)

For application issues:
- Check application logs
- Review webhook event logs
- Contact development team

---

*Last updated: January 2025*