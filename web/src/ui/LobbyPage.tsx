import { useState, useEffect } from "react";
import { Crown, Swords, Settings as SettingsIcon, User, Users, Globe, Copy, Check, Link, Lock, Sparkles, ShieldCheck } from "lucide-react";

import type { Difficulty, Faction } from "../core/types";
import { generateRoomCode } from "../core/multiplayer";
import { lobbyService, type LobbyStats } from "../core/lobby";
import { Crest } from "./Heraldry";
import { ArenaPicker, ArmyPicker, type MusterChoice } from "./Muster";
import { RazorpayPrivateRoomModal } from "./RazorpayPrivateRoomModal";
import type { MatchConfig } from "./MainMenu";

interface LobbyPageProps {
  onStart: (config: MatchConfig) => void;
  onOpenSettings: () => void;
  muster: MusterChoice;
  onMuster: (choice: MusterChoice) => void;
  onSwitchTab?: (tab: "ai" | "hotseat" | "online") => void;
  hasKeyboard?: boolean;
}

const DIFFICULTY_COPY: Record<Difficulty, string> = {
  easy: "Squire — quick, straightforward moves",
  medium: "Knight — thinks three moves deep",
  hard: "Warlord — full search, no mercy",
};

const CLOCKS: { label: string; value: number | null }[] = [
  { label: "None", value: null },
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
];

