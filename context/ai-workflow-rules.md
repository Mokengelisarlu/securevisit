AI Workflow Rules
Approach

Build SecureVisit incrementally using a spec-driven workflow. All implementation must follow the architecture, tenant isolation, authentication, and UI context documents.

The system is a multi-tenant Visitor Management SaaS platform with strict tenant isolation, subdomain-based routing, and database-per-tenant architecture.

Every feature must:

Respect tenant boundaries
Be fully typed and validated
Be production-oriented
Be implemented in small verifiable units
Be aligned with the architecture context files

Do not invent behavior outside the documented requirements.

Scoping Rules
Work on one feature unit at a time
Prefer small, verifiable increments over large speculative changes
Keep frontend, backend, and infrastructure concerns separated
Complete and verify one workflow before starting another
Every implementation step must be testable end-to-end
When to Split Work

Split implementation if the task combines:

UI changes and infrastructure/database provisioning
Multiple unrelated API domains
Tenant routing and business logic changes together
Authentication changes and dashboard feature work
Upload system changes and dashboard UI work
Realtime architecture and CRUD implementation
Undefined behavior not covered in the context files

If a change cannot be validated quickly end-to-end, the scope is too large and must be split.

Handling Missing Requirements
Do not invent undefined business behavior
Resolve ambiguous requirements inside the proper context file first
Add unresolved decisions to progress-tracker.md
Clarify data ownership and tenant scope before implementing
All API payloads and response contracts must be explicitly defined
Protected Files

Do not modify the following unless explicitly instructed:

components/ui/*
node_modules/*
Generated ORM or migration files
Clerk-generated configuration
Environment configuration templates
Shared design tokens without updating ui-context.md
Keeping Docs in Sync

Update the relevant context files whenever implementation changes:

System architecture
Database boundaries
Authentication behavior
Tenant isolation logic
API conventions
Storage decisions
UI design system
Background job architecture
Upload/storage behavior
Before Moving to the Next Unit
The feature works end-to-end inside its defined scope
No architecture invariant was violated
Tenant isolation is preserved
Types and validation are complete
progress-tracker.md reflects current status
Build passes successfully
No security boundary was weakened
API contracts remain consistent