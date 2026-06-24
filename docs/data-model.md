# Data Model

> Update this file when the source API endpoint is defined.

## Domain Models

### Player

Represents a team member in a specific category. Players are users with role `player` or `captain`.

```typescript
type PlayerStatus = 'active' | 'inactive';

interface Player {
  id: string;
  number: number | null;  // jersey number, optional
  firstName: string;
  lastName: string;
  status: PlayerStatus;   // hardcoded 'active' until monthly fee service is available
  categoryId: string;
  role: 'player' | 'captain';
}
```

- **Source**: PostgreSQL `users` table — queried with `WHERE role IN ('player', 'captain') AND category_id = $1`
- **Backend type**: `backend/src/lib/types/player.ts`
- **Frontend type**: `frontend/src/app/models/player.model.ts`

### Category

Groups players by team division (e.g., "Sub 14", "Primera", "Caballeros").

```typescript
interface Category {
  id: string;
  name: string;
}
```

- **Source**: PostgreSQL `categories` table — seeded with 6 categories on `initDatabase()`
- **Backend type**: `backend/src/lib/types/player.ts`
- **Frontend type**: `frontend/src/app/models/player.model.ts`

### FixtureMatch

Represents a single match in a tournament fixture.

```typescript
type MatchStatus = 'completed' | 'pending';

interface TeamInfo {
  clubId: number;
  clubName: string;
}

interface MatchScore {
  home: number;
  away: number;
}

interface FixtureMatch {
  id: number;
  status: MatchStatus;
  date: string;
  venue: string;
  round: number;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  score: MatchScore | null;
}
```

- **Source**: External API at `https://sistema.hockeychubut.com.ar/api/public/torneo/{tournamentId}/fixture/{fixtureId}/partido` — normalized from raw Spanish field names (`estado`, `cancha`, `instancia`, etc.). Tournament ID configured via `TOURNAMENT_ID` env var (default: `205151`), fixture ID passed as query param.
- **Backend type**: `backend/src/lib/types/fixture.ts`
- **Frontend type**: `frontend/src/app/models/fixture.model.ts`

### FixtureClub

Represents a club with its logo.

```typescript
interface FixtureClub {
  id: number;
  name: string;
  logo: string | null; // base64-encoded PNG
}
```

- **Source**: External API at `https://sistema.hockeychubut.com.ar/api/public/torneo/{tournamentId}/fixture/{fixtureId}/club`
- **Backend type**: `backend/src/lib/types/fixture.ts`
- **Frontend type**: `frontend/src/app/models/fixture.model.ts`

### FixtureDivision

Represents a fixture division/category within the tournament (e.g., "Mixto Sub 14 A", "Caballeros Primera").

```typescript
interface FixtureDivision {
  id: number;
  name: string;
}
```

- **Source**: External API at `https://sistema.hockeychubut.com.ar/api/public/torneo/{tournamentId}/fixture` — normalized from raw `nombre` field
- **Backend type**: `backend/src/lib/types/fixture.ts`
- **Frontend type**: `frontend/src/app/models/fixture.model.ts`

### StandingsEntry

Represents a single row in the standings table for a fixture division.

```typescript
interface StandingsEntry {
  position: number;
  clubId: number;
  clubName: string;
  clubLogo: string | null; // base64-encoded PNG
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}
```

- **Source**: External API at `https://sistema.hockeychubut.com.ar/api/public/torneo/{tournamentId}/fixture/{fixtureId}/tabla-posiciones` — normalized from Spanish field names (`posicion`, `nombreClub`, `puntos`, etc.)
- **Backend type**: `backend/src/lib/types/fixture.ts`
- **Frontend type**: `frontend/src/app/models/fixture.model.ts`

### FixtureRound

Groups matches by round number (frontend only).

```typescript
interface FixtureRound {
  number: number;
  matches: FixtureMatch[];
}
```

