import {
  RawMatch,
  RawClubWithLogo,
  RawFixtureDivision,
  RawStandingsEntry,
  FixtureMatch,
  FixtureClub,
  FixtureDivision,
  StandingsEntry,
  MatchStatus,
} from '@/lib/types/fixture';

const HOCKEY_CHUBUT_BASE = 'https://sistema.hockeychubut.com.ar/api/public';
const DEFAULT_TOURNAMENT_ID = '205151';

function getTournamentId(): string {
  return process.env.TOURNAMENT_ID || DEFAULT_TOURNAMENT_ID;
}

function buildUrl(path: string): string {
  return `${HOCKEY_CHUBUT_BASE}/torneo/${getTournamentId()}/${path}`;
}

function mapStatus(estado: string): MatchStatus {
  return estado === 'CERRADO' ? 'completed' : 'pending';
}

function normalizeMatch(raw: RawMatch): FixtureMatch {
  return {
    id: raw.id,
    status: mapStatus(raw.estado),
    date: raw.fecha,
    venue: raw.cancha.nombre,
    round: raw.instancia.numero,
    homeTeam: {
      clubId: raw.local.club.id,
      clubName: raw.local.club.razonSocial,
    },
    awayTeam: {
      clubId: raw.visitante.club.id,
      clubName: raw.visitante.club.razonSocial,
    },
    score: raw.resultado
      ? { home: raw.resultado.golLocal, away: raw.resultado.golVisitante }
      : null,
  };
}

function normalizeClub(raw: RawClubWithLogo): FixtureClub {
  return {
    id: raw.id,
    name: raw.razonSocial,
    logo: raw.logo,
  };
}

function normalizeDivision(raw: RawFixtureDivision): FixtureDivision {
  return {
    id: raw.id,
    name: raw.nombre,
  };
}

function normalizeStandingsEntry(raw: RawStandingsEntry): StandingsEntry {
  return {
    position: raw.posicion,
    clubId: raw.clubId,
    clubName: raw.nombreClub,
    clubLogo: raw.logoClub,
    points: raw.puntos,
    played: raw.partidosJugados,
    won: raw.partidosGanados,
    drawn: raw.partidosEmpatados,
    lost: raw.partidosPerdidos,
    goalsFor: raw.golesFavor,
    goalsAgainst: raw.golesContra,
    goalDifference: raw.diferenciaGoles,
  };
}

async function getMatches(fixtureId: number): Promise<FixtureMatch[]> {
  const response = await fetch(buildUrl(`fixture/${fixtureId}/partido`));

  if (!response.ok) {
    throw new Error(
      `Failed to fetch matches: ${response.status} ${response.statusText}`
    );
  }

  const raw: RawMatch[] = await response.json();
  return raw.map(normalizeMatch);
}

async function getClubs(fixtureId: number): Promise<FixtureClub[]> {
  const response = await fetch(buildUrl(`fixture/${fixtureId}/club`));

  if (!response.ok) {
    throw new Error(
      `Failed to fetch clubs: ${response.status} ${response.statusText}`
    );
  }

  const raw: RawClubWithLogo[] = await response.json();
  return raw.map(normalizeClub);
}

async function getDivisions(): Promise<FixtureDivision[]> {
  const response = await fetch(buildUrl('fixture'));

  if (!response.ok) {
    throw new Error(
      `Failed to fetch divisions: ${response.status} ${response.statusText}`
    );
  }

  const raw: RawFixtureDivision[] = await response.json();
  return raw.map(normalizeDivision);
}

async function getStandings(fixtureId: number): Promise<StandingsEntry[]> {
  const response = await fetch(buildUrl(`fixture/${fixtureId}/tabla-posiciones`));

  if (!response.ok) {
    throw new Error(
      `Failed to fetch standings: ${response.status} ${response.statusText}`
    );
  }

  const raw: RawStandingsEntry[] = await response.json();
  return raw.map(normalizeStandingsEntry);
}

export const fixtureService = {
  getMatches,
  getClubs,
  getDivisions,
  getStandings,
};
