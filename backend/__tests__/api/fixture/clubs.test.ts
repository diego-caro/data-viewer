import { GET } from '@/app/api/fixture/clubs/route';
import { fixtureService } from '@/lib/services/fixtureService';
import { userService } from '@/lib/services/userService';
import { FixtureClub } from '@/lib/types/fixture';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/fixtureService');
jest.mock('@/lib/services/userService');

const mockedFixtureService = fixtureService as jest.Mocked<typeof fixtureService>;
const mockedUserService = userService as jest.Mocked<typeof userService>;

function createRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost:3000/api/fixture/clubs', { headers });
}

const MOCK_CLUBS: FixtureClub[] = [
  { id: 3, name: 'Bigornia Club', logo: 'base64data1' },
  { id: 5, name: 'Club Empleados de Comercio', logo: null },
  { id: 12, name: 'Trelew R.C.', logo: 'base64data3' },
];

describe('GET /api/fixture/clubs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserService.verifyToken.mockReturnValue({ userId: 'u1', role: 'admin' });
  });

  it('should return clubs from fixtureService', async () => {
    mockedFixtureService.getClubs.mockResolvedValue(MOCK_CLUBS);

    const response = await GET(createRequest('Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(MOCK_CLUBS);
    expect(mockedFixtureService.getClubs).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no clubs exist', async () => {
    mockedFixtureService.getClubs.mockResolvedValue([]);

    const response = await GET(createRequest('Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it('should return 500 when service throws', async () => {
    mockedFixtureService.getClubs.mockRejectedValue(
      new Error('Failed to fetch clubs: 503 Service Unavailable')
    );

    const response = await GET(createRequest('Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch fixture clubs');
  });

  it('should return 401 without auth', async () => {
    const response = await GET(createRequest());
    expect(response.status).toBe(401);
  });
});