- **Frontend type**: `frontend/src/app/models/fixture.model.ts`

### CategoryChartData

View model for the dashboard donut charts — aggregated from Player data client-side.

```typescript
interface CategoryChartData {
  categoryName: string;
  activeCount: number;
  inactiveCount: number;
  isEmpty: boolean;
}
```

- **Source**: Computed in `frontend/src/app/pages/dashboard/dashboard.component.ts` from `GET /api/categories` + `GET /api/players?categoryId=X`
- **Frontend type**: `frontend/src/app/pages/dashboard/dashboard.component.ts`

### FeeChartData

View model for the admin dashboard fee collection donut charts — aggregated from `GET /api/fees` response.

```typescript
interface FeeChartData {
  categoryName: string;
  paidCount: number;
  unpaidCount: number;
  isEmpty: boolean;
}
```

- **Source**: Computed in `frontend/src/app/pages/dashboard/dashboard.component.ts` from `GET /api/fees` (admin only)
- **Frontend type**: `frontend/src/app/pages/dashboard/dashboard.component.ts`

### User

Represents an authenticated user in the system. Stored in PostgreSQL `users` table.

```typescript
type UserRole = 'admin' | 'player' | 'captain';

interface User {
  id: string;         // UUID, auto-generated
  email: string;      // unique
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  categoryId: string | null;    // links players/captains to their category
  playerNumber: number | null;  // jersey number, optional
}
```

- **Source**: PostgreSQL `users` table
- **Backend type**: `backend/src/lib/types/user.ts`
- **Frontend type**: `frontend/src/app/models/user.model.ts` (UserProfile only — no passwordHash)

### UserProfile

Safe projection of User — excludes `passwordHash`. Used in API responses and frontend state.

```typescript
interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  categoryId: string | null;
  playerNumber: number | null;
}
```

- **Source**: Derived from `User` in `userService.ts` via `userToProfile()`
- **Backend type**: `backend/src/lib/types/user.ts`
- **Frontend type**: `frontend/src/app/models/user.model.ts`

### AuthPayload

JWT token payload shape — embedded in signed tokens.

```typescript
interface AuthPayload {
  userId: string;
  role: UserRole;
}
```

- **Backend type**: `backend/src/lib/types/user.ts`

### CreateUserRequest

Request body for admin user creation endpoint.

```typescript
interface CreateUserRequest {
  email: string;
  password: string;
  role: 'admin' | 'player' | 'captain';
  firstName: string;
  lastName: string;
  categoryId: string | null;    // required when role is 'player' or 'captain'
  playerNumber?: number | null; // optional jersey number for player/captain
}
```

- **Backend validation**: `backend/src/app/api/users/route.ts` (manual field checks)
- **Frontend type**: `frontend/src/app/services/user.service.ts`

### UpdateUserRequest

Request body for admin user update endpoint. Password is optional — only updated if provided.

```typescript
interface UpdateUserRequest {
  email: string;
  role: 'admin' | 'player' | 'captain';
  firstName: string;
  lastName: string;
  categoryId: string | null; // required when role is 'player' or 'captain'; cleared for admin
  password?: string;         // optional — only hashes if provided
}
```

- **Backend validation**: `backend/src/app/api/users/[id]/route.ts` (manual field checks)
- **Frontend type**: `frontend/src/app/services/user.service.ts`

### CategoryFee

Represents the fee configuration for a category in a given week. Per-player amount is auto-calculated from `totalAmount / availablePlayers`.

```typescript
type FeeStatus = 'pending' | 'paid';

interface CategoryFee {
  id: string;            // UUID
  categoryId: string;
  categoryName: string;  // resolved from playerService
  totalAmount: number;
  availablePlayers: number;
  perPlayerAmount: number; // auto-calculated
  weekStartDate: string;  // Monday of the week (YYYY-MM-DD)
  createdBy: string;      // admin user UUID
  createdAt: string;
}
```

