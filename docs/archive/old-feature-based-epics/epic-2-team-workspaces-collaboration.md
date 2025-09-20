# Epic 2: Team Workspaces & Collaboration

**Expanded Goal**: This epic transforms the platform from individual use to team collaboration. Teams can create shared workspaces, invite members, organize links with folders and tags, and manage permissions. This establishes the foundation for the platform's collaborative differentiation from competitors.

## Story 2.1: Workspace Creation and Management

**As a** team admin,
**I want** to create and configure workspaces for my team,
**so that** we can collaborate on link management in an organized environment.

**Acceptance Criteria:**
1. Workspace creation flow with name, slug, and description
2. Unique workspace URL structure (app.domain.com/w/[workspace-slug])
3. Workspace settings page for editing name, description, and branding
4. User's first workspace created automatically on signup
5. Workspace switcher in navigation for users with multiple workspaces
6. Database properly associates all links with workspace context
7. Workspace deletion (soft delete) with confirmation dialog

## Story 2.2: Team Member Invitations

**As a** workspace admin,
**I want** to invite team members via email,
**so that** my team can collaborate on link management.

**Acceptance Criteria:**
1. Invite form accepts email addresses (individual or comma-separated)
2. Invitation emails sent with magic link to join workspace
3. Pending invitations list with ability to resend or revoke
4. New users can sign up directly from invitation link
5. Existing users can accept invitation and access workspace immediately
6. Team members list shows all active members with role badges
7. Remove member functionality with confirmation

## Story 2.3: Folder Organization System

**As a** user,
**I want** to organize links into folders,
**so that** I can maintain structure as our link collection grows.

**Acceptance Criteria:**
1. Create folders with name and optional description
2. Drag-and-drop links into folders
3. Folder tree navigation in sidebar
4. Bulk move operations for multiple links
5. Nested folders support (up to 3 levels deep)
6. Folder sharing inherits workspace permissions
7. Delete folder with option to preserve or delete contained links

## Story 2.4: Tagging and Filtering

**As a** user,
**I want** to tag and filter links,
**so that** I can quickly find and organize links by categories.

**Acceptance Criteria:**
1. Add multiple tags to links during creation or edit
2. Tag autocomplete suggests existing tags
3. Filter links by single or multiple tags
4. Tag management page to rename or merge tags
5. Quick filter bar with common tags displayed
6. Bulk tag operations for multiple links
7. Search combines with tag filters for precise results

## Story 2.5: Link Search and Bulk Operations

**As a** user,
**I want** to search and perform bulk operations on links,
**so that** I can efficiently manage large collections.

**Acceptance Criteria:**
1. Search by URL, slug, title, or tag
2. Search results update as user types (debounced)
3. Select multiple links with checkboxes
4. Bulk operations: delete, move to folder, add/remove tags
5. Select all/none helpers for current view
6. Confirmation dialog for destructive bulk operations
7. Bulk operations complete within 2 seconds for 100 links

## Story 2.6: Basic Permission System

**As a** workspace admin,
**I want** to control member permissions,
**so that** I can manage who can create, edit, and delete links.

**Acceptance Criteria:**
1. Two roles implemented: Admin and Member
2. Admins can: manage workspace, invite/remove members, all link operations
3. Members can: create links, edit own links, view all links
4. Role assignment during invitation process
5. Role change functionality in team management
6. Permission checks enforced at API level
7. UI elements hidden based on user permissions
