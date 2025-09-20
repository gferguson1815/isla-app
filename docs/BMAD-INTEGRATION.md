# BMAD Integration with Page-Based Development

## 🎯 How to Use BMAD with Our Page-Based Approach

### For Scrum Master (`/sm`)

When drafting stories, always:
1. **Check for page requirements** in `/docs/pages/[page-name]-requirements.md`
2. **Reference the epic** in `/docs/stories/epic-*.md`
3. **Include requirements** in the story draft

Example SM workflow:
```
/sm *draft
"Create story for onboarding page using requirements from /docs/pages/onboarding-page-requirements.md and Epic 0.5"
```

### For Product Owner (`/po`)

When validating stories:
1. **Check against page requirements** in `/docs/pages/`
2. **Verify acceptance criteria** match requirements
3. **Ensure no missing requirements**

### For Developer (`/dev`)

When implementing:
1. **Read the requirements document** first
2. **Follow the story** created by SM
3. **Reference visuals** in requirements if available

### For QA (`/qa`)

When testing:
1. **Test against requirements** in `/docs/pages/`
2. **Verify all acceptance criteria**
3. **Check edge cases** listed in requirements

## 📁 Document Locations

### Our Structure:
```
docs/
├── prd.md                    # Master PRD (bridges to our structure)
├── pages/                    # Page requirements (our primary specs)
│   ├── TEMPLATE-requirements.md
│   ├── onboarding-page-requirements.md
│   ├── links-page-requirements.md
│   └── [page-name]-requirements.md
├── stories/                  # Epic and story files
│   ├── epic-0-foundation.md
│   ├── epic-0.5-onboarding.md
│   ├── epic-1-links-page.md
│   └── [BMAD stories will go here as .story.md files]
├── prd/                      # Our planning documents
│   ├── page-based-development-plan.md
│   ├── requirements-tracking.md
│   └── development-process-and-roles.md
└── architecture/             # Technical architecture
```

## 🔄 Workflow Process

### Creating a New Page:

1. **Product Owner** decides which page to build next
2. **Use `/sm *draft`** which will:
   - Create requirements document from template
   - **GATHER requirements interactively** from you
   - Ask specific questions about the page
   - Document your answers
   - Create the story based on gathered requirements
3. **Get approval** from Product Owner on the story
4. **Use `/dev`** to implement
5. **Use `/qa`** to test
6. **User verification** and close

### The Key: Requirements Gathered DURING Story Creation
- SM agent creates `/docs/pages/[page]-requirements.md` WHILE drafting
- SM asks you questions in real-time
- Requirements are captured as part of story creation
- No pre-existing requirements needed!

## 📝 Example: Onboarding Page

### Current Status:
- ✅ Requirements doc created: `/docs/pages/onboarding-page-requirements.md`
- ⏳ Needs Product Owner input on requirements
- ⏳ Then SM creates story
- ⏳ Then Dev implements
- ⏳ Then QA tests

### To Create Story WITH Requirements Gathering:
```
/sm *draft
"Create story 0.5.1 for onboarding page.
I need to gather requirements first - there's no requirements doc yet.
Please ask me about:
- Visual design preferences
- Form fields needed
- Validation rules
- Success/error handling
- Edge cases
Then create both the requirements doc and the story."
```

### Alternative if Requirements Already Exist:
```
/sm *draft
"Create story using existing requirements from /docs/pages/onboarding-page-requirements.md"
```

## 🚨 Important Notes

### Requirements First!
- **NEVER** create a story without requirements document
- **NEVER** start coding without validated requirements
- **ALWAYS** reference the `/docs/pages/[page]-requirements.md` file

### BMAD Agents Need Context
When using BMAD agents, always provide:
1. Path to requirements document
2. Epic number and story number
3. Any special considerations

### Story Numbering
- Epic 0: Foundation (0.1, 0.2, 0.3...)
- Epic 0.5: Onboarding (0.5.1, 0.5.2...)
- Epic 1: Links Page (1.1, 1.2, 1.3...)
- Epic 2: Analytics (2.1, 2.2...)

## 🎯 Quick Reference

### Commands:
- `/sm *draft` - Create story (provide requirements path)
- `/po *validate` - Validate story against requirements
- `/dev *implement` - Build the feature
- `/qa *test` - Test against requirements

### Before Any Page:
1. Requirements doc exists? (`/docs/pages/[page]-requirements.md`)
2. Requirements validated by PO?
3. Epic defined? (`/docs/stories/epic-*.md`)
4. Ready for SM to draft story?

---

*This document bridges our page-based development approach with the BMAD agent system.*