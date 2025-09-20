# Product Requirements Document (PRD) - Isla

## Overview
Isla is a modern link shortening and analytics platform with workspace management and partner program capabilities.

## Development Approach
We use **Page-Based Development** where each page is fully specified before implementation.

## Requirements Structure

### 📋 Page Requirements
Each page has detailed requirements documented in:
- **Location**: `/docs/pages/[page-name]-requirements.md`
- **Template**: `/docs/pages/TEMPLATE-requirements.md`
- **Process**: Requirements MUST be gathered and validated BEFORE any development

### Current Page Requirements Status:
- ✅ **Links Page**: `/docs/pages/links-page-requirements.md` - VALIDATED
- ✅ **Links Display**: `/docs/pages/links-display-requirements.md` - VALIDATED
- ✅ **Links Edit**: `/docs/pages/links-edit-and-selection-requirements.md` - VALIDATED
- 📝 **Onboarding**: `/docs/pages/onboarding-page-requirements.md` - NEEDS INPUT
- ⏳ **Analytics**: Not created yet
- ⏳ **Domains**: Not created yet
- ⏳ **Events**: Not created yet
- ⏳ **Customers**: Not created yet

## Epic Structure

### Epic 0: Foundation ✅
- **Status**: COMPLETE
- **Documentation**: `/docs/stories/epic-0-foundation.md`

### Epic 0.5: User Onboarding
- **Status**: IN PROGRESS
- **Requirements**: `/docs/pages/onboarding-page-requirements.md`
- **Stories**: `/docs/stories/epic-0.5-onboarding.md`
- **Priority**: P0 - Blocks all user access

### Epic 1: Links Management Page
- **Status**: READY TO BUILD
- **Requirements**: `/docs/pages/links-page-requirements.md`
- **Stories**: `/docs/stories/epic-1-links-page.md`
- **Priority**: P0 - Core functionality

### Epic 2: Analytics Page
- **Status**: REQUIREMENTS NEEDED
- **Requirements**: To be created at `/docs/pages/analytics-page-requirements.md`
- **Priority**: P0

### Epic 3: Domains Page
- **Status**: REQUIREMENTS NEEDED
- **Requirements**: To be created at `/docs/pages/domains-page-requirements.md`
- **Priority**: P0

### Epic 4: Events & Customers Pages
- **Status**: REQUIREMENTS NEEDED
- **Requirements**: To be created
- **Priority**: P1

## Functional Requirements

### Authentication & Authorization
- User signup/login with email and OAuth
- Session management
- Role-based access control (owner, admin, member)

### Workspace Management
- Multiple workspaces per user
- Workspace creation and configuration
- Team member invitations
- Workspace switching

### Link Management
- Create short links with custom slugs
- QR code generation
- Link expiration settings
- Password protection
- Click limits
- UTM parameter builder
- Bulk operations

### Analytics
- Real-time click tracking
- Geographic data
- Device and browser analytics
- Time-based analytics
- Referrer tracking

### Domain Management
- Custom domain support
- Domain verification
- SSL certificate management

## Non-Functional Requirements

### Performance
- Page load < 2 seconds
- API response < 500ms
- Support 10,000 concurrent users

### Security
- HTTPS everywhere
- Data encryption at rest
- Rate limiting
- GDPR compliance

### Usability
- Mobile responsive
- Keyboard shortcuts
- Accessibility (WCAG 2.1 AA)

### Scalability
- Horizontal scaling capability
- Database sharding ready
- CDN integration

## Development Process

### Requirements Gathering During Story Creation
1. SM agent gathers requirements DURING story drafting
2. Requirements captured interactively from Product Owner
3. Requirements document created as part of the process
4. Story created based on gathered requirements

### Story Creation Flow
When creating stories with BMAD agents:
1. **If requirements don't exist**: SM gathers them during draft
2. **If requirements exist**: SM references the document
3. Include acceptance criteria from requirements
4. Add technical context from architecture

### The Reality
- Not all pages have requirements upfront
- Requirements gathered when we decide to build that page
- SM agent asks questions and documents answers
- Creates both requirements doc AND story in one flow

### Quality Gates
- Requirements validated
- Story approved
- Development complete
- Tests passing
- QA review passed
- User acceptance

## References

### Key Documents
- **Development Plan**: `/docs/prd/page-based-development-plan.md`
- **Requirements Tracking**: `/docs/prd/requirements-tracking.md`
- **Architecture**: `/docs/architecture/architecture.md`
- **Process**: `/docs/prd/development-process-and-roles.md`

### Requirements Documents
All page requirements are in `/docs/pages/` directory:
- Use TEMPLATE-requirements.md for new pages
- Each page must have validated requirements before development
- Requirements include visual design, interactions, validation, edge cases

## Notes for BMAD Agents

When using BMAD agents (`/sm`, `/dev`, `/qa`):
- **SM**: Reference requirements from `/docs/pages/[page]-requirements.md`
- **SM**: Use epic files from `/docs/stories/epic-*.md`
- **Dev**: Follow requirements exactly as specified
- **QA**: Validate against requirements document

---

*This PRD serves as the bridge between our page-based development approach and the BMAD process.*