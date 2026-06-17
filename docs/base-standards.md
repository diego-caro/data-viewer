# Base Standards

## Language & Framework
- TypeScript strict mode — no `any`, no implicit types
- Next.js 14 App Router — backend and API routes
- Angular — frontend UI and components
- Tailwind CSS for all styling — no inline styles, no CSS modules unless justified

## Testing Requirements
- **Minimum 70% code coverage** for all new code — both frontend and backend
- Write tests before implementation (TDD)
- Every API route must have unit tests
- Every UI component must have component tests (Angular TestBed)
- E2E tests (Cypress) for critical user flows

## Code Quality
- Functions must be small and single-purpose
- No magic numbers or strings — use constants
- Error handling is mandatory on all async operations
- All API responses must be typed with interfaces or zod schemas

## Commits
- Conventional commits: `feat:`, `fix:`, `test:`, `refactor:`, `chore:`
- One logical change per commit
- Commit message body explains the "why", not the "what"

## Data Fetching
- All external API calls go through a service layer (`/lib/services/`)
- Never fetch directly inside components
- Handle loading, error, and empty states explicitly

## Coverage Enforcement
- Run `jest --coverage` after every implementation task
- Frontend: `npx jest --testPathPattern="components|services|pipes" --coverage`
- Backend: `npx jest --testPathPattern=api --coverage`
- If coverage drops below 70%, the task is not complete
