import React, { useEffect, useState } from "react";
import { MatchRecord, UserProfile, UserStats, sqliteDb } from "../db";
import { Trophy, Swords, Scroll, Database, Sparkles, X } from "lucide-react";

interface UserStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserStatsModal: React.FC<UserStatsModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"stats" | "history" | "sql">("stats");
  const [customSql, setCustomSql] = useState<string>("SELECT * FROM match_history ORDER BY timestamp DESC;");
  const [queryResult, setQueryResult] = useState<unknown[][] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    void loadData();
  }, [isOpen]);

  const loadData = async () => {
    try {
      const user = await sqliteDb.getUser();
      const userStats = await sqliteDb.getUserStats();
      const history = await sqliteDb.getMatchHistory(20);
      setProfile(user);
      setStats(userStats);
      setMatches(history);
    } catch (e) {
      console.error("Failed to load SQLite data:", e);
    }
  };

  const handleRunSql = async () => {
    setQueryError(null);
    setQueryResult(null);
    try {
      const res = await sqliteDb.executeSql(customSql);
      setQueryResult(res);
    } catch (err: unknown) {
      setQueryError(err instanceof Error ? err.message : String(err));
    }
  };

  if (!isOpen) return null;

  const winRate = stats && stats.totalMatches > 0 ? Math.round((stats.wins / stats.totalMatches) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="mc-slate mc-goldleaf flex flex-col w-full max-w-3xl max-h-[85vh] rounded-2xl border border-amber-500/30 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-200 tracking-wider">
                COMMANDER PROFILE & SQLITE DATABASE
              </h2>
              <p className="text-xs text-amber-200/60">
                WebAssembly SQLite • Local Client Browser Storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/20 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-xl transition-all ${activeTab === "stats"
              ? "bg-amber-500/20 text-amber-300 border-t border-x border-amber-500/40"
              : "text-white/60 hover:text-white"
              }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            Player Statistics
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-xl transition-all ${activeTab === "history"
              ? "bg-amber-500/20 text-amber-300 border-t border-x border-amber-500/40"
              : "text-white/60 hover:text-white"
              }`}
          >
            <Swords className="w-4 h-4 text-amber-400" />
            Match History ({matches.length})
          </button>

          <button
            onClick={() => setActiveTab("sql")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-xl transition-all ${activeTab === "sql"
              ? "bg-amber-500/20 text-amber-300 border-t border-x border-amber-500/40"
              : "text-white/60 hover:text-white"
              }`}
          >
            <Scroll className="w-4 h-4 text-amber-400" />
            SQLite Console
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 mc-scroll">
          {activeTab === "stats" && (
            <div className="space-y-4">
              {/* User Profile Card */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-amber-950/60 border-2 border-amber-500/50 flex items-center justify-center text-amber-300 text-2xl font-bold">
                    {profile?.username.slice(0, 2).toUpperCase() || "CM"}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-100">{profile?.username || "Commander"}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-amber-300/80 mt-0.5">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                        {profile?.title || "Commander"}
                      </span>
                      <span>Rating: <strong>{profile?.rating || 1200} ELO</strong></span>
                    </div>
                    {profile?.username && (
                      <div className="text-[10px] text-emerald-400/90 font-mono mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                        <span>Player: {profile.username}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-400">{winRate}%</div>
                  <div className="text-xs text-white/50">Win Rate</div>
                </div>
              </div>

              {/* Grid Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-xs text-white/50 mb-1">Total Played</div>
                  <div className="text-2xl font-bold text-white">{stats?.totalMatches || 0}</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center">
                  <div className="text-xs text-emerald-300/70 mb-1">Victories</div>
                  <div className="text-2xl font-bold text-emerald-400">{stats?.wins || 0}</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-center">
                  <div className="text-xs text-rose-300/70 mb-1">Defeats</div>
                  <div className="text-2xl font-bold text-rose-400">{stats?.losses || 0}</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-center">
                  <div className="text-xs text-amber-300/70 mb-1">Win Streak</div>
                  <div className="text-2xl font-bold text-amber-400">{stats?.winStreak || 0} 🔥</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-2">
              {matches.length === 0 ? (
                <div className="text-center py-10 text-white/40">
                  <Swords className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No recorded match history found in SQLite database.</p>
                  <p className="text-xs text-white/30 mt-1">Play a game in AI, Hotseat, or Online to record matches!</p>
                </div>
              ) : (
                matches.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-amber-200">
                        <span>{m.whitePlayer}</span>
                        <span className="text-white/40">vs</span>
                        <span>{m.blackPlayer}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/70 uppercase">
                          {m.mode}
                        </span>
                      </div>
                      <div className="text-white/50 mt-1">
                        Arena: <span className="capitalize text-amber-300/80">{m.arena}</span> • {m.movesCount} moves • {new Date(m.timestamp).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-amber-400">Winner: {m.winner}</div>
                      <div className="text-white/40 text-[11px]">{m.resultReason}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "sql" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-amber-300">Run SQL Query on Client SQLite DB:</label>
                <button
                  onClick={handleRunSql}
                  className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Run Query
                </button>
              </div>

              <textarea
                value={customSql}
                onChange={(e) => setCustomSql(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-xl bg-black/60 border border-amber-500/40 text-amber-100 font-mono text-xs focus:outline-none focus:border-amber-400"
              />

              {queryError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
                  Error: {queryError}
                </div>
              )}

              {queryResult && (
                <div className="overflow-x-auto max-h-48 mc-scroll border border-white/10 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <tbody>
                      {queryResult.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-white/5 hover:bg-white/5">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2 border-r border-white/5 text-amber-100/80">
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
