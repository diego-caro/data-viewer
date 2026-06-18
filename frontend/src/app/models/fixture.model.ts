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
