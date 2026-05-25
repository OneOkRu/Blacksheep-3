export interface PlayerHistory {
  date: string;
  points: number;
  elo: number;
  position: number;
}

export interface EloHistoryEntry {
  date: string;
  overall: number;
  axe?: number;
  sword?: number;
}

export interface Player {
  id: string;
  nickname: string;
  skinNickname?: string;
  points: number;
  tournamentPoints?: number;
  elo?: number;
  eloScores?: Record<string, number | undefined>;
  badge: string; // base64, emoji or url
  tier: string; // e.g. HT1, LT1
  tierScores: Record<string, string>; // tierId -> tier string
  history: PlayerHistory[];
  eloHistory?: EloHistoryEntry[];
}

export interface Tournament {
  id: string;
  name: string;
  shortName?: string;
  date: string;
  places: {
    1: string[]; // player ids
    2: string[];
    3: string[];
  };
}

export interface Tier {
  id: string;
  name: string;
  icon?: string;
}

export interface AppSettings {
  siteName: string;
  description: string;
  tournamentCoefficients: {
    1: number;
    2: number;
    3: number;
  };
  tierValues: Record<string, number>;
  visibleTabs: string[];
}

export interface Match {
  id: string;
  date: string;
  tierId?: string;
  player1Id: string;
  player2Id: string;
  winnerId: string | null; // null for draw
  eloChange1: number;
  eloChange2: number;
  score1?: number;
  score2?: number;
}

export interface ArchiveSnapshot {
  id: string;
  name: string;
  date: string;
  data: Player[];
}

export interface RatingData {
  settings: AppSettings;
  tiers: Tier[];
  players: Player[];
  tournaments: Tournament[];
  archives: ArchiveSnapshot[];
  matches?: Match[];
}
