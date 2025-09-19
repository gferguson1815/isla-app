# Infrastructure Gap Recommendations

## Gap 1: Mock Services and Test Data Strategy

### Recommendation: Add Mock Service Infrastructure

Add the following to **Epic 1, Story 1.1** acceptance criteria:

```markdown
9. Test fixtures and mock data setup:
   - Create `tests/fixtures/` directory with sample data
   - Install MSW (Mock Service Worker) for API mocking
   - Configure mock Supabase client for unit tests
   - Set up factory functions for test data generation
```

### Implementation Details:

**Mock Service Setup (packages/testing-utils):**

```typescript
// packages/testing-utils/src/mocks/supabase.ts
export const createMockSupabaseClient = () => ({
  auth: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
});

// packages/testing-utils/src/factories/index.ts
export const factories = {
  user: () => ({
    id: faker.datatype.uuid(),
    email: faker.internet.email(),
    created_at: faker.date.recent(),
  }),
  link: () => ({
    id: faker.datatype.uuid(),
    slug: faker.random.alphaNumeric(7),
    destination_url: faker.internet.url(),
    clicks: faker.datatype.number({ min: 0, max: 1000 }),
  }),
};
```

## Gap 2: Middleware Utilities Definition

### Recommendation: Define Core Middleware in Epic 1

Add the following to **Epic 1, Story 1.3** (Authentication Flow):

```markdown
8. Core middleware utilities implemented:
   - Authentication middleware for protected routes
   - Rate limiting middleware (100 req/min per IP)
   - Request logging middleware with correlation IDs
   - Error handling middleware with proper status codes
   - CORS configuration for API routes
```

### Implementation Details:

**Middleware Architecture (apps/web/src/middleware):**

```typescript
// apps/web/src/middleware/auth.ts
export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: User) => Promise<Response>
) {
  const session = await getServerSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handler(req, session.user);
}

// apps/web/src/middleware/rateLimit.ts
export async function withRateLimit(req: NextRequest, handler: () => Promise<Response>) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const isAllowed = await rateLimiter.check(ip, 100); // 100 req/min

  if (!isAllowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return handler();
}

// apps/web/src/middleware/index.ts
export { withAuth } from "./auth";
export { withRateLimit } from "./rateLimit";
export { withLogging } from "./logging";
export { withErrorHandling } from "./errorHandling";
```

## Integration with CI/CD

Add to **GitHub Actions workflow** for testing:

```yaml
# Additional step in .github/workflows/ci.yaml
- name: Setup Mock Services
  run: |
    pnpm --filter @isla/testing-utils build
    pnpm test:mocks:setup

- name: Run Tests with Mocks
  env:
    USE_MOCK_SERVICES: true
  run: |
    pnpm test:unit
    pnpm test:integration
```

## Benefits of These Additions:

1. **Mock Services:**
   - Faster test execution (no external dependencies)
   - Predictable test data
   - Offline development capability
   - Reduced API usage costs during testing

2. **Middleware Utilities:**
   - Security from day one (auth, rate limiting)
   - Better observability (logging, correlation IDs)
   - Consistent error handling
   - Easier debugging with request tracing

## Impact on Timeline:

- Estimated additional effort: 4-6 hours
- Can be implemented in parallel with other Story 1.1 tasks
- No impact on critical path as it enhances existing stories

## Verification Checklist:

- [ ] Mock services can simulate all Supabase operations
- [ ] Test data factories cover all entity types
- [ ] Middleware properly chains in API routes
- [ ] Rate limiting prevents abuse
- [ ] Error responses follow consistent format
- [ ] All middleware has unit tests
