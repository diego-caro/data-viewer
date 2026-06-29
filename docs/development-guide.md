# Development Guide

> This document is a living guide. Updated automatically after each completed ticket.
> Last updated: SCRUM-43 — Dashboard fee collection charts with tabs by payment type

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
WEBHOOK_BASE_URL=https://your-domain.com    # Base URL for MP webhook notifications (omit in dev to skip)
MP_WEBHOOK_SECRET=your-mp-webhook-secret    # Mercado Pago webhook signing secret (omit to skip signature validation)
MP_CLIENT_ID=your-mp-app-client-id          # Mercado Pago app client ID (required for captain OAuth flow)
MP_CLIENT_SECRET=your-mp-app-client-secret  # Mercado Pago app client secret (required for captain OAuth flow)
MP_REDIRECT_URI=http://localhost:4200/mp/callback  # OAuth redirect URI (must match MP app config)
TOURNAMENT_ID=205151                               # Hockey Chubut tournament ID (default: 205151, current tournament)
FRONTEND_URL=                                      # Production frontend URL for CORS (e.g., https://your-app.vercel.app)
```

### Production Deployment (Vercel + Supabase)
The app deploys to Vercel as a monorepo: Next.js backend as serverless functions + Angular frontend as static files.

1. **Vercel**: Connect the GitHub repo, Vercel auto-detects `vercel.json` config
   - Root directory: `backend/`
   - Build: Angular → copies to `backend/public/` → Next.js builds
   - SPA rewrites route non-API/non-static requests to Angular's `index.html`
2. **Supabase**: Create a PostgreSQL database, copy the connection string
3. **Environment variables**: Set in Vercel dashboard:
   - `DATABASE_URL` — Supabase pooled connection string (port 6543)
   - `JWT_SECRET` — strong random secret for production
   - `WEBHOOK_BASE_URL` — Vercel deployment URL (for MP webhooks)
   - `MP_ACCESS_TOKEN`, `TOURNAMENT_ID` — same as local
   - `FRONTEND_URL` — Vercel deployment URL (for CORS, only needed if custom domain differs)
4. **Database schema**: Auto-creates on first request via `initDatabase()` in `instrumentation.ts`

Frontend API base URL is configured in `frontend/src/environments/environment.ts` (set to `/api` — relative, not absolute). The Angular dev server proxies `/api` requests to `http://localhost:3000` via `frontend/proxy.conf.json`.

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
  src/app/api/users/[id]/number/ → PATCH: update jersey number — admin only
  src/app/api/categories/[id]/captain/ → PUT: change captain for a category — admin only
  src/app/api/fixture/           → Fixture proxy routes (divisions, matches, clubs, standings)
  src/app/api/payments/          → Payment management routes (list, create, mark-paid, pay, webhook, verify-payment)
  src/app/api/mp/              → Mercado Pago OAuth routes (auth-url, callback, status)
  src/lib/db.ts                 → PostgreSQL connection pool + schema init (users, categories, match_fees, match_player_fees, league_fees, league_player_fees, travel_fees, travel_player_fees, captain_mp_config)
  src/lib/middleware/            → Auth middleware (extractAuth, requireAuth, requireRole, requireAnyRole)
  src/lib/services/             → Data layer (DB-backed queries)
  src/lib/types/                → Shared TypeScript interfaces
  __tests__/api/                → Unit tests for API routes
  __tests__/services/           → Unit tests for services

