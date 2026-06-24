import { GET } from '@/app/api/fixture/standings/route';
import { fixtureService } from '@/lib/services/fixtureService';
import { userService } from '@/lib/services/userService';
import { StandingsEntry } from '@/lib/types/fixture';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/fixtureService');
jest.mock('@/lib/services/userService');

const mockedFixtureService = fixtureService as jest.Mocked<typeof fixtureService>;
const mockedUserService = userService as jest.Mocked<typeof userService>;

function createRequest(fixtureId?: string, authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;
  const query = fixtureId ? `?fixtureId=${fixtureId}` : '';
  return new NextRequest(`http://localhost:3000/api/fixture/standings${query}`, { headers });
}

const MOCK_STANDINGS: StandingsEntry[] = [
  {
    position: 1,
    clubId: 1,
    clubName: 'Patoruzú Rugby Club',
    clubLogo: 'base64logo1',
    points: 9,
    played: 3,
    won: 3,
    drawn: 0,
    lost: 0,
    goalsFor: 8,
    goalsAgainst: 2,
    goalDifference: 6,
  },
  {
    position: 2,
    clubId: 6,
    clubName: 'Puerto Madryn Rugby Club',
    clubLogo: null,
    points: 6,
    played: 3,
    won: 2,
    drawn: 0,
    lost: 1,
    goalsFor: 7,
    goalsAgainst: 6,
    goalDifference: 1,
  },
];

describe('GET /api/fixture/standings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserService.verifyToken.mockReturnValue({ userId: 'u1', role: 'admin' });
  });

  it('should return standings for the given fixtureId', async () => {
    mockedFixtureService.getStandings.mockResolvedValue(MOCK_STANDINGS);

    const response = await GET(createRequest('206752', 'Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(MOCK_STANDINGS);
    expect(mockedFixtureService.getStandings).toHaveBeenCalledWith(206752);
  });

  it('should return empty array when no standings exist', async () => {
    mockedFixtureService.getStandings.mockResolvedValue([]);

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
    mockedFixtureService.getStandings.mockRejectedValue(
      new Error('Failed to fetch standings: 500 Internal Server Error')
    );

    const response = await GET(createRequest('206752', 'Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch fixture standings');
  });

  it('should return 401 without auth', async () => {
    const response = await GET(createRequest('206752'));
    expect(response.status).toBe(401);
  });
});
