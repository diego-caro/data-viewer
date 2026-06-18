import { GET } from '@/app/api/fixture/clubs/route';
import { fixtureService } from '@/lib/services/fixtureService';
import { FixtureClub } from '@/lib/types/fixture';

jest.mock('@/lib/services/fixtureService');

const mockedFixtureService = fixtureService as jest.Mocked<typeof fixtureService>;

const MOCK_CLUBS: FixtureClub[] = [
  { id: 3, name: 'Bigornia Club', logo: 'base64data1' },
  { id: 5, name: 'Club Empleados de Comercio', logo: null },
  { id: 12, name: 'Trelew R.C.', logo: 'base64data3' },
];

describe('GET /api/fixture/clubs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return clubs from fixtureService', async () => {
    mockedFixtureService.getClubs.mockResolvedValue(MOCK_CLUBS);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(MOCK_CLUBS);
    expect(mockedFixtureService.getClubs).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no clubs exist', async () => {
    mockedFixtureService.getClubs.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it('should return 500 when service throws', async () => {
    mockedFixtureService.getClubs.mockRejectedValue(
      new Error('Failed to fetch clubs: 503 Service Unavailable')
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch fixture clubs');
  });
});
