export interface UserProfile {
  id: number;
  uuid: string;
  username: string;
  rating: number;
  title: string;
  avatar: string;
  createdAt: number;
}

export interface MatchRecord {
  id: string;
  userUuid?: string;
  mode: string;
  whitePlayer: string;
  blackPlayer: string;
  winner: string;
  resultReason: string;
  movesCount: number;
  pgn: string;
  arena: string;
  durationSeconds: number;
  timestamp: number;
}

export interface UserStats {
  userId: number;
  userUuid: string;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestStreak: number;
}

export interface SavedGame {
  id: string;
  mode: string;
  fen: string;
  pgn: string;
  updatedAt: number;
}
