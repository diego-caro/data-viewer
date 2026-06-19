# Development Guide

> This document is a living guide. Updated automatically after each completed ticket.
> Last updated: SCRUM-14 — Update categories to match real club divisions

## Project Overview
App that reads data from an external REST API and visualizes it in a different way.

- **Jira**: https://petreles.atlassian.net/jira/software/projects/SCRUM/boards/1
- **Stack**: Next.js 14 (App Router, backend/API), Angular 18 (frontend), TypeScript, Tailwind CSS
- **Testing**: Jest + Angular TestBed, Cypress (E2E)

## Setup

### Prerequisites
- Node.js 20.19.0+
- npm 10+
- Docker (for PostgreSQL)

### Quick Start
```bash
git clone [repo-url]
cd data-viewer
npm run setup       # Install backend + frontend dependencies
npm run dev         # Start Docker, backend (3000), and frontend (4200)
```

That's it. `npm run dev` handles everything:
1. Starts PostgreSQL via Docker (port 5433, with healthcheck)
2. Creates `backend/.env.local` from `.env.example` if missing
3. Starts backend (Next.js, port 3000) and frontend (Angular, port 4200) concurrently

### Available Scripts (root)

| Command | Description |
|---------|-------------|
| `npm run setup` | Install dependencies for backend and frontend |
| `npm run dev` | Start Docker + backend + frontend (single command) |
| `npm run db:down` | Stop the Docker PostgreSQL container |
| `npm test` | Run all backend and frontend tests |

### Environment Variables
```env
# backend/.env.local (auto-created from .env.example on first npm run dev)
DATABASE_URL=postgresql://cec:cec123@localhost:5433/data_viewer
JWT_SECRET=dev-secret-change-in-production
```

Frontend API base URL is configured in `frontend/src/environments/environment.ts`.

### Run Tests
```bash
# All tests
npm test

# Backend only — with coverage
cd backend && npx jest --coverage

# Frontend only — with coverage
cd frontend && npx jest --coverage

# E2E (requires npm run dev running)
cd frontend && npx cypress run
```

## Architecture

### Folder Structure
```
backend/                        → Next.js 14 App Router (API server)
  src/app/api/                  → API route handlers
  src/app/api/auth/             → Auth routes (login, me)
  src/app/api/users/            → User management routes (list, create) — admin only
  src/lib/db.ts                 → PostgreSQL connection pool + schema init
  src/lib/middleware/            → Auth middleware (extractAuth, requireAuth, requireRole)
  src/lib/services/             → Data layer (hardcoded now, external API later)
  src/lib/types/                → Shared TypeScript interfaces
  __tests__/api/                → Unit tests for API routes
  __tests__/services/           → Unit tests for services

frontend/                       → Angular 18 (UI client)
  src/app/models/               → TypeScript interfaces
  src/app/services/             → Angular services (HttpClient, AuthService)
  src/app/pages/                → Routed page components
  src/app/pages/login/          → Login page (standalone, no auth guard)
  src/app/pages/admin/users/    → Admin users management page
  src/app/interceptors/         → HTTP interceptors (auth token)
  src/app/guards/               → Route guards (auth, admin)
  src/app/components/           → Reusable UI components
  cypress/e2e/                  → Cypress E2E tests

docs/                           → Project documentation
ai-specs/                       → AI agent definitions and skills
```

### Data Flow
```
External API → backend/lib/services/ → backend/app/api/ → Angular Service → Component → UI
```

All external data fetching is isolated in `backend/src/lib/services/`. API routes expose typed endpoints. Angular services call the API via `HttpClient`. Components handle loading, error, and empty states.

## Features
> Updated automatically after each completed SCRUM ticket.

| Ticket | Feature | Status |
|--------|---------|--------|
| SCRUM-6 | Players List by Category — display player roster grouped by category with status badges | Done |
| SCRUM-7 | Bug fix: category dropdown now reflects selected option; no loading spinner on category change | Done |
| SCRUM-8 | Tournament fixture page — matches grouped by round, scores for completed, dates for pending, team logos, venue | Done |
| SCRUM-9 | Dashboard home page — donut charts showing active vs inactive players per category, default route | Done |
| SCRUM-10 | Responsive navigation menu — CEC logo, hamburger on mobile, inline links on desktop, active route highlighting | Done |
| SCRUM-11 | Auth infrastructure + Login page — PostgreSQL, JWT auth, login form, auth guard, HTTP interceptor, user name in nav, logout | Done |
| SCRUM-12 | Admin user management + role-based views — admin users page with create form, role-based route guards, dashboard/players filtered by player role | Done |
| SCRUM-13 | Single-command dev startup — `npm run dev` starts Docker, backend, and frontend; `npm run setup` for deps; `.env.example` auto-copied | Done |
| SCRUM-14 | Update categories to match real club divisions — 6 categories: Sub 14, Sub 16, Sub 19, Primera, Intermedia, Caballeros | Done |

