
export type Player = {
  id: string;
  name: string;
};

export type Team = {
  id: string;
  name: string;
  players: [Player, Player]; // Each team has exactly 2 players
  groupId?: string;
};

export type Match = {
  id: string;
  teamA: Team;
  teamB: Team;
  winner: Team | null;
  round: string; // "group" or "quarterfinal", "semifinal", "final", "tiebreaker"
  groupId?: string;
  isTiebreaker?: boolean;
};

export type Group = {
  id: string;
  name: string;
  teams: Team[];
  matches: Match[];
  tiebreakers?: Match[];
};

export type TournamentStage = "setup" | "teams" | "groups" | "bracket" | "completed";

export type Tournament = {
  id: string;
  name: string;
  numberOfTeams: number;
  numberOfGroups: number;
  teams: Team[];
  groups: Group[];
  matches: Match[];
  knockoutMatches: Match[];
  stage: TournamentStage;
  createdAt: string;
  updatedAt: string;
};
