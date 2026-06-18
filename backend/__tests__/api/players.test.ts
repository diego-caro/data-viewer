import { GET } from '@/app/api/players/route';
import { playerService } from '@/lib/services/playerService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/playerService');

const mockedPlayerService = playerService as jest.Mocked<typeof playerService>;

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/players', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return players for a valid categoryId', async () => {
    const mockCategory = { id: 'cat-1', name: 'Mixto Sub 14 A' };
    const mockPlayers = [
      { id: 'p-01', number: 1, firstName: 'Mateo', lastName: 'Alvarez', status: 'active' as const, categoryId: 'cat-1' },
      { id: 'p-02', number: 2, firstName: 'Valentina', lastName: 'Bravo', status: 'active' as const, categoryId: 'cat-1' },
    ];

    mockedPlayerService.getCategoryById.mockReturnValue(mockCategory);
    mockedPlayerService.getPlayersByCategory.mockReturnValue(mockPlayers);

    const response = await GET(createRequest('/api/players?categoryId=cat-1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(mockPlayers);
    expect(body.category).toEqual(mockCategory);
    expect(mockedPlayerService.getPlayersByCategory).toHaveBeenCalledWith('cat-1');
  });

  it('should return 400 when categoryId is missing', async () => {
    const response = await GET(createRequest('/api/players'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it('should return 404 when category does not exist', async () => {
    mockedPlayerService.getCategoryById.mockReturnValue(null);

    const response = await GET(createRequest('/api/players?categoryId=non-existent'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBeDefined();
  });

  it('should return empty data array when category exists but has no players', async () => {
    const mockCategory = { id: 'cat-empty', name: 'Empty Category' };
    mockedPlayerService.getCategoryById.mockReturnValue(mockCategory);
    mockedPlayerService.getPlayersByCategory.mockReturnValue([]);

    const response = await GET(createRequest('/api/players?categoryId=cat-empty'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.category).toEqual(mockCategory);
  });
});
