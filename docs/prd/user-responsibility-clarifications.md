# User Responsibility Clarifications

## Purpose
This document clarifies the division of responsibilities between users (human stakeholders) and developer agents (AI/automated systems) to ensure clear ownership and prevent blocking issues during development.

## Responsibility Matrix

### User/Company Responsibilities (Human-Only Tasks)

These tasks MUST be completed by human users as they require legal authority, financial decisions, or access to external systems:

| Task | Owner | Epic/Story | When Required | Estimated Time |
|------|-------|------------|---------------|----------------|
| **Google Account Creation** | User/Company | Epic 1, Story 1.3 | Before OAuth setup | 5 minutes |
| **Google OAuth Consent Screen** | User/Company | Epic 1, Story 1.3 | Before OAuth testing | 30 minutes |
| **Supabase Account Creation** | User/Company | Epic 1, Story 1.2 | Day 1 | 10 minutes |
| **Supabase Project Creation** | User/Company | Epic 1, Story 1.2 | Day 1 | 5 minutes |
| **Chrome Developer Account** | User/Company | Epic 4, Story 4.7 | Before extension publish | 15 minutes |
| **Chrome Developer Fee ($5)** | User/Company | Epic 4, Story 4.7 | Before extension publish | Immediate |
| **Domain Purchase (isla.link)** | User/Company | Pre-development | Before go-live | 10 minutes |
| **DNS Configuration** | User/Company | Pre-development | Before go-live | 30 minutes |
| **Vercel Account Creation** | User/Company | Epic 1, Story 1.1 | Day 1 | 10 minutes |
| **GitHub Account Creation** | User/Company | Epic 1, Story 1.1 | Day 1 | 10 minutes |
| **Privacy Policy Approval** | User/Legal | Epic 4, Story 4.7 | Before Chrome Store | 1-2 days |
| **Terms of Service Approval** | User/Legal | Epic 4, Story 4.7 | Before Chrome Store | 1-2 days |
| **Payment Method Setup** | User/Company | Various | For paid services | 10 minutes |
| **Business Verification** | User/Company | If required | For OAuth/payments | 1-3 days |

### Developer Agent Responsibilities (AI/Automated Tasks)

These tasks will be handled entirely by the developer agent:

| Task Category | Examples | Notes |
|---------------|----------|-------|
| **Code Implementation** | All programming tasks | 100% automated |
| **Configuration Files** | env files, configs | Will request values from user |
| **Database Setup** | Schema, migrations | After Supabase project exists |
| **API Integration** | OAuth flow, webhooks | After accounts created |
| **Testing** | Unit, integration, E2E | Fully automated |
| **Documentation** | Code docs, README | Auto-generated |
| **Build & Deploy** | CI/CD pipelines | After accounts linked |
| **Performance Optimization** | Code splitting, caching | Automated |
| **Security Implementation** | RLS, encryption | Automated |

### Shared Responsibilities

These tasks require collaboration between user and developer agent:

| Task | User Role | Developer Role |
|------|-----------|----------------|
| **API Key Management** | Provide keys securely | Implement secure storage |
| **Feature Testing** | UAT and feedback | Fix issues |
| **Deployment Approval** | Approve production deploy | Execute deployment |
| **Monitoring Setup** | Create monitoring accounts | Implement tracking |
| **Cost Management** | Set budgets | Implement limits |

## Critical Day 1 User Tasks

**Before development can begin, users MUST complete:**

1. ✅ **Create GitHub account** (or provide existing)
2. ✅ **Create Vercel account** (or provide existing)
3. ✅ **Create Supabase account and project**
4. ✅ **Provide project name preference**
5. ✅ **Confirm domain availability** (isla.link or alternative)

## Story Updates for Clarity

### Epic 1, Story 1.2: Supabase Setup
**ADD to Acceptance Criteria:**
```markdown
0. PREREQUISITE (User Responsibility):
   - User has created Supabase account at supabase.com
   - User has created new Supabase project
   - User provides project URL and anon key to developer
```

