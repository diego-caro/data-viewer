# Data Model

> Update this file when the source API endpoint is defined.

## Domain Models

### Player

Represents a team member in a specific category.

```typescript
type PlayerStatus = 'active' | 'inactive';

interface Player {
  id: string;
  number: number;
  firstName: string;
  lastName: string;
  status: PlayerStatus;
  categoryId: string;
}
```

- **Source**: Hardcoded in `backend/src/lib/services/playerService.ts` (will be replaced by external API)
- **Backend type**: `backend/src/lib/types/player.ts`
- **Frontend type**: `frontend/src/app/models/player.model.ts`

### Category

Groups players by team division (e.g., "Mixto Sub 14 A").

```typescript
interface Category {
  id: string;
  name: string;
}
```

- **Source**: Hardcoded in `backend/src/lib/services/playerService.ts`
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

- **Source**: External API at `https://sistema.hockeychubut.com.ar/api/public/torneo/205151/fixture/206752/partido` — normalized from raw Spanish field names (`estado`, `cancha`, `instancia`, etc.)
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

- **Source**: External API at `https://sistema.hockeychubut.com.ar/api/public/torneo/205151/fixture/206752/club`
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

## API Response Wrappers

```typescript
interface PlayersResponse {
  data: Player[];
  category: Category | null;
}

interface CategoriesResponse {
  data: Category[];
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
```
