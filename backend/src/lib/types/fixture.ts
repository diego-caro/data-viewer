// Raw types from Hockey Chubut external API

export interface RawMatchResult {
  id: number;
  golLocal: number;
  golVisitante: number;
}

export interface RawVenue {
  id: number;
  nombre: string;
}

export interface RawClub {
  id: number;
  razonSocial: string;
}

export interface RawTeam {
  id: number;
  nombre: string;
  club: RawClub;
}

export interface RawRound {
  id: number;
  numero: number;
}

export interface RawMatch {
  id: number;
  estado: string;
  fecha: string;
  resultado: RawMatchResult | null;
  cancha: RawVenue;
  local: RawTeam;
  visitante: RawTeam;
  instancia: RawRound;
}

export interface RawClubWithLogo {
  id: number;
  razonSocial: string;
  logo: string | null;
}

// Normalized domain types

export type MatchStatus = 'completed' | 'pending';

export interface TeamInfo {
  clubId: number;
  clubName: string;
}

export interface MatchScore {
  home: number;
  away: number;
}

export interface FixtureMatch {
  id: number;
  status: MatchStatus;
  date: string;
  venue: string;
  round: number;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  score: MatchScore | null;
}

export interface FixtureClub {
  id: number;
  name: string;
  logo: string | null;
}

export interface FixtureMatchesResponse {
  data: FixtureMatch[];
}

export interface FixtureClubsResponse {
  data: FixtureClub[];
}

// Raw types for fixture divisions (from /torneo/{id}/fixture)

export interface RawFixtureDivision {
  id: number;
  nombre: string;
}

// Raw types for standings (from /tabla-posiciones)

export interface RawStandingsEntry {
  clubId: number;
  nombreClub: string;
  logoClub: string | null;
  posicion: number;
  puntos: number;
  partidosJugados: number;
  partidosGanados: number;
  partidosEmpatados: number;
  partidosPerdidos: number;
  golesFavor: number;
  golesContra: number;
  diferenciaGoles: number;
}

// Normalized domain types

export interface FixtureDivision {
  id: number;
  name: string;
}

export interface StandingsEntry {
  position: number;
  clubId: number;
  clubName: string;
  clubLogo: string | null;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

// Response wrappers

export interface FixtureDivisionsResponse {
  data: FixtureDivision[];
}

export interface FixtureStandingsResponse {
  data: StandingsEntry[];
}
