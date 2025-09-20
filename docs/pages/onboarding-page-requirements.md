# Onboarding Page Requirements

## Page Overview
**URL**: `/onboarding`
**Purpose**: Guide new users through workspace creation and initial setup
**When Shown**: First-time users after signup, or users with no workspaces

---

## 📝 Requirements To Be Gathered

### Step 1: Visual Design Requirements
Please provide your preferences or screenshots for:

1. **Overall Layout**
   - [ ] Full-screen design with gradient background
   - [ ] Centered card/modal design
   - [ ] Split-screen with illustration
   - [ ] Minimal clean design

2. **Branding Elements**
   - [ ] Show Isla logo where?
   - [ ] Use brand colors (specify hex codes)
   - [ ] Include tagline/welcome message
   - [ ] Add illustrations or just text

3. **Form Style**
   - [ ] Input field style (rounded, square, underlined)
   - [ ] Button style (primary color, size, rounded?)
   - [ ] Error message placement (below field, tooltip, banner)
   - [ ] Loading states (spinner, progress bar, button state)

---

### Step 2: Workspace Creation Fields

Please specify which fields are needed:

**Required Fields:**
- [ ] Workspace Name
  - Min length: ___
  - Max length: ___
  - Allow special characters? Yes/No
  - Example placeholder: ___

- [ ] Workspace URL/Slug
  - Auto-generate from name? Yes/No
  - Editable? Yes/No
  - Format: `app.isla.sh/____` or `____.isla.sh`
  - Allowed characters: [a-z0-9-] only?

**Optional Fields:**
- [ ] Workspace Description
  - Max length: ___
  - Purpose: ___

- [ ] Industry/Use Case
  - Options: ___
  - Purpose: ___

- [ ] Company Size
  - Options: [Solo, 2-10, 11-50, 51-200, 200+]
  - Purpose: ___

- [ ] Primary Use Case
  - Options: [Marketing, Sales, Support, Personal, Other]
  - Purpose: ___

---

### Step 3: Validation Rules

Please specify validation requirements:

1. **Workspace Name**
   - [ ] Required
   - [ ] Min ___ characters
   - [ ] Max ___ characters
   - [ ] Unique per user? Yes/No

2. **Workspace Slug**
   - [ ] Must be globally unique
   - [ ] Min ___ characters
   - [ ] Max ___ characters
   - [ ] Reserved words: [admin, api, app, www, support, help, ...]
   - [ ] Check availability in real-time? Yes/No
   - [ ] Suggest alternatives if taken? Yes/No

3. **Error Messages**
   - Workspace name required: "___"
   - Workspace name too short: "___"
   - Workspace name too long: "___"
   - Slug taken: "___"
   - Invalid slug format: "___"

---

### Step 4: User Flow

Please specify the flow:

**Single Page (Current)**
```
/onboarding
  ├── Welcome message
  ├── Workspace form
  ├── Create button
  └── Redirect to /{workspace}/links
```

**Multi-Step Wizard (Alternative)**
```
/onboarding
  ├── Step 1: Welcome & Workspace Details
  ├── Step 2: Customize (logo, colors) [optional]
  ├── Step 3: Invite Team [optional, skippable]
  ├── Step 4: Quick Tour [optional, skippable]
  └── Complete → /{workspace}/links
```

Which approach? _______________

---

### Step 5: Additional Features

Should we include:

- [ ] **Sample Data**
  - Create example links? Yes/No
  - How many? ___
  - What kind? ___

- [ ] **Quick Tour**
  - Before entering workspace? Yes/No
  - Tooltips/guided tour? Yes/No
  - Can skip? Yes/No

- [ ] **Import Data**
  - From which services? [Bitly, Rebrandly, Short.io, CSV]
  - On this page or later? ___

- [ ] **Team Invites**
  - Invite during onboarding? Yes/No
  - How many? ___
  - Required or optional? ___

---

### Step 6: Success & Error States

**On Success:**
- [ ] Show success message? Yes/No
  - Message: "___"
  - Duration: ___ seconds
- [ ] Celebration animation? Yes/No
- [ ] Redirect immediately? Yes/No
- [ ] Show "Getting started" tips? Yes/No

**On Error:**
- [ ] Inline error below field
- [ ] Toast notification
- [ ] Error banner at top
- [ ] Shake animation on field

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

When creating a workspace, set these defaults:

```javascript
{
  plan: 'free',        // or 'trial'?
  limits: {
    max_links: ___,    // 50? 100?
    max_clicks: ___,   // 5000? 10000?
    max_users: ___,    // 1? 5?
    max_domains: ___,  // 1? 3?
  },
  features: {
    custom_domains: true/false,
    api_access: true/false,
    analytics: true/false,
    team_members: true/false,
  },
  settings: {
    timezone: 'auto' or specific,
    week_starts: 'monday' or 'sunday',
    date_format: 'MM/DD/YYYY' or 'DD/MM/YYYY',
  }
}
```

---

## ✅ Checklist for Requirements Gathering

Before building, we need answers to:

- [ ] Visual design preference (minimalist, branded, illustrated)
- [ ] Single page vs multi-step wizard
- [ ] Required vs optional fields
- [ ] Validation rules and error messages
- [ ] Real-time slug availability checking
- [ ] Sample data creation
- [ ] Tour/tutorial integration
- [ ] Default workspace limits
- [ ] Success/error state handling
- [ ] Edge case handling

---

## 📝 Notes Section
(Add any additional requirements or clarifications here as we gather them)