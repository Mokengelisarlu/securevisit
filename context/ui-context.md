# UI Context

## Theme

SecureVisit uses a modern enterprise SaaS design language focused on clarity, speed, and operational visibility.

The UI should feel:

* Professional and security-oriented
* Clean and data-dense without clutter
* Optimized for dashboard workflows
* Consistent across admin, tenant dashboard, and kiosk interfaces

Design principles:

* Dark-first interface with optional light mode later
* Layered surfaces with strong visual hierarchy
* Minimal gradients
* Soft shadows and subtle borders
* Large spacing for kiosk/touch interactions
* Fast-loading UI with skeleton states
* Mobile-responsive but desktop-optimized

---

# Colors

All UI colors must use CSS variables defined in `globals.css`.

No hardcoded hex colors inside components.

| Role             | CSS Variable       | Value              |
| ---------------- | ------------------ | ------------------ |
| Page background  | `--bg-base`        | `#0B1020`          |
| Surface          | `--bg-surface`     | `#121A2B`          |
| Elevated Surface | `--bg-elevated`    | `#182235`          |
| Primary text     | `--text-primary`   | `#F3F4F6`          |
| Secondary text   | `--text-secondary` | `#CBD5E1`          |
| Muted text       | `--text-muted`     | `#94A3B8`          |
| Primary accent   | `--accent-primary` | `#3B82F6`          |
| Accent hover     | `--accent-hover`   | `#2563EB`          |
| Success          | `--state-success`  | `#10B981`          |
| Warning          | `--state-warning`  | `#F59E0B`          |
| Error            | `--state-error`    | `#EF4444`          |
| Border           | `--border-default` | `#243041`          |
| Input background | `--input-bg`       | `#0F172A`          |
| Overlay          | `--overlay-bg`     | `rgba(0,0,0,0.65)` |

---

# Typography

| Role      | Font       | Variable      |
| --------- | ---------- | ------------- |
| UI text   | Geist Sans | `--font-sans` |
| Mono/code | Geist Mono | `--font-mono` |

Typography scale:

* Page title → `text-3xl font-bold`
* Section title → `text-xl font-semibold`
* Card title → `text-lg font-medium`
* Body text → `text-sm`
* Small labels → `text-xs uppercase tracking-wide`

Guidelines:

* Avoid excessive font weights
* Maintain strong spacing hierarchy
* Use muted text for metadata
* Keep dashboard metrics highly legible

---

# Border Radius

| Context           | Class         |
| ----------------- | ------------- |
| Inputs / buttons  | `rounded-md`  |
| Cards / panels    | `rounded-xl`  |
| Modals / overlays | `rounded-2xl` |
| Kiosk touch UI    | `rounded-2xl` |

---

# Shadows

| Context         | Class        |
| --------------- | ------------ |
| Cards           | `shadow-sm`  |
| Elevated panels | `shadow-lg`  |
| Modals          | `shadow-2xl` |

Avoid excessive glow effects.

---

# Component Library

SecureVisit uses:

* Tailwind CSS
* shadcn/ui
* Radix UI primitives
* Lucide React icons
* React Hook Form
* Zod validation
* TanStack Query (React Query)

Component rules:

* All reusable UI components live in `components/ui`
* Business/domain components live in feature folders
* Prefer composition over deeply nested props
* Use server components by default
* Client components only when interactivity is required

---

# Layout Patterns

## Admin Dashboard

Pattern:

* Left fixed sidebar
* Top navigation bar
* Scrollable content area
* Data tables and analytics cards

Structure:

```txt
Sidebar | Main Content
```

---

## Tenant Dashboard

Pattern:

* App shell layout
* Collapsible sidebar
* Header with tenant branding
* Responsive content grid

Used for:

* Visits
* Visitors
* Hosts
* Reports
* Settings

---

## Kiosk Interface

Pattern:

* Fullscreen workflow UI
* Large touch targets
* Step-by-step flow
* Minimal distractions

Rules:

* One primary action per screen
* Large typography
* Strong visual feedback
* Optimized for tablets

---

## Modals

Pattern:

* Centered overlay
* Backdrop blur
* Escape closes modal
* Smooth animations

---

## Tables

Pattern:

* Sticky headers
* Search/filter toolbar
* Pagination
* Row actions dropdown

Used for:

* Visitors
* Visits
* Tenants
* Audit logs

---

# Icons

Library:

* Lucide React only

Usage:

* Inline icons → `h-4 w-4`
* Buttons → `h-5 w-5`
* Navigation → `h-5 w-5`
* Feature illustrations → custom SVG

Rules:

* Stroke icons only
* Consistent stroke width
* Avoid filled icons unless status-related

---

# Motion & Animation

Animation philosophy:

* Fast
* Minimal
* Functional

Allowed:

* Fade transitions
* Slide transitions
* Hover elevation
* Loading skeletons
* Toast animations

Avoid:

* Excessive bouncing
* Long transitions
* Decorative motion

Preferred library:

* Framer Motion

---

# Form Design Standards

Forms must:

* Use React Hook Form + Zod
* Show inline validation
* Support loading states
* Disable submit during mutation
* Display success/error toast feedback

Input standards:

* Minimum height: `h-10`
* Kiosk inputs: `h-14`
* Labels always visible
* Required fields marked clearly

---

# Data Visualization

Charts:

* Recharts

Guidelines:

* Minimal grid lines
* Clear legends
* Accessible contrast
* Dashboard-friendly sizing

Used for:

* Visitor traffic
* Peak hours
* Department analytics
* Monthly trends

---

# Responsive Strategy

Breakpoints:

* Mobile → basic support
* Tablet → kiosk optimized
* Desktop → primary admin experience
* Large screens → analytics optimized

Rules:

* Sidebar collapses on mobile
* Tables become cards on small screens
* Touch-friendly controls on tablet

---

# Accessibility

Requirements:

* Keyboard navigable
* Proper aria labels
* Visible focus states
* Color contrast compliant
* Screen-reader friendly forms

Kiosk accessibility:

* Large touch targets
* High readability
* Error prevention

---

# Empty States

Every major screen must include:

* Empty state illustration/icon
* Helpful description
* Primary CTA button

Example:
“No visits recorded today.”
→ “Create New Visit”

---

# Loading States

Use:

* Skeleton loaders
* Optimistic updates
* Suspense boundaries where appropriate

Never show blank screens during loading.

---

# Notification System

Use toast notifications for:

* Success actions
* Errors
* Warnings
* Upload progress

Preferred placement:

* Top-right desktop
* Bottom-center mobile

---

# File & Media UI

Image uploads:

* Drag-and-drop support
* Camera capture support
* Preview before upload

Signature capture:

* Canvas-based input
* Clear/reset actions
* Export PNG/SVG

---

# Security UX

Sensitive operations must include:

* Confirmation dialogs
* Permission checks
* Audit-friendly UI indicators

Examples:

* Delete tenant
* Revoke access
* Export logs

---

# Future UI Expansion

Planned future additions:

* Light mode
* Real-time WebSocket indicators
* Advanced analytics dashboard
* Mobile companion app
* Offline kiosk mode
* Multi-language support
