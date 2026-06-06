export type Role = 'owner' | 'admin' | 'news' | 'viewer';

export type User = {
  id: string;
  role: Role;
  username: string;
  eventId?: string; // Only for admins
};

export type EventStatus = 'upcoming' | 'live' | 'finished';

export type EventType = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  prizepool: string | number;
  currency?: string;
  prizepoolDetails?: { rank: string; amount: number; count?: number }[];
  description?: string;
  rules?: string;
  adminCode: string;
  adminCodes?: string[]; // Multiple admin codes
  status: EventStatus;
  format?: 'round-robin' | 'knockout' | 'hybrid';
  isQualifier?: boolean;
  eliminationType?: 'single' | 'double';
  bracketSize?: number;
  totalPlayers?: number;
  qualifierSpots?: number;
  qualifierStage2Draw?: 'random' | 'manual' | 'seeded';
  defaultScoringSystem?: 'race' | 'sets';
  defaultRaceTo?: number;
  roundRaceTo?: Record<string, number>;
  logoUrl?: string;
  bannerUrl?: string;
  enrolledPlayers?: string[];
};

export type Player = {
  id: string;
  name: string;
  country: string;
  flagUrl?: string;
  pictureUrl?: string;
  bio?: string;
  points?: number;
  equipment?: Record<string, string>;
};

export type MatchStatus = 'pending' | 'live' | 'finished';
export type MatchStage = 'round-robin' | 'knockout' | 'stage1' | 'stage2';
export type ScoringSystem = 'race' | 'sets';

export type Match = {
  id: string;
  eventId: string;
  player1: Player | 'BYE' | 'TBA' | 'DSQ' | 'NS';
  player2: Player | 'BYE' | 'TBA' | 'DSQ' | 'NS';
  score1: number;
  score2: number;
  extensions1?: number;
  extensions2?: number;
  notes?: string;
  history?: Array<{ timestamp: number; action: string; playerIndex?: 1 | 2 }>;
  status: MatchStatus;
  stage: MatchStage;
  tableNumber: number;
  scoringSystem: ScoringSystem;
  raceTo?: number;
  bestOfSets?: number;
  setsWon1?: number;
  setsWon2?: number;
  bracketPosition?: string; // For syncing with knocking tree (e.g. "QF1", "SF1", "Final")
  time?: string;
  endTime?: number;
};

export type StandingsEntry = {
  playerId: string;
  player: Player;
  matchesPlayed: number;
  wins: number;
  losses: number;
  racksWon: number;
  racksLost: number;
  rackDifference: number;
  points: number;
};

export type NewsItem = {
  id: string;
  title: string;
  content: string;
  date: string;
  authorName: string;
  type: 'update' | 'highlight' | 'schedule';
  imageUrl?: string;
};

export type AppState = {
  events: EventType[];
  matches: Match[];
  news: NewsItem[];
  players: Player[];
  settings?: GlobalSettings;
};

export type GlobalSettings = {
  notifications: boolean;
  showAbbreviations: boolean;
  systemName?: string;
  systemLogo?: string;
  otpCode?: string;
  otpTimestamp?: number;
  newsPassword?: string;
  devMode?: boolean;
};
