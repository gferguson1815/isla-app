# Isla Public API Documentation

## Base URL

```
https://api.isla.link/v1
```

## Authentication

All API requests require authentication using an API key in the header:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.isla.link/v1/links
```

### Getting Your API Key

1. Log in to your Isla dashboard
2. Navigate to Settings → API Keys
3. Click "Generate New Key"
4. Copy and securely store your key (shown only once)

## Rate Limits

| Plan    | Rate Limit           | Burst        |
| ------- | -------------------- | ------------ |
| Free    | 60 requests/hour     | 10/minute    |
| Starter | 1,000 requests/hour  | 100/minute   |
| Growth  | 10,000 requests/hour | 1,000/minute |

Rate limit headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Endpoints

### Links

#### Create Link

```http
POST /v1/links
```

**Request Body:**

```json
{
  "destination_url": "https://example.com/very/long/url",
  "slug": "custom-slug", // optional
  "title": "My Link", // optional
  "tags": ["marketing", "campaign"], // optional
  "folder_id": "folder_123", // optional
  "utm_source": "newsletter", // optional
  "utm_medium": "email", // optional
  "utm_campaign": "summer2024" // optional
}
```

**Response:**

```json
{
  "id": "link_abc123",
  "short_url": "https://isla.link/custom-slug",
  "destination_url": "https://example.com/very/long/url",
  "slug": "custom-slug",
  "title": "My Link",
  "tags": ["marketing", "campaign"],
  "clicks": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "qr_code": "https://api.isla.link/v1/links/link_abc123/qr"
}
```

#### Get Link

```http
GET /v1/links/{id}
```

**Response:**

```json
{
  "id": "link_abc123",
  "short_url": "https://isla.link/custom-slug",
  "destination_url": "https://example.com/very/long/url",
  "slug": "custom-slug",
  "title": "My Link",
  "tags": ["marketing", "campaign"],
  "clicks": 1523,
  "unique_clicks": 892,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "last_clicked_at": "2024-01-20T15:45:00Z"
}
```

#### Update Link

```http
PATCH /v1/links/{id}
```

**Request Body:**

```json
{
  "destination_url": "https://new-example.com",
  "title": "Updated Title",
  "tags": ["new", "tags"]
}
```

**Note:** Slug cannot be changed after creation.

#### Delete Link

```http
DELETE /v1/links/{id}
```

**Response:**

```json
{
  "success": true,
  "message": "Link deleted successfully"
}
```

#### List Links

```http
GET /v1/links
```

**Query Parameters:**

- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `search` (string): Search in URL, slug, or title
- `tags` (array): Filter by tags
- `folder_id` (string): Filter by folder
- `sort` (string): Sort by field (created_at, clicks, title)
- `order` (string): Sort order (asc, desc)

**Response:**

```json
{
  "data": [
    {
      "id": "link_abc123",
      "short_url": "https://isla.link/custom-slug",
      "destination_url": "https://example.com",
      "clicks": 1523
      // ... other fields
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

### Analytics

#### Get Link Analytics

```http
GET /v1/links/{id}/analytics
```

**Query Parameters:**

- `start_date` (ISO 8601): Start of date range
- `end_date` (ISO 8601): End of date range
- `interval` (string): hour, day, week, month

**Response:**

```json
{
  "link_id": "link_abc123",
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "totals": {
    "clicks": 5234,
    "unique_visitors": 3421
  },
  "time_series": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "clicks": 145,
      "unique_visitors": 98
    }
  ],
  "geography": {
    "countries": [
      { "code": "US", "name": "United States", "clicks": 3421 },
      { "code": "GB", "name": "United Kingdom", "clicks": 892 }
    ],
    "cities": [
      { "name": "New York", "country": "US", "clicks": 523 },
      { "name": "London", "country": "GB", "clicks": 412 }
    ]
  },
  "devices": {
    "desktop": 3102,
    "mobile": 1876,
    "tablet": 256
  },
  "browsers": {
    "Chrome": 2834,
    "Safari": 1523,
    "Firefox": 623,
    "Edge": 254
  },
  "referrers": [
    { "source": "google.com", "clicks": 1234 },
    { "source": "facebook.com", "clicks": 892 },
    { "source": "direct", "clicks": 523 }
  ]
}
```

#### Get Workspace Analytics

```http
GET /v1/analytics
```

Returns aggregated analytics for all links in the workspace.

### Bulk Operations

#### Bulk Create Links

```http
POST /v1/links/bulk
```

**Request Body:**

```json
{
  "links": [
    {
      "destination_url": "https://example.com/1",
      "slug": "promo1",
      "tags": ["campaign"]
    },
    {
      "destination_url": "https://example.com/2",
      "slug": "promo2",
      "tags": ["campaign"]
    }
  ]
}
```

**Limits:**

- Free: 10 links per request
- Starter: 100 links per request
- Growth: 1,000 links per request

**Response:**

```json
{
  "success": 98,
  "failed": 2,
  "created": [
    { "id": "link_abc123", "short_url": "https://isla.link/promo1" },
    { "id": "link_abc124", "short_url": "https://isla.link/promo2" }
  ],
  "errors": [
    { "index": 3, "error": "Slug already exists" },
    { "index": 7, "error": "Invalid URL" }
  ]
}
```

### QR Codes

#### Generate QR Code

```http
GET /v1/links/{id}/qr
```

**Query Parameters:**

- `size` (integer): 200, 400, 800 (default: 400)
- `format` (string): png, svg (default: png)
- `correction` (string): L, M, H (default: M)
- `color` (string): Hex color (Growth plan only)
- `logo` (boolean): Include logo (Growth plan only)

**Response:** Binary image data

### Folders

#### List Folders

```http
GET /v1/folders
```

#### Create Folder

```http
POST /v1/folders
```

**Request Body:**

```json
{
  "name": "Q4 Campaigns",
  "description": "All Q4 marketing campaigns",
  "parent_id": null // optional, for nested folders
}
```

### Tags

#### List Tags

```http
GET /v1/tags
```

**Response:**

```json
{
  "tags": [
    { "name": "marketing", "count": 45 },
    { "name": "social", "count": 23 },
    { "name": "email", "count": 67 }
  ]
}
```

## Webhooks (Coming Soon)

Configure webhooks to receive real-time notifications:

```json
{
  "event": "link.clicked",
  "data": {
    "link_id": "link_abc123",
    "clicked_at": "2024-01-20T15:45:00Z",
    "ip": "192.168.1.1",
    "country": "US",
    "device": "mobile"
  }
}
```

Available events:

- `link.created`
- `link.updated`
- `link.deleted`
- `link.clicked`
- `threshold.reached`

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "destination_url",
        "message": "Must be a valid URL"
      }
    ]
  }
}
```

### Common Error Codes

| Code               | HTTP Status | Description                |
| ------------------ | ----------- | -------------------------- |
| `UNAUTHORIZED`     | 401         | Invalid or missing API key |
| `FORBIDDEN`        | 403         | Insufficient permissions   |
| `NOT_FOUND`        | 404         | Resource not found         |
| `VALIDATION_ERROR` | 422         | Invalid request data       |
| `RATE_LIMITED`     | 429         | Too many requests          |
| `SERVER_ERROR`     | 500         | Internal server error      |

## SDKs & Libraries

### JavaScript/TypeScript

```bash
npm install @isla/sdk
```

```javascript
import { IslaClient } from "@isla/sdk";

