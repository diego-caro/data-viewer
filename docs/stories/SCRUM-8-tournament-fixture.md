# SCRUM-8: Tournament Fixture Page — Match Results, Dates, Logos by Round

## User Story
As a **tournament follower**, I want to **view the full fixture of the current tournament grouped by round** so that I can **see match results, upcoming games, team logos, and venues at a glance**.

## Context
The Hockey Chubut association publishes tournament data via a public API. Currently there's no friendly way to visualize the fixture. This feature creates a standalone page that fetches match and club data from the external API and presents it in a modern, card-based UI grouped by round.

## Acceptance Criteria
- [ ] Given the fixture page loads, when data is fetched successfully, then matches are displayed **grouped by round** (Fecha 1, Fecha 2, etc.)
- [ ] Given a match is **completed** (estado = "CERRADO"), then the score is displayed prominently between the two team logos/names (e.g., Bigornia 2 - 2 Comercio)
- [ ] Given a match is **pending** (estado = "PENDIENTE"), then the scheduled date is shown instead of a score, with a visual indicator that the match hasn't been played yet
- [ ] Given the clubs endpoint returns logo data (base64), then each team's **logo** is displayed next to the team name in every match card
- [ ] Given each match has a `cancha` field, then the **venue name** is displayed on the match card
- [ ] Given the page is standalone, then it has its own route accessible from the app (e.g., `/fixture`)
- [ ] Given the user is on any screen size, then the fixture page is **responsive** (mobile-friendly)

## Technical Notes
- **Source endpoints (external)**:
  - Matches: `GET https://sistema.hockeychubut.com.ar/api/public/torneo/205151/fixture/206752/partido`
  - Clubs: `GET https://sistema.hockeychubut.com.ar/api/public/torneo/205151/fixture/206752/club`
- **Backend**: Create Next.js API routes that proxy these external endpoints (`/api/fixture/matches`, `/api/fixture/clubs`) to avoid CORS issues
- **Frontend**: Angular standalone page at route `/fixture`
- **Data mapping**: Match the `club.id` from the match's `local.club.id` / `visitante.club.id` to the clubs endpoint to get the logo
- **Logos**: Clubs endpoint returns base64-encoded PNG images — render as `<img src="data:image/png;base64,...">`
- **Grouping**: Use `instancia.numero` to group matches by round
- **Date handling**: Parse `fecha` (ISO 8601 UTC) and display in local timezone (Argentina, UTC-3)
- Edge cases:
  - `resultado` is `null` for pending matches
  - A club's `logo` field could be `null` — show a placeholder/fallback icon
  - Match dates with `T03:00:00Z` are date-only placeholders (midnight Argentina time) — display date only, not time

## Out of Scope
- Goal scorers / individual player stats per match
- Match detail view (clicking into a match)
- Standings/positions table
- Navigation integration with existing Players List
- Filtering or searching matches
- Live score updates / real-time refresh

## Definition of Done
- [ ] Feature implemented (backend proxy + frontend page)
- [ ] Unit tests (>=70% coverage)
- [ ] Component tests (>=70% coverage)
- [ ] E2E test for the main flow (page loads, rounds display, scores visible)
- [ ] Docs updated
- [ ] Jira ticket moved to Done
