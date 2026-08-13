import { useState, useEffect } from "react";
import { Crown, Swords, Settings as SettingsIcon, User, Users, Globe, Copy, Check, Link, Lock, Sparkles, ShieldCheck } from "lucide-react";

import type { DemoOptions, Difficulty, Faction } from "../core/types";
import { generateRoomCode } from "../core/multiplayer";
import { lobbyService, type LobbyStats } from "../core/lobby";
import { Crest } from "./Heraldry";
import { useHasKeyboard } from "./inputMode";
import { MusterSection, type MusterChoice } from "./Muster";
import { RazorpayPrivateRoomModal } from "./RazorpayPrivateRoomModal";

export interface OnlineMatchOptions {
  roomCode: string;
  isHost: boolean;
  isPrivate?: boolean;
  playerName?: string;
}

export interface MatchConfig {
  mode: "ai" | "hotseat" | "demo" | "online";
  difficulty: Difficulty;
  playerColor: Faction;
  clockMinutes: number | null;
  demo?: DemoOptions;
  online?: OnlineMatchOptions;
}

interface MainMenuProps {
  onStart: (config: MatchConfig) => void;
  onOpenSettings: () => void;
  /** Armies and battleground — settled here, before the first move. */
  muster: MusterChoice;
  onMuster: (choice: MusterChoice) => void;
  attract: boolean;
  onInteract: () => void;
}

const DIFFICULTY_COPY: Record<Difficulty, string> = {
  easy: "Squire — plays fast and loose",
  medium: "Knight — thinks three moves deep",
  hard: "Warlord — full search, no mercy",
};

const CLOCKS: { label: string; value: number | null }[] = [
  { label: "None", value: null },
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
];

