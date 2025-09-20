# Documentation Cleanup Plan

## 🗑️ Files to Archive/Delete

### Old Epic Structure (Feature-Based)
**Location**: `/docs/prd/`
- [ ] epic-1-foundation-core-link-management.md
- [ ] epic-2-team-workspaces-collaboration.md
- [ ] epic-2-updated-monetization.md
- [ ] epic-2.5-ui-ux-convergence.md
- [ ] epic-3-analytics-campaign-attribution.md
- [ ] epic-4-chrome-extension-viral-features.md
- [ ] epic-5-platform-administration.md
- [ ] epic-list.md (old version)
- [ ] epic-list-optimized.md (old version)
- [ ] epic-resequencing-plan.md
- [ ] epic-updates-external-dependencies.md

### Old Planning Documents
**Location**: `/docs/prd/`
- [ ] checklist-results-report.md
- [ ] po-validation-final-report.md
- [ ] mvp-missing-features-additions.md
- [ ] next-steps.md (outdated)
- [ ] index.md (if outdated)

### Duplicate Page Lists
**Location**: `/docs/pages/`
- [ ] complete-page-inventory.md (duplicate of final-page-list.md)
- [ ] links-page-specification.md (superseded by requirements)
- [ ] links-page-story-mapping.md (old approach)

### Already Archived (Good ✅)
**Location**: `/docs/stories/archived-feature-based/`
- All ARCHIVED-FEATURE-*.story.md files are properly archived

---

## ✅ Files to Keep (Current Approach)

### BMAD Integration
- `/docs/prd.md` - Master PRD (newly created)
- `/docs/BMAD-INTEGRATION.md` - How to use BMAD with our approach

### Page-Based Approach
- `/docs/prd/page-based-development-plan.md` - Current master plan
- `/docs/prd/epic-list-page-based.md` - Current epic structure
- `/docs/prd/requirements-tracking.md` - Requirements process
- `/docs/prd/development-process-and-roles.md` - Process documentation

### Page Requirements
**Location**: `/docs/pages/`
- `TEMPLATE-requirements.md` - Template for new pages
- `final-page-list.md` - Master page inventory
- `links-page-requirements.md` - Validated requirements
- `links-display-requirements.md` - Validated requirements
- `links-edit-and-selection-requirements.md` - Validated requirements
- `onboarding-page-requirements.md` - In progress

### Current Epics
**Location**: `/docs/stories/`
- `epic-0-foundation.md` - Foundation epic
- `epic-0.5-onboarding.md` - Onboarding epic
- `epic-1-links-page.md` - Links page epic
- `MIGRATION-NOTES.md` - Explains the transition

### Context Documents (Keep if Useful)
- `/docs/prd/goals-and-background-context.md`
- `/docs/prd/requirements.md` (if still relevant)
- `/docs/prd/technical-assumptions.md`
- `/docs/prd/technical-risks-mitigation.md`
- `/docs/prd/user-interface-design-goals.md`
- `/docs/prd/user-responsibility-clarifications.md`

---

## 🎯 Recommended Actions

### 1. Create Archive Directory
```bash
mkdir -p docs/archive/old-feature-based-epics
mkdir -p docs/archive/old-planning-docs
```

### 2. Move Old Files
```bash
# Move old epic files
mv docs/prd/epic-[1-5]*.md docs/archive/old-feature-based-epics/
mv docs/prd/epic-list.md docs/archive/old-feature-based-epics/
mv docs/prd/epic-list-optimized.md docs/archive/old-feature-based-epics/

# Move old planning docs
mv docs/prd/checklist-results-report.md docs/archive/old-planning-docs/
mv docs/prd/po-validation-final-report.md docs/archive/old-planning-docs/
# ... etc
```

### 3. Clean Up Duplicates
```bash
# Remove duplicate page lists
rm docs/pages/complete-page-inventory.md
rm docs/pages/links-page-specification.md
rm docs/pages/links-page-story-mapping.md
```

### 4. Update README/Index
Create a clear index showing current structure:
- Active documents
- Archived documents
- Where to find what

---

## 📁 Final Clean Structure

```
docs/
├── prd.md                          # Master PRD
├── BMAD-INTEGRATION.md             # BMAD process guide
├── pages/                          # Page requirements
│   ├── TEMPLATE-requirements.md
│   ├── final-page-list.md
│   ├── *-requirements.md          # Page-specific requirements
├── stories/                        # Current epics & stories
│   ├── epic-0-foundation.md
│   ├── epic-0.5-onboarding.md
│   ├── epic-1-links-page.md
│   ├── MIGRATION-NOTES.md
│   ├── archived-feature-based/    # Old approach (already archived)
│   └── *.story.md                 # BMAD stories will go here
├── prd/                           # Planning & process docs
│   ├── page-based-development-plan.md
│   ├── epic-list-page-based.md
│   ├── requirements-tracking.md
│   ├── development-process-and-roles.md
│   └── [context docs if keeping]
├── architecture/                   # Technical docs
└── archive/                       # Old/outdated docs
    ├── old-feature-based-epics/
    └── old-planning-docs/
```

---

## ⚠️ Before Cleanup

1. **Review each file** - Some may have valuable context
2. **Backup everything** - In case we need to reference
3. **Update any references** - Other docs may link to these

---

## Decision Needed

Should we:
1. **Archive** (move to archive folder) - Can still reference if needed
2. **Delete** (remove completely) - Cleaner but loses history
3. **Keep with PREFIX** (like ARCHIVED-*) - Clear but clutters directory

Recommendation: **Archive** to preserve history while cleaning working directories