frontend/                       → Angular 18 (UI client)
  src/app/models/               → TypeScript interfaces
  src/app/services/             → Angular services (HttpClient, AuthService)
  src/app/pages/                → Routed page components
  src/app/pages/login/          → Login page (standalone, no auth guard)
  src/app/pages/admin/users/    → Admin users management page
  src/app/pages/admin/payments/  → Admin payments configuration page
  src/app/pages/payments/        → Player payments page (pay via MP / view paid status)
  src/app/interceptors/         → HTTP interceptors (auth token)
  src/app/guards/               → Route guards (auth, admin)
  src/app/components/           → Reusable UI components
  src/app/testing/              → Test helpers (translate-testing.ts)
  src/assets/i18n/              → Translation files (es.json, en.json)
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
| SCRUM-15 | Fee data model + captain role + admin fees page — category fees with auto-calculated per-player amounts, captain user role, mark paid, weekly reset logic | Done |
| SCRUM-16 | Mercado Pago integration + player payment flow — MP Checkout Pro via captain's account, webhook-based automatic payment tracking, player fees page with Pay/Paid states | Done |
| SCRUM-17 | Captain dashboard + player warning banner + admin fee chart — captain sees player list with paid/unpaid badges, player warning when match ≤4 days and fee unpaid, admin dashboard paid/unpaid donut charts | Done |
| SCRUM-21 | Replace mock player data with DB — categories table, jersey numbers, captain badge, change captain, admin jersey number editing | Done |
| SCRUM-22 | Admin edit and delete users — full CRUD on users page, edit form pre-filled, password optional on update, confirmation dialog on delete, FK cascade for player_fees | Done |
| SCRUM-23 | Captain MP OAuth flow — connect Mercado Pago account via OAuth, callback page, status indicator, reconnect option | Done |
| SCRUM-27 | Tournament standings table — category filter dropdown, fixture/standings tabs, dynamic fixture IDs via TOURNAMENT_ID env var, mobile-friendly sticky columns | Done |
| SCRUM-29 | Fix fees page build error — getMatches missing fixtureId after SCRUM-27 refactor | Done |
| SCRUM-30 | Dashboard play eligibility status card — players/captains see fee-based play status (enabled/pending/no-fee) with link to fees page | Done |
| SCRUM-33 | Angular proxy for external access — relative API URLs + dev server proxy so app works via ngrok with a single tunnel | Done |
| SCRUM-32 | Deploy to Vercel + Supabase — monorepo config, Angular build into Next.js public/, SPA rewrites, dynamic CORS, production env | Done |
| SCRUM-35 | Internationalization (i18n) — auto-detect browser language (ES/EN), all UI text translated via @ngx-translate, Spanish fallback for unsupported languages, database content untranslated | Done |
| SCRUM-38 | Travel fee for away matches — auto-detect away via fixture data, admin Fee/Travel tabs with Away/Local badge, player fee breakdown with individual Pay + Pay All, dashboard status pills for fee + travel eligibility | Done |
| SCRUM-41 | Rename Fees to Payments, separate DB tables for match/league/travel fees — 3 admin tabs (Match Fee, League Fee, Travel), league fee with monthly period, dashboard pills for all 3 types, play eligibility checks all fee types, API routes renamed to /api/payments/* | Done |
| SCRUM-42 | Rename frontend fee files/folders to payments — `fee.model.ts` → `payment.model.ts`, `fee.service.ts` → `payment.service.ts`, `pages/fees/` → `pages/payments/`, `pages/admin/fees/` → `pages/admin/payments/`, all imports updated | Done |
| SCRUM-43 | Dashboard fee collection charts with tabs — admin dashboard fee charts grouped by payment type tabs (Match Fee, League Fee, Travel), client-side filtering, empty tab state, Chart.js instances properly destroyed on tab switch | Done |

## API Routes
> Updated automatically when new routes are added.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/categories` | List all player categories |
| GET | `/api/players?categoryId=X` | List players filtered by category (400 if missing, 404 if not found) |
| GET | `/api/fixture/divisions` | Proxy: list all fixture divisions for current tournament — auth required |
| GET | `/api/fixture/matches?fixtureId=X` | Proxy: matches for a division from Hockey Chubut API (normalized) — auth required |
| GET | `/api/fixture/clubs?fixtureId=X` | Proxy: clubs with base64 logos for a division — auth required |
| GET | `/api/fixture/standings?fixtureId=X` | Proxy: standings table for a division from Hockey Chubut API (normalized) — auth required |
| POST | `/api/auth/login` | Authenticate user — returns JWT token + user profile (401 on invalid credentials) |
| GET | `/api/auth/me` | Get current user profile from JWT (requires `Authorization: Bearer <token>`) |
| GET | `/api/users` | List all users — admin only (401/403 for non-admin) |
| POST | `/api/users` | Create a user — admin only (validates role, categoryId for player/captain, duplicate email → 409) |
| GET | `/api/payments` | Get current period's payments — admin sees all, captain/player sees own category (match + league + travel) |
| POST | `/api/payments` | Create/update payment config for a category — admin only (UPSERT by category + period + type) |
| POST | `/api/payments/mark-paid` | Mark a player's fee as paid — admin or captain only (searches all 3 fee tables) |
| POST | `/api/payments/pay` | Generate MP payment preference — player or captain (supports match/league/travel + payAll) |
| POST | `/api/payments/webhook` | Mercado Pago webhook — marks player fee as paid (public, no JWT, signature-validated) |
| POST | `/api/payments/verify-payment` | Verify payment status from MP return flow — player or captain only |
| PATCH | `/api/users/:id/number` | Update a player's jersey number — admin only |
| PUT | `/api/categories/:id/captain` | Change captain for a category — swaps roles, admin only |
| PUT | `/api/users/:id` | Update user fields — admin only (password optional, duplicate email → 409, role admin clears categoryId) |
| DELETE | `/api/users/:id` | Hard-delete user — admin only (self-delete → 400, cascades player fees from all 3 tables, FK violation → 409) |
| GET | `/api/mp/auth-url` | Generate MP OAuth authorization URL — captain only |
| GET | `/api/mp/callback` | MP OAuth callback — exchanges code for access token, stores in captain_mp_config — captain only |
| GET | `/api/mp/status` | Check MP connection status for captain's category — captain only |

## Known Decisions & Trade-offs
> Architecture decisions are added here as they are made.

- Separate backend (Next.js 14, port 3000) and frontend (Angular 18, port 4200) projects
- All external API calls isolated in `backend/src/lib/services/` to decouple UI from data source
- Player data hardcoded initially in the service layer — typed interfaces ready for API swap
- Player/Category types duplicated between backend and frontend (shared package planned for later)
- CORS headers configured in `backend/next.config.mjs` for dev (allows `http://localhost:4200`)
- Category change does not trigger a loading spinner — content stays visible during player fetch (SCRUM-7)
- Fixture page uses `forkJoin` to load matches and clubs in parallel — if either fails, the whole page shows an error (SCRUM-8)
- External Hockey Chubut API URLs built dynamically in `fixtureService.ts` from `TOURNAMENT_ID` env var + `fixtureId` param — no hardcoded IDs (SCRUM-27, replaces SCRUM-8 hardcoded approach)
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
- `UserRole` extended from `'admin' | 'player'` to `'admin' | 'player' | 'captain'` — captain is a player who can also see payment status and mark players as paid for their category (SCRUM-15)
- Fee model uses weekly periods keyed by Monday date — `category_fees` table has UNIQUE(category_id, week_start_date) for UPSERT support (SCRUM-15)
- Per-player amount auto-calculated server-side: `Math.round((totalAmount / availablePlayers) * 100) / 100` — frontend shows a preview but backend is the source of truth (SCRUM-15)
- `resetWeeklyFees()` function in `feeService.ts` copies last week's fee configs and creates new `player_fees` rows with 'pending' status — scheduling mechanism (cron/external trigger) to be wired separately (SCRUM-15)
- Auth middleware extended with `requireAnyRole(request, roles[])` — used by `mark-paid` endpoint to allow both admin and captain access (SCRUM-15)
- `captain_mp_config` table created in schema for future Mercado Pago token storage (one per category) — not populated until SCRUM-16 (SCRUM-15)
- Admin nav now shows two links ("Users" and "Fees") instead of one — both gated by `role === 'admin'` in template and `adminGuard` on routes (SCRUM-15)
- Cypress `loginAsCaptain()` custom command added for captain role E2E tests (SCRUM-15)
- Mercado Pago integration uses `mercadopago` npm SDK v3 — `MercadoPagoConfig`, `Preference`, `Payment`, `WebhookSignatureValidator` classes (SCRUM-16)
- Payment preferences route through captain's MP access token (from `captain_mp_config` table) — each category's payments go to that category's captain's MP account (SCRUM-16)
- `playerFeeId` is embedded as a query parameter in the MP `notification_url` — webhook extracts it to identify which player fee to mark as paid (SCRUM-16)
- Webhook validates `payment.external_reference === playerFeeId` after fetching payment status from MP API — prevents cross-payment fraud where an attacker replays a valid payment notification against a different fee (SCRUM-16)
- Webhook signature validation is optional (active when `MP_WEBHOOK_SECRET` env var is set) — allows local development without MP webhook signing, production must set the secret (SCRUM-16)
- `binary_mode: true` on MP preferences — forces approved/rejected only (no in_process or pending states), simplifying webhook handling (SCRUM-16)
- Player fees page (`/fees`) lazy-loaded via Angular route — shows Pay button (pending) or Paid badge (paid) based on player's fee status (SCRUM-16)
- Fees page renders role-based views: captain sees full player list with red/green badges and paid/unpaid counts; player sees own fee with Pay/Paid state (SCRUM-17)
- Player warning banner uses fixture match dates with 4-day threshold — `forkJoin` with `catchError` on fixture API so fees page degrades gracefully if fixture service is down (SCRUM-17)
- Admin dashboard loads fee data (`GET /api/fees`) and renders paid/unpaid donut charts per category using the same Chart.js pattern as active/inactive player charts — only loaded for admin role (SCRUM-17)
- Captain payment status visibility is on-refresh (no WebSocket/polling) — captain sees updated statuses each time they load the fees page (SCRUM-17)
- Player data now DB-backed — `playerService` queries PostgreSQL `users` and `categories` tables instead of hardcoded arrays; all functions are async (SCRUM-21)
- `categories` table seeded on `initDatabase()` with 6 rows (Sub 14, Sub 16, Sub 19, Primera, Intermedia, Caballeros) using `ON CONFLICT DO NOTHING` for idempotency (SCRUM-21)
- `player_number` column added to `users` table via idempotent `DO $ ... IF NOT EXISTS ... END $` migration block — nullable integer for jersey number (SCRUM-21)
- Captain swap uses PostgreSQL transaction (`BEGIN/COMMIT/ROLLBACK` via `getClient()`) — demotes old captain and promotes new captain atomically to prevent inconsistent state on failure (SCRUM-21)
- Player `status` hardcoded to `'active'` — monthly fee-based status calculation is TBD (SCRUM-21)
- User update (`PUT /api/users/:id`) password field is optional — only hashes and updates if provided, otherwise keeps current hash (SCRUM-22)
- User delete is hard delete — cascades `player_fees` rows first, catches FK constraint violations from `category_fees.created_by` and returns 409 instead of 500 (SCRUM-22)
- Admin cannot delete their own account — backend enforces `auth.userId !== params.id` check before proceeding (SCRUM-22)
- Frontend reuses the create-user form for editing — `editingUser()` signal toggles between create/edit mode, form title, and submit behavior (SCRUM-22)
- Captain MP OAuth uses Mercado Pago's authorization code flow — captain clicks "Connect", gets redirected to MP login, authorizes, and app stores the access token in `captain_mp_config` (SCRUM-23)
- MP OAuth requires `MP_CLIENT_ID`, `MP_CLIENT_SECRET`, and `MP_REDIRECT_URI` env vars — app must be registered with MP as an integration (one-time developer setup) (SCRUM-23)
- Frontend `/mp/callback` page handles OAuth redirect — exchanges code via backend, shows success/error, auto-redirects to `/fees` after 2 seconds (SCRUM-23)
- `POST /api/fees/pay` now returns 404 (not 500) when `captain_mp_config` is missing — friendly "Payments not yet configured for this category" message (SCRUM-23)
- Dashboard play eligibility status card reuses existing `GET /api/fees` endpoint — no backend changes, purely frontend (SCRUM-30)
- Play status determined by matching `userId` against `playerFees` array from fee response — `paid` → enabled, `pending` → not-enabled, empty/not-found → no-fee (SCRUM-30)
- Status card only visible for player/captain roles — admin never triggers the fee fetch for play status (SCRUM-30)
- Tournament page renamed from "Fixture" to "Tournament" — nav link, page title, and all references updated (SCRUM-27)
- Fixture page refactored with category dropdown + fixture/standings tabs — both tabs share the same division selector and reload on category change (SCRUM-27)
- Standings table on mobile uses `overflow-x-auto` with sticky `#` and `Club` columns (`left-0` / `left-10`) — background color applied to sticky cells to prevent see-through on scroll (SCRUM-27)
- Standings data comes pre-sorted by `position` from the external API — frontend renders in received order without explicit sorting (SCRUM-27)
- `TOURNAMENT_ID` env var defaults to `205151` (current tournament) — when the tournament changes, only the env var needs updating (SCRUM-27)
- Frontend `apiBaseUrl` changed from absolute `http://localhost:3000/api` to relative `/api` — Angular dev server proxy (`proxy.conf.json`) forwards to backend; this enables sharing the app via ngrok with a single tunnel on port 4200 (SCRUM-33)
- `angular.json` includes `allowedHosts` with the ngrok subdomain — update this value if the ngrok URL changes (SCRUM-33)
- Vercel deployment uses monorepo approach: `vercel.json` at repo root sets `rootDirectory: "backend"`, `buildCommand` builds Angular then copies output to `backend/public/` before building Next.js (SCRUM-32)
- Next.js `page.tsx` removed — Angular's `index.html` is the only frontend entry point, served via SPA fallback rewrites in both `vercel.json` (production) and `next.config.mjs` (local `next start`) (SCRUM-32)
- CORS middleware dynamically reads `FRONTEND_URL` env var — in production (same domain) CORS is not needed, but the env var supports custom domain setups (SCRUM-32)
- Angular `fileReplacements` configured in `angular.json` — production build swaps `environment.ts` with `environment.prod.ts` (`production: true`) (SCRUM-32)
- Supabase free tier (500MB, 2GB bandwidth) is sufficient for ~90 users — use pooled connection string (port 6543) to avoid exhausting serverless connection limits (SCRUM-32)
- i18n uses `@ngx-translate/core` v18 + `@ngx-translate/http-loader` v18 — v18 uses standalone component APIs (`TranslatePipe`, `provideTranslateService`) not NgModule (`TranslateModule` was removed) (SCRUM-35)
- Translation files at `frontend/src/assets/i18n/{es,en}.json` — 130 keys covering all 8 pages (login, dashboard, players, fixture, fees, admin fees, admin users, nav); loaded via HTTP at runtime (SCRUM-35)
- Browser language auto-detected via `TranslateService.getBrowserLang()` in `AppComponent` constructor — matches against `es|en`, falls back to `'es'` for unsupported languages (SCRUM-35)
- Default and fallback language is Spanish (`es`) — configured in `provideTranslateService({ lang: 'es', fallbackLang: 'es' })` in `app.config.ts` (SCRUM-35)
- Error messages in components use `translate.instant('KEY')` for synchronous translation — UI text in templates uses `{{ 'KEY' | translate }}` pipe (SCRUM-35)
- Database-driven content (category names, player names, club names, division names) remains untranslated — only UI chrome is translated (SCRUM-35)
- Test helper `frontend/src/app/testing/translate-testing.ts` provides `provideTranslateTesting()` and `setupTestTranslations()` — loads English translations in test environment so text assertions match (SCRUM-35)
- Fixture component date formatting uses locale based on current language: `es` → `es-AR`, `en` → `en-GB` (SCRUM-35)
- Away match detection uses `match.awayTeam.clubName.includes(environment.clubName)` from fixture data — `environment.clubName = 'Club Empleados de Comercio'` (SCRUM-38)
- Admin fees page uses page-level tabs (`Match Fee` / `League Fee` / `Travel`) to switch between payment types — travel tab shows Away/Local badge based on fixture data (SCRUM-38, updated SCRUM-41)
- Player fees page shows a breakdown card: match fee row + league fee row + travel row (when applicable) + individual Pay buttons per type + "Pay All" button for combined unpaid amount — Pay All creates a single MP preference with combined amount and comma-separated playerFeeIds in external_reference (SCRUM-38, updated SCRUM-41)
- Dashboard play eligibility requires all configured fee types (match + league + travel when they exist) to be paid — status pills (`Match: Paid/Pending`, `League: Paid/Pending`, `Travel: Paid/Pending`) shown inside the play status card (SCRUM-38, updated SCRUM-41)
- `GET /api/payments` for non-admin users returns all fee types via `getAllCurrentFeesByCategory` — frontend separates them by `type` field client-side (SCRUM-38, updated SCRUM-41)
- `PaymentType = 'match' | 'league' | 'travel'` replaces old `FeeType = 'fee' | 'travel'` — each type stored in its own pair of DB tables (`match_fees` + `match_player_fees`, etc.) instead of a single `category_fees` table with type discriminator (SCRUM-41)
- `TABLE_CONFIGS: Record<PaymentType, TableConfig>` pattern in `paymentService.ts` — all service functions are DRY across the 3 fee types using config-driven table/column names (SCRUM-41)
- League fee uses monthly periods (`month_start_date`, 1st of month) vs weekly periods (`week_start_date`, Monday) for match and travel fees (SCRUM-41)
- `resetWeeklyFees()` only resets match and travel types (weekly) — league fees are monthly and managed manually by admin (SCRUM-41)
- API routes renamed from `/api/fees/*` to `/api/payments/*` — nav labels renamed from "Fees"/"My Fees" to "Payments"/"My Payments" (SCRUM-41)
- Backend types moved from `backend/src/lib/types/fee.ts` to `backend/src/lib/types/payment.ts` — service renamed from `feeService` to `paymentService` (SCRUM-41)
- Dashboard fee collection charts use client-side tab filtering (`feeActiveTab` + `allFees` array) — no additional API call on tab switch; `setFeeTab()` destroys old Chart.js instances before re-rendering to prevent memory leaks (SCRUM-43)
- `FeeChartData` interface extended with `type: PaymentType` field to support tab-based filtering — dashboard stores full `allFees` array and derives `feeCharts` via `updateFeeCharts()` (SCRUM-43)
