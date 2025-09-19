# Source Tree

## Project Root Structure

```
isla_app/
├── .bmad-core/              # BMAD™ Core configuration and tasks
│   ├── core-config.yaml     # Core configuration settings
│   ├── install-manifest.yaml # Installation manifest
│   └── tasks/               # BMAD task definitions
├── .claude/                 # Claude AI assistant configuration
│   ├── commands/            # Custom Claude commands
│   │   └── BMad/           # BMAD-specific commands
│   │       ├── agents/     # Agent role definitions
│   │       └── tasks/      # Task command definitions
│   └── settings.local.json # Local Claude settings
├── docs/                    # Documentation root
│   ├── architecture/        # Sharded architecture documentation
│   ├── prd/                # Sharded PRD documentation
│   ├── architecture.md     # Original architecture document
│   └── prd.md             # Original PRD document
└── refs/                   # Reference documents
    ├── brainstorming-output-link-shortener.md
    └── brief.md

```

## Key Directories

### Documentation (`/docs`)

- **architecture/** - Technical architecture documentation (sharded)
  - API specifications
  - Backend and frontend architecture
  - Database schema
  - Development workflows
  - Testing strategies
  - Coding standards
- **prd/** - Product requirements documentation (sharded)
  - Epics and user stories
  - Requirements and assumptions
  - Technical risks and mitigations

### BMAD Configuration (`/.bmad-core`)

- Core BMAD™ framework configuration
- Task templates for various development activities
- Installation and setup manifests

### Claude Assistant (`/.claude`)

- Custom commands for project-specific workflows
- Agent definitions for different roles (PM, Dev, QA, etc.)
- Task automation commands

### Reference Materials (`/refs`)

- Project briefs
- Brainstorming outputs
- External reference documentation

## File Naming Conventions

- **Markdown files**: `kebab-case.md`
- **Configuration files**: `kebab-case.yaml` or `.json`
- **Task files**: `verb-noun.md` (e.g., `create-story.md`)
- **Agent files**: `role-name.md` (e.g., `architect.md`)

## Directory Organization Principles

1. **Documentation First**: All documentation in `/docs` with logical subdirectories
2. **Configuration Separation**: Tool configs in dot-directories (`.bmad-core`, `.claude`)
3. **Reference Isolation**: External and reference materials in `/refs`
4. **Sharded Documents**: Large documents split into topic-specific files in subdirectories

## Future Structure (Post-Implementation)

Once development begins, the following directories will be added:

```
isla_app/
├── src/                    # Source code
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── lib/              # Utility libraries
│   ├── hooks/            # Custom React hooks
│   └── styles/           # Global styles
├── public/                # Static assets
├── tests/                 # Test files
├── scripts/              # Build and utility scripts
└── config/               # Application configuration
```

## Version Control

- `.git/` directory present - project is Git-initialized
- Follow conventional commit messages
- Branch naming: `feature/`, `bugfix/`, `hotfix/` prefixes

## Build Artifacts (To Be Ignored)

Future directories to be excluded from version control:

- `node_modules/`
- `.next/`
- `dist/`
- `build/`
- `coverage/`
- `*.log`
