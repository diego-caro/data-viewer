import {
  RawMatch,
  RawClubWithLogo,
  FixtureMatch,
  FixtureClub,
  MatchStatus,
} from '@/lib/types/fixture';

const MATCHES_URL =
  'https://sistema.hockeychubut.com.ar/api/public/torneo/205151/fixture/206752/partido';
const CLUBS_URL =
  'https://sistema.hockeychubut.com.ar/api/public/torneo/205151/fixture/206752/club';

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

async function getMatches(): Promise<FixtureMatch[]> {
  const response = await fetch(MATCHES_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch matches: ${response.status} ${response.statusText}`
    );
  }

  const raw: RawMatch[] = await response.json();
  return raw.map(normalizeMatch);
}

async function getClubs(): Promise<FixtureClub[]> {
  const response = await fetch(CLUBS_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch clubs: ${response.status} ${response.statusText}`
    );
  }

  const raw: RawClubWithLogo[] = await response.json();
  return raw.map(normalizeClub);
}

export const fixtureService = {
  getMatches,
  getClubs,
};
