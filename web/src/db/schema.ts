export const INIT_DB_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    rating INTEGER DEFAULT 1200,
    title TEXT DEFAULT 'Commander',
    avatar TEXT DEFAULT 'knight',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS match_history (
    id TEXT PRIMARY KEY,
    user_uuid TEXT DEFAULT '',
    mode TEXT NOT NULL,
    white_player TEXT NOT NULL,
    black_player TEXT NOT NULL,
    winner TEXT NOT NULL,
    result_reason TEXT NOT NULL,
    moves_count INTEGER DEFAULT 0,
    pgn TEXT DEFAULT '',
    arena TEXT DEFAULT 'jungle',
    duration_seconds INTEGER DEFAULT 0,
    timestamp INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_stats (
    user_id INTEGER PRIMARY KEY,
    user_uuid TEXT NOT NULL,
    total_matches INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    win_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS saved_games (
    id TEXT PRIMARY KEY,
    mode TEXT NOT NULL,
    fen TEXT NOT NULL,
    pgn TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`;
