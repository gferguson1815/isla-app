# Error Handling Strategy

## Error Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as API
    participant DB as Database
    participant SENTRY as Sentry

    U->>FE: Action
    FE->>API: Request
    API->>DB: Query

    alt Database Error
        DB--xAPI: Error
        API->>SENTRY: Log error (Dev/Prod only)
        API-->>FE: Formatted error
        FE-->>U: User-friendly message
    else Success
        DB-->>API: Data
        API-->>FE: Response
        FE-->>U: Update UI
    end
```

## Error Response Format

```typescript
interface ApiError {
  error: {
    code: string; // Machine-readable error code
    message: string; // User-friendly message
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
    environment: "local" | "development" | "production";
  };
}
```
