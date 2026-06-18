# Players List by Category

## User Story
As a team manager/viewer, I want to see a list of players grouped by category so that I can quickly check which players belong to each category and their current status.

## Context
First feature of the data-viewer app. Displays a sports team's player roster organized by categories (e.g., "Mixto Sub 14 A"). Each player has a status indicator (active/inactive). Data will be hardcoded initially; architecture must allow swapping in a REST API endpoint later.

## Acceptance Criteria
- [x] Given the app loads, when the user navigates to the players page, then a list of players is displayed for the selected category
- [x] Given multiple categories exist, when the user selects a different category, then the player list updates to show that category's players
- [x] Each player row shows: numbered badge (with status color), last name, and first name
- [x] Green badge = active player; Red badge = inactive/suspended player
- [x] Players are sorted alphabetically by last name
- [x] The page is responsive (mobile-friendly layout as shown in the reference)

## Technical Notes
- **Data**: Hardcoded player data initially (typed interfaces ready for API integration)
- **Frontend page**: `/players` route in Angular
- **Data model**: `Player { id, number, firstName, lastName, status, categoryId }`
- **Data model**: `Category { id, name }` (e.g., "Mixto Sub 14 A")
- **Category selector**: Dropdown or tab component to switch categories
- **Edge cases**: Empty category (no players), long names wrapping

## Out of Scope
- REST API integration (future ticket)
- Player detail page / click-through
- Player editing / CRUD operations
- Search or filtering beyond category selection

## Definition of Done
- [x] Feature implemented
- [x] Unit tests (>=70% coverage) — backend 100%, frontend 100%
- [x] Component tests (>=70% coverage) — 100%
- [x] E2E test for the main flow — 7 tests in cypress/e2e/SCRUM-6-players-list.cy.ts
- [x] Docs updated
- [ ] Jira ticket moved to Done
