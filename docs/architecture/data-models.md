# Data Models

Core data models shared between frontend and backend, with TypeScript interfaces for type safety across all environments.

## User Model

**Purpose:** Represents authenticated users in the system, managed by Supabase Auth

**Key Attributes:**

- id: UUID - Unique identifier from Supabase Auth
- email: string - User's email address
- name: string? - Optional display name
- avatarUrl: string? - Profile picture URL
- createdAt: DateTime - Account creation timestamp
- updatedAt: DateTime - Last profile update
- isSuspended: boolean - Account suspension status
- suspensionReason: string? - Reason for suspension

**TypeScript Interface:**

```typescript
interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isSuspended: boolean;
  suspensionReason?: string | null;
}
```

**Relationships:**

- Has many WorkspaceMemberships
- Has many Links (through Workspaces)

## Workspace Model

**Purpose:** Multi-tenant container for teams to collaborate on link collections

**Key Attributes:**

- id: UUID - Unique identifier
- name: string - Workspace display name
- slug: string - URL-friendly identifier
- plan: 'free' | 'pro' | 'business' - Subscription tier
- billingCycleStart: DateTime - Subscription start date
- stripeCustomerId: string? - Stripe reference
- stripeSubscriptionId: string? - Active subscription
- createdAt: DateTime - Workspace creation
- limits: JSON - Plan-specific limits (links, users, etc.)
- isSuspended: boolean - Suspension status
- suspensionReason: string? - Suspension reason
- isVerified: boolean - Trusted workspace status
- customLimits: JSON? - Admin overrides

**TypeScript Interface:**

```typescript
interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "business";
  billingCycleStart: Date;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  createdAt: Date;
  limits: {
    maxLinks: number;
    maxUsers: number;
    maxClicks: number;
    customDomains: boolean;
  };
  isSuspended: boolean;
  suspensionReason?: string | null;
  isVerified: boolean;
  customLimits?: Record<string, number> | null;
}
```

**Relationships:**

- Has many WorkspaceMemberships
- Has many Links
- Has many Campaigns
- Has many Folders

## WorkspaceMembership Model

**Purpose:** Junction table managing user access and roles within workspaces

**Key Attributes:**

- id: UUID - Unique identifier
- userId: UUID - Reference to User
- workspaceId: UUID - Reference to Workspace
- role: 'owner' | 'admin' | 'member' - Permission level
- joinedAt: DateTime - Membership start date

**TypeScript Interface:**

```typescript
interface WorkspaceMembership {
  id: string;
  userId: string;
  workspaceId: string;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
  user?: User;
  workspace?: Workspace;
}
```

**Relationships:**

- Belongs to User
- Belongs to Workspace

## Link Model

**Purpose:** Core entity representing shortened URLs with their metadata

**Key Attributes:**

- id: UUID - Unique identifier
- workspaceId: UUID - Owning workspace
- url: string - Destination URL
- slug: string - Short URL identifier
- title: string? - Optional link title
- description: string? - Link description
- folderId: UUID? - Optional folder organization
- tags: string[] - Categorization tags
- utmSource: string? - UTM campaign source
- utmMedium: string? - UTM medium
- utmCampaign: string? - UTM campaign name
- utmTerm: string? - UTM term
- utmContent: string? - UTM content variant
- createdBy: UUID - User who created
- createdAt: DateTime - Creation timestamp
- updatedAt: DateTime - Last modification
- expiresAt: DateTime? - Optional expiration
- clickCount: number - Cached click total

**TypeScript Interface:**

```typescript
interface Link {
  id: string;
  workspaceId: string;
  url: string;
  slug: string;
  title?: string | null;
  description?: string | null;
  folderId?: string | null;
  tags: string[];
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date | null;
  clickCount: number;
  workspace?: Workspace;
  folder?: Folder;
  creator?: User;
}
```

**Relationships:**

- Belongs to Workspace
- Belongs to Folder (optional)
- Has many ClickEvents
- Belongs to Campaign (optional)
- Created by User

## ClickEvent Model

**Purpose:** Captures detailed analytics for each link click

**Key Attributes:**

- id: UUID - Unique identifier
- linkId: UUID - Associated link
- timestamp: DateTime - Click timestamp
- ip: string - Hashed IP for privacy
- country: string? - Geo location country
- city: string? - Geo location city
- device: string - Device type (mobile/desktop/tablet)
- browser: string - Browser name
- os: string - Operating system
- referrer: string? - Referring URL
- userAgent: string - Full user agent string

**TypeScript Interface:**

```typescript
interface ClickEvent {
  id: string;
  linkId: string;
  timestamp: Date;
  ip: string; // Hashed for privacy
  country?: string | null;
  city?: string | null;
  device: "mobile" | "desktop" | "tablet";
  browser: string;
  os: string;
  referrer?: string | null;
  userAgent: string;
  link?: Link;
}
```

**Relationships:**

- Belongs to Link

## Campaign Model

**Purpose:** Groups links for coordinated marketing efforts

**Key Attributes:**

- id: UUID - Unique identifier
- workspaceId: UUID - Owning workspace
- name: string - Campaign name
- description: string? - Campaign details
- startDate: DateTime - Campaign start
- endDate: DateTime? - Campaign end
- createdBy: UUID - Creator
- createdAt: DateTime - Creation timestamp

**TypeScript Interface:**

```typescript
interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date | null;
  createdBy: string;
  createdAt: Date;
  workspace?: Workspace;
  links?: Link[];
  creator?: User;
}
```

**Relationships:**

- Belongs to Workspace
- Has many Links
- Created by User

## Folder Model

