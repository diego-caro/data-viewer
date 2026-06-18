import { GET } from '@/app/api/fixture/matches/route';
import { fixtureService } from '@/lib/services/fixtureService';
import { FixtureMatch } from '@/lib/types/fixture';

jest.mock('@/lib/services/fixtureService');

const mockedFixtureService = fixtureService as jest.Mocked<typeof fixtureService>;

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
  });

  it('should return matches from fixtureService', async () => {
    mockedFixtureService.getMatches.mockResolvedValue(MOCK_MATCHES);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(MOCK_MATCHES);
    expect(mockedFixtureService.getMatches).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no matches exist', async () => {
    mockedFixtureService.getMatches.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it('should return 500 when service throws', async () => {
    mockedFixtureService.getMatches.mockRejectedValue(
      new Error('Failed to fetch matches: 500 Internal Server Error')
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch fixture matches');
  });
});
