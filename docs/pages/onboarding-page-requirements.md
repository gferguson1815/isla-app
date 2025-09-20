# Onboarding Page Requirements

## Page Overview
**URL**: `/onboarding/workspace`
**Purpose**: Guide new users through workspace creation (Step 2 of multi-step onboarding)
**When Shown**: After welcome page (/onboarding/welcome), for users with no workspaces
**Approach**: Multi-step onboarding with each step as a separate story

---

## 📝 Requirements To Be Gathered

### Step 1: Visual Design Requirements
✅ **CONFIRMED** (Based on Dub.co pattern):

1. **Overall Layout**
   - [x] Full-screen design with gradient background (Aurora background from welcome page)
   - [x] Centered white card with form
   - [x] Consistent with welcome page template

2. **Branding Elements**
   - [x] Show Isla logo at top of card
   - [x] Maintain aurora gradient background
   - [x] "Create your workspace" heading
   - [x] Subheading: "Set up a shared space to manage your links with your team. Learn more."

3. **Form Style**
   - [x] Input fields: Rounded corners, gray border
   - [x] Button: Black background, white text, rounded, full width
   - [x] Error messages: Below field inline
   - [x] Loading states: Button state change with spinner

---

### Step 2: Workspace Creation Fields
✅ **CONFIRMED**:

**Required Fields:**
- [x] Workspace Name
  - Min length: 1
  - Max length: 50
  - Allow special characters? Yes
  - Example placeholder: "Acme, Inc."

- [x] Workspace URL/Slug
  - Auto-generate from name? Yes
  - Editable? Yes
  - Format: `app.isla.so/[slug]`
  - Allowed characters: lowercase letters (a-z), numbers (0-9), hyphens (-) only
  - Auto-transformation: Convert to lowercase, replace spaces with hyphens, remove special characters
  - Helper text: "You can change this later in your workspace settings."

- [x] Workspace Logo
  - Upload image button
  - Recommended size: 160x160px
  - Preview after upload
  - Required for this step

**Optional Fields:**
- Not included in this step

---

### Step 3: Validation Rules
✅ **CONFIRMED**:

1. **Workspace Name**
   - [x] Required
   - [x] Min 1 character
   - [x] Max 50 characters
   - [x] Not necessarily unique (multiple workspaces can have same display name)

2. **Workspace Slug**
   - [x] Must be globally unique
   - [x] Min 3 characters
   - [x] Max 30 characters
   - [x] Reserved words: [admin, api, app, www, support, help, docs, blog, status]
   - [x] Check availability in real-time? Yes
   - [x] Auto-generate from name (lowercase, hyphens for spaces, strip special chars)
   - [x] Allow manual editing but enforce URL-safe characters only

3. **Error Messages**
   - Workspace name required: "Please enter a workspace name"
   - Workspace name too long: "Workspace name must be 50 characters or less"
   - Slug taken: "This workspace URL is already taken"
   - Invalid slug format: "Only lowercase letters, numbers, and hyphens allowed"
   - Slug too short: "Workspace URL must be at least 3 characters"
   - Logo required: "Please upload a workspace logo"

---

### Step 4: User Flow
✅ **CONFIRMED**: Multi-Step Wizard

```
/onboarding/welcome (Story 0.5.1 - DONE)
  └── /onboarding/workspace (Story 0.5.3 - THIS STORY)
      └── [Next steps - separate stories]
```

**This Story Focus:**
- User arrives from welcome page
- Fills in workspace name, slug, and logo
- Creates workspace
- Proceeds to next onboarding step (TBD in future stories)

---

### Step 5: Additional Features
✅ **FOR THIS STEP**:

- [x] **Sample Data**: Not in this step
- [x] **Quick Tour**: Not in this step
- [x] **Import Data**: Not in this step
- [x] **Team Invites**: Not in this step (future story)

All additional features will be handled in subsequent onboarding steps as separate stories.

---

### Step 6: Success & Error States
✅ **CONFIRMED**:

**On Success:**
- [x] Show loading state on button
- [x] Create workspace in database
- [x] Navigate to next onboarding step
- No celebration at this step (save for final step)

**On Error:**
- [x] Inline error below field
- [x] Field border turns red
- [x] Maintain form data for retry
- [x] Focus on first field with error

---

### Step 7: Edge Cases

How to handle:

1. **User already has workspace**
   - Should never see onboarding (handled by redirect)

2. **User deleted all workspaces**
   - [ ] Show modified message: "Welcome back! Create a new workspace"
   - [ ] Show same as new user

3. **User was invited to workspace**
   - [ ] Skip onboarding, join workspace directly
   - [ ] Still require personal workspace creation

4. **Multiple tabs during creation**
   - [ ] Prevent duplicate creation
   - [ ] Handle race condition

5. **Workspace limits reached**
   - Free plan limit: ___ workspaces
   - Show upgrade prompt? Yes/No

---

## 🎨 Visual Examples Needed

Please provide screenshots or links to onboarding flows you like:

1. **Design inspiration**: ___
2. **Form layout example**: ___
3. **Error state example**: ___
4. **Success state example**: ___

---

## 📊 Default Workspace Settings
✅ **CONFIRMED** for workspace creation:

```javascript
{
  plan: 'free',
  limits: {
    max_links: 100,
    max_clicks: 5000,
    max_users: 1,
    max_domains: 1,
  },
  features: {
    custom_domains: false,
    api_access: false,
    analytics: true,
    team_members: false,
  },
  settings: {
    timezone: 'auto', // Detect from browser
    week_starts: 'monday',
    date_format: 'MM/DD/YYYY',
  }
}
```

---

## ✅ Checklist for Requirements Gathering

**COMPLETED** for Story 0.5.3:

- [x] Visual design: Dub.co style with Aurora background
- [x] Multi-step wizard confirmed
- [x] Required fields: name, slug, logo
- [x] Validation rules defined
- [x] Real-time slug checking: Yes
- [x] Sample data: Not in this step
- [x] Tour/tutorial: Not in this step
- [x] Default workspace limits defined
- [x] Success/error states defined
- [x] Edge cases handled below

---

## 🗄️ Storage Requirements

### Supabase Storage Configuration
✅ **CONFIRMED** - Using Supabase Storage for all file uploads:

**Bucket Structure:**
```
workspace-logos/
  └── {workspace_id}/
      └── logo.{ext}  (e.g., logo.png, logo.jpg)
```

**Storage Settings:**
- Bucket name: `workspace-logos`
- Public bucket: Yes (logos need to be publicly accessible)
- Max file size: 5MB
- Allowed MIME types: `image/png`, `image/jpeg`, `image/svg+xml`, `image/webp`
- File naming: Use workspace ID to avoid conflicts
- CDN URL format: `{SUPABASE_URL}/storage/v1/object/public/workspace-logos/{workspace_id}/logo.{ext}`

**Upload Process:**
1. Validate file on client (type, size)
2. Generate unique filename using workspace ID
3. Upload to Supabase Storage
4. Get public URL
5. Save URL to workspace record in database

**Security Considerations:**
- Validate file type on both client and server
- Check file size limits
- Scan for malicious content if possible
- Use RLS policies to control who can upload/delete

## 📝 Notes Section
- Logo upload is required during workspace creation
- Consider adding image optimization/resizing in future
- May want to add support for animated logos (GIF) later
- Storage costs are minimal for logos (small files, one per workspace)