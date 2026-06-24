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

export interface FixtureRound {
  number: number;
  matches: FixtureMatch[];
}

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

export interface FixtureDivisionsResponse {
  data: FixtureDivision[];
}

export interface FixtureStandingsResponse {
  data: StandingsEntry[];
}
