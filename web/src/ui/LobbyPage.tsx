import { useState, useEffect } from "react";
import { Crown, Swords, Settings as SettingsIcon, User, Users, Globe, Copy, Check, Link, Lock, Sparkles, ShieldCheck } from "lucide-react";

import type { Difficulty, Faction } from "../core/types";
import { generateRoomCode } from "../core/multiplayer";
import { lobbyService, type LobbyStats } from "../core/lobby";
import { Crest } from "./Heraldry";
import { MusterSection, type MusterChoice } from "./Muster";
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
  onSwitchTab,
  hasKeyboard = true,
}: LobbyPageProps) {
  const [difficulty] = useState<Difficulty>("medium");
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
    } catch {}
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
      setOnlineTab("join");
      setJoinCode(roomParam.toUpperCase());
    }
  }, []);

  // Register host room when in public create or paid private create tab so second person sees it live in directory
  useEffect(() => {
    if (onlineTab === "public_create") {
      lobbyService.registerHostRoom(hostCode, false);
    } else if (onlineTab === "private_create" && isPrivatePaid) {
      lobbyService.registerHostRoom(hostCode, true);
    } else {
      lobbyService.leaveRoom();
    }
    return () => {
      lobbyService.leaveRoom();
    };
  }, [onlineTab, hostCode, isPrivatePaid]);

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

  const handleStartOnlineMatch = (): void => {
    if (onlineTab === "private_create" && !isPrivatePaid) {
      setShowPrivateModal(true);
      return;
    }

    const isHostMode = onlineTab === "public_create" || onlineTab === "private_create";
    const selectedCode = isHostMode ? hostCode : joinCode;
    const isPrivate = onlineTab === "private_create";

    if (isHostMode) {
      // Publish the public/private room only now when the host makes it public!
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
    <div className="mc-menu mc-modal-pad pointer-events-auto absolute inset-0 flex flex-col items-center justify-between overflow-hidden p-3 sm:p-5">
      {/* Title & Online Header Counters */}
      <div className="mc-unfurl mc-menu-hero shrink-0 text-center relative mb-2">
        <p className="mc-display text-[0.65rem] tracking-[0.55em] text-[#c084fc] font-semibold drop-shadow-[0_0_12px_rgba(192,132,252,0.5)]">
          DRAVIDA 3D CHESS
        </p>
        <h1 className="mc-display mc-title-glow mt-0.5 text-3xl font-extrabold text-white sm:text-5xl">
          KING&apos;S FALL LOBBY
        </h1>

        {/* Live Online Users Header Badge */}
        <div className="mt-1.5 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-3 py-0.5 text-[0.62rem] font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{lobbyStats.onlineUsersCount} COMMANDERS ONLINE</span>
          </span>
          {lobbyStats.publicRooms.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-500/40 px-3 py-0.5 text-[0.62rem] font-bold text-[#c084fc]">
              <Globe size={11} />
              <span>{lobbyStats.publicRooms.length} PUBLIC LOBBIES</span>
            </span>
          )}
        </div>
      </div>

      {/* Split 2-Column Container: Full Width, Fixed Height Bound */}
      <div className="mc-rise flex w-full max-w-6xl flex-1 flex-col gap-3 min-h-0 md:flex-row md:items-stretch overflow-hidden">
        
        {/* LEFT SIDE: LIVE LOBBY DIRECTORY PANEL */}
        <div className="mc-slate mc-goldleaf flex w-full flex-col p-4 sm:p-5 md:w-1/2 h-full min-h-0 overflow-hidden shrink-0">
          <div className="shrink-0 mb-2.5 flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-[#c084fc]" />
              <h2 className="mc-display text-xs sm:text-sm font-bold tracking-wider text-white uppercase">
                Live Lobby Rooms ({lobbyStats.allRooms.length})
              </h2>
            </div>
            <span className="text-[0.6rem] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
              MAX 2 PLAYERS
            </span>
          </div>

          {privateNotice && (
            <div className="shrink-0 mb-2 text-[0.68rem] font-semibold text-amber-300 bg-amber-500/20 border border-amber-500/40 p-2 rounded-lg text-center animate-fade-in">
              {privateNotice}
            </div>
          )}

          {/* Directory Listings Container - Fixed Scroll Window */}
          <div className="mc-scroll flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
            {lobbyStats.allRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4 rounded-xl border border-dashed border-white/10 bg-white/5">
                <Globe size={36} className="text-white/20 mb-2 animate-pulse" />
                <p className="text-xs font-semibold text-white/70">No active lobby rooms right now.</p>
                <p className="text-[0.68rem] text-white/40 mt-1">Host a public or secret private room on the right menu to begin!</p>
              </div>
            ) : (
              lobbyStats.allRooms.map((room) => (
                <div
                  key={room.roomCode}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    room.isPrivate
                      ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50"
                      : "bg-white/5 hover:bg-white/10 border-white/10"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="mc-display text-sm font-bold text-white tracking-widest">{room.roomCode}</span>
                      {room.isPrivate ? (
                        <span className="text-[0.58rem] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                          <Lock size={9} /> PRIVATE (LOCKED)
                        </span>
                      ) : (
                        <span className="text-[0.58rem] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                          PUBLIC · 1/2 PLAYERS
                        </span>
                      )}
                    </div>
                    <p className="text-[0.68rem] text-[#a5b9e0] mt-0.5">Host: {room.hostName}</p>
                  </div>

                  {room.isPrivate ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPrivateNotice("🔒 Private Room: Requires 6-character room code or invite link from host");
                        setTimeout(() => setPrivateNotice(null), 4500);
                      }}
                      className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-3 py-1.5 font-bold rounded-lg cursor-pointer hover:bg-amber-500/30"
                      title="Private Room — Cannot join directly from directory"
                    >
                      <Lock size={12} /> LOCKED
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleJoinPublicRoom(room.roomCode)}
                      className="mc-btn mc-btn-primary text-xs px-3.5 py-1.5 font-bold shadow-md"
                    >
                      JOIN
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="shrink-0 mt-3 rounded-xl border border-white/10 bg-black/20 p-2.5 text-[0.65rem] text-white/60 space-y-0.5">
            <p className="font-semibold text-[#c084fc] flex items-center gap-1">
              <Globe size={11} /> Lobby Information
            </p>
            <p>• Public rooms are free & joinable by anyone until 2 players join.</p>
            <p>• Secret private rooms cost ₹25 & require entering the code or link.</p>
          </div>
        </div>

        {/* RIGHT SIDE: CREATION & MATCH MENU PANEL */}
        <div className="mc-slate mc-goldleaf flex w-full flex-col p-4 sm:p-5 md:w-1/2 h-full min-h-0 overflow-hidden shrink-0">
          {/* Main Navigation Mode Tabs */}
          <div className="shrink-0 mb-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              className="mc-chip flex items-center justify-center gap-1.5 px-1 py-2 text-xs"
              onClick={() => onSwitchTab?.("ai")}
            >
              <Swords size={14} /> Computer
            </button>
            <button
              type="button"
              className="mc-chip flex items-center justify-center gap-1.5 px-1 py-2 text-xs"
              onClick={() => onSwitchTab?.("hotseat")}
            >
              <Users size={14} /> 2 Players
            </button>
            <button
              type="button"
              className="mc-chip flex items-center justify-center gap-1.5 px-1 py-2 text-xs"
              data-active={true}
            >
              <Globe size={14} /> Online Mode
            </button>
          </div>

          {/* Menu Controls Container - Independent Internal Scroll */}
          <div className="mc-scroll flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="mc-fade space-y-3">
              {/* Commander Name Input */}
              <div>
                <p className="mc-display mb-1 text-[0.62rem] tracking-[0.3em] text-[#c084fc]">Your Commander Name</p>
                <div className="relative flex items-center">
                  <User size={14} className="absolute left-3 text-[#c084fc]" />
                  <input
                    type="text"
                    className="mc-chip w-full pl-9 pr-3 py-1.5 text-sm font-semibold text-white outline-none focus:border-[#c084fc]"
                    placeholder="Enter your commander name..."
                    maxLength={24}
                    value={playerName}
                    onChange={(e) => handlePlayerNameChange(e.target.value)}
                  />
                </div>
              </div>

              {/* Room Creation & Join Sub-Tabs */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  className="mc-chip py-1.5 text-[0.65rem] font-bold"
                  data-active={onlineTab === "public_create"}
                  onClick={() => setOnlineTab("public_create")}
                >
                  Public (FREE)
                </button>
                <button
                  type="button"
                  className="mc-chip py-1.5 text-[0.65rem] font-bold text-amber-300"
                  data-active={onlineTab === "private_create"}
                  onClick={() => setOnlineTab("private_create")}
                >
                  <Lock size={10} className="inline mr-1 text-amber-400" />
                  Private (₹25)
                </button>
                <button
                  type="button"
                  className="mc-chip py-1.5 text-[0.65rem] font-bold"
                  data-active={onlineTab === "join"}
                  onClick={() => setOnlineTab("join")}
                >
                  Join Code
                </button>
              </div>

              {/* Public Room Creation Box */}
              {onlineTab === "public_create" && (
                <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-center">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.62rem] font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-1">
                      <Globe size={12} /> Public Room Invite Code
                    </span>
                    <span className="text-[0.58rem] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">FREE · MAX 2 PLAYERS</span>
                  </div>

                  <button
                    type="button"
                    onClick={copyCodeOnly}
                    className="mc-display text-xl font-bold tracking-[0.3em] text-white hover:text-emerald-400 transition-colors cursor-pointer w-full py-1 rounded-lg bg-black/40 border border-emerald-500/30 flex items-center justify-center gap-2 group"
                    title="Click to copy room code"
                  >
                    <span>{hostCode}</span>
                    <Copy size={14} className="opacity-60 group-hover:opacity-100 text-emerald-400" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="mc-btn flex items-center justify-center gap-1.5 py-1 text-xs"
                      onClick={copyCodeOnly}
                    >
                      {copiedMode === "code" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      {copiedMode === "code" ? "Copied!" : "Copy Code"}
                    </button>

                    <button
                      type="button"
                      className="mc-btn flex items-center justify-center gap-1.5 py-1 text-xs mc-btn-primary"
                      onClick={copyInviteLink}
                    >
                      {copiedMode === "link" ? <Check size={13} className="text-emerald-400" /> : <Link size={13} />}
                      {copiedMode === "link" ? "Link Copied!" : "Copy Link"}
                    </button>
                  </div>
                </div>
              )}

              {/* Private Room Creation Box */}
              {onlineTab === "private_create" && (
                <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-center">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.62rem] font-bold tracking-wider text-amber-400 uppercase flex items-center gap-1">
                      <Lock size={12} /> Secret Private Room
                    </span>
                    <span className="text-[0.58rem] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">₹25 FEE · HIDDEN</span>
                  </div>

                  {isPrivatePaid ? (
                    <>
                      <div className="flex items-center justify-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/15 py-1 rounded-lg border border-emerald-500/30">
                        <ShieldCheck size={14} /> Private Room Unlocked & Active!
                      </div>
                      <button
                        type="button"
                        onClick={copyCodeOnly}
                        className="mc-display text-xl font-bold tracking-[0.3em] text-white hover:text-amber-400 transition-colors cursor-pointer w-full py-1 rounded-lg bg-black/40 border border-amber-500/30 flex items-center justify-center gap-2 group"
                      >
                        <span>{hostCode}</span>
                        <Copy size={14} className="text-amber-400" />
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" className="mc-btn py-1 text-xs" onClick={copyCodeOnly}>
                          {copiedMode === "code" ? "Copied!" : "Copy Code"}
                        </button>
                        <button type="button" className="mc-btn mc-btn-primary py-1 text-xs" onClick={copyInviteLink}>
                          {copiedMode === "link" ? "Link Copied!" : "Copy Link"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPrivateModal(true)}
                      className="mc-pulse flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                    >
                      <Sparkles size={14} /> Unlock Private Room (₹25 Razorpay)
                    </button>
                  )}
                </div>
              )}

              {/* Join Code Mode */}
              {onlineTab === "join" && (
                <div className="space-y-1.5 rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <p className="mc-display text-[0.62rem] tracking-[0.2em] text-[#c084fc]">Enter Room Code</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="mc-chip uppercase flex-1 px-3 py-1.5 text-center text-base font-bold tracking-widest text-white outline-none focus:border-[#c084fc]"
                      placeholder="e.g. 7X9K2A"
                      maxLength={8}
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              )}

              {/* Banner Pick */}
              <div>
                <p className="mc-display mb-1.5 text-[0.62rem] tracking-[0.3em] text-[#c084fc]">Your Banner</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["w", "b"] as Faction[]).map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="mc-chip flex items-center justify-center gap-2 py-1.5"
                      data-active={playerColor === color}
                      onClick={() => setPlayerColor(color)}
                    >
                      <Crest faction={color} size={16} active={playerColor === color} />
                      {color === "w" ? "Vikramaditya" : "Suryadev"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hourglass Selection */}
            <div className="mt-3">
              <p className="mc-display mb-1 text-[0.62rem] tracking-[0.3em] text-[#c084fc]">Hourglass</p>
              <div className="grid grid-cols-4 gap-2">
                {CLOCKS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className="mc-chip py-1.5 text-xs"
                    data-active={clock === option.value}
                    onClick={() => setClock(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mc-rule my-3" />

            <MusterSection choice={muster} onChange={onMuster} />
          </div>

          {/* Action & Settings Buttons Footer */}
          <div className="shrink-0 mt-3 space-y-1.5">
            <button
              type="button"
              className="mc-btn mc-btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm font-bold shadow-md"
              onClick={handleStartOnlineMatch}
            >
              <Crown size={16} />{" "}
              {onlineTab === "private_create" && !isPrivatePaid
                ? "Pay ₹25 & Host Private Room"
                : onlineTab === "join"
                ? "Join Friend Game"
                : "Host Public Room"}
            </button>

            <button
              type="button"
              className="mc-btn flex w-full items-center justify-center gap-2 py-1.5 text-xs"
              onClick={onOpenSettings}
            >
              <SettingsIcon size={14} /> Settings
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
      <p className="mc-menu-hint mt-2 shrink-0 text-[0.65rem] tracking-[0.2em] text-[#7d6f57]">
        {hasKeyboard
          ? "DRAG TO ORBIT · SCROLL TO ZOOM · CLICK A FIGURE TO COMMAND IT"
          : "DRAG TO ORBIT · PINCH TO ZOOM · TAP A FIGURE TO COMMAND IT"}
      </p>
    </div>
  );
}
