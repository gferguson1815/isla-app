# Testing Strategy

## Testing Pyramid

```
          E2E Tests (10%)
         /              \
    Integration Tests (30%)
   /                      \
Unit Tests (60%)  Component Tests
```

## Test Organization

**Frontend Tests:**

```
apps/web/src/
├── components/
│   └── __tests__/       # Component tests
├── hooks/
│   └── __tests__/       # Hook tests
└── lib/
    └── __tests__/       # Utility tests
```

**Backend Tests:**

```
apps/web/src/server/
├── routers/
│   └── __tests__/       # API route tests
├── services/
│   └── __tests__/       # Service tests
└── lib/
    └── __tests__/       # Utility tests
```

**E2E Tests:**

```
tests/e2e/
├── auth.spec.ts         # Authentication flows
├── links.spec.ts        # Link CRUD operations
├── analytics.spec.ts    # Analytics functionality
└── fixtures/           # Test data
```

## Environment-Specific Testing

**Local Testing:**

```bash
pnpm test              # Unit tests only
pnpm test:integration  # Integration tests with local DB
pnpm test:e2e:local   # E2E against localhost
```

**Development Testing:**

```bash
pnpm test:e2e:dev     # E2E against dev.isla.link
pnpm test:api:dev     # API tests against dev environment
```

**Production Testing:**

```bash
pnpm test:smoke       # Critical path tests only
pnpm test:monitoring  # Synthetic monitoring tests
```
