import { GET } from '@/app/api/fixture/divisions/route';
import { fixtureService } from '@/lib/services/fixtureService';
import { userService } from '@/lib/services/userService';
import { FixtureDivision } from '@/lib/types/fixture';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/fixtureService');
jest.mock('@/lib/services/userService');

const mockedFixtureService = fixtureService as jest.Mocked<typeof fixtureService>;
const mockedUserService = userService as jest.Mocked<typeof userService>;

function createRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost:3000/api/fixture/divisions', { headers });
}

const MOCK_DIVISIONS: FixtureDivision[] = [
  { id: 206754, name: 'Caballeros Primera' },
  { id: 206752, name: 'Mixto Sub 14 A' },
  { id: 206753, name: 'Mixto Sub 16 A' },
];

describe('GET /api/fixture/divisions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserService.verifyToken.mockReturnValue({ userId: 'u1', role: 'admin' });
  });

  it('should return divisions from fixtureService', async () => {
    mockedFixtureService.getDivisions.mockResolvedValue(MOCK_DIVISIONS);

    const response = await GET(createRequest('Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(MOCK_DIVISIONS);
    expect(mockedFixtureService.getDivisions).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no divisions exist', async () => {
    mockedFixtureService.getDivisions.mockResolvedValue([]);

    const response = await GET(createRequest('Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it('should return 500 when service throws', async () => {
    mockedFixtureService.getDivisions.mockRejectedValue(
      new Error('Failed to fetch divisions: 500 Internal Server Error')
    );

    const response = await GET(createRequest('Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch fixture divisions');
  });

  it('should return 401 without auth', async () => {
    const response = await GET(createRequest());
    expect(response.status).toBe(401);
  });
});