### Epic 1, Story 1.3: Authentication Flow
**ADD to Acceptance Criteria:**
```markdown
0. PREREQUISITE (User Responsibility):
   - User has created Google Cloud Console account
   - User has created new project in Google Cloud
   - User has configured OAuth consent screen
   - User provides OAuth client ID and secret
```

### Epic 4, NEW Story 4.7: Chrome Web Store Submission
**UPDATE to clarify ownership:**
```markdown
**User Responsibilities (Must be completed by human):**
1. Create Chrome Developer account ($5 fee)
2. Verify developer identity via phone/email
3. Accept Chrome Web Store developer agreement
4. Review and approve privacy policy text
5. Review and approve terms of service text
6. Submit final extension for review

**Developer Agent Responsibilities (Automated):**
1. Generate all required icon assets
2. Create screenshots and promotional images
3. Write store listing description
4. Build and package extension
5. Generate privacy policy template
6. Generate terms of service template
7. Prepare all submission materials
```

## Communication Protocol

### When User Action is Required

The developer agent will:
1. **HALT** execution at blocking points
2. **NOTIFY** user with clear instructions
3. **PROVIDE** step-by-step guidance
4. **WAIT** for confirmation before proceeding
5. **VERIFY** completion before continuing

Example notification:
```
🔔 USER ACTION REQUIRED

To continue with OAuth setup, please:
1. Go to https://console.cloud.google.com
2. Create a new project named "isla-link"
3. Enable Google Sign-In API
4. Create OAuth 2.0 credentials
5. Add http://localhost:3000 to authorized origins
6. Provide the Client ID: ________________
7. Provide the Client Secret: ________________

Type 'done' when completed.
```

## Blocking Points Timeline

| Day | Blocking Task | Impact if Delayed |
|-----|---------------|-------------------|
| Day 1 | Supabase account | Cannot start database |
| Day 1 | GitHub account | Cannot version control |
| Day 1 | Vercel account | Cannot deploy |
| Day 3-5 | Google OAuth | Auth limited to magic links |
| Day 10-15 | Chrome Developer | Cannot publish extension |
| Pre-launch | Domain + DNS | Cannot go live |

## Cost Responsibilities

### One-Time Costs (User Pays)
- Chrome Developer Account: $5
- Domain Registration: ~$30/year
- Business Verification: $0-100 (if required)

### Recurring Costs (User Pays)
- Supabase Pro: $25/month
- Vercel Pro: $20/month
- Domain Renewal: $30/year

### Developer Agent Optimizations
- Will implement cost monitoring
- Will set up usage alerts
- Will optimize for free tiers
- Will implement rate limiting

## Legal/Compliance Responsibilities

### User/Company MUST:
- Review and approve all legal documents
- Ensure GDPR compliance for their jurisdiction
- Provide company information for terms
- Handle any regulatory requirements
- Manage user data requests

### Developer Agent WILL:
- Generate template legal documents
- Implement GDPR technical requirements
- Add cookie consent mechanisms
- Create data export functionality
- Implement data deletion features

## Success Criteria

Clear responsibility assignment is successful when:
- [ ] No development blocked waiting for user action
- [ ] All user tasks have clear instructions
- [ ] Cost responsibilities are explicit
- [ ] Legal responsibilities are documented
- [ ] Timeline shows all blocking dependencies
- [ ] User knows exactly what they must do and when

## Quick Reference Card

### "What Do I Need To Do?" - User Checklist

**Today (Day 1):**
- [ ] Create Supabase account + project
- [ ] Create GitHub account
- [ ] Create Vercel account
- [ ] Share project preferences (name, domain)

**This Week (Days 2-7):**
- [ ] Set up Google OAuth (optional but recommended)
- [ ] Purchase domain (if going live soon)

**Before Extension Launch (Days 10-15):**
- [ ] Create Chrome Developer account
- [ ] Pay $5 developer fee
- [ ] Approve privacy policy
- [ ] Approve terms of service

**Before Go-Live:**
- [ ] Configure DNS
- [ ] Set up payment methods for services
- [ ] Review and approve production deployment

---

This document ensures zero ambiguity about who does what, preventing any "I thought you were doing that" moments during development.