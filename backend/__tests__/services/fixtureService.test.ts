import { fixtureService } from '@/lib/services/fixtureService';
import {
  RawMatch,
  RawClubWithLogo,
  RawFixtureDivision,
  RawStandingsEntry,
  RawInstance,
  FixtureMatch,
  FixtureClub,
  FixtureDivision,
  StandingsEntry,
  FixtureInstance,
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

const RAW_DIVISIONS: RawFixtureDivision[] = [
  { id: 206754, nombre: 'Caballeros Primera' },
  { id: 206752, nombre: 'Mixto Sub 14 A' },
  { id: 206753, nombre: 'Mixto Sub 16 A' },
];

const RAW_STANDINGS: RawStandingsEntry[] = [
  {
    clubId: 1,
    nombreClub: 'Patoruzú Rugby Club',
    logoClub: 'base64logo1',
    posicion: 1,
    puntos: 9,
    partidosJugados: 3,
    partidosGanados: 3,
    partidosEmpatados: 0,
    partidosPerdidos: 0,
    golesFavor: 8,
    golesContra: 2,
    diferenciaGoles: 6,
  },
  {
    clubId: 6,
    nombreClub: 'Puerto Madryn Rugby Club',
    logoClub: null,
    posicion: 2,
    puntos: 6,
    partidosJugados: 3,
    partidosGanados: 2,
    partidosEmpatados: 0,
    partidosPerdidos: 1,
    golesFavor: 7,
    golesContra: 6,
    diferenciaGoles: 1,
  },
];

const RAW_INSTANCES: RawInstance[] = [
  { id: 207304, fecha: '2026-06-20T03:00:00Z', descripcion: 'Fecha 3', numero: 3 },
  { id: 207306, fecha: '2026-06-06T13:30:00Z', descripcion: 'Fecha 1', numero: 1 },
];

const TOURNAMENT_ID = '205151';
const BASE_URL = `https://sistema.hockeychubut.com.ar/api/public/torneo/${TOURNAMENT_ID}`;

describe('FixtureService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TOURNAMENT_ID = TOURNAMENT_ID;
  });

  afterEach(() => {
    delete process.env.TOURNAMENT_ID;
  });

  describe('getMatches', () => {
    it('should fetch matches using fixtureId and tournament env var', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => RAW_MATCHES,
      });

      await fixtureService.getMatches(206752);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/fixture/206752/partido`
      );
    });

    it('should fetch and normalize matches from external API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => RAW_MATCHES,
      });

      const matches = await fixtureService.getMatches(206752);

      expect(matches).toHaveLength(2);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should map completed match status from CERRADO', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [RAW_MATCHES[0]],
      });

      const matches = await fixtureService.getMatches(206752);

      expect(matches[0].status).toBe('completed');
    });

    it('should map pending match status from PENDIENTE', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [RAW_MATCHES[1]],
      });

      const matches = await fixtureService.getMatches(206752);

      expect(matches[0].status).toBe('pending');
    });

    it('should normalize match fields correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [RAW_MATCHES[0]],
      });

      const matches = await fixtureService.getMatches(206752);
      const match = matches[0];

      expect(match).toEqual<FixtureMatch>({
        id: 207519,
        status: 'completed',
        date: '2026-06-06T13:30:00Z',
        venue: 'Bigornia',
        instance: 207306,
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

      const matches = await fixtureService.getMatches(206752);

      expect(matches[0].score).toBeNull();
    });

    it('should return empty array when API returns empty list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const matches = await fixtureService.getMatches(206752);

      expect(matches).toEqual([]);
    });

    it('should throw when external API returns non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fixtureService.getMatches(206752)).rejects.toThrow(
        'Failed to fetch matches: 500 Internal Server Error'
      );
    });

    it('should throw when fetch fails with network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fixtureService.getMatches(206752)).rejects.toThrow('Network error');
    });

    it('should use default tournament ID when env var is not set', async () => {
      delete process.env.TOURNAMENT_ID;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fixtureService.getMatches(206752);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/fixture/206752/partido`
      );
    });
  });

  describe('getClubs', () => {
    it('should fetch clubs using fixtureId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => RAW_CLUBS,
      });

      await fixtureService.getClubs(206752);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/fixture/206752/club`
      );
    });

    it('should fetch and normalize clubs from external API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => RAW_CLUBS,
      });

      const clubs = await fixtureService.getClubs(206752);

      expect(clubs).toHaveLength(3);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should normalize club fields correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [RAW_CLUBS[0]],
      });

      const clubs = await fixtureService.getClubs(206752);

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

      const clubs = await fixtureService.getClubs(206752);

      expect(clubs[0].logo).toBeNull();
    });

    it('should return empty array when API returns empty list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const clubs = await fixtureService.getClubs(206752);

      expect(clubs).toEqual([]);
    });

    it('should throw when external API returns non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      await expect(fixtureService.getClubs(206752)).rejects.toThrow(
        'Failed to fetch clubs: 503 Service Unavailable'
      );
    });
  });

  describe('getDivisions', () => {
    it('should fetch divisions from external API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => RAW_DIVISIONS,
      });

      await fixtureService.getDivisions();

      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/fixture`);
    });

    it('should normalize division fields to id and name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => RAW_DIVISIONS,
      });

      const divisions = await fixtureService.getDivisions();

      expect(divisions).toEqual<FixtureDivision[]>([
        { id: 206754, name: 'Caballeros Primera' },
        { id: 206752, name: 'Mixto Sub 14 A' },
        { id: 206753, name: 'Mixto Sub 16 A' },
      ]);
    });

    it('should return empty array when API returns empty list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const divisions = await fixtureService.getDivisions();

      expect(divisions).toEqual([]);
    });

    it('should throw when external API returns non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fixtureService.getDivisions()).rejects.toThrow(
        'Failed to fetch divisions: 500 Internal Server Error'
      );
    });

    it('should throw when fetch fails with network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fixtureService.getDivisions()).rejects.toThrow('Network error');
    });
  });

  describe('getStandings', () => {
    it('should fetch standings using fixtureId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => RAW_STANDINGS,
      });

      await fixtureService.getStandings(206752);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/fixture/206752/tabla-posiciones`
      );
    });

    it('should normalize standings fields correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [RAW_STANDINGS[0]],
      });

      const standings = await fixtureService.getStandings(206752);

      expect(standings[0]).toEqual<StandingsEntry>({
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
      });
    });

    it('should handle null logo in standings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [RAW_STANDINGS[1]],
      });

      const standings = await fixtureService.getStandings(206752);

      expect(standings[0].clubLogo).toBeNull();
    });

    it('should return all entries sorted by position', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => RAW_STANDINGS,
      });

      const standings = await fixtureService.getStandings(206752);

      expect(standings).toHaveLength(2);
      expect(standings[0].position).toBe(1);
      expect(standings[1].position).toBe(2);
    });

    it('should return empty array when API returns empty list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const standings = await fixtureService.getStandings(206752);

      expect(standings).toEqual([]);
    });

    it('should throw when external API returns non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fixtureService.getStandings(206752)).rejects.toThrow(
        'Failed to fetch standings: 500 Internal Server Error'
      );
    });

    it('should throw when fetch fails with network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fixtureService.getStandings(206752)).rejects.toThrow('Network error');
    });
  });

  describe('getInstances', () => {
    it('should fetch instances using fixtureId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => RAW_INSTANCES,
      });

      await fixtureService.getInstances(206752);

      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/fixture/206752/instancia`);
    });

    it('should normalize instance fields correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [RAW_INSTANCES[1]],
      });

      const instances = await fixtureService.getInstances(206752);

      expect(instances[0]).toEqual<FixtureInstance>({
        id: 207306,
        date: '2026-06-06T13:30:00Z',
        description: 'Fecha 1',
        round: 1,
      });
    });

    it('should sort instances by round number ascending', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => RAW_INSTANCES,
      });

      const instances = await fixtureService.getInstances(206752);

      expect(instances.map((instance) => instance.round)).toEqual([1, 3]);
    });

    it('should return empty array when API returns empty list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const instances = await fixtureService.getInstances(206752);

      expect(instances).toEqual([]);
    });

    it('should throw when external API returns non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fixtureService.getInstances(206752)).rejects.toThrow(
        'Failed to fetch instances: 500 Internal Server Error'
      );
    });
  });

  describe('getFixtures', () => {
    function mockFixtureEndpoints(
      overrides: {
        matches?: RawMatch[];
        clubs?: RawClubWithLogo[];
        instances?: RawInstance[];
        failing?: 'partido' | 'club' | 'instancia';
      } = {}
    ): void {
      const { matches = RAW_MATCHES, clubs = RAW_CLUBS, instances = RAW_INSTANCES, failing } = overrides;

      mockFetch.mockImplementation((url: string) => {
        if (failing && url.endsWith(`/${failing}`)) {
          return Promise.resolve({ ok: false, status: 500, statusText: 'Internal Server Error' });
        }
        if (url.endsWith('/partido')) return Promise.resolve({ ok: true, json: async () => matches });
        if (url.endsWith('/club')) return Promise.resolve({ ok: true, json: async () => clubs });
        if (url.endsWith('/instancia')) return Promise.resolve({ ok: true, json: async () => instances });
        return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
      });
    }

    it('should fetch matches, clubs and instances', async () => {
      mockFixtureEndpoints();

      await fixtureService.getFixtures(206752);

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/fixture/206752/partido`);
      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/fixture/206752/club`);
      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/fixture/206752/instancia`);
    });

    it('should group matches into rounds sorted by round number', async () => {
      mockFixtureEndpoints();

      const rounds = await fixtureService.getFixtures(206752);

      expect(rounds).toHaveLength(2);
      expect(rounds[0].round).toBe(1);
      expect(rounds[0].description).toBe('Fecha 1');
      expect(rounds[0].date).toBe('2026-06-06T13:30:00Z');
      expect(rounds[0].matches.map((match) => match.id)).toEqual([207519]);
      expect(rounds[1].round).toBe(3);
      expect(rounds[1].matches.map((match) => match.id)).toEqual([208130]);
    });

    it('should enrich team logos from clubs', async () => {
      mockFixtureEndpoints();

      const rounds = await fixtureService.getFixtures(206752);
      const match = rounds[0].matches[0];

      expect(match.homeTeam.logo).toBe('base64data1');
      expect(match.awayTeam.logo).toBeNull();
    });

    it('should return empty matches for instances without matches', async () => {
      mockFixtureEndpoints({
        instances: [...RAW_INSTANCES, { id: 999, fecha: '2026-07-04T13:00:00Z', descripcion: 'Fecha 5', numero: 5 }],
      });

      const rounds = await fixtureService.getFixtures(206752);

      expect(rounds).toHaveLength(3);
      expect(rounds[2].round).toBe(5);
      expect(rounds[2].matches).toEqual([]);
    });

    it('should exclude matches whose instance is not listed', async () => {
      mockFixtureEndpoints({ instances: [RAW_INSTANCES[1]] });

      const rounds = await fixtureService.getFixtures(206752);

      expect(rounds).toHaveLength(1);
      expect(rounds[0].matches.map((match) => match.id)).toEqual([207519]);
    });

    it('should return empty array when there are no instances', async () => {
      mockFixtureEndpoints({ matches: [], clubs: [], instances: [] });

      const rounds = await fixtureService.getFixtures(206752);

      expect(rounds).toEqual([]);
    });

    it('should throw when the matches request fails', async () => {
      mockFixtureEndpoints({ failing: 'partido' });

      await expect(fixtureService.getFixtures(206752)).rejects.toThrow(
        'Failed to fetch matches: 500 Internal Server Error'
      );
    });

    it('should throw when the clubs request fails', async () => {
      mockFixtureEndpoints({ failing: 'club' });

      await expect(fixtureService.getFixtures(206752)).rejects.toThrow(
        'Failed to fetch clubs: 500 Internal Server Error'
      );
    });

    it('should throw when the instances request fails', async () => {
      mockFixtureEndpoints({ failing: 'instancia' });

      await expect(fixtureService.getFixtures(206752)).rejects.toThrow(
        'Failed to fetch instances: 500 Internal Server Error'
      );
    });
  });
});
