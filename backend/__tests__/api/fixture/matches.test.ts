import { GET } from '@/app/api/fixture/matches/route';
import { fixtureService } from '@/lib/services/fixtureService';
import { userService } from '@/lib/services/userService';
import { FixtureMatch } from '@/lib/types/fixture';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/fixtureService');
jest.mock('@/lib/services/userService');

const mockedFixtureService = fixtureService as jest.Mocked<typeof fixtureService>;
const mockedUserService = userService as jest.Mocked<typeof userService>;

function createRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost:3000/api/fixture/matches', { headers });
}

const MOCK_MATCHES: FixtureMatch[] = [
  {
    id: 207519,
    status: 'completed',
    date: '2026-06-06T13:30:00Z',
    venue: 'Bigornia',
    round: 1,
    homeTeam: { clubId: 3, clubName: 'Bigornia Club' },
    awayTeam: { clubId: 5, clubName: 'Club Empleados de Comercio' },
    score: { home: 2, away: 2 },
  },
  {
    id: 208130,
    status: 'pending',
    date: '2026-06-20T03:00:00Z',
    venue: 'C.E.C. Hockey',
    round: 3,
    homeTeam: { clubId: 5, clubName: 'Club Empleados de Comercio' },
    awayTeam: { clubId: 12, clubName: 'Trelew R.C.' },
    score: null,
  },
];

describe('GET /api/fixture/matches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserService.verifyToken.mockReturnValue({ userId: 'u1', role: 'admin' });
  });

  it('should return matches from fixtureService', async () => {
    mockedFixtureService.getMatches.mockResolvedValue(MOCK_MATCHES);

    const response = await GET(createRequest('Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(MOCK_MATCHES);
    expect(mockedFixtureService.getMatches).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no matches exist', async () => {
    mockedFixtureService.getMatches.mockResolvedValue([]);

    const response = await GET(createRequest('Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it('should return 500 when service throws', async () => {
    mockedFixtureService.getMatches.mockRejectedValue(
      new Error('Failed to fetch matches: 500 Internal Server Error')
    );

    const response = await GET(createRequest('Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch fixture matches');
  });

  it('should return 401 without auth', async () => {
    const response = await GET(createRequest());
    expect(response.status).toBe(401);
  });
});