export function MainMenu({ onStart, onOpenSettings, muster, onMuster, attract, onInteract }: MainMenuProps) {
  const hasKeyboard = useHasKeyboard();
  const [tab, setTab] = useState<"ai" | "hotseat" | "online">("ai");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [playerColor, setPlayerColor] = useState<Faction>("w");
  const [clock, setClock] = useState<number | null>(null);

  // Lobby & Online State
  const [lobbyStats, setLobbyStats] = useState<LobbyStats>({ onlineUsersCount: 1, publicRooms: [] });
  const [onlineTab, setOnlineTab] = useState<"public_create" | "private_create" | "join">("public_create");
  const [hostCode, setHostCode] = useState<string>(() => generateRoomCode());
  const [joinCode, setJoinCode] = useState<string>("");
  const [copiedMode, setCopiedMode] = useState<"code" | "link" | null>(null);
  const [showPrivateModal, setShowPrivateModal] = useState<boolean>(false);
  const [isPrivatePaid, setIsPrivatePaid] = useState<boolean>(false);
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
      setTab("online");
      setOnlineTab("join");
      setJoinCode(roomParam.toUpperCase());
    }
  }, []);

  // Update lobby room registry when switching host modes
  useEffect(() => {
    if (tab === "online") {
      if (onlineTab === "public_create") {
        lobbyService.registerHostRoom(hostCode, false);
      } else if (onlineTab === "private_create" && isPrivatePaid) {
        lobbyService.registerHostRoom(hostCode, true);
      } else {
        lobbyService.leaveRoom();
      }
    } else {
      lobbyService.leaveRoom();
    }
  }, [tab, onlineTab, hostCode, isPrivatePaid]);

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

  const start = (): void => {
    if (tab === "online") {
      if (onlineTab === "private_create" && !isPrivatePaid) {
        setShowPrivateModal(true);
        return;
      }

      const isHostMode = onlineTab === "public_create" || onlineTab === "private_create";
      const selectedCode = isHostMode ? hostCode : joinCode;
      const isPrivate = onlineTab === "private_create";

      if (!isHostMode) {
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
    } else {
      onStart({
        mode: tab,
        difficulty,
        playerColor,
        clockMinutes: clock,
      });
    }
  };

  return (
    <div
      className="mc-menu mc-modal-pad pointer-events-auto absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      onPointerDown={onInteract}
      onPointerMove={onInteract}
    >
      <div className="mc-unfurl mc-menu-hero mb-4 shrink-0 text-center relative">
        <p className="mc-display text-[0.68rem] tracking-[0.55em] text-[#c084fc] font-semibold drop-shadow-[0_0_12px_rgba(192,132,252,0.5)]">
          DRAVIDA 3D CHESS
        </p>
        <h1 className="mc-display mc-title-glow mt-1 text-5xl font-extrabold text-white sm:text-6xl">
          KING&apos;S FALL
        </h1>
        
        {/* Online Users Badge */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-3 py-0.5 text-[0.65rem] font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{lobbyStats.onlineUsersCount} COMMANDERS ONLINE</span>
          </span>
          {lobbyStats.publicRooms.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-500/40 px-3 py-0.5 text-[0.65rem] font-bold text-[#c084fc]">
              <Globe size={11} />
              <span>{lobbyStats.publicRooms.length} PUBLIC LOBBIES</span>
            </span>
          )}
        </div>

        <div className="mc-rule mx-auto mt-2 w-64" />
      </div>

      <div className="mc-slate mc-goldleaf mc-rise flex w-full min-h-0 max-w-md flex-col p-5 sm:p-6">
        <div className="mb-4 grid shrink-0 grid-cols-3 gap-2">
          <button
            type="button"
            className="mc-chip flex items-center justify-center gap-1.5 px-1 py-3 text-xs"
            data-active={tab === "ai"}
            onClick={() => setTab("ai")}
          >
            <Swords size={14} /> Computer
          </button>
          <button
            type="button"
            className="mc-chip flex items-center justify-center gap-1.5 px-1 py-3 text-xs"
            data-active={tab === "hotseat"}
            onClick={() => setTab("hotseat")}
          >
            <Users size={14} /> 2 Players
          </button>
          <button
            type="button"
            className="mc-chip flex items-center justify-center gap-1.5 px-1 py-3 text-xs"
            data-active={tab === "online"}
            onClick={() => setTab("online")}
          >
            <Globe size={14} /> Online
          </button>
        </div>

        <div className="mc-scroll -mr-2 min-h-0 flex-auto overflow-y-auto pr-2">
          {tab === "ai" ? (
            <div className="mc-fade space-y-5">
              <div>
                <p className="mc-display mb-2 text-[0.62rem] tracking-[0.3em] text-[#c084fc]">Opponent</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      className="mc-chip py-2.5"
                      data-active={difficulty === level}
                      onClick={() => setDifficulty(level)}
                    >
                      {level.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs italic text-[#a5b9e0]">{DIFFICULTY_COPY[difficulty]}</p>
              </div>

              <div>
                <p className="mc-display mb-2 text-[0.62rem] tracking-[0.3em] text-[#c084fc]">Your side</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["w", "b"] as Faction[]).map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="mc-chip flex items-center justify-center gap-2 py-2.5"
                      data-active={playerColor === color}
                      onClick={() => setPlayerColor(color)}
                    >
                      <Crest faction={color} size={18} active={playerColor === color} />
                      {color === "w" ? "Vikramaditya" : "Suryadev"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : tab === "hotseat" ? (
            <p className="mc-fade text-sm italic leading-relaxed text-[#e0ebff]">
              Two commanders, one board. The view holds its angle between turns —{" "}
              {hasKeyboard ? (
                <>
                  flip it whenever you like with <span className="mc-display text-[#c084fc]">F</span>, or
                </>
              ) : (
                <>flip it whenever you like from the camera menu, or</>
              )}{" "}
              switch on the automatic swing in settings.
            </p>
          ) : (
            <div className="mc-fade space-y-3">
              {/* Commander Name */}
              <div>
                <p className="mc-display mb-1.5 text-[0.62rem] tracking-[0.3em] text-[#c084fc]">Your Commander Name</p>
                <div className="relative flex items-center">
                  <User size={14} className="absolute left-3 text-[#c084fc]" />
                  <input
                    type="text"
                    className="mc-chip w-full pl-9 pr-3 py-2 text-sm font-semibold text-white outline-none focus:border-[#c084fc]"
                    placeholder="Enter your commander name..."
                    maxLength={24}
                    value={playerName}
                    onChange={(e) => handlePlayerNameChange(e.target.value)}
                  />
                </div>
              </div>

              {/* Online Mode Tabs */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  className="mc-chip py-2 text-[0.68rem] font-bold"
                  data-active={onlineTab === "public_create"}
                  onClick={() => setOnlineTab("public_create")}
                >
                  Public (FREE)
                </button>
                <button
                  type="button"
                  className="mc-chip py-2 text-[0.68rem] font-bold text-amber-300"
                  data-active={onlineTab === "private_create"}
                  onClick={() => setOnlineTab("private_create")}
                >
                  <Lock size={10} className="inline mr-1 text-amber-400" />
                  Private (₹25)
                </button>
                <button
                  type="button"
                  className="mc-chip py-2 text-[0.68rem] font-bold"
                  data-active={onlineTab === "join"}
                  onClick={() => setOnlineTab("join")}
                >
                  Join Code
                </button>
              </div>

              {/* Public Create Mode */}
              {onlineTab === "public_create" && (
                <div className="space-y-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-center">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.62rem] font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-1">
                      <Globe size={12} /> Public Room Invite Code
                    </span>
                    <span className="text-[0.58rem] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">FREE · MAX 2 PLAYERS</span>
                  </div>

                  <button
                    type="button"
                    onClick={copyCodeOnly}
                    className="mc-display text-2xl font-bold tracking-[0.3em] text-white hover:text-emerald-400 transition-colors cursor-pointer w-full py-1.5 rounded-lg bg-black/40 border border-emerald-500/30 flex items-center justify-center gap-2 group"
                    title="Click to copy room code"
                  >
                    <span>{hostCode}</span>
                    <Copy size={15} className="opacity-60 group-hover:opacity-100 text-emerald-400" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="mc-btn flex items-center justify-center gap-1.5 py-1.5 text-xs"
                      onClick={copyCodeOnly}
                    >
                      {copiedMode === "code" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      {copiedMode === "code" ? "Copied!" : "Copy Code"}
                    </button>

                    <button
                      type="button"
                      className="mc-btn flex items-center justify-center gap-1.5 py-1.5 text-xs mc-btn-primary"
                      onClick={copyInviteLink}
                    >
                      {copiedMode === "link" ? <Check size={13} className="text-emerald-400" /> : <Link size={13} />}
                      {copiedMode === "link" ? "Link Copied!" : "Copy Link"}
                    </button>
                  </div>
                </div>
              )}

              {/* Private Create Mode */}
              {onlineTab === "private_create" && (
                <div className="space-y-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-center">
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
                        className="mc-display text-2xl font-bold tracking-[0.3em] text-white hover:text-amber-400 transition-colors cursor-pointer w-full py-1 rounded-lg bg-black/40 border border-amber-500/30 flex items-center justify-center gap-2 group"
                      >
                        <span>{hostCode}</span>
                        <Copy size={15} className="text-amber-400" />
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" className="mc-btn py-1.5 text-xs" onClick={copyCodeOnly}>
                          {copiedMode === "code" ? "Copied!" : "Copy Code"}
                        </button>
                        <button type="button" className="mc-btn mc-btn-primary py-1.5 text-xs" onClick={copyInviteLink}>
                          {copiedMode === "link" ? "Link Copied!" : "Copy Link"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPrivateModal(true)}
                      className="mc-pulse flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                    >
                      <Sparkles size={14} /> Unlock Private Room (₹25 Razorpay)
                    </button>
                  )}
                </div>
              )}

              {/* Join Code Mode */}
              {onlineTab === "join" && (
                <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="mc-display text-[0.62rem] tracking-[0.2em] text-[#c084fc]">Enter Room Code</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="mc-chip uppercase flex-1 px-3 py-2 text-center text-lg font-bold tracking-widest text-white outline-none focus:border-[#c084fc]"
                      placeholder="e.g. 7X9K2A"
                      maxLength={8}
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              )}

              {/* Active Public Lobbies Directory */}
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[0.62rem] font-bold tracking-wider text-[#c084fc] uppercase flex items-center gap-1">
                    <Globe size={12} /> Active Public Rooms ({lobbyStats.publicRooms.length})
                  </span>
                  <span className="text-[0.58rem] text-emerald-400 font-semibold">Max 2 Players</span>
                </div>

                {lobbyStats.publicRooms.length === 0 ? (
                  <p className="text-xs italic text-white/50 text-center py-2">
                    No open public rooms right now. Host a room above to play!
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {lobbyStats.publicRooms.map((room) => (
                      <div
                        key={room.roomCode}
                        className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-2 rounded-lg border border-white/10 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white tracking-wider">{room.roomCode}</span>
                            <span className="text-[0.58rem] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                              1/2 PLAYERS
                            </span>
                          </div>
                          <p className="text-[0.65rem] text-[#a5b9e0]">Host: {room.hostName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleJoinPublicRoom(room.roomCode)}
                          className="mc-btn mc-btn-primary text-xs px-3 py-1 font-bold"
                        >
                          JOIN
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Banner Pick */}
              <div>
                <p className="mc-display mb-2 text-[0.62rem] tracking-[0.3em] text-[#c084fc]">Your banner</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["w", "b"] as Faction[]).map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="mc-chip flex items-center justify-center gap-2 py-2"
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
          )}

          <div className="mt-4">
            <p className="mc-display mb-2 text-[0.62rem] tracking-[0.3em] text-[#c084fc]">Hourglass</p>
            <div className="grid grid-cols-4 gap-2">
              {CLOCKS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  className="mc-chip py-2"
                  data-active={clock === option.value}
                  onClick={() => setClock(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mc-rule my-4" />

          <MusterSection choice={muster} onChange={onMuster} />
        </div>

        <div className="mc-panel-foot shrink-0">
          <button
            type="button"
            className="mc-btn mc-btn-primary mt-4 flex w-full items-center justify-center gap-2 py-3.5 text-sm"
            onClick={start}
          >
            {tab === "online" ? (
              <>
                <Globe size={16} />{" "}
                {onlineTab === "private_create" && !isPrivatePaid
                  ? "Pay ₹25 & Host Private Room"
                  : onlineTab === "join"
                  ? "Join Friend Game"
                  : "Host Public Room"}
              </>
            ) : (
              <>
                <Crown size={16} /> Take the field
              </>
            )}
          </button>

          <button
            type="button"
            className="mc-btn mt-2 flex w-full items-center justify-center gap-2"
            onClick={onOpenSettings}
          >
            <SettingsIcon size={15} /> Settings
          </button>
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
      <p className="mc-menu-hint mt-4 shrink-0 text-[0.68rem] tracking-[0.2em] text-[#7d6f57]">
        {hasKeyboard
          ? "DRAG TO ORBIT · SCROLL TO ZOOM · CLICK A FIGURE TO COMMAND IT"
          : "DRAG TO ORBIT · PINCH TO ZOOM · TAP A FIGURE TO COMMAND IT"}
      </p>
    </div>
  );
}
