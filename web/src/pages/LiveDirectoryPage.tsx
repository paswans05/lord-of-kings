import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Globe,
  Users,
  Copy,
  Check,
  Plus,
  ArrowLeft,
  Crown,
  Swords,
  Lock,
  Sparkles,
  ShieldCheck,
  Database,
  User,
  Trophy,
  Activity,
  Flame,
  Award,
} from "lucide-react";
import { sqliteDb, UserProfile, UserStats, MatchRecord } from "../db";
import { lobbyService, type LobbyStats } from "../core/lobby";
import { generateRoomCode } from "../core/multiplayer";
import { RazorpayPrivateRoomModal } from "../ui/RazorpayPrivateRoomModal";
import { UserStatsModal } from "../ui/UserStatsModal";

export default function LiveDirectoryPage() {
  const navigate = useNavigate();

  // User Identity & SQLite Stats State
  const [playerName, setPlayerName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("kg.playername") || "Commander";
    }
    return "Commander";
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);

  // Lobby State
  const [lobbyStats, setLobbyStats] = useState<LobbyStats>({
    onlineUsersCount: 1,
    publicRooms: [],
    privateRooms: [],
    allRooms: [],
  });

  const [onlineTab, setOnlineTab] = useState<"public_create" | "private_create" | "join">("public_create");
  const [hostCode] = useState<string>(() => generateRoomCode());
  const [joinCode, setJoinCode] = useState<string>("");
  const [copiedMode, setCopiedMode] = useState<"code" | "link" | null>(null);
  const [showPrivateModal, setShowPrivateModal] = useState<boolean>(false);
  const [isPrivatePaid, setIsPrivatePaid] = useState<boolean>(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    void loadUserData();

    const unsubscribe = lobbyService.subscribe((stats) => {
      setLobbyStats(stats);
    });
    return () => unsubscribe();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await sqliteDb.getUser();
      const stats = await sqliteDb.getUserStats();
      const history = await sqliteDb.getMatchHistory(10);

      if (user && user.username) {
        setPlayerName(user.username);
        setProfile(user);
      }
      setUserStats(stats);
      setMatchHistory(history);
    } catch (err) {
      console.warn("[LiveDirectory] Error loading SQLite user data:", err);
    }
  };

  const handleCopy = (type: "code" | "link") => {
    const textToCopy =
      type === "code"
        ? hostCode
        : `${window.location.origin}/chess?room=${hostCode}`;
    navigator.clipboard.writeText(textToCopy).catch(() => {});
    setCopiedMode(type);
    setTimeout(() => setCopiedMode(null), 2500);
  };

  const handleLaunchChess = (roomCode?: string, isHost = true, isPrivate = false) => {
    if (isPrivate && !isPrivatePaid) {
      setShowPrivateModal(true);
      return;
    }

    const code = roomCode || (onlineTab === "join" ? joinCode : hostCode);
    navigate(`/chess?room=${code}&host=${isHost ? "1" : "0"}&private=${isPrivate ? "1" : "0"}`);
  };

  const handleQuickVsAi = () => {
    navigate("/chess?mode=ai");
  };

  const handleQuickHotseat = () => {
    navigate("/chess?mode=hotseat");
  };

  const winRate =
    userStats && userStats.totalMatches > 0
      ? Math.round((userStats.wins / userStats.totalMatches) * 100)
      : 0;

  return (
    <div className="mc-root fixed inset-0 flex flex-col items-center justify-between bg-[#05060a] p-3 sm:p-6 select-none overflow-y-auto">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] rounded-full bg-amber-500/15 blur-[120px] pointer-events-none" />

      {/* Top Header Navigation Bar */}
      <div className="w-full max-w-6xl flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur-md shrink-0 mb-3">
        <div className="flex items-center gap-3">
          <Link
            to="/games"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Game Catalog (/games)</span>
          </Link>
          <div className="h-6 w-px bg-white/15" />
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span className="mc-display text-[#c084fc] font-bold">COMMANDER:</span>
            <span className="font-bold text-white">{playerName}</span>
            <Link to="/" className="text-[0.68rem] text-purple-300 underline hover:text-white ml-1">
              Edit Name (/)
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsStatsModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-all cursor-pointer"
          >
            <Database size={13} />
            <span>SQLite Console</span>
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

      {/* Main Split Dashboard: LEFT = Live Directory | RIGHT = User Stats */}
      <div className="w-full max-w-6xl flex-1 flex flex-col gap-3 min-h-0">
        
        {/* Title Bar */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="mc-display text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              <span>LIVE DIRECTORY & USER STATS</span>
            </h1>
            <p className="text-xs text-[#a5b9e0]">
              Browse online lobbies on the left, and track your SQLite database player statistics on the right!
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            {lobbyStats.onlineUsersCount} COMMANDERS ONLINE
          </span>
        </div>

        {/* 2-COLUMN SPLIT DASHBOARD GRID */}
        <div className="mc-rise flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-y-auto mc-scroll">
          
          {/* ========================================================= LEFT SIDE: LIVE DIRECTORY */}
          <div className="mc-slate mc-goldleaf p-4 sm:p-5 rounded-2xl border border-purple-500/40 bg-[#0c0e17]/95 flex flex-col justify-between space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Globe size={18} />
                </div>
                <div>
                  <h2 className="mc-display text-base font-bold text-white">Live Room Directory</h2>
                  <p className="text-[0.65rem] text-[#a5b9e0]">Real-time P2P multiplayer lobbies & room creation</p>
                </div>
              </div>
              <span className="text-[0.6rem] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full font-mono font-bold">
                {lobbyStats.publicRooms.length} PUBLIC ROOMS
              </span>
            </div>

            {/* Room Host / Join Selector Tabs */}
            <div className="flex border-b border-white/10 pb-2 gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setOnlineTab("public_create")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  onlineTab === "public_create"
                    ? "bg-purple-500/30 text-purple-200 border border-purple-500/40"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Host Public
              </button>
              <button
                type="button"
                onClick={() => setOnlineTab("private_create")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  onlineTab === "private_create"
                    ? "bg-amber-500/30 text-amber-200 border border-amber-500/40"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Host Private (₹25)
              </button>
              <button
                type="button"
                onClick={() => setOnlineTab("join")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  onlineTab === "join"
                    ? "bg-emerald-500/30 text-emerald-200 border border-emerald-500/40"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Join Code
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="space-y-3 shrink-0">
              {onlineTab === "public_create" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/70 font-semibold">Invite Code:</span>
                      <span className="font-mono text-base font-bold text-amber-300 bg-black/40 px-3 py-0.5 rounded-lg border border-amber-500/30">
                        {hostCode}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy("code")}
                        className="py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs text-white/90 hover:bg-white/20 font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copiedMode === "code" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{copiedMode === "code" ? "Copied Code!" : "Copy Code"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy("link")}
                        className="py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs text-white/90 hover:bg-white/20 font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copiedMode === "link" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{copiedMode === "link" ? "Copied Link!" : "Copy Link"}</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLaunchChess(hostCode, true, false)}
                    className="mc-btn mc-btn-primary w-full py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Crown size={15} />
                    <span>Host Public Room & Launch 3D Chess (/chess)</span>
                  </button>
                </div>
              )}

              {onlineTab === "private_create" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                    <div className="flex items-center gap-2">
                      <Lock size={16} className="text-amber-400" />
                      <h4 className="text-xs font-bold text-amber-300 uppercase">Secret Passwordless Private Room (₹25)</h4>
                    </div>
                    <p className="text-[0.68rem] text-[#dcd1bc]">
                      Hidden from public directory. Accessible only via your direct invite code/link.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLaunchChess(hostCode, true, true)}
                    className="mc-btn w-full py-3 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-purple-600 to-[#c084fc] text-white shadow-lg cursor-pointer"
                  >
                    <Lock size={15} />
                    <span>{isPrivatePaid ? "Launch Private 3D Chess Arena (/chess)" : "Pay ₹25 Pass & Host Private Room"}</span>
                  </button>
                </div>
              )}

              {onlineTab === "join" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-emerald-300 block mb-1">
                      Enter Friend&apos;s Room Code:
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="e.g. AB12CD"
                      maxLength={6}
                      className="w-full p-2.5 font-mono text-center text-base font-bold bg-black/40 border border-emerald-500/40 rounded-xl text-white outline-none focus:border-emerald-400"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!joinCode.trim()}
                    onClick={() => handleLaunchChess(joinCode, false, false)}
                    className="mc-btn w-full py-3 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    <Swords size={15} />
                    <span>Join Friend Game & Launch 3D Chess (/chess)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Active Public Lobbies List */}
            <div className="space-y-2 border-t border-white/10 pt-3 flex-1 min-h-[140px] overflow-y-auto mc-scroll">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Active Public Lobbies</h3>
              {lobbyStats.publicRooms.length === 0 ? (
                <div className="text-center py-6 text-white/40 border border-dashed border-white/10 rounded-xl">
                  <Users size={24} className="mx-auto mb-1 opacity-30" />
                  <p className="text-xs text-white/70">No active public rooms right now.</p>
                </div>
              ) : (
                lobbyStats.publicRooms.map((r) => (
                  <div
                    key={r.roomCode}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition-all flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{r.hostName || "Commander"}</span>
                      <span className="ml-2 font-mono text-[0.6rem] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded">
                        #{r.roomCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLaunchChess(r.roomCode, false, false)}
                      className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[0.65rem] font-bold cursor-pointer"
                    >
                      Join & Play →
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* ========================================================= RIGHT SIDE: USER STATS */}
          <div className="mc-slate mc-goldleaf p-4 sm:p-5 rounded-2xl border border-amber-500/40 bg-[#0c0e17]/95 flex flex-col justify-between space-y-4">
            
            {/* Header & User Profile */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-lg shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                  {playerName.charAt(0).toUpperCase() || "C"}
                </div>
                <div>
                  <h2 className="mc-display text-base font-bold text-white">{playerName}</h2>
                  <div className="flex items-center gap-2 text-[0.65rem] text-amber-300/80">
                    <span className="px-2 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 font-semibold">
                      {profile?.title || "Commander"}
                    </span>
                    <span>Rating: <strong>{profile?.rating || 1200} ELO</strong></span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl sm:text-2xl font-black text-amber-400">{winRate}%</div>
                <div className="text-[0.62rem] text-white/50 font-semibold uppercase">Win Rate</div>
              </div>
            </div>

            {/* SQLite KPI Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-[0.58rem] text-white/50 uppercase font-bold">Matches</p>
                <p className="text-lg font-bold text-white">{userStats?.totalMatches || 0}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center">
                <p className="text-[0.58rem] text-emerald-300/70 uppercase font-bold">Victories</p>
                <p className="text-lg font-bold text-emerald-400">{userStats?.wins || 0}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-center">
                <p className="text-[0.58rem] text-rose-300/70 uppercase font-bold">Defeats</p>
                <p className="text-lg font-bold text-rose-400">{userStats?.losses || 0}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-center">
                <p className="text-[0.58rem] text-amber-300/70 uppercase font-bold">Win Streak</p>
                <p className="text-lg font-bold text-amber-400">{userStats?.winStreak || 0} 🔥</p>
              </div>
            </div>

            {/* Recent Match History Table */}
            <div className="space-y-2 border-t border-white/10 pt-3 flex-1 min-h-[140px] overflow-y-auto mc-scroll">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={14} /> SQLite Match History
                </h3>
                <span className="text-[0.6rem] text-white/40 font-mono">Top 5 Records</span>
              </div>

              {matchHistory.length === 0 ? (
                <div className="text-center py-6 text-white/40 border border-dashed border-white/10 rounded-xl">
                  <Trophy size={24} className="mx-auto mb-1 opacity-30 text-amber-400" />
                  <p className="text-xs text-white/70">No match records stored yet.</p>
                  <p className="text-[0.62rem] text-white/40">Play AI, Hotseat, or Online to record matches!</p>
                </div>
              ) : (
                matchHistory.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-white">
                        <span>{m.whitePlayer}</span> <span className="text-white/40 font-normal">vs</span> <span>{m.blackPlayer}</span>
                        <span className="ml-2 text-[0.6rem] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 uppercase font-mono">
                          {m.mode}
                        </span>
                      </div>
                      <p className="text-[0.62rem] text-white/50 mt-0.5">
                        {m.movesCount} moves • {new Date(m.timestamp).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[0.62rem] font-bold">
                        {m.winner}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Practice & Local Actions */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 shrink-0">
              <button
                type="button"
                onClick={handleQuickVsAi}
                className="py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Swords size={13} /> Practice vs AI
              </button>
              <button
                type="button"
                onClick={handleQuickHotseat}
                className="py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Crown size={13} /> Hotseat 2P
              </button>
            </div>

          </div>

        </div>
      </div>

      <RazorpayPrivateRoomModal
        isOpen={showPrivateModal}
        onClose={() => setShowPrivateModal(false)}
        onSuccess={() => {
          setIsPrivatePaid(true);
          setShowPrivateModal(false);
          handleLaunchChess(hostCode, true, true);
        }}
        playerName={playerName}
      />

      <UserStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
      />

      {/* Footer */}
      <p className="mc-menu-hint mt-2 shrink-0 text-[0.62rem] tracking-[0.2em] text-[#7d6f57]">
        DRAVIDA 3D CHESS • LEFT: LIVE DIRECTORY | RIGHT: USER STATS
      </p>
    </div>
  );
}
