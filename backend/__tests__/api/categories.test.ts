import { GET } from '@/app/api/categories/route';
import { playerService } from '@/lib/services/playerService';
import { userService } from '@/lib/services/userService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/playerService');
jest.mock('@/lib/services/userService');

const mockedPlayerService = playerService as jest.Mocked<typeof playerService>;
const mockedUserService = userService as jest.Mocked<typeof userService>;

function createRequest(url: string, authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest(new URL(url, 'http://localhost:3000'), { headers });
}

describe('GET /api/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserService.verifyToken.mockReturnValue({ userId: 'u1', role: 'admin' });
  });

  it('should return all categories', async () => {
    const mockCategories = [
      { id: 'cat-1', name: 'Sub 14' },
      { id: 'cat-2', name: 'Sub 16' },
    ];

    mockedPlayerService.getCategories.mockResolvedValue(mockCategories);

    const response = await GET(createRequest('/api/categories', 'Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(mockCategories);
  });

  it('should return an empty array when no categories exist', async () => {
    mockedPlayerService.getCategories.mockResolvedValue([]);

    const response = await GET(createRequest('/api/categories', 'Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it('should return 401 without auth', async () => {
    const response = await GET(createRequest('/api/categories'));
    expect(response.status).toBe(401);
  });
});
