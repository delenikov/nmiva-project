# Repository Agent Context

This file contains repo-wide Codex rules for NMIVA.

## Context Layout

- Personal global defaults live in `~/.codex/AGENTS.md`.
- Repo-wide rules live in this root `AGENTS.md`.
- Frontend-specific rules live in `frontend/AGENTS.md`.
- Backend-specific rules live in `backend/AGENTS.md`.

When working inside `frontend/`, follow both this file and `frontend/AGENTS.md`.
When working inside `backend/`, follow both this file and `backend/AGENTS.md`.
For changes that cross frontend and backend, follow all relevant nested `AGENTS.md` files.

## Project Snapshot

- NMIVA is a mobile-first PWA for vehicle maintenance and expense tracking.
- Backend: Java 21, Spring Boot 4, PostgreSQL, Flyway, JWT auth, Web Push.
- Frontend: React 19, TypeScript, Vite 7, React Router 7, Tailwind CSS 4, PWA service worker.
- Offline sync is central to the product. Preserve client/server reconciliation across changes.

## Repo-Wide Rules

- Keep backend API contracts and frontend API types aligned.
- Preserve authenticated user ownership boundaries.
- Avoid logging secrets, JWTs, passwords, VAPID private keys, or push subscription payloads.
- Prefer focused changes over broad rewrites.
- Do not edit generated build output or dependency folders.
- Keep docs and commands Windows-friendly when adding local instructions.

## Common Commands

Run backend tests from the repository root:

```powershell
.\mvnw.cmd -pl backend test
```

Run frontend checks from `frontend/`:

```powershell
npm run typecheck
npm run build
```
