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

## Source Data (from external API)

> Replace with actual structure once endpoint is known.

```typescript
interface SourceItem {
  id: string;
  // fields from the API
}
```
