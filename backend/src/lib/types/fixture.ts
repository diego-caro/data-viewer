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