export function LobbyPage({
  onStart,
  onOpenSettings,
  muster,
  onMuster,
  hasKeyboard = true,
}: LobbyPageProps) {
  const [activeMode, setActiveMode] = useState<"ai" | "hotseat" | "online">("online");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [playerColor, setPlayerColor] = useState<Faction>("w");
  const [clock, setClock] = useState<number | null>(null);

  // Lobby & Online State
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
  const [privateNotice, setPrivateNotice] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("kg.playername") || "Commander";
    }
    return "Commander";
  });

  const handlePlayerNameChange = (name: string): void => {
    setPlayerName(name);
    lobbyService.setPlayerName(name);
    try {
      window.localStorage.setItem("kg.playername", name);
    } catch { }
  };

  useEffect(() => {
    const unsubscribe = lobbyService.subscribe((stats) => {
      setLobbyStats(stats);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");
    if (roomParam) {
      setActiveMode("online");
      setOnlineTab("join");
      setJoinCode(roomParam.toUpperCase());
    }
  }, []);

  // Leave draft unhosted rooms on setup tab change so rooms are only published when host enters the game room
  useEffect(() => {
    lobbyService.leaveRoom();
  }, [onlineTab, activeMode]);

  const copyCodeOnly = (): void => {
    void navigator.clipboard.writeText(hostCode);
    setCopiedMode("code");
    setTimeout(() => setCopiedMode(null), 2500);
  };

  const copyInviteLink = (): void => {
    const code = onlineTab === "join" ? joinCode : hostCode;
    const url = `${window.location.origin}${window.location.pathname}?room=${code}`;
    void navigator.clipboard.writeText(url);
    setCopiedMode("link");
    setTimeout(() => setCopiedMode(null), 2500);
  };

  const handleJoinPublicRoom = (roomCode: string): void => {
    lobbyService.markRoomJoined(roomCode);
    onStart({
      mode: "online",
      difficulty,
      playerColor,
      clockMinutes: clock,
      online: {
        roomCode,
        isHost: false,
        playerName: playerName.trim() || "Commander",
      },
    });
  };

  const handleStartMatch = (): void => {
    if (activeMode !== "online") {
      onStart({
        mode: activeMode,
        difficulty,
        playerColor,
        clockMinutes: clock,
      });
      return;
    }

    if (onlineTab === "private_create" && !isPrivatePaid) {
      setShowPrivateModal(true);
      return;
    }

    const isHostMode = onlineTab === "public_create" || onlineTab === "private_create";
    const selectedCode = isHostMode ? hostCode : joinCode;
    const isPrivate = onlineTab === "private_create";

    if (isHostMode) {
      lobbyService.registerHostRoom(selectedCode, isPrivate);
    } else {
      lobbyService.markRoomJoined(selectedCode);
    }

    onStart({
      mode: "online",
      difficulty,
      playerColor,
      clockMinutes: clock,
      online: {
        roomCode: selectedCode,
        isHost: isHostMode,
        isPrivate,
        playerName: playerName.trim() || "Commander",
      },
    });
  };

  return (
    <div className="mc-menu mc-modal-pad pointer-events-auto absolute inset-0 flex flex-col items-center justify-between overflow-hidden p-2 sm:p-4">
      {/* Title Header - Compact & Sleek */}
      <div className="mc-unfurl mc-menu-hero shrink-0 text-center relative mb-1">
        <p className="mc-display text-[0.62rem] tracking-[0.55em] text-[#c084fc] font-semibold drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]">
          DRAVIDA 3D CHESS
        </p>
        <h1 className="mc-display mc-title-glow mt-0.5 text-2xl font-extrabold text-white sm:text-4xl">
          KING&apos;S FALL
        </h1>

        {/* Live Online Badges */}
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-0.5 text-[0.6rem] font-bold text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{lobbyStats.onlineUsersCount} COMMANDERS ONLINE</span>
          </span>
          {lobbyStats.publicRooms.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/40 px-2.5 py-0.5 text-[0.6rem] font-bold text-[#c084fc]">
              <Globe size={10} />
              <span>{lobbyStats.publicRooms.length} PUBLIC LOBBIES</span>
            </span>
          )}
        </div>
      </div>

      {/* Split 2-Column Dashboard: Unified Glassmorphism Dashboard Layout */}
      <div className="mc-rise flex w-full max-w-6xl flex-1 flex-col gap-2.5 min-h-0 md:flex-row md:items-stretch overflow-hidden">

        {/* LEFT PANEL: LIVE LOBBY ROOMS DIRECTORY (COMPACT ~34%) */}
        <div className="mc-slate mc-goldleaf flex w-full flex-col p-3 sm:p-4 md:w-[34%] h-full min-h-0 overflow-hidden shrink-0">
          <div className="shrink-0 mb-2 flex items-center justify-between border-b border-white/10 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Globe size={14} className="text-[#c084fc]" />
              <h2 className="mc-display text-xs font-bold tracking-wider text-white uppercase">
                Live Directory ({lobbyStats.allRooms.length})
              </h2>
            </div>
            <span className="text-[0.58rem] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
              MAX 2
            </span>
          </div>

          {privateNotice && (
            <div className="shrink-0 mb-2 text-[0.65rem] font-semibold text-amber-300 bg-amber-500/20 border border-amber-500/40 p-1.5 rounded-lg text-center animate-fade-in">
              {privateNotice}
            </div>
          )}

          {/* Directory Listings */}
          <div className="mc-scroll flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5">
            {lobbyStats.allRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-3 rounded-xl border border-dashed border-white/10 bg-white/5">
                <Globe size={32} className="text-white/20 mb-1.5 animate-pulse" />
                <p className="text-xs font-semibold text-white/70">No active lobby rooms.</p>
                <p className="text-[0.65rem] text-white/40 mt-0.5">Host a public or secret room on the right panel!</p>
              </div>
            ) : (
              lobbyStats.allRooms.map((room) => (
                <div
                  key={room.roomCode}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all ${room.isPrivate
                      ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50"
                      : "bg-white/5 hover:bg-white/10 border-white/10"
                    }`}
                >
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="mc-display text-xs font-bold text-white tracking-widest">{room.roomCode}</span>
                      {room.isPrivate ? (
                        <span className="text-[0.55rem] bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded font-mono font-bold flex items-center gap-0.5">
                          <Lock size={8} /> PRIVATE
                        </span>
                      ) : (
                        <span className="text-[0.55rem] bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded font-mono font-bold">
                          PUBLIC
                        </span>
                      )}
                    </div>
                    <p className="text-[0.62rem] text-[#a5b9e0] mt-0.5">Host: {room.hostName}</p>
                  </div>

                  {room.isPrivate ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPrivateNotice("🔒 Private Room: Requires 6-character room code or invite link from host");
                        setTimeout(() => setPrivateNotice(null), 4500);
                      }}
                      className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2 py-1 font-bold rounded-lg cursor-pointer hover:bg-amber-500/30"
                      title="Private Room — Cannot join directly from directory"
                    >
                      <Lock size={10} /> LOCKED
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleJoinPublicRoom(room.roomCode)}
                      className="mc-btn mc-btn-primary text-xs px-2.5 py-1 font-bold shadow-md"
                    >
                      JOIN
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="shrink-0 mt-2 rounded-xl border border-white/10 bg-black/20 p-2 text-[0.62rem] text-white/60 space-y-0.5">
            <p className="font-semibold text-[#c084fc] flex items-center gap-1">
              <Globe size={10} /> Lobby Information
            </p>
            <p>• Public rooms are free & joinable by anyone until 2 players join.</p>
            <p>• Secret private rooms cost ₹25 & require code/link.</p>
          </div>
        </div>

        {/* RIGHT PANEL: UNIFIED GLASS DASHBOARD SETUP (EXPANDED ~66%) */}
        <div className="mc-slate mc-goldleaf flex w-full flex-col p-3 sm:p-4 md:w-[66%] h-full min-h-0 overflow-hidden shrink-0 justify-between">
          {/* Main Navigation Mode Tabs */}
          <div className="shrink-0 mb-2 grid grid-cols-3 gap-1.5">
            <button
              type="button"
              className="mc-chip flex items-center justify-center gap-1 px-1 py-2 text-xs font-semibold"
              data-active={activeMode === "ai"}
              onClick={() => setActiveMode("ai")}
            >
              <Swords size={13} /> Computer
            </button>
            <button
              type="button"
              className="mc-chip flex items-center justify-center gap-1 px-1 py-2 text-xs font-semibold"
              data-active={activeMode === "hotseat"}
              onClick={() => setActiveMode("hotseat")}
            >
              <Users size={13} /> 2 Players
            </button>
            <button
              type="button"
              className="mc-chip flex items-center justify-center gap-1 px-1 py-2 text-xs font-semibold"
              data-active={activeMode === "online"}
              onClick={() => setActiveMode("online")}
            >
              <Globe size={13} /> Online Mode
            </button>
          </div>

          {/* 2-Column Side-by-Side Menu Options Grid */}
          <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-hidden">
            {/* Column 1: Active Mode Options */}
            <div className="flex flex-col justify-between space-y-2">
              {activeMode === "ai" && (
                <div className="space-y-2.5">
                  <div>
                    <p className="mc-display mb-1 text-[0.6rem] tracking-[0.3em] text-[#c084fc]">Opponent AI</p>
                    <div className="grid grid-cols-3 gap-1">
                      {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
                        <button
                          key={level}
                          type="button"
                          className="mc-chip py-1.5 text-xs font-semibold"
                          data-active={difficulty === level}
                          onClick={() => setDifficulty(level)}
                        >
                          {level.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1 text-[0.65rem] italic text-[#a5b9e0]">{DIFFICULTY_COPY[difficulty]}</p>
                  </div>

                  <div>
                    <p className="mc-display mb-1 text-[0.6rem] tracking-[0.3em] text-[#c084fc]">Your Banner</p>
                    <div className="grid grid-cols-2 gap-1">
                      {(["w", "b"] as Faction[]).map((color) => (
                        <button
                          key={color}
                          type="button"
                          className="mc-chip flex items-center justify-center gap-1 py-1.5 text-[0.65rem]"
                          data-active={playerColor === color}
                          onClick={() => setPlayerColor(color)}
                        >
                          <Crest faction={color} size={14} active={playerColor === color} />
                          {color === "w" ? "Vikramaditya" : "Suryadev"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeMode === "hotseat" && (
                <div className="space-y-2.5">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs italic text-[#e0ebff] leading-relaxed">
                    Two commanders, one board. The view holds its angle between turns —{" "}
                    {hasKeyboard ? (
                      <>flip it with <span className="mc-display text-[#c084fc]">F</span>, or</>
                    ) : (
                      <>flip it from camera menu, or</>
                    )}{" "}
                    switch on automatic swing in settings.
                  </div>

                  <div>
                    <p className="mc-display mb-1 text-[0.6rem] tracking-[0.3em] text-[#c084fc]">Near Side Banner</p>
                    <div className="grid grid-cols-2 gap-1">
                      {(["w", "b"] as Faction[]).map((color) => (
                        <button
                          key={color}
                          type="button"
                          className="mc-chip flex items-center justify-center gap-1 py-1.5 text-[0.65rem]"
                          data-active={playerColor === color}
                          onClick={() => setPlayerColor(color)}
                        >
                          <Crest faction={color} size={14} active={playerColor === color} />
                          {color === "w" ? "Vikramaditya" : "Suryadev"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeMode === "online" && (
                <div className="flex flex-col justify-between space-y-2">
                  <div>
                    <p className="mc-display mb-1 text-[0.6rem] tracking-[0.3em] text-[#c084fc]">Your Commander Name</p>
                    <div className="relative flex items-center">
                      <User size={13} className="absolute left-2.5 text-[#c084fc]" />
                      <input
                        type="text"
                        className="mc-chip w-full pl-8 pr-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-[#c084fc]"
                        placeholder="Enter commander name..."
                        maxLength={24}
                        value={playerName}
                        onChange={(e) => handlePlayerNameChange(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Room Creation & Join Sub-Tabs */}
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      className="mc-chip py-1 text-[0.6rem] font-bold"
                      data-active={onlineTab === "public_create"}
                      onClick={() => setOnlineTab("public_create")}
                    >
                      Public (FREE)
                    </button>
                    <button
                      type="button"
                      className="mc-chip py-1 text-[0.6rem] font-bold text-amber-300"
                      data-active={onlineTab === "private_create"}
                      onClick={() => setOnlineTab("private_create")}
                    >
                      <Lock size={9} className="inline mr-0.5 text-amber-400" />
                      Private (₹25)
                    </button>
                    <button
                      type="button"
                      className="mc-chip py-1 text-[0.6rem] font-bold"
                      data-active={onlineTab === "join"}
                      onClick={() => setOnlineTab("join")}
                    >
                      Join Code
                    </button>
                  </div>

                  {/* Public Room Box */}
                  {onlineTab === "public_create" && (
                    <div className="space-y-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2 text-center">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.6rem] font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-0.5">
                          <Globe size={11} /> Invite Code
                        </span>
                        <span className="text-[0.55rem] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">FREE</span>
                      </div>

                      <button
                        type="button"
                        onClick={copyCodeOnly}
                        className="mc-display text-lg font-bold tracking-[0.25em] text-white hover:text-emerald-400 transition-colors cursor-pointer w-full py-0.5 rounded-lg bg-black/40 border border-emerald-500/30 flex items-center justify-center gap-1.5 group"
                      >
                        <span>{hostCode}</span>
                        <Copy size={13} className="opacity-60 group-hover:opacity-100 text-emerald-400" />
                      </button>

                      <div className="grid grid-cols-2 gap-1">
                        <button type="button" className="mc-btn py-1 text-[0.65rem]" onClick={copyCodeOnly}>
                          {copiedMode === "code" ? <Check size={11} className="text-emerald-400 inline" /> : <Copy size={11} className="inline" />} Copy
                        </button>
                        <button type="button" className="mc-btn mc-btn-primary py-1 text-[0.65rem]" onClick={copyInviteLink}>
                          {copiedMode === "link" ? <Check size={11} className="text-emerald-400 inline" /> : <Link size={11} className="inline" />} Link
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Private Room Box */}
                  {onlineTab === "private_create" && (
                    <div className="space-y-1.5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-2 text-center">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.6rem] font-bold tracking-wider text-amber-400 uppercase flex items-center gap-0.5">
                          <Lock size={11} /> Secret Room
                        </span>
                        <span className="text-[0.55rem] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">₹25 FEE</span>
                      </div>

                      {isPrivatePaid ? (
                        <>
                          <div className="flex items-center justify-center gap-1 text-[0.65rem] text-emerald-400 font-bold bg-emerald-500/15 py-0.5 rounded border border-emerald-500/30">
                            <ShieldCheck size={12} /> Unlocked & Active!
                          </div>
                          <button
                            type="button"
                            onClick={copyCodeOnly}
                            className="mc-display text-lg font-bold tracking-[0.25em] text-white hover:text-amber-400 transition-colors cursor-pointer w-full py-0.5 rounded-lg bg-black/40 border border-amber-500/30 flex items-center justify-center gap-1.5 group"
                          >
                            <span>{hostCode}</span>
                            <Copy size={13} className="text-amber-400" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowPrivateModal(true)}
                          className="mc-pulse flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-purple-600 py-1.5 text-xs font-bold text-white shadow-md hover:brightness-110 cursor-pointer"
                        >
                          <Sparkles size={12} /> Unlock Private (₹25)
                        </button>
                      )}
                    </div>
                  )}

                  {/* Join Code Mode */}
                  {onlineTab === "join" && (
                    <div className="space-y-1 rounded-xl border border-white/10 bg-white/5 p-2">
                      <p className="mc-display text-[0.6rem] tracking-[0.2em] text-[#c084fc]">Enter Room Code</p>
                      <input
                        type="text"
                        className="mc-chip uppercase w-full px-2 py-1 text-center text-sm font-bold tracking-widest text-white outline-none focus:border-[#c084fc]"
                        placeholder="e.g. 7X9K2A"
                        maxLength={8}
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Column 2: Battleground Arena, Banner, Hourglass & Armies */}
            <div className="mc-scroll flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
              {/* Battleground Arena Selector */}
              <div>
                <p className="mc-display mb-1 text-[0.6rem] tracking-[0.3em] text-[#c084fc]">Battleground Arena</p>
                <ArenaPicker chosen={muster.arena} onChoose={(arena) => onMuster({ ...muster, arena })} />
              </div>

              {/* Hourglass Timer */}
              <div>
                <p className="mc-display mb-1 text-[0.6rem] tracking-[0.3em] text-[#c084fc]">Hourglass Timer</p>
                <div className="grid grid-cols-4 gap-1">
                  {CLOCKS.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      className="mc-chip py-1 text-[0.65rem]"
                      data-active={clock === option.value}
                      onClick={() => setClock(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Armies Muster */}
              <div>
                <p className="mc-display mb-1 text-[0.6rem] tracking-[0.3em] text-[#c084fc]">Armies Muster</p>
                <ArmyPicker
                  side="w"
                  name="Near side"
                  chosen={muster.skins.w}
                  onChoose={(skin) => onMuster({ ...muster, skins: { ...muster.skins, w: skin } })}
                />
                <ArmyPicker
                  side="b"
                  name="Far side"
                  chosen={muster.skins.b}
                  onChoose={(skin) => onMuster({ ...muster, skins: { ...muster.skins, b: skin } })}
                />
              </div>
            </div>
          </div>

          {/* Action & Settings Buttons Footer */}
          <div className="shrink-0 mt-2 space-y-1">
            <button
              type="button"
              className="mc-btn mc-btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-bold shadow-md"
              onClick={handleStartMatch}
            >
              <Crown size={15} />{" "}
              {activeMode !== "online"
                ? "Take the field"
                : onlineTab === "private_create" && !isPrivatePaid
                  ? "Pay ₹25 & Host Private Room"
                  : onlineTab === "join"
                    ? "Join Friend Game"
                    : "Host Public Room"}
            </button>

            <button
              type="button"
              className="mc-btn flex w-full items-center justify-center gap-1.5 py-1 text-[0.68rem]"
              onClick={onOpenSettings}
            >
              <SettingsIcon size={13} /> Settings
            </button>
          </div>
        </div>
      </div>

      <RazorpayPrivateRoomModal
        isOpen={showPrivateModal}
        onClose={() => setShowPrivateModal(false)}
        onSuccess={() => {
          setIsPrivatePaid(true);
          setShowPrivateModal(false);
          lobbyService.registerHostRoom(hostCode, true);
        }}
        playerName={playerName}
      />

      {/* Footer hint */}
      <p className="mc-menu-hint mt-1 shrink-0 text-[0.62rem] tracking-[0.2em] text-[#7d6f57]">
        {hasKeyboard
          ? "DRAG TO ORBIT · SCROLL TO ZOOM · CLICK A FIGURE TO COMMAND IT"
          : "DRAG TO ORBIT · PINCH TO ZOOM · TAP A FIGURE TO COMMAND IT"}
      </p>
    </div>
  );
}
