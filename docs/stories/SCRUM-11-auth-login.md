# SCRUM-11: Auth infrastructure + Login page with PostgreSQL and JWT

## User Story
As a **user**, I want to **log in with my credentials** so that the app can identify me and show me the appropriate content based on my role.

## Context
The app currently has no authentication — all pages are publicly accessible. Adding auth is the foundation for role-based access (admin vs player). This ticket sets up the database, auth API, and login UI. A default admin account is seeded on first run so the system is immediately usable.

## Acceptance Criteria
- [ ] Given the backend starts for the first time, then a default admin user is created (seeded)
- [ ] Given I navigate to any page without being logged in, then I am redirected to `/login`
- [ ] Given I am on `/login`, then I see a form with email and password fields
- [ ] Given I enter valid credentials, then I am redirected to `/dashboard` and see my name in the nav
- [ ] Given I enter invalid credentials, then I see an error message "Invalid email or password"
- [ ] Given I am logged in, then my JWT is stored and sent with all API requests
- [ ] Given I click "Logout", then my session is cleared and I am redirected to `/login`
- [ ] Given the JWT expires or is invalid, then I am redirected to `/login`

## Technical Notes
- **Database**: PostgreSQL with `pg` (node-postgres) or Prisma ORM
- **Connection**: `DATABASE_URL` env var in `backend/.env.local`
- **User table**: `id` (UUID), `email` (unique), `passwordHash`, `role` (admin|player), `firstName`, `lastName`, `categoryId` (nullable — links players to their category)
- **Password**: Hash with `bcrypt`
- **JWT**: `jsonwebtoken` — signed tokens with `{ userId, role }` payload, short expiry (e.g., 8h)
- **New API routes**:
  - `POST /api/auth/login` — validates credentials, returns JWT + user profile
  - `GET /api/auth/me` — returns current user from JWT (used on app load)
- **Frontend**:
  - Login page: `frontend/src/app/pages/login/login.component.{ts,html,spec.ts}`
  - Auth service: `frontend/src/app/services/auth.service.ts` — login, logout, token storage
  - HTTP interceptor: attaches `Authorization: Bearer <token>` to all API requests
  - Auth guard: redirects unauthenticated users to `/login`
- **Seed**: On backend startup, check if users table is empty → create default admin (email: `admin@cec.com`, password: `admin123`)
- **Colors**: Login page should match existing Tailwind design (gray-50 bg, white card, blue-500 buttons)

## Out of Scope
- User registration (admin creates users — SCRUM-12)
- Role-based view restrictions (SCRUM-12)
- Password reset / "forgot password" flow
- OAuth / social login
- Refresh tokens

## Definition of Done
- [ ] PostgreSQL database initialized on backend start
- [ ] Auth API endpoints implemented with tests
- [ ] Login page implemented with all states (form, loading, error)
- [ ] JWT flow working end-to-end
- [ ] Unit tests (>=70% coverage)
- [ ] Component tests for login page
- [ ] E2E test for login flow
- [ ] Docs updated
