import { GET } from '@/app/api/fixture/fixtures/route';
import { fixtureService } from '@/lib/services/fixtureService';
import { userService } from '@/lib/services/userService';
import { FixtureRound } from '@/lib/types/fixture';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/fixtureService');
jest.mock('@/lib/services/userService');

const mockedFixtureService = fixtureService as jest.Mocked<typeof fixtureService>;
const mockedUserService = userService as jest.Mocked<typeof userService>;

function createRequest(fixtureId?: string, authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;
  const query = fixtureId ? `?fixtureId=${fixtureId}` : '';
  return new NextRequest(`http://localhost:3000/api/fixture/fixtures${query}`, { headers });
}

const MOCK_ROUNDS: FixtureRound[] = [
  {
    date: '2026-06-06T13:30:00Z',
    description: 'Fecha 1',
    round: 1,
    matches: [
      {
        id: 207519,
        status: 'completed',
        date: '2026-06-06T13:30:00Z',
        venue: 'Bigornia',
        instance: 207306,
        homeTeam: { clubId: 3, clubName: 'Bigornia Club', logo: 'base64data1' },
        awayTeam: { clubId: 5, clubName: 'Club Empleados de Comercio', logo: null },
        score: { home: 2, away: 2 },
      },
    ],
  },
  {
    date: '2026-06-20T03:00:00Z',
    description: 'Fecha 3',
    round: 3,
    matches: [
      {
        id: 208130,
        status: 'pending',
        date: '2026-06-20T03:00:00Z',
        venue: 'C.E.C. Hockey',
        instance: 207304,
        homeTeam: { clubId: 5, clubName: 'Club Empleados de Comercio', logo: null },
        awayTeam: { clubId: 12, clubName: 'Trelew R.C.', logo: 'base64data3' },
        score: null,
      },
    ],
  },
];

describe('GET /api/fixture/fixtures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserService.verifyToken.mockReturnValue({ userId: 'u1', role: 'admin' });
  });

  it('should return grouped fixture rounds for the given fixtureId', async () => {
    mockedFixtureService.getFixtures.mockResolvedValue(MOCK_ROUNDS);

    const response = await GET(createRequest('206752', 'Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(MOCK_ROUNDS);
    expect(mockedFixtureService.getFixtures).toHaveBeenCalledWith(206752);
  });

  it('should return empty array when no rounds exist', async () => {
    mockedFixtureService.getFixtures.mockResolvedValue([]);

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
    mockedFixtureService.getFixtures.mockRejectedValue(
      new Error('Failed to fetch matches: 500 Internal Server Error')
    );

    const response = await GET(createRequest('206752', 'Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch fixture results');
  });

  it('should return 401 without auth', async () => {
    const response = await GET(createRequest('206752'));
    expect(response.status).toBe(401);
  });
});
