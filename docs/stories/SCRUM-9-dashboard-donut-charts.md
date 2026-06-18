# SCRUM-9: Dashboard home page with donut charts for player status per category

## User Story
As a **user**, I want a **dashboard home page with donut charts showing active vs inactive players per category** so that I can quickly see the status distribution across all team divisions.

## Context
The app already has player data with `active`/`inactive` status and categories. This dashboard provides a visual overview — one donut chart per category — making it easy to spot categories with many inactive players at a glance.

## Acceptance Criteria
- [ ] Given I navigate to `/`, then I am redirected to `/dashboard`
- [ ] Given the dashboard loads, then I see one donut chart for each category
- [ ] Given a donut chart, then it shows two segments: green for active players, red for inactive players
- [ ] Given a donut chart, then it displays the category name as the chart title
- [ ] Given a donut chart, then it shows the count of active and inactive players (as labels or legend)
- [ ] Given a category with no players, then the chart shows an empty state (e.g., "No players" text instead of a chart)
- [ ] Given the API fails, then an error state is displayed

## Technical Notes
- **New page**: `frontend/src/app/pages/dashboard/dashboard.component.{ts,html,spec.ts}`
- **Route**: `/dashboard` as default route, redirect `/` to `/dashboard`
- **Charting library**: Use a lightweight library (e.g., `ngx-charts` or `Chart.js` with `ng2-charts`)
- **Data**: Fetch all categories via `GET /api/categories`, then fetch players per category via `GET /api/players?categoryId=X` — aggregate counts client-side
- **Backend**: No new endpoints needed — existing API is sufficient
- **Colors**: Green (`#22c55e`) for active, Red (`#ef4444`) for inactive (matching existing Tailwind badge colors)

## Out of Scope
- Clicking a chart to navigate to the category's player list
- Additional statistics (total players, percentages)
- Real-time updates or polling
- Dark mode styling

## Definition of Done
- [ ] Dashboard page implemented with donut charts
- [ ] Route configured as home page
- [ ] Unit tests (>=70% coverage)
- [ ] Component tests for all states (loading, data, empty, error)
- [ ] E2E test for the main flow
- [ ] Docs updated
