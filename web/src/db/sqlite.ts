import initSqlJs, { Database } from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import path from "node:path";
import { MatchRecord, PaymentRecord, SavedGame, UserProfile, UserStats, AdminCredentials } from "./models";
import { INIT_DB_SCHEMA } from "./schema";

const STORAGE_KEY = "kings_fall_sqlite_db_v1";
const USER_UUID_COOKIE = "kg_user_uuid";

let mockNodeCookie: string | null = null;

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return mockNodeCookie;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === "undefined") {
    mockNodeCookie = value;
    return;
  }
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

export function getOrCreateUserUuid(): string {
  let uuid = getCookie(USER_UUID_COOKIE);
  if (!uuid) {
    uuid =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setCookie(USER_UUID_COOKIE, uuid, 365);
    console.log("[Cookie Auth] Generated & stored new User UUID Cookie:", uuid);
  }
  return uuid;
}

class SqliteDatabase {
  private db: Database | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  public async init(): Promise<void> {
    if (this.isInitialized && this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const SQL = await initSqlJs({
          locateFile: (file) => {
            if (typeof window === "undefined") {
              // Node.js environment (e.g. Vitest / SSR)
              return path.resolve(process.cwd(), "public", file);
            }
            return sqlWasmUrl;
          },
        });

        let savedBytes: Uint8Array | null = null;
        if (typeof window !== "undefined" && window.localStorage) {
          try {
            const b64 = window.localStorage.getItem(STORAGE_KEY);
            if (b64) {
              const binaryString = atob(b64);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              savedBytes = bytes;
            }
          } catch (e) {
            console.warn("[SQLite DB] Failed to decode localStorage database binary:", e);
          }
        }

        if (savedBytes) {
          this.db = new SQL.Database(savedBytes);
        } else {
          this.db = new SQL.Database();
        }

        this.setupTables();
        this.isInitialized = true;
        console.log("[SQLite DB] WebAssembly SQLite initialized with Cookie UUID Auth.");
      } catch (err) {
        console.error("[SQLite DB] Failed to initialize SQLite WASM:", err);
        throw err;
      }
    })();

    return this.initPromise;
  }

  private setupTables(): void {
    if (!this.db) return;

    this.db.run(INIT_DB_SCHEMA);

    const userUuid = getOrCreateUserUuid();

    const res = this.db.exec("SELECT id FROM users WHERE uuid = ?;", [userUuid]);

    if (!res[0] || !res[0].values[0]) {
      const defaultName = (typeof window !== "undefined" && window.localStorage?.getItem("kg.playername")) || "Commander";
      this.db.run(
        "INSERT INTO users (uuid, username, rating, title, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?);",
        [userUuid, defaultName, 1200, "Commander", "knight", Date.now()]
      );

      const userRow = this.db.exec("SELECT id FROM users WHERE uuid = ?;", [userUuid]);
      const userId = (userRow[0]?.values[0]?.[0] as number) || 1;

      this.db.run(
        "INSERT OR IGNORE INTO user_stats (user_id, user_uuid, total_matches, wins, losses, draws, win_streak, best_streak) VALUES (?, ?, 0, 0, 0, 0, 0, 0);",
        [userId, userUuid]
      );

      this.persist();
      console.log(`[SQLite DB] Created new user row for UUID: ${userUuid}`);
    }

    const adminCheck = this.db.exec("SELECT id FROM admin_credentials LIMIT 1;");
    if (!adminCheck[0] || !adminCheck[0].values[0]) {
      this.db.run(
        "INSERT INTO admin_credentials (username, password, email, recovery_key, updated_at) VALUES (?, ?, ?, ?, ?);",
        ["admin", "admin123", "admin@dravidachess.com", "DRAVIDA2026", Date.now()]
      );
      this.persist();
      console.log("[SQLite DB] Initialized default admin_credentials table.");
    }
  }

  public persist(): void {
    if (!this.db) return;
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const data = this.db.export();
      let binary = "";
      const len = data.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(data[i]);
      }
      const b64 = btoa(binary);
      window.localStorage.setItem(STORAGE_KEY, b64);
    } catch (e) {
      console.warn("[SQLite DB] Failed to persist database to localStorage:", e);
    }
  }

  // --- USER PROFILES ---
  public async getUser(): Promise<UserProfile | null> {
    await this.init();
    if (!this.db) return null;

    const uuid = getOrCreateUserUuid();
    const res = this.db.exec("SELECT id, uuid, username, rating, title, avatar, created_at FROM users WHERE uuid = ? LIMIT 1;", [uuid]);
    
    if (!res[0] || !res[0].values[0]) {
      const fallback = this.db.exec("SELECT id, uuid, username, rating, title, avatar, created_at FROM users LIMIT 1;");
      if (!fallback[0] || !fallback[0].values[0]) return null;
      const r = fallback[0].values[0];
      return {
        id: r[0] as number,
        uuid: r[1] as string,
        username: r[2] as string,
        rating: r[3] as number,
        title: r[4] as string,
        avatar: r[5] as string,
        createdAt: r[6] as number,
      };
    }

    const row = res[0].values[0];
    return {
      id: row[0] as number,
      uuid: row[1] as string,
      username: row[2] as string,
      rating: row[3] as number,
      title: row[4] as string,
      avatar: row[5] as string,
      createdAt: row[6] as number,
    };
  }

  public async setUsername(username: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    const uuid = getOrCreateUserUuid();
    const check = this.db.exec("SELECT id FROM users WHERE uuid = ?;", [uuid]);
    if (!check[0] || !check[0].values[0]) {
      this.db.run(
        "INSERT INTO users (uuid, username, rating, title, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?);",
        [uuid, username, 1200, "Commander", "knight", Date.now()]
      );
      const userRow = this.db.exec("SELECT id FROM users WHERE uuid = ?;", [uuid]);
      const userId = (userRow[0]?.values[0]?.[0] as number) || 1;
      this.db.run(
        "INSERT OR IGNORE INTO user_stats (user_id, user_uuid, total_matches, wins, losses, draws, win_streak, best_streak) VALUES (?, ?, 0, 0, 0, 0, 0, 0);",
        [userId, uuid]
      );
    } else {
      this.db.run("UPDATE users SET username = ? WHERE uuid = ?;", [username, uuid]);
    }
    this.persist();
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem("kg.playername", username);
      } catch {}
    }
    console.log(`[SQLite DB] Saved username "${username}" for UUID ${uuid} into SQLite database.`);
  }

  // --- MATCH HISTORY ---
  public async recordMatch(match: Omit<MatchRecord, "timestamp">): Promise<void> {
    await this.init();
    if (!this.db) return;

    const uuid = getOrCreateUserUuid();
    const now = Date.now();
    this.db.run(
      `INSERT OR REPLACE INTO match_history 
       (id, user_uuid, mode, white_player, black_player, winner, result_reason, moves_count, pgn, arena, duration_seconds, timestamp) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        match.id,
        uuid,
        match.mode,
        match.whitePlayer,
        match.blackPlayer,
        match.winner,
        match.resultReason,
        match.movesCount,
        match.pgn,
        match.arena,
        match.durationSeconds,
        now,
      ]
    );

    const isWin = match.winner === "w" || match.winner === "white" || match.winner === match.whitePlayer;
    const isLoss = match.winner === "b" || match.winner === "black" || match.winner === match.blackPlayer;
    const isDraw = match.winner === "draw";

    const statsRes = this.db.exec("SELECT total_matches, wins, losses, draws, win_streak, best_streak FROM user_stats WHERE user_uuid = ?;", [uuid]);
    if (statsRes[0] && statsRes[0].values[0]) {
      const s = statsRes[0].values[0];
      const wins = (s[1] as number) + (isWin ? 1 : 0);
      const losses = (s[2] as number) + (isLoss ? 1 : 0);
      const draws = (s[3] as number) + (isDraw ? 1 : 0);
      const total = (s[0] as number) + 1;
      const streak = isWin ? (s[4] as number) + 1 : 0;
      const bestStreak = Math.max(streak, s[5] as number);

      this.db.run(
        "UPDATE user_stats SET total_matches = ?, wins = ?, losses = ?, draws = ?, win_streak = ?, best_streak = ? WHERE user_uuid = ?;",
        [total, wins, losses, draws, streak, bestStreak, uuid]
      );
    }

    this.persist();
  }

  public async getMatchHistory(limit = 20): Promise<MatchRecord[]> {
    await this.init();
    if (!this.db) return [];

    const uuid = getOrCreateUserUuid();
    const res = this.db.exec(
      `SELECT id, user_uuid, mode, white_player, black_player, winner, result_reason, moves_count, pgn, arena, duration_seconds, timestamp 
       FROM match_history 
       WHERE user_uuid = ? OR user_uuid = '' OR user_uuid IS NULL
       ORDER BY timestamp DESC LIMIT ${limit};`,
      [uuid]
    );

    if (!res[0]) return [];

    return res[0].values.map((row) => ({
      id: row[0] as string,
      userUuid: row[1] as string,
      mode: row[2] as string,
      whitePlayer: row[3] as string,
      blackPlayer: row[4] as string,
      winner: row[5] as string,
      resultReason: row[6] as string,
      movesCount: row[7] as number,
      pgn: row[8] as string,
      arena: row[9] as string,
      durationSeconds: row[10] as number,
      timestamp: row[11] as number,
    }));
  }

  public async getUserStats(): Promise<UserStats | null> {
    await this.init();
    if (!this.db) return null;

    const uuid = getOrCreateUserUuid();
    const res = this.db.exec(
      "SELECT user_id, user_uuid, total_matches, wins, losses, draws, win_streak, best_streak FROM user_stats WHERE user_uuid = ? LIMIT 1;",
      [uuid]
    );

    if (!res[0] || !res[0].values[0]) {
      const fallback = this.db.exec("SELECT user_id, user_uuid, total_matches, wins, losses, draws, win_streak, best_streak FROM user_stats LIMIT 1;");
      if (!fallback[0] || !fallback[0].values[0]) return null;
      const r = fallback[0].values[0];
      return {
        userId: r[0] as number,
        userUuid: r[1] as string,
        totalMatches: r[2] as number,
        wins: r[3] as number,
        losses: r[4] as number,
        draws: r[5] as number,
        winStreak: r[6] as number,
        bestStreak: r[7] as number,
      };
    }

    const r = res[0].values[0];
    return {
      userId: r[0] as number,
      userUuid: r[1] as string,
      totalMatches: r[2] as number,
      wins: r[3] as number,
      losses: r[4] as number,
      draws: r[5] as number,
      winStreak: r[6] as number,
      bestStreak: r[7] as number,
    };
  }

  // --- PAYMENTS & ADMIN ---
  public async recordPayment(payment: Omit<PaymentRecord, "timestamp">): Promise<void> {
    await this.init();
    if (!this.db) return;

    const uuid = getOrCreateUserUuid();
    const now = Date.now();
    this.db.run(
      `INSERT OR REPLACE INTO payments 
       (id, user_uuid, player_name, email, amount, currency, purpose, status, gateway, timestamp) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        payment.id,
        uuid,
        payment.playerName,
        payment.email || "",
        payment.amount,
        payment.currency || "INR",
        payment.purpose,
        payment.status || "SUCCESS",
        payment.gateway || "Razorpay",
        now,
      ]
    );

    this.persist();
    console.log(`[SQLite DB] Recorded payment: ₹${payment.amount} for ${payment.playerName} (${payment.purpose})`);
  }

  public async getAllPayments(): Promise<PaymentRecord[]> {
    await this.init();
    if (!this.db) return [];

    const res = this.db.exec(
      `SELECT id, user_uuid, player_name, email, amount, currency, purpose, status, gateway, timestamp 
       FROM payments 
       ORDER BY timestamp DESC;`
    );

    if (!res[0]) return [];

    return res[0].values.map((row) => ({
      id: row[0] as string,
      userUuid: row[1] as string,
      playerName: row[2] as string,
      email: row[3] as string,
      amount: row[4] as number,
      currency: row[5] as string,
      purpose: row[6] as string,
      status: row[7] as string,
      gateway: row[8] as string,
      timestamp: row[9] as number,
    }));
  }

  public async getAllUsers(): Promise<UserProfile[]> {
    await this.init();
    if (!this.db) return [];

    const res = this.db.exec(
      `SELECT id, uuid, username, rating, title, avatar, created_at 
       FROM users 
       ORDER BY created_at DESC;`
    );

    if (!res[0]) return [];

    return res[0].values.map((row) => ({
      id: row[0] as number,
      uuid: row[1] as string,
      username: row[2] as string,
      rating: row[3] as number,
      title: row[4] as string,
      avatar: row[5] as string,
      createdAt: row[6] as number,
    }));
  }

  public async getAdminOverview() {
    await this.init();
    const users = await this.getAllUsers();
    const payments = await this.getAllPayments();
    const matches = await this.getMatchHistory(100);

    const totalRevenue = payments.reduce((acc, p) => acc + (p.status === "SUCCESS" ? p.amount : 0), 0);

    return {
      totalUsersCount: users.length,
      totalMatchesCount: matches.length,
      totalPaymentsCount: payments.length,
      totalRevenueINR: totalRevenue,
      users,
      payments,
      recentMatches: matches,
    };
  }

  // --- ADMIN AUTH & CREDENTIALS ---
  public async getAdminCredentials(): Promise<AdminCredentials> {
    await this.init();
    const fallback: AdminCredentials = {
      username: "admin",
      password: "admin123",
      email: "admin@dravidachess.com",
      recoveryKey: "DRAVIDA2026",
      updatedAt: Date.now(),
    };

    if (!this.db) return fallback;

    const res = this.db.exec(
      "SELECT id, username, password, email, recovery_key, updated_at FROM admin_credentials ORDER BY id ASC LIMIT 1;"
    );

    if (!res[0] || !res[0].values[0]) return fallback;

    const row = res[0].values[0];
    return {
      id: row[0] as number,
      username: row[1] as string,
      password: row[2] as string,
      email: row[3] as string,
      recoveryKey: row[4] as string,
      updatedAt: row[5] as number,
    };
  }

  public async verifyAdminLogin(usernameInput: string, passwordInput: string): Promise<boolean> {
    await this.init();
    const creds = await this.getAdminCredentials();
    return (
      usernameInput.trim().toLowerCase() === creds.username.toLowerCase() &&
      passwordInput.trim() === creds.password
    );
  }

  public async updateAdminPassword(newPasswordInput: string, usernameInput = "admin"): Promise<boolean> {
    await this.init();
    if (!this.db) return false;

    const pwd = newPasswordInput.trim();
    this.db.run("UPDATE admin_credentials SET password = ?, updated_at = ? WHERE username = ? OR id = 1;", [
      pwd,
      Date.now(),
      usernameInput.trim(),
    ]);

    const check = this.db.exec("SELECT id FROM admin_credentials LIMIT 1;");
    if (!check[0] || !check[0].values[0]) {
      this.db.run(
        "INSERT INTO admin_credentials (username, password, email, recovery_key, updated_at) VALUES (?, ?, ?, ?, ?);",
        ["admin", pwd, "admin@dravidachess.com", "DRAVIDA2026", Date.now()]
      );
    }

    this.persist();
    console.log(`[SQLite DB] Updated admin password in SQLite DB.`);
    return true;
  }

  public async resetAdminPasswordWithRecovery(
    recoveryKeyOrEmailInput: string,
    newPasswordInput: string
  ): Promise<{ success: boolean; message: string }> {
    await this.init();
    const creds = await this.getAdminCredentials();
    const input = recoveryKeyOrEmailInput.trim().toLowerCase();

    const matchesRecoveryKey = input === creds.recoveryKey.toLowerCase();
    const matchesEmail = input === creds.email.toLowerCase();

    if (!matchesRecoveryKey && !matchesEmail) {
      return {
        success: false,
        message: "Invalid Recovery Key or Email address. Verify system defaults (DRAVIDA2026 / admin@dravidachess.com)",
      };
    }

    await this.updateAdminPassword(newPasswordInput, creds.username);
    return {
      success: true,
      message: "Admin password successfully reset and saved to SQLite database!",
    };
  }

  // --- RAW SQL EXECUTOR ---
  public async executeSql(sql: string, params: (string | number)[] = []): Promise<unknown[][]> {
    await this.init();
    if (!this.db) return [];

    const res = this.db.exec(sql, params);
    if (!res[0]) return [];
    return res[0].values;
  }
}

export const sqliteDb = new SqliteDatabase();
