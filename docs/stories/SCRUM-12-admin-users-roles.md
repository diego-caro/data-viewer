# SCRUM-12: Admin user management + Role-based views

## User Story
As an **admin**, I want to **create user accounts and assign roles** so that I control who accesses the app, and **players see only their own data**.

## Context
With auth in place (SCRUM-11), admins need a way to create player accounts. Players should only see data for their own category. Admins see everything. This introduces role-based access control across existing pages.

## Acceptance Criteria
- [ ] Given I am an admin, then I see an "Admin" section in the navigation menu
- [ ] Given I navigate to `/admin/users`, then I see a list of all users with their name, email, role, and category
- [ ] Given I click "New User", then I see a form with fields: first name, last name, email, password, role (dropdown), category (dropdown, required for player role)
- [ ] Given I submit a valid user form, then the user is created and appears in the list
- [ ] Given I submit a form with a duplicate email, then I see an error "Email already exists"
- [ ] Given I am a player, then I do NOT see the "Admin" menu item
- [ ] Given I am a player, then the dashboard only shows my category's chart
- [ ] Given I am a player, then the players list only shows my category (no category selector)
- [ ] Given I am a player and I try to navigate to `/admin/users`, then I am redirected to `/dashboard`

## Technical Notes
- **New API routes**:
  - `POST /api/users` — admin-only, creates a user with role and categoryId
  - `GET /api/users` — admin-only, lists all users
- **Middleware**: Auth middleware that checks JWT and role on protected routes
- **Frontend**:
  - Admin users page: `frontend/src/app/pages/admin/users/users.component.{ts,html,spec.ts}`
  - Role guard: checks user role, redirects non-admins from `/admin/*`
  - Modify existing components: dashboard and players pages filter by `categoryId` for player role
  - Navigation: conditionally show/hide menu items based on role
- **Depends on**: SCRUM-11 (Auth infrastructure + Login page)

## Out of Scope
- Edit/delete users
- Player self-service (change password, update profile)
- Role-based restrictions on the fixture page (both roles see it)
- Audit log of user actions

## Definition of Done
- [ ] User management API implemented with admin-only access
- [ ] Admin users page with create form
- [ ] Role-based route guards
- [ ] Existing pages filtered by role
- [ ] Unit tests (>=70% coverage)
- [ ] Component tests for admin page
- [ ] E2E test for user creation + role-based access
- [ ] Docs updated
