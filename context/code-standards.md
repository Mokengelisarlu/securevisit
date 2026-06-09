Code Standards
General
Keep modules small and single-purpose
Prefer composition over deeply coupled abstractions
Fix root causes instead of layering workarounds
Keep tenant logic centralized and reusable
Avoid mixing UI, data access, and business logic
Keep feature boundaries explicit
Optimize for maintainability and readability first
TypeScript
TypeScript strict mode is required
Avoid any
Use explicit interfaces and inferred schemas where possible
Validate all unknown input using Zod
Share API types between frontend and backend when possible
Prefer readonly-safe immutable patterns
Use discriminated unions for complex state
Next.js
Default to Server Components
Use use client only when interactivity requires it
Keep route handlers focused on a single responsibility
Avoid unnecessary client-side fetching
Use Suspense and streaming where appropriate
Use server actions carefully and only for scoped mutations
Middleware owns tenant routing responsibilities
Styling
Use CSS variables defined in ui-context.md
No hardcoded color values
Use Tailwind utility classes consistently
Use design tokens for spacing, colors, and radius
Keep component styling consistent across features
Avoid inline styles unless dynamically required
API Routes
Validate request input before any logic runs
Enforce authentication before protected access
Enforce authorization before mutations
Return predictable response shapes
Never expose internal database errors directly
Log critical failures server-side
Keep business logic outside route handlers when possible
Data and Storage
Metadata belongs in PostgreSQL
Large files belong in Blob storage
Never store large binary content in the database
Keep tenant connections isolated
Use connection caching carefully
Use transactions for critical multi-step operations
Avoid N+1 query patterns
File Organization
features/ — Domain-specific business logic
components/ — Shared reusable UI components
lib/ — Infrastructure and shared utilities
db/ — Schema, migrations, and database utilities
app/api/ — Thin HTTP route handlers
contexts/ — Global React providers
hooks/ — Shared reusable hooks
types/ — Shared contracts and types