import { fixtureService } from '@/lib/services/fixtureService';
import {
  RawMatch,
  RawClubWithLogo,
  FixtureMatch,
  FixtureClub,
} from '@/lib/types/fixture';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const RAW_MATCHES: RawMatch[] = [
  {
    id: 207519,
    estado: 'CERRADO',
    fecha: '2026-06-06T13:30:00Z',
    resultado: { id: 206854, golLocal: 2, golVisitante: 2 },
    cancha: { id: 1, nombre: 'Bigornia' },
    local: {
      id: 205206,
      nombre: 'Mixto Sub 14 A',
      club: { id: 3, razonSocial: 'Bigornia Club' },
    },
    visitante: {
      id: 205221,
      nombre: 'Mixto Sub 14 A',
      club: { id: 5, razonSocial: 'Club Empleados de Comercio' },
    },
    instancia: { id: 207306, numero: 1 },
  },
  {
    id: 208130,
    estado: 'PENDIENTE',
    fecha: '2026-06-20T03:00:00Z',
    resultado: null,
    cancha: { id: 5, nombre: 'C.E.C. Hockey' },
    local: {
      id: 205221,
      nombre: 'Mixto Sub 14 A',
      club: { id: 5, razonSocial: 'Club Empleados de Comercio' },
    },
    visitante: {
      id: 205252,
      nombre: 'Mixto Sub 14 A',
      club: { id: 12, razonSocial: 'Trelew R.C.' },
    },
    instancia: { id: 207304, numero: 3 },
  },
];

const RAW_CLUBS: RawClubWithLogo[] = [
  { id: 3, razonSocial: 'Bigornia Club', logo: 'base64data1' },
  { id: 5, razonSocial: 'Club Empleados de Comercio', logo: null },
  { id: 12, razonSocial: 'Trelew R.C.', logo: 'base64data3' },
];

describe('FixtureService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMatches', () => {
    it('should fetch and normalize matches from external API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => RAW_MATCHES,
      });

      const matches = await fixtureService.getMatches();

      expect(matches).toHaveLength(2);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should map completed match status from CERRADO', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [RAW_MATCHES[0]],
      });

      const matches = await fixtureService.getMatches();

      expect(matches[0].status).toBe('completed');
    });

    it('should map pending match status from PENDIENTE', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [RAW_MATCHES[1]],
      });

      const matches = await fixtureService.getMatches();

      expect(matches[0].status).toBe('pending');
    });

    it('should normalize match fields correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [RAW_MATCHES[0]],
      });

      const matches = await fixtureService.getMatches();
      const match = matches[0];

      expect(match).toEqual<FixtureMatch>({
        id: 207519,
        status: 'completed',
        date: '2026-06-06T13:30:00Z',
        venue: 'Bigornia',
        round: 1,
        homeTeam: { clubId: 3, clubName: 'Bigornia Club' },
        awayTeam: { clubId: 5, clubName: 'Club Empleados de Comercio' },
        score: { home: 2, away: 2 },
      });
    });

    it('should set score to null for pending matches', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [RAW_MATCHES[1]],
      });

      const matches = await fixtureService.getMatches();

      expect(matches[0].score).toBeNull();
    });

    it('should return empty array when API returns empty list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const matches = await fixtureService.getMatches();

      expect(matches).toEqual([]);
    });

    it('should throw when external API returns non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fixtureService.getMatches()).rejects.toThrow(
        'Failed to fetch matches: 500 Internal Server Error'
      );
    });

    it('should throw when fetch fails with network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fixtureService.getMatches()).rejects.toThrow('Network error');
    });
  });

  describe('getClubs', () => {
    it('should fetch and normalize clubs from external API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => RAW_CLUBS,
      });

      const clubs = await fixtureService.getClubs();

      expect(clubs).toHaveLength(3);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should normalize club fields correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [RAW_CLUBS[0]],
      });

      const clubs = await fixtureService.getClubs();

      expect(clubs[0]).toEqual<FixtureClub>({
        id: 3,
        name: 'Bigornia Club',
        logo: 'base64data1',
      });
    });

    it('should preserve null logo values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [RAW_CLUBS[1]],
      });

      const clubs = await fixtureService.getClubs();

      expect(clubs[0].logo).toBeNull();
    });

    it('should return empty array when API returns empty list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const clubs = await fixtureService.getClubs();

      expect(clubs).toEqual([]);
    });

    it('should throw when external API returns non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      await expect(fixtureService.getClubs()).rejects.toThrow(
        'Failed to fetch clubs: 503 Service Unavailable'
      );
    });
  });
});