**Purpose:** Hierarchical organization structure for links

**Key Attributes:**

- id: UUID - Unique identifier
- workspaceId: UUID - Owning workspace
- name: string - Folder name
- parentId: UUID? - Parent folder for nesting
- color: string? - Visual identification
- order: number - Sort order
- createdAt: DateTime - Creation timestamp

**TypeScript Interface:**

```typescript
interface Folder {
  id: string;
  workspaceId: string;
  name: string;
  parentId?: string | null;
  color?: string | null;
  order: number;
  createdAt: Date;
  workspace?: Workspace;
  parent?: Folder;
  children?: Folder[];
  links?: Link[];
}
```

**Relationships:**

- Belongs to Workspace
- Has many Links
- Self-referential for nesting (max 3 levels)

## Admin Models

### AdminUser Model

**Purpose:** Super administrators with platform-wide access, separate from regular users

**Key Attributes:**

- id: UUID - Unique identifier
- email: string - Admin email address
- name: string - Admin display name
- role: 'super_admin' | 'support' - Admin permission level
- twoFactorEnabled: boolean - 2FA requirement
- lastLoginAt: DateTime? - Last access timestamp
- lastLoginIp: string? - Last login IP for security
- createdAt: DateTime - Admin account creation
- isActive: boolean - Account status

**TypeScript Interface:**

```typescript
interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "support";
  twoFactorEnabled: boolean;
  lastLoginAt?: Date | null;
  lastLoginIp?: string | null;
  createdAt: Date;
  isActive: boolean;
}
```

**Relationships:**

- Has many AdminAuditLogs
- Has many SupportTickets (assigned)

### AdminAuditLog Model

**Purpose:** Tracks all administrative actions for security and compliance

**Key Attributes:**

- id: UUID - Unique identifier
- adminId: UUID - Admin who performed action
- action: string - Action type (e.g., 'user.suspend', 'workspace.delete')
- resourceType: string - Type of resource affected
- resourceId: string - ID of affected resource
- details: JSON - Additional action context
- ipAddress: string - Admin's IP address
- userAgent: string - Browser information
- timestamp: DateTime - Action timestamp

**TypeScript Interface:**

```typescript
interface AdminAuditLog {
  id: string;
  adminId: string;
  action: AdminAction;
  resourceType: "user" | "workspace" | "link" | "config";
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  admin?: AdminUser;
}

type AdminAction =
  | "user.suspend"
  | "user.unsuspend"
  | "user.delete"
  | "user.impersonate"
  | "workspace.suspend"
  | "workspace.delete"
  | "workspace.transfer"
  | "link.delete"
  | "link.review"
  | "config.update"
  | "feature_flag.toggle";
```

**Relationships:**

- Belongs to AdminUser

### PlatformConfig Model

**Purpose:** Dynamic platform configuration without deployments

**Key Attributes:**

- id: UUID - Unique identifier
- key: string - Configuration key
- value: JSON - Configuration value
- category: string - Config category (limits, features, etc.)
- description: string - Human-readable description
- updatedBy: UUID - Last admin to modify
- updatedAt: DateTime - Last update timestamp

**TypeScript Interface:**

```typescript
interface PlatformConfig {
  id: string;
  key: string;
  value: any; // JSON value
  category: "limits" | "features" | "pricing" | "email" | "maintenance";
  description: string;
  updatedBy: string;
  updatedAt: Date;
  updater?: AdminUser;
}

// Example configs:
interface PlatformLimits {
  free: {
    maxLinks: number;
    maxWorkspaces: number;
    maxTeamMembers: number;
    maxClicksPerMonth: number;
  };
  pro: {
    maxLinks: number;
    maxWorkspaces: number;
    maxTeamMembers: number;
    maxClicksPerMonth: number;
  };
}
```

**Relationships:**

- Updated by AdminUser

### FeatureFlag Model

**Purpose:** Control feature rollout and A/B testing

**Key Attributes:**

- id: UUID - Unique identifier
- key: string - Feature flag identifier
- name: string - Human-readable name
- description: string - Feature description
- enabled: boolean - Global on/off
- rolloutPercentage: number - Gradual rollout (0-100)
- targetWorkspaces: string[]? - Specific workspace IDs
- targetPlans: string[]? - Specific plan tiers
- createdBy: UUID - Admin who created
- updatedAt: DateTime - Last modification

**TypeScript Interface:**

```typescript
interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetWorkspaces?: string[] | null;
  targetPlans?: ("free" | "pro" | "business")[] | null;
  createdBy: string;
  updatedAt: Date;
  creator?: AdminUser;
}
```

**Relationships:**

- Created by AdminUser

### UserSuspension Model

**Purpose:** Track and manage user account suspensions

**Key Attributes:**

- id: UUID - Unique identifier
- userId: UUID - Suspended user
- reason: string - Suspension reason
- suspendedBy: UUID - Admin who suspended
- suspendedAt: DateTime - Suspension start
- expiresAt: DateTime? - Auto-unsuspend time
- unsuspendedBy: UUID? - Admin who lifted
- unsuspendedAt: DateTime? - Unsuspension time

**TypeScript Interface:**

```typescript
interface UserSuspension {
  id: string;
  userId: string;
  reason: string;
  suspendedBy: string;
  suspendedAt: Date;
  expiresAt?: Date | null;
  unsuspendedBy?: string | null;
  unsuspendedAt?: Date | null;
  user?: User;
  suspendedByAdmin?: AdminUser;
  unsuspendedByAdmin?: AdminUser;
}
```

**Relationships:**

- Belongs to User
- Suspended by AdminUser
- Unsuspended by AdminUser
