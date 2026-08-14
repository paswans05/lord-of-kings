import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Gamepad2,
  Crown,
  Swords,
  User,
  Database,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Check,
  Globe,
} from "lucide-react";
import { sqliteDb } from "../db";
import { lobbyService, type LobbyStats } from "../core/lobby";
import { UserStatsModal } from "../ui/UserStatsModal";

export default function GamesCatalogPage() {
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
    void (async () => {
      try {
        const user = await sqliteDb.getUser();
        if (user && user.username) {
          setPlayerName(user.username);
        }
      } catch (err) {
        console.warn("[GamesCatalog] SQLite load error:", err);
      }
    })();

    const unsubscribe = lobbyService.subscribe((stats) => {
      setLobbyStats(stats);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="mc-root fixed inset-0 flex flex-col items-center justify-between bg-[#05060a] p-3 sm:p-6 select-none overflow-y-auto">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

      {/* Navigation & Commander Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur-md shrink-0 mb-3">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Edit Profile (/)</span>
          </Link>
          <div className="h-6 w-px bg-white/15" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-xs">
              {playerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[0.55rem] tracking-[0.2em] text-[#c084fc] font-bold uppercase">COMMANDER PROFILE</p>
              <h3 className="text-xs sm:text-sm font-bold text-white">{playerName}</h3>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsStatsModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-all cursor-pointer"
          >
            <Database size={13} />
            <span>SQLite Stats</span>
          </button>

          <Link
            to="/admin"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/30 transition-all"
          >
            <ShieldCheck size={13} />
            <span>Admin</span>
          </Link>
        </div>
      </div>

      {/* Main Catalog Header */}
      <div className="w-full max-w-5xl flex-1 flex flex-col gap-4 min-h-0">
        <div className="shrink-0 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 text-xs font-semibold mb-1">
            <Gamepad2 size={14} className="text-[#c084fc]" />
            <span>REALM GAME DIRECTORY</span>
          </div>
          <h1 className="mc-display text-2xl sm:text-3xl font-extrabold text-white">
            Select a Game to Launch
          </h1>
          <p className="text-xs text-[#a5b9e0]">
            Choose your battleground below. Click CHESS to enter the 3D WebAssembly match lobby!
          </p>
        </div>

        {/* Games Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-y-auto mc-scroll">
          
          {/* GAME 1: KING'S FALL 3D CHESS (PLAYABLE NOW) */}
          <div className="mc-slate mc-goldleaf p-5 rounded-2xl border-2 border-purple-500/50 bg-gradient-to-br from-purple-950/40 via-black/60 to-purple-900/20 flex flex-col justify-between relative overflow-hidden group hover:border-purple-400 transition-all shadow-[0_0_30px_rgba(168,85,247,0.25)]">
            <div className="absolute top-0 right-0 px-3 py-0.5 bg-gradient-to-l from-purple-600 to-indigo-600 text-white text-[0.6rem] font-extrabold tracking-widest uppercase rounded-bl-xl shadow-md">
              PLAYABLE NOW
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/30 border border-purple-400 flex items-center justify-center text-amber-300 text-2xl shadow-[0_0_15px_rgba(192,132,252,0.4)]">
                  ♚
                </div>
                <div>
                  <p className="text-[0.58rem] tracking-[0.25em] text-[#c084fc] font-bold uppercase">DRAVIDA 3D SUITE</p>
                  <h3 className="mc-display text-lg font-extrabold text-white">KING&apos;S FALL CHESS</h3>
                </div>
              </div>

              <p className="text-xs text-[#dcd1bc] leading-relaxed mb-4">
                Full 3D WebAssembly chess hall featuring AI opponents, live P2P online lobbies, voice chat, custom armies, and photorealistic arenas.
              </p>

              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {lobbyStats.onlineUsersCount} Commanders Online
                </span>
                <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full font-bold">
                  3D WebAssembly
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => navigate("/chess")}
                className="mc-btn mc-btn-primary py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Crown size={14} /> Launch Chess (/chess)
              </button>
              <button
                type="button"
                onClick={() => navigate("/live-directory")}
                className="mc-btn py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-purple-600/30 hover:bg-purple-600/50 border-purple-500/40 text-purple-200 cursor-pointer"
              >
                <Globe size={14} /> Live Directory (/live-directory)
              </button>
            </div>
          </div>

          {/* GAME 2: ANCIENT CHECKERS 3D */}
          <div className="mc-slate p-5 rounded-2xl border border-white/10 bg-white/5 flex flex-col justify-between opacity-80 hover:opacity-100 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-amber-300 text-2xl">
                    ⚪
                  </div>
                  <div>
                    <p className="text-[0.58rem] tracking-[0.25em] text-white/50 font-bold uppercase">TACTICAL SERIES</p>
                    <h3 className="mc-display text-base font-bold text-white/90">ANCIENT CHECKERS 3D</h3>
                  </div>
                </div>
                <span className="text-[0.6rem] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  COMING SOON
                </span>
              </div>

              <p className="text-xs text-[#a5b9e0] leading-relaxed mb-4">
                Classic draughts rendered with full physics, force jumps, king promotions, and atmospheric medieval battleboards.
              </p>
            </div>

            <button
              type="button"
              disabled
              className="mc-btn py-2.5 text-xs font-bold text-white/40 border border-white/10 cursor-not-allowed bg-white/5"
            >
              In Development
            </button>
          </div>

          {/* GAME 3: DRAVIDA WAR CARROM */}
          <div className="mc-slate p-5 rounded-2xl border border-white/10 bg-white/5 flex flex-col justify-between opacity-80 hover:opacity-100 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-amber-300 text-2xl">
                    🎯
                  </div>
                  <div>
                    <p className="text-[0.58rem] tracking-[0.25em] text-white/50 font-bold uppercase">PHYSICS ARENA</p>
                    <h3 className="mc-display text-base font-bold text-white/90">DRAVIDA WAR CARROM</h3>
                  </div>
                </div>
                <span className="text-[0.6rem] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  COMING SOON
                </span>
              </div>

              <p className="text-xs text-[#a5b9e0] leading-relaxed mb-4">
                Flick-action carrom striker board with real-time rigid body physics, queen cover bonuses, and 4-player online matches.
              </p>
            </div>

            <button
              type="button"
              disabled
              className="mc-btn py-2.5 text-xs font-bold text-white/40 border border-white/10 cursor-not-allowed bg-white/5"
            >
              In Development
            </button>
          </div>

          {/* GAME 4: CHATURANGA 4P */}
          <div className="mc-slate p-5 rounded-2xl border border-white/10 bg-white/5 flex flex-col justify-between opacity-80 hover:opacity-100 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-amber-300 text-2xl">
                    🐘
                  </div>
                  <div>
                    <p className="text-[0.58rem] tracking-[0.25em] text-white/50 font-bold uppercase">ANCIENT ORIGINS</p>
                    <h3 className="mc-display text-base font-bold text-white/90">CHATURANGA 4P</h3>
                  </div>
                </div>
                <span className="text-[0.6rem] bg-white/10 text-white/60 border border-white/15 px-2 py-0.5 rounded-full font-mono font-bold">
                  PLANNED
                </span>
              </div>

              <p className="text-xs text-[#a5b9e0] leading-relaxed mb-4">
                The ancient 4-player Indian precursor to modern chess featuring dice rolls, infantry, war elephants, and chariots.
              </p>
            </div>

            <button
              type="button"
              disabled
              className="mc-btn py-2.5 text-xs font-bold text-white/40 border border-white/10 cursor-not-allowed bg-white/5"
            >
              Planned
            </button>
          </div>

        </div>
      </div>

      <UserStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
      />

      {/* Footer */}
      <p className="mc-menu-hint mt-2 shrink-0 text-[0.62rem] tracking-[0.2em] text-[#7d6f57]">
        DRAVIDA 3D REALM GAME CATALOG
      </p>
    </div>
  );
}