const client = new IslaClient("YOUR_API_KEY");

// Create a link
const link = await client.links.create({
  destination_url: "https://example.com",
  slug: "my-link",
});

// Get analytics
const analytics = await client.analytics.get(link.id, {
  start_date: "2024-01-01",
  end_date: "2024-01-31",
});
```

### Python

```bash
pip install isla-sdk
```

```python
from isla import IslaClient

client = IslaClient('YOUR_API_KEY')

# Create a link
link = client.links.create(
    destination_url='https://example.com',
    slug='my-link'
)

# Get analytics
analytics = client.analytics.get(
    link.id,
    start_date='2024-01-01',
    end_date='2024-01-31'
)
```

### cURL Examples

```bash
# Create a link
curl -X POST https://api.isla.link/v1/links \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "destination_url": "https://example.com",
    "slug": "my-link"
  }'

# Get link analytics
curl https://api.isla.link/v1/links/link_abc123/analytics \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Best Practices

1. **Cache responses** when possible to reduce API calls
2. **Use bulk endpoints** for creating multiple links
3. **Implement exponential backoff** for rate limit errors
4. **Store link IDs** locally for faster lookups
5. **Use webhooks** instead of polling for real-time updates
6. **Paginate large result sets** to improve performance

## Changelog

### v1.0.0 (2024-01-01)

- Initial API release
- Links CRUD operations
- Basic analytics
- QR code generation

### v1.1.0 (Coming Soon)

- Webhook support
- Advanced analytics filters
- Custom domains API
- Batch operations improvements

## Support

- **Documentation**: https://docs.isla.link/api
- **Status Page**: https://status.isla.link
- **Support Email**: api-support@isla.link
- **Community Forum**: https://community.isla.link

---

_Last Updated: [Date]_
