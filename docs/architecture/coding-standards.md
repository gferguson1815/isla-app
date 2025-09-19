# Coding Standards

## Critical Fullstack Rules

- **Type Sharing:** Always define types in packages/shared and import from there
- **API Calls:** Never make direct HTTP calls - use the service layer
- **Environment Variables:** Access only through config objects, never process.env directly
- **Error Handling:** All API routes must use the standard error handler
- **State Updates:** Never mutate state directly - use proper state management patterns
- **Environment Separation:** Never mix environment configs or data

## Naming Conventions

| Element               | Frontend             | Backend              | Example               |
| --------------------- | -------------------- | -------------------- | --------------------- |
| Components            | PascalCase           | -                    | `UserProfile.tsx`     |
| Hooks                 | camelCase with 'use' | -                    | `useAuth.ts`          |
| API Routes            | -                    | kebab-case           | `/api/user-profile`   |
| Database Tables       | -                    | snake_case           | `user_profiles`       |
| Environment Variables | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE | `NEXT_PUBLIC_APP_URL` |
