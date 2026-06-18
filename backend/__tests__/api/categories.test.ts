import { GET } from '@/app/api/categories/route';
import { playerService } from '@/lib/services/playerService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/playerService');

const mockedPlayerService = playerService as jest.Mocked<typeof playerService>;

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all categories', async () => {
    const mockCategories = [
      { id: 'cat-1', name: 'Mixto Sub 14 A' },
      { id: 'cat-2', name: 'Mixto Sub 14 B' },
    ];

    mockedPlayerService.getCategories.mockReturnValue(mockCategories);

    const response = await GET(createRequest('/api/categories'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(mockCategories);
  });

  it('should return an empty array when no categories exist', async () => {
    mockedPlayerService.getCategories.mockReturnValue([]);

    const response = await GET(createRequest('/api/categories'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });
});
