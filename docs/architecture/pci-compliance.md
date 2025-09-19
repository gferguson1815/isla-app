# PCI Compliance Documentation

## Overview

This document outlines our approach to PCI DSS (Payment Card Industry Data Security Standard) compliance for the Isla link shortener application's billing system. Our implementation achieves PCI compliance through Stripe's tokenization approach, ensuring that no sensitive cardholder data ever touches our servers.

## Compliance Strategy

### SAQ-A Eligibility

Our implementation qualifies for **SAQ-A (Self-Assessment Questionnaire A)**, the simplest form of PCI compliance, because:

1. **No Direct Card Data Handling**: We never collect, process, store, or transmit cardholder data on our systems
2. **Stripe Tokenization**: All payment information is handled directly by Stripe's PCI-compliant infrastructure
3. **Redirect/Iframe Integration**: Payment forms are served by Stripe (Checkout/Elements), not our servers
4. **Token-Only Storage**: We only store Stripe-generated tokens (customer IDs, payment method IDs) which are non-sensitive references

## Implementation Details

### 1. Payment Collection

#### Stripe Checkout (Primary Method)
```typescript
// app/server/routers/billing.ts
const session = await StripeService.createCheckoutSession({
  customerId,
  priceId: plan.priceId,
  successUrl: input.successUrl,
  cancelUrl: input.cancelUrl,
  workspaceId: workspace.id,
});
```

- Customers are redirected to Stripe-hosted payment pages
- Card details are entered directly on Stripe's PCI-compliant servers
- We receive only a session ID and success/failure callbacks

#### Stripe Elements (Future Implementation)
When implementing embedded payment forms:
- Use Stripe Elements JavaScript library
- Card inputs are iframe components served by Stripe
- Data flows directly from customer to Stripe, bypassing our servers
- We receive only tokenized payment method IDs

### 2. Data Storage

#### What We Store
```prisma
// prisma/schema.prisma
model payment_methods {
  id                       String  @id
  workspace_id            String
  stripe_payment_method_id String  // Token reference only
  type                    String
  card_brand              String? // e.g., "visa", "mastercard"
  card_last4              String? // Last 4 digits only
  card_exp_month          Int?
  card_exp_year           Int?
  is_default              Boolean
}
```

#### What We DON'T Store
- ❌ Full card numbers (PAN)
- ❌ CVV/CVC codes
- ❌ Card PIN numbers
- ❌ Magnetic stripe data
- ❌ Any sensitive authentication data

### 3. Webhook Security

```typescript
// app/api/webhooks/stripe/route.ts
// Verify webhook signature to ensure requests come from Stripe
event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

- All webhook events are cryptographically signed by Stripe
- Signature verification prevents data tampering
- Rate limiting prevents abuse
- Idempotency handling prevents duplicate processing

### 4. Environment Security

```typescript
// lib/env-validation.ts
const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1).startsWith('sk_'),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1).startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).startsWith('whsec_'),
});
```

- Stripe keys are validated at startup
- Secret keys are never exposed to client-side code
- Environment variables are properly segregated by environment (test/production)

## Security Measures

### 1. Network Security
- **HTTPS Only**: All API endpoints require TLS encryption
- **Webhook Endpoints**: Protected by signature verification and rate limiting
- **API Authentication**: All billing operations require authenticated sessions

### 2. Access Control
```typescript
// app/server/routers/billing.ts
export const billingRouter = router({
  getCurrentPlan: protectedProcedure // Requires authentication
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      // Verify user has access to workspace
    }),
});
```

### 3. Audit Logging
```typescript
// Webhook events are logged for audit trail
await prisma.audit_logs.create({
  data: {
    workspace_id: workspaceId,
    action: `stripe_webhook_${event.type}`,
    entity_type: 'webhook',
    entity_id: event.id,
    metadata: {
      stripe_event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
    },
  },
});
```

### 4. Data Retention
- Payment method tokens are deleted when customers remove them
- Subscription data is retained for accounting purposes
- Invoice records are kept per legal requirements
- No sensitive card data is ever stored

## Compliance Checklist

### SAQ-A Requirements Met

✅ **Requirement 2**: Default passwords changed (N/A - no card data systems)
✅ **Requirement 6.5**: Secure coding practices followed
✅ **Requirement 8**: User access controls implemented
✅ **Requirement 9**: Physical access restrictions (cloud infrastructure)
✅ **Requirement 12.8**: Service provider (Stripe) is PCI compliant

### Stripe Integration Requirements

✅ Use HTTPS for all pages with Stripe Elements
✅ Use Stripe's official libraries (stripe-node)
✅ Keep Stripe libraries up to date
✅ Validate webhook signatures
✅ Use separate keys for test and production

## Testing and Validation

### Test Mode
```typescript
// Use Stripe test mode for development
const stripe = new Stripe(
  process.env.NODE_ENV === 'production' 
    ? process.env.STRIPE_SECRET_KEY 
    : process.env.STRIPE_TEST_SECRET_KEY,
  { apiVersion: '2023-10-16' }
);
```

### Test Cards
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 9995
- Requires authentication: 4000 0025 0000 3155

## Incident Response

### Payment Data Breach Response
1. **Immediate Actions**:
   - Revoke compromised Stripe API keys
   - Rotate webhook signing secrets
   - Review audit logs for unauthorized access

2. **Notification**:
   - Contact Stripe support immediately
   - Notify affected customers per regulations
   - Document incident for compliance records

3. **Remediation**:
   - Conduct security audit
   - Implement additional controls as needed
   - Update security procedures

## Monitoring and Maintenance

### Regular Tasks
- **Monthly**: Review failed payment logs
- **Quarterly**: Audit user access permissions
- **Annually**: Complete SAQ-A self-assessment
- **Ongoing**: Monitor Stripe security bulletins

### Key Metrics
- Webhook signature verification failures
- Rate limiting triggers
- Payment failure rates
- Unauthorized access attempts

## Contact Information

### Stripe Support
- Dashboard: https://dashboard.stripe.com
- Support: https://support.stripe.com
- Security: security@stripe.com

### Internal Contacts
- Security Team: [Configure in production]
- Compliance Officer: [Configure in production]
- Engineering Lead: [Configure in production]

## References

- [PCI DSS v4.0 Requirements](https://www.pcisecuritystandards.org/)
- [Stripe PCI Compliance Guide](https://stripe.com/docs/security/guide)
- [SAQ-A Documentation](https://www.pcisecuritystandards.org/document_library/)
- [Stripe Security Best Practices](https://stripe.com/docs/security)

## Revision History

| Version | Date       | Changes                    | Author |
|---------|------------|----------------------------|--------|
| 1.0     | 2025-01-19 | Initial documentation      | System |

---

*This document should be reviewed annually and updated whenever significant changes are made to the payment processing infrastructure.*