import { GET } from '@/app/api/fixture/instances/route';
import { fixtureService } from '@/lib/services/fixtureService';
import { userService } from '@/lib/services/userService';
import { FixtureInstance } from '@/lib/types/fixture';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/fixtureService');
jest.mock('@/lib/services/userService');

const mockedFixtureService = fixtureService as jest.Mocked<typeof fixtureService>;
const mockedUserService = userService as jest.Mocked<typeof userService>;

function createRequest(fixtureId?: string, authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;
  const query = fixtureId ? `?fixtureId=${fixtureId}` : '';
  return new NextRequest(`http://localhost:3000/api/fixture/instances${query}`, { headers });
}

const MOCK_INSTANCES: FixtureInstance[] = [
  { id: 207306, description: 'Fecha 1', date: '2026-06-06T13:30:00Z', round: 1 },
  { id: 207304, description: 'Fecha 3', date: '2026-06-20T03:00:00Z', round: 3 },
];

describe('GET /api/fixture/instances', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserService.verifyToken.mockReturnValue({ userId: 'u1', role: 'admin' });
  });

  it('should return instances for the given fixtureId', async () => {
    mockedFixtureService.getInstances.mockResolvedValue(MOCK_INSTANCES);

    const response = await GET(createRequest('206752', 'Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(MOCK_INSTANCES);
    expect(mockedFixtureService.getInstances).toHaveBeenCalledWith(206752);
  });

  it('should return empty array when no instances exist', async () => {
    mockedFixtureService.getInstances.mockResolvedValue([]);

    const response = await GET(createRequest('206752', 'Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it('should return 400 when fixtureId is missing', async () => {
    const response = await GET(createRequest(undefined, 'Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('fixtureId query parameter is required');
  });

  it('should return 400 when fixtureId is not a number', async () => {
    const response = await GET(createRequest('abc', 'Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('fixtureId must be a number');
  });

  it('should return 500 when service throws', async () => {
    mockedFixtureService.getInstances.mockRejectedValue(
      new Error('Failed to fetch instances: 500 Internal Server Error')
    );

    const response = await GET(createRequest('206752', 'Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch fixture instances');
  });

  it('should return 401 without auth', async () => {
    const response = await GET(createRequest('206752'));
    expect(response.status).toBe(401);
  });
});
