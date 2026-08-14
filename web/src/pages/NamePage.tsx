import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Sparkles,
  Crown,
  Gamepad2,
  Globe,
  Database,
  ShieldCheck,
  Swords,
  Check,
  ArrowRight,
} from "lucide-react";
import { sqliteDb } from "../db";
import { lobbyService, type LobbyStats } from "../core/lobby";
import { UserStatsModal } from "../ui/UserStatsModal";

export default function NamePage() {
  const navigate = useNavigate();

  const [playerName, setPlayerName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("kg.playername") || "Commander";
    }
    return "Commander";
  });

  const [lobbyStats, setLobbyStats] = useState<LobbyStats>({
    onlineUsersCount: 1,
    publicRooms: [],
    privateRooms: [],
    allRooms: [],
  });

  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Fetch initial SQLite username
    void (async () => {
      try {
        const user = await sqliteDb.getUser();
        if (user && user.username && user.username.trim()) {
          setPlayerName(user.username);
          lobbyService.setPlayerName(user.username);
          if (typeof window !== "undefined") {
            window.localStorage.setItem("kg.playername", user.username);
          }
        }
      } catch (err) {
        console.warn("[NamePage] SQLite load error:", err);
      }
    })();

    const unsubscribe = lobbyService.subscribe((stats) => {
      setLobbyStats(stats);
    });
    return () => unsubscribe();
  }, []);

  const handleNameChange = (name: string) => {
    setPlayerName(name);
    lobbyService.setPlayerName(name);
    try {
      window.localStorage.setItem("kg.playername", name);
    } catch {}
    void sqliteDb.setUsername(name);
  };

  const handleContinueToGames = () => {
    if (!playerName.trim()) return;
    navigate("/games");
  };

  return (
    <div className="mc-root fixed inset-0 flex flex-col items-center justify-between bg-[#05060a] p-3 sm:p-6 select-none overflow-y-auto">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/3 w-[30rem] h-[30rem] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[30rem] h-[30rem] rounded-full bg-amber-500/15 blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <div className="mc-unfurl text-center relative shrink-0 pt-2 mb-2">
        <p className="mc-display text-[0.62rem] tracking-[0.55em] text-[#c084fc] font-semibold drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]">
          DRAVIDA 3D GAMING REALM
        </p>
        <h1 className="mc-display mc-title-glow mt-0.5 text-3xl font-extrabold text-white sm:text-5xl">
          KING&apos;S FALL
        </h1>

        {/* System Badges */}
        <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-3 py-0.5 text-xs font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{lobbyStats.onlineUsersCount} COMMANDERS ONLINE</span>
          </span>

          <button
            type="button"
            onClick={() => setIsStatsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 text-xs font-bold text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)] hover:bg-amber-500/30 transition-all cursor-pointer"
          >
            <Database size={12} />
            <span>SQLITE STATS</span>
          </button>

          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 px-3 py-0.5 text-xs font-bold text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:bg-purple-500/30 transition-all cursor-pointer"
          >
            <ShieldCheck size={12} />
            <span>ADMIN CONSOLE</span>
          </Link>
        </div>
      </div>

      {/* Main Identity Input Card */}
      <div className="mc-rise flex w-full max-w-md flex-col items-center justify-center my-auto p-2 relative">
        <div className="mc-slate mc-goldleaf w-full p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden border border-purple-500/40 shadow-[0_0_60px_rgba(168,85,247,0.2)] rounded-3xl bg-[#0c0e17]/95">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 text-xs font-semibold mb-3">
            <User size={14} className="text-[#c084fc]" />
            <span>COMMANDER IDENTITY REGISTRATION</span>
          </div>

          <h2 className="mc-display text-xl sm:text-2xl font-extrabold text-white mb-1.5 tracking-wide">
            Enter the Realm
          </h2>
          <p className="text-xs text-[#a5b9e0] mb-5 leading-relaxed">
            Set your commander handle to save stats in WebAssembly SQLite and access live game lobbies.
          </p>

          <div className="w-full space-y-4 mb-6 text-left">
            <div>
              <label className="mc-display text-[0.65rem] tracking-[0.25em] text-[#c084fc] block mb-1 font-bold uppercase">
                Commander Name / Handle
              </label>
              <div className="relative flex items-center">
                <User size={16} className="absolute left-3 text-[#c084fc]" />
                <input
                  type="text"
                  autoFocus
                  className="mc-chip w-full pl-9 pr-3 py-3 text-sm font-bold text-white outline-none focus:border-[#c084fc] rounded-xl bg-black/40 border border-white/15"
                  placeholder="e.g. Commander Vikram"
                  maxLength={24}
                  value={playerName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && playerName.trim()) {
                      handleContinueToGames();
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <label className="mc-display text-[0.65rem] tracking-[0.25em] text-[#c084fc] block mb-1 font-bold uppercase">
                Quick Title Presets
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {["Commander", "Warlord", "Emperor", "Knight"].map((title) => (
                  <button
                    key={title}
                    type="button"
                    className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      playerName.startsWith(title)
                        ? "bg-purple-500/30 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)] font-bold"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                    onClick={() => {
                      const cleaned = playerName.replace(/^(Commander|Warlord|Emperor|Knight)\s*/i, "").trim();
                      handleNameChange(`${title} ${cleaned}`.trim());
                    }}
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full space-y-2.5">
            <button
              type="button"
              disabled={!playerName.trim()}
              onClick={handleContinueToGames}
              className="mc-btn mc-btn-primary w-full py-3.5 text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>Select a Game to Launch</span>
              <ArrowRight size={16} />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/live-directory"
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#c084fc]/15 hover:bg-[#c084fc]/30 border border-[#c084fc]/40 text-[#c084fc] text-xs font-bold transition-all"
              >
                <Globe size={14} />
                <span>Live Directory (/live-directory)</span>
              </Link>
              <Link
                to="/chess"
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all"
              >
                <Crown size={14} className="text-amber-300" />
                <span>Launch Chess (/chess)</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <UserStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
      />

      {/* Footer info */}
      <p className="mc-menu-hint mt-2 shrink-0 text-[0.62rem] tracking-[0.2em] text-[#7d6f57]">
        DRAVIDA 3D GAMING REALM • WEBASSEMBLY SQLITE PERSISTENCE
      </p>
    </div>
  );
}
