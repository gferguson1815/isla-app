# Epic 0.5: User Onboarding & Workspace Creation

## Epic Overview
**Priority**: P0 - Critical path item, blocks access to all features
**Timeline**: 1-2 days
**Status**: IN PROGRESS

## Problem Statement
New users who sign up need a smooth onboarding experience that:
1. Creates their first workspace
2. Introduces them to key features
3. Sets them up for success
4. Guides them to their first action (creating a link)

## Success Criteria
- [ ] New users can create their first workspace
- [ ] Workspace creation validates slug uniqueness
- [ ] Users are redirected to their workspace after creation
- [ ] Onboarding flow feels smooth and professional
- [ ] Optional: Tutorial or guided tour for first-time users

---

## 📋 Requirements Gathering Needed

### Questions for Product Owner

#### Page Layout & Design
1. **Visual Design**
   - Should it match Isla's branding (blue/indigo gradient)?
   - Full-screen or centered card design?
   - Should we show Isla logo/branding?
   - Any welcome illustrations or icons?

2. **Form Fields for Workspace Creation**
   - Workspace name (required)
   - Workspace slug/URL (auto-generated or manual?)
   - Description field?
   - Industry/use case selection?
   - Team size selection?
   - Timezone selection?

3. **Slug/URL Handling**
   - Auto-generate from workspace name?
   - Allow manual editing?
   - Show real-time availability check?
   - Format: `app.isla.sh/[slug]` or `[slug].isla.sh`?
   - Character restrictions (alphanumeric, hyphens only)?

4. **Validation & Error States**
   - How to show slug already taken?
   - Minimum/maximum length for workspace name?
   - Reserved words to block (admin, api, www, etc.)?
   - Show suggestions for alternative slugs?

5. **Multi-step vs Single Page**
   - All in one page (current implementation)?
   - Or multi-step wizard:
     - Step 1: Welcome & workspace details
     - Step 2: Customization (logo, colors)
     - Step 3: Invite team (skippable)
     - Step 4: Quick tutorial

6. **Additional Options**
   - "Create sample data" checkbox?
   - "Take a quick tour" option?
   - "Import from another service" button?
   - Newsletter/updates opt-in?

7. **Success State**
   - Immediate redirect to workspace?
   - Show success message first?
   - Offer quick tutorial before redirect?
   - Celebration animation?

