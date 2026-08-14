import { describe, it, expect, beforeEach } from "vitest";
import { sqliteDb } from "./sqlite";

describe("SQLite WebAssembly Database", () => {
  beforeEach(async () => {
    await sqliteDb.init();
  });

  it("should initialize SQLite database and default user profile", async () => {
    const user = await sqliteDb.getUser();
    expect(user).not.toBeNull();
    expect(user?.username).toBeDefined();
    expect(user?.rating).toBe(1200);
    expect(user?.title).toBe("Commander");
  });

  it("should update user username", async () => {
    await sqliteDb.setUsername("KingSanjay");
    const user = await sqliteDb.getUser();
    expect(user?.username).toBe("KingSanjay");
  });

  it("should record match and update stats", async () => {
    const matchId = `test_match_${Date.now()}`;
    await sqliteDb.recordMatch({
      id: matchId,
      mode: "ai",
      whitePlayer: "KingSanjay",
      blackPlayer: "Squire AI",
      winner: "KingSanjay",
      resultReason: "checkmate",
      movesCount: 32,
      pgn: "1. e4 e5 2. Nf3 Nc6",
      arena: "jungle",
      durationSeconds: 120,
    });

    const history = await sqliteDb.getMatchHistory(5);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].id).toBe(matchId);

    const stats = await sqliteDb.getUserStats();
    expect(stats).not.toBeNull();
    expect(stats?.totalMatches).toBeGreaterThan(0);
    expect(stats?.wins).toBeGreaterThan(0);
  });

  it("should execute raw SQL queries", async () => {
    const rows = await sqliteDb.executeSql("SELECT 1 + 1 as result;");
    expect(rows[0][0]).toBe(2);
  });
});