- **Source**: PostgreSQL `category_fees` table (UNIQUE on `category_id` + `week_start_date`)
- **Backend type**: `backend/src/lib/types/fee.ts`
- **Frontend type**: `frontend/src/app/models/fee.model.ts`

### PlayerFee

Tracks individual player payment status for a given category fee period.

```typescript
interface PlayerFee {
  id: string;            // UUID
  categoryFeeId: string; // links to CategoryFee
  userId: string;        // links to User
  playerName: string;    // "LastName, FirstName" — joined from users table
  status: FeeStatus;     // 'pending' | 'paid'
  paidAt: string | null;
}
```

- **Source**: PostgreSQL `player_fees` table (UNIQUE on `category_fee_id` + `user_id`)
- **Backend type**: `backend/src/lib/types/fee.ts`
- **Frontend type**: `frontend/src/app/models/fee.model.ts`

### CategoryFeeWithPlayers

Extended fee view with player fee details and aggregate counts. Used in API responses.

```typescript
interface CategoryFeeWithPlayers extends CategoryFee {
  playerFees: PlayerFee[];
  paidCount: number;
  unpaidCount: number;
}
```

- **Backend type**: `backend/src/lib/types/fee.ts`
- **Frontend type**: `frontend/src/app/models/fee.model.ts` (as `CategoryFee` — includes player fees)

### CaptainMpConfig

Stores a captain's Mercado Pago access token for their category. One config per category — payments from players in that category route to this MP account.

```typescript
interface CaptainMpConfig {
  id: string;          // UUID
  categoryId: string;  // links to category
  accessToken: string; // captain's MP access token
  updatedAt: string;   // last time the token was updated
}
```

- **Source**: PostgreSQL `captain_mp_config` table (UNIQUE on `category_id`)
- **Backend type**: `backend/src/lib/types/fee.ts`

### PaymentPreferenceResult

Returned by `POST /api/fees/pay` — contains Mercado Pago Checkout Pro URLs for the player to complete payment.

```typescript
interface PaymentPreferenceResult {
  preferenceId: string;    // MP preference ID
  initPoint: string;       // production checkout URL
  sandboxInitPoint: string; // sandbox checkout URL
}
```

- **Backend type**: `backend/src/lib/types/fee.ts`
- **Frontend type**: `frontend/src/app/models/fee.model.ts`

## API Response Wrappers

```typescript
interface LoginResponse {
  token: string;
  user: UserProfile;
}

interface PlayersResponse {
  data: Player[];
  category: Category | null;
}

interface CategoriesResponse {
  data: Category[];
}

interface FixtureDivisionsResponse {
  data: FixtureDivision[];
}

interface FixtureStandingsResponse {
  data: StandingsEntry[];
}
```

## Source Data (from external API — Hockey Chubut)

The external API returns raw data in Spanish. The backend service normalizes these into domain types above.

```typescript
interface RawMatch {
  id: number;
  estado: string;       // "CERRADO" | "PENDIENTE"
  fecha: string;        // ISO 8601
  resultado: { golLocal: number; golVisitante: number } | null;
  cancha: { id: number; nombre: string };
  local: { id: number; nombre: string; club: { id: number; razonSocial: string } };
  visitante: { id: number; nombre: string; club: { id: number; razonSocial: string } };
  instancia: { id: number; numero: number };
}

interface RawClubWithLogo {
  id: number;
  razonSocial: string;
  logo: string | null;  // base64-encoded PNG
}

interface RawFixtureDivision {
  id: number;
  nombre: string;
}

interface RawStandingsEntry {
  clubId: number;
  nombreClub: string;
  logoClub: string | null;
  posicion: number;
  puntos: number;
  partidosJugados: number;
  partidosGanados: number;
  partidosEmpatados: number;
  partidosPerdidos: number;
  golesFavor: number;
  golesContra: number;
  diferenciaGoles: number;
}
```
