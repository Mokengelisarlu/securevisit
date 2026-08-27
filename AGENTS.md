# Agents & Subagents — Usage Guide

This document explains how to use agents and subagents in this repository, and describes conventions for the React Native Expo kiosk project.

## Purpose

- Provide clear instructions for invoking agents when exploring, modifying, or testing the codebase.
- Map agent usage to the kiosk project artifacts: the progress tracker, Drizzle schema, and context rules.

## Key Project Files

- `KIOSK_PROGRESS_TRACKER.md` — step-by-step, unit-based tracker for the kiosk app.
- `DRIZZLE_SCHEMA.md` — Drizzle ORM schema and DB client setup for Neon Postgres.
- `context/progress-tracker.md` — central project progress document; update after each meaningful implementation change.
- `CLAUDE.md` — application-building context; follow the note: "If implementation changes the architecture, scope, or standards documented in the context files, update the relevant file before continuing." (keep this in mind while making structural changes)
- `context/visitor-lifecycle-plan.md` — **APPROVED master implementation plan** for the Visitor Request → Approval → Check-in → Check-out → Completion workstream (host + operator + group visits). **MANDATORY: read this file before implementing anything related to the visit lifecycle, host portal, approvals, participants, notifications, or audit.** It encodes the frozen scope, domain model, state machine, schema deltas, API contracts, phases, and acceptance criteria. Do not deviate from it without updating the file first. Companion draft: `docs/plans/2026-08-27-visitor-lifecycle-host-portal.md`.

## Available Agent (Subagent) Patterns

1. `Explore` — Read-only, fast codebase exploration and Q&A. Use it to locate files, summarize code, and gather context. Example:

```js
runSubagent({
  agentName: 'Explore',
  prompt: 'Find all API handlers that reference devices table and summarize them',
  description: 'Find device API handlers (quick)'
});
```

2. Local editing agent (manual) — For applying code changes we operate directly in the workspace using the apply_patch tool and follow the repo conventions. Make small, testable changes per unit in `KIOSK_PROGRESS_TRACKER.md`.

3. Testing / Verification — After code edits, run the project's local tests or manual E2E steps described in the tracker. If a subagent for automated testing exists, list it here and invoke it.

## Conventions for Using Agents on This Repo

- Always consult `context/*` files before making architecture or standards changes.
- Work in small, verifiable units: implement one unit at a time from `KIOSK_PROGRESS_TRACKER.md` and mark it completed in the tracker.
- When asking an agent to modify code, provide:
  - The exact file path(s) to change
  - A concise description of intent and constraints
  - Desired test or verification steps
- If a change affects architecture, schema, or standards, update the corresponding context file(s) first and commit them.

## How to Request Work from an Agent

1. For read-only exploration or locating files, request the `Explore` subagent and specify thoroughness: `quick`, `medium`, or `thorough`.
2. For code changes, instruct the assistant to make a small, single-unit change and reference the unit number in `KIOSK_PROGRESS_TRACKER.md`.
3. For database or migration work, reference `DRIZZLE_SCHEMA.md` and include `DATABASE_URL` environment requirements.

## Example Requests (Templates)

- "Use `Explore` (quick) to list files that reference `devices` and `commands` tables."  
- "Implement Unit 0.6 — create the QR scanner screen at `app/(pairing)/index.tsx` and persist validated payload into `AppConfigProvider`. Follow tests listed in the tracker."  
- "Run DB migration: generate Drizzle migration from `DRIZZLE_SCHEMA.md` and produce SQL migration files. Do not apply migrations; just create them for review." 

## Checklist Before Merging Any Agent-Produced Change

- Update `context/progress-tracker.md` with the completed unit (per `CLAUDE.md` instruction).
- Verify the unit's test cases listed in `KIOSK_PROGRESS_TRACKER.md` pass locally.
- Ensure no protected files were modified (see `context/ai-workflow-rules.md`).
- Add or update docs in the repository when architectural or standard changes are introduced.

## Contact / Escalation

If an agent suggests a change that affects tenant isolation, database partitioning, or authentication flows, pause and escalate to a human reviewer before applying it.

---

End of `AGENTS.md`.