## API Routes
> Updated automatically when new routes are added.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/categories` | List all player categories |
| GET | `/api/players?categoryId=X` | List players filtered by category (400 if missing, 404 if not found) |
| GET | `/api/fixture/matches` | Proxy: tournament matches from Hockey Chubut API (normalized) |
| GET | `/api/fixture/clubs` | Proxy: clubs with base64 logos from Hockey Chubut API |
| POST | `/api/auth/login` | Authenticate user — returns JWT token + user profile (401 on invalid credentials) |
| GET | `/api/auth/me` | Get current user profile from JWT (requires `Authorization: Bearer <token>`) |
| GET | `/api/users` | List all users — admin only (401/403 for non-admin) |
| POST | `/api/users` | Create a user — admin only (validates role, categoryId for player, duplicate email → 409) |

## Known Decisions & Trade-offs
> Architecture decisions are added here as they are made.

- Separate backend (Next.js 14, port 3000) and frontend (Angular 18, port 4200) projects
- All external API calls isolated in `backend/src/lib/services/` to decouple UI from data source
- Player data hardcoded initially in the service layer — typed interfaces ready for API swap
- Player/Category types duplicated between backend and frontend (shared package planned for later)
- CORS headers configured in `backend/next.config.mjs` for dev (allows `http://localhost:4200`)
- Category change does not trigger a loading spinner — content stays visible during player fetch (SCRUM-7)
- Fixture page uses `forkJoin` to load matches and clubs in parallel — if either fails, the whole page shows an error (SCRUM-8)
- External Hockey Chubut API URLs hardcoded in `fixtureService.ts` — matches current tournament/fixture IDs (SCRUM-8)
- Date-only detection for pending matches uses `T03:00:00Z` heuristic (midnight Argentina time) — revisit if API changes (SCRUM-8)
- Dashboard uses Chart.js directly (not ng2-charts wrapper) — ng2-charts `BaseChartDirective` caused Angular rendering issues where sibling cards failed to render; manual `AfterViewChecked` initialization avoids this (SCRUM-9)
- Dashboard `forkJoin` for player data: if any single category's player fetch fails, the entire dashboard shows an error (all-or-nothing) — matches fixture page pattern (SCRUM-9)
- Default route changed from `/players` to `/dashboard` (SCRUM-9)
- Navigation menu lives in `AppComponent` (wraps `<router-outlet>`) — not a separate component, since it's the only persistent UI shell (SCRUM-10)
- CEC logo served from `frontend/public/logo-cec.png` — Angular 18 `public/` directory serves files at root (SCRUM-10)
- Mobile menu toggle uses Angular `signal()` for local state — no service needed for simple UI toggle (SCRUM-10)
- PostgreSQL chosen over SQLite for auth database — user preference for production-ready storage (SCRUM-11)
- JWT tokens signed with `jsonwebtoken`, 8h expiry, payload contains `{ userId, role }` — no refresh tokens (SCRUM-11)
- Passwords hashed with `bcrypt` (10 salt rounds) — never stored or transmitted in plaintext (SCRUM-11)
- Database connection via `pg` Pool singleton in `backend/src/lib/db.ts` — schema auto-created via `initDatabase()` (SCRUM-11)
- Default admin seeded on first run (`admin@cec.com` / `admin123`) when users table is empty (SCRUM-11)
- Auth guard (`CanActivateFn`) protects all routes except `/login` — checks token in localStorage, validates via `GET /api/auth/me` (SCRUM-11)
- HTTP interceptor attaches `Authorization: Bearer <token>` to all API requests; on 401 (except login), clears token and redirects to `/login` (SCRUM-11)
- Nav bar hidden on `/login` page via `isLoginPage()` check in `AppComponent` — login has its own centered layout (SCRUM-11)
- CORS config updated to allow `POST, PUT, DELETE` methods and `Authorization` header for auth requests (SCRUM-11)
- Cypress `loginAsAdmin()` custom command added to `cypress/support/e2e.ts` — sets mock token + intercepts `/auth/me` for all existing E2E tests (SCRUM-11)
- Auth middleware in `backend/src/lib/middleware/auth.ts` provides `extractAuth` → `requireAuth` → `requireRole` — layered pattern returns either `AuthPayload` or `NextResponse` (instanceof check in route handlers) (SCRUM-12)
- Admin guard (`adminGuard`) is self-contained: checks token, loads user if needed, verifies `role === 'admin'`, redirects non-admins to `/dashboard` (SCRUM-12)
- Dashboard and Players pages filter categories by `user.categoryId` for player role — admin sees all, player sees only their assigned category (SCRUM-12)
- Admin nav link conditionally rendered via `authService.user()?.role === 'admin'` in `app.component.html` for both desktop and mobile (SCRUM-12)
- Cypress `loginAsPlayer()` custom command added for role-based E2E tests — sets mock player token with configurable categoryId (SCRUM-12)
- Docker PostgreSQL mapped to host port 5433 (not 5432) via `POSTGRES_PORT` env var to avoid conflicts with local PostgreSQL installations (SCRUM-13)
- `npm run dev` uses npm `predev` hook to auto-start Docker and create `.env.local` before launching `concurrently` with backend + frontend (SCRUM-13)
- `docker-compose.yml` includes `healthcheck` with `pg_isready` — `docker compose up -d --wait` blocks until PostgreSQL is accepting connections (SCRUM-13)
- Categories updated from 3 placeholders (Mixto Sub 14 A/B, Mixto Sub 16) to 6 real club divisions: Sub 14, Sub 16, Sub 19, Primera, Intermedia, Caballeros — hardcoded in `playerService.ts`, IDs unchanged (cat-1 through cat-6) (SCRUM-14)