8. **Edge Cases**
   - User already has workspace (shouldn't see onboarding)
   - User deleted all workspaces (see onboarding again?)
   - User was invited to workspace (skip onboarding?)
   - Multiple browser tabs open during creation?

### Visual References Needed
- Screenshots of similar onboarding flows you like
- Specific design elements to include/avoid
- Brand guidelines (colors, fonts, tone)

### Technical Decisions Needed
1. **Workspace Limits**
   - Max workspaces per user on free plan?
   - Default limits for new workspace (links, clicks, users)?
   - Which plan to assign (free, trial, etc.)?

2. **Post-Creation Setup**
   - Create default folders/tags?
   - Create sample link?
   - Send welcome email?
   - Track in analytics?

---

## 🎯 Once Requirements Are Gathered

After getting requirements, update each story below with specific acceptance criteria based on the answers.

---

## Story 0.5.1: Basic Onboarding Page
**Status**: 🚧 IN PROGRESS
**Estimate**: 2 hours
**Actual**: -

### Description
Create the basic onboarding page where new users land when they don't have a workspace.

### Acceptance Criteria
- [x] Page exists at `/onboarding`
- [x] Clean, welcoming design with Isla branding
- [x] Form to enter workspace name
- [x] Auto-generate workspace slug from name
- [x] Allow editing of slug
- [x] Show current user email
- [x] Create workspace button
- [ ] Loading state while creating
- [ ] Error handling for duplicate slugs
- [ ] Success redirect to workspace

### Implementation Notes
- Basic version created at `/app/onboarding/page.tsx`
- Uses trpc.workspace.create mutation
- Auto-generates slug from workspace name

---

## Story 0.5.2: Workspace Creation Flow
**Status**: ⏳ TODO
**Estimate**: 2 hours

### Description
Handle the complete workspace creation process including validation and error states.

### Acceptance Criteria
- [ ] Validate slug uniqueness in real-time
- [ ] Show availability indicator for slug
- [ ] Handle workspace creation errors gracefully
- [ ] Ensure user becomes workspace owner
- [ ] Set correct default limits (links, clicks, etc.)
- [ ] Create workspace in correct timezone
- [ ] Initialize workspace with sample data (optional)

### Technical Requirements
- Update workspace.create mutation for better validation
- Add slug availability check endpoint
- Handle race conditions for slug creation

---

## Story 0.5.3: Onboarding Progress Steps (Optional)
**Status**: 💭 FUTURE
**Estimate**: 3 hours

### Description
Multi-step onboarding with progress indicator for better user experience.

### Acceptance Criteria
- [ ] Step 1: Welcome & workspace creation
- [ ] Step 2: Workspace customization (logo, colors)
- [ ] Step 3: Invite team members (optional, skippable)
- [ ] Step 4: Create first link (guided)
- [ ] Progress bar showing current step
- [ ] Ability to skip steps
- [ ] Remember progress if user leaves

### UI Components Needed
- Progress stepper component
- Step navigation (back/next)
- Skip button
- Completion celebration

---

## Story 0.5.4: First-Time User Detection
**Status**: ⏳ TODO
**Estimate**: 1 hour

### Description
Properly detect and redirect new users without workspaces to onboarding.

### Acceptance Criteria
- [ ] Check for existing workspaces on login
- [ ] Redirect to /onboarding if no workspaces
- [ ] Skip onboarding for returning users
- [ ] Handle edge case: user deleted all workspaces
- [ ] Support direct invite links (bypass onboarding)

### Implementation Notes
- Update dashboard redirect logic
- Check in auth callback
- Consider middleware approach

---

## Story 0.5.5: Welcome Tutorial (Optional)
**Status**: 💭 FUTURE
**Estimate**: 4 hours

### Description
Interactive tutorial that guides users through creating their first link.

### Acceptance Criteria
- [ ] Tooltip-based guided tour
- [ ] Highlights key UI elements
- [ ] Step-by-step link creation
- [ ] Can be dismissed
- [ ] Can be re-triggered from help menu
- [ ] Tracks completion in user preferences

### Libraries to Consider
- Intro.js
- Shepherd.js
- Custom React component

---

## Story 0.5.6: Sample Data & Templates
**Status**: 💭 FUTURE
**Estimate**: 2 hours

### Description
Provide templates and sample links to help users get started quickly.

### Acceptance Criteria
- [ ] Option to create workspace with sample links
- [ ] Link templates for common use cases
- [ ] UTM template suggestions
- [ ] Industry-specific examples
- [ ] Clear labeling that these are samples

---

## Technical Decisions

### Current Approach
- Removed automatic workspace creation from user.initialize
- Explicit onboarding flow at `/onboarding`
- Simple single-page form initially

### Data Flow
1. User signs up → user.initialize (no workspace)
2. Redirect to /dashboard
3. Dashboard checks for workspace
4. No workspace → redirect to /onboarding
5. User creates workspace
6. Redirect to /{workspace}/links

### Alternative Approaches Considered
1. **Modal-based**: Show workspace creation in modal (rejected - too cramped)
2. **Auto-create**: Create default workspace automatically (rejected - poor UX)
3. **Wizard**: Multi-step wizard (future enhancement)

---

## Dependencies
- Auth system (Epic 0.2) ✅
- Workspace model (Epic 0.3) ✅
- Workspace creation API ✅
- Routing structure ✅

## Blockers
- None currently

## Risks
- Slug collision handling needs to be robust
- First impression is critical - needs polish

---

## Notes for PM

### MVP (Story 0.5.1 & 0.5.2)
- Basic onboarding page ✅
- Workspace creation with validation
- Proper redirects
- **Time**: 4 hours

### Enhanced Experience (Story 0.5.3-0.5.6)
- Multi-step process
- Tutorial
- Templates
- **Time**: Additional 9 hours

### Recommendation
Ship MVP first, then enhance based on user feedback. The basic flow is functional but could benefit from polish before launch.

---

## Test Cases
1. New user signup → redirect to onboarding
2. Create workspace with taken slug → error message
3. Create workspace successfully → redirect to workspace
4. User with workspace → skip onboarding
5. User deletes last workspace → redirect to onboarding