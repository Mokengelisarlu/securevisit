# SecureVisit - Visitor Management System (SaaS)

SecureVisit is a high-performance, multi-tenant Visitor Management System (VMS) designed for modern workplaces.

## 🚀 Quick Links

- **[Feature Guide](./FEATURE_GUIDE.md)**: Explore all application functionalities.
- **[Architecture Overview](./ARCHITECTURE.md)**: Technical deep dive into the system design.
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)**: Deployment and implementation details.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Authentication**: Clerk
- **Database**: Neon (PostgreSQL) with Drizzle ORM
- **UI & Styling**: Tailwind CSS, Shadcn/UI, Lucide Icons
- **State Management**: React Query (TanStack Query)

## 🏗️ Multi-Tenant Architecture

SecureVisit uses a subdomain-based architecture for maximum isolation:

- `app.localhost:3000`: Public landing and onboarding.
- `[subdomain].localhost:3000`: Tenant workspaces.
- `admin.localhost:3000`: System-wide administration.

## 🚦 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Copy `.env.local.example` to `.env.local` and add your Clerk and Neon DB credentials.

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Hosts File**:
   Ensure your local hosts file has entries for `app.localhost`, `admin.localhost`, and your test tenant subdomains.

---

*Powered by Mokengeli Sarlu*
