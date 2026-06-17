# Data Model

> Update this file when the source API endpoint is defined.

## Source Data (from external API)
Document the shape of data received from the endpoint:

```typescript
// Replace with actual structure once endpoint is known
interface SourceItem {
  id: string
  // fields from the API
}
```

## Transformed / Visualization Data
Document how data is transformed for display:

```typescript
interface DisplayItem {
  id: string
  // fields after transformation/mapping
}
```

## API Response Wrapper
```typescript
interface ApiResponse<T> {
  data: T[]
  total: number
  page: number
}
```
