// ─── Live Match types ────────────────────────────────────────────────
export interface MatchTeamInfo {
  teamId: number;
  teamSName: string;
  teamName: string;
}

export interface MatchScoreInfo {
  inngs1?: {
    runs?: number;
    wickets?: number;
    overs?: number;
  };
  inngs2?: {
    runs?: number;
    wickets?: number;
    overs?: number;
  };
}

export interface Match {
  matchId: number;
  matchDesc: string;
  matchFormat: string;
  state: string;
  status: string;
  team1: MatchTeamInfo;
  team2: MatchTeamInfo;
  scoreCard?: MatchScoreInfo;
  seriesName?: string;
  venueInfo?: {
    ground?: string;
    city?: string;
  };
}

// ─── Scorecard from hscard endpoint ──────────────────────────────────
export interface BatsmanScore {
  name: string;
  runs: number;
  balls: number;
}

export interface InningsScorecard {
  batTeamDetails?: {
    batTeamName?: string;
    batTeamShortName?: string;
  };
  scoreDetails?: {
    runs?: number;
    wickets?: number;
    overs?: number;
  };
  batsman?: BatsmanScore[];
}

export interface ScorecardResponse {
  scoreCard?: InningsScorecard[];
}

// ─── Extracted innings data ──────────────────────────────────────────
export interface InningsData {
  runs: number;
  wickets: number;
  overs: number;
  teamName: string;
  totalOvers: number;
}

// ─── DLS Calculator state ────────────────────────────────────────────
export interface DLSState {
  // First innings
  firstInningsRuns: number;
  firstInningsWickets: number;
  firstInningsOvers: number;
  // Match settings
  totalOvers: number;
  // Team 2 revised overs (after interruption)
  team2RevisedOvers: number;
}

// ─── Team 2 live progress ────────────────────────────────────────────
export interface Team2Progress {
  runs: number;
  oversBowled: number;
  wicketsLost: number;
}

// ─── DLS result ──────────────────────────────────────────────────────
export interface DLSResult {
  parScore: number;
  revisedTarget: number;
  resourceTeam1: number;
  resourceTeam2: number;
}

// ─── What-if scenario ────────────────────────────────────────────────
export interface WhatIfScenario {
  label: string;
  description: string;
  parScore: number;
  overs: number;
  wickets: number;
}
