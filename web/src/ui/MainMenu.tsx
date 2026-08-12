import { useState, useEffect } from "react";
import { Clapperboard, Crown, Swords, Settings as SettingsIcon, User, Users, Globe, Copy, Check, Link } from "lucide-react";

import type { DemoOptions, Difficulty, Faction } from "../core/types";
import { generateRoomCode } from "../core/multiplayer";
import { Crest } from "./Heraldry";
import { useHasKeyboard } from "./inputMode";
import { MusterSection, type MusterChoice } from "./Muster";

export interface OnlineMatchOptions {
  roomCode: string;
  isHost: boolean;
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

const DEMO_SPEEDS: { label: string; value: number }[] = [
  { label: "0.5×", value: 0.5 },
  { label: "1×", value: 1 },
  { label: "2×", value: 2 },
  { label: "4×", value: 4 },
];

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

  // Online Multiplayer State
  const [onlineTab, setOnlineTab] = useState<"create" | "join">("create");
  const [hostCode, setHostCode] = useState<string>(() => generateRoomCode());
  const [joinCode, setJoinCode] = useState<string>("");
  const [copiedMode, setCopiedMode] = useState<"code" | "link" | null>(null);
  const [playerName, setPlayerName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("kg.playername") || "Commander";
    }
    return "Commander";
  });

  const handlePlayerNameChange = (name: string): void => {
    setPlayerName(name);
    try {
      window.localStorage.setItem("kg.playername", name);
    } catch {
      // Ignore storage errors in private mode
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");
    if (roomParam) {
      setTab("online");
      setOnlineTab("join");
      setJoinCode(roomParam.toUpperCase());
    }
  }, []);

  const copyCodeOnly = (): void => {
    void navigator.clipboard.writeText(hostCode);
    setCopiedMode("code");
    setTimeout(() => setCopiedMode(null), 2500);
  };

  const copyInviteLink = (): void => {
    const code = onlineTab === "create" ? hostCode : joinCode;
    const url = `${window.location.origin}${window.location.pathname}?room=${code}`;
    void navigator.clipboard.writeText(url);
    setCopiedMode("link");
    setTimeout(() => setCopiedMode(null), 2500);
  };

  const start = (): void => {
    const selectedCode = onlineTab === "create" ? hostCode : joinCode;
    onStart({
      mode: tab,
      difficulty,
      playerColor,
      clockMinutes: clock,
      online:
        tab === "online"
          ? { roomCode: selectedCode, isHost: onlineTab === "create", playerName: playerName.trim() || "Commander" }
          : undefined,
    });
  };

  return (
    <div
      className="mc-menu mc-modal-pad pointer-events-auto absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      onPointerDown={onInteract}
      onPointerMove={onInteract}
    >
      <div className="mc-unfurl mc-menu-hero mb-6 shrink-0 text-center">
        <p className="mc-display text-[0.68rem] tracking-[0.55em] text-[#c084fc] font-semibold drop-shadow-[0_0_12px_rgba(192,132,252,0.5)]">
          DRAVIDA 3D CHESS
        </p>
        <h1 className="mc-display mc-title-glow mt-2 text-5xl font-extrabold text-white sm:text-6xl">
          KING&apos;S FALL
        </h1>
        <div className="mc-rule mx-auto mt-3 w-64" />
        <p className="mt-3 text-sm italic text-[#e2ebfc]">
          Chess in the great hall of Magadha
        </p>
      </div>

      <div className="mc-slate mc-goldleaf mc-rise flex w-full min-h-0 max-w-md flex-col p-5 sm:p-6">
        <div className="mb-5 grid shrink-0 grid-cols-3 gap-2">
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
                      {level}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs italic text-[#e0ebff]">{DIFFICULTY_COPY[difficulty]}</p>
              </div>

              <div>
                <p className="mc-display mb-2 text-[0.62rem] tracking-[0.3em] text-[#c084fc]">Your banner</p>
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
            <div className="mc-fade space-y-4">
              {/* Rename Commander Field - ONLY IN ONLINE MODE */}
              <div>
                <p className="mc-display mb-2 text-[0.62rem] tracking-[0.3em] text-[#c084fc]">Your Commander Name</p>
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

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="mc-chip py-2"
                  data-active={onlineTab === "create"}
                  onClick={() => setOnlineTab("create")}
                >
                  Create Room
                </button>
                <button
                  type="button"
                  className="mc-chip py-2"
                  data-active={onlineTab === "join"}
                  onClick={() => setOnlineTab("join")}
                >
                  Join Room
                </button>
              </div>

              {onlineTab === "create" ? (<></>
                // <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                //   <p className="mc-display text-xs tracking-[0.2em] text-[#c084fc]">Room Invite Code</p>
                //   <button
                //     type="button"
                //     onClick={copyCodeOnly}
                //     className="mc-display text-2xl font-bold tracking-[0.3em] text-white hover:text-[#c084fc] transition-colors cursor-pointer w-full py-1 rounded-lg border border-transparent hover:border-[#c084fc]/40 hover:bg-[#c084fc]/10 flex items-center justify-center gap-2 group"
                //     title="Click to copy code"
                //   >
                //     <span>{hostCode}</span>
                //     <Copy size={16} className="opacity-60 group-hover:opacity-100 text-[#c084fc]" />
                //   </button>

                //   <div className="grid grid-cols-2 gap-2 pt-1">
                //     <button
                //       type="button"
                //       className="mc-btn flex items-center justify-center gap-1.5 py-2 text-xs"
                //       onClick={copyCodeOnly}
                //     >
                //       {copiedMode === "code" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                //       {copiedMode === "code" ? "Code Copied!" : "Copy Code"}
                //     </button>

                //     <button
                //       type="button"
                //       className="mc-btn flex items-center justify-center gap-1.5 py-2 text-xs mc-btn-primary"
                //       onClick={copyInviteLink}
                //     >
                //       {copiedMode === "link" ? <Check size={14} className="text-emerald-400" /> : <Link size={14} />}
                //       {copiedMode === "link" ? "Link Copied!" : "Copy Invite Link"}
                //     </button>
                //   </div>

                //   <p className="text-xs italic text-[#e0ebff]">
                //     Share code or link with your friend to connect instantly!
                //   </p>
                // </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="mc-display text-xs tracking-[0.2em] text-[#c084fc]">Enter Friend&apos;s Room Code</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="mc-chip uppercase flex-1 px-3 py-2 text-center text-lg font-bold tracking-widest text-white outline-none focus:border-[#c084fc]"
                      placeholder="e.g. 7X9K2A"
                      maxLength={8}
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    />
                    <button
                      type="button"
                      className="mc-btn px-3"
                      onClick={copyInviteLink}
                      title="Copy link"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <p className="mc-display mb-2 text-[0.62rem] tracking-[0.3em] text-[#c084fc]">Your banner</p>
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
          )}

          <div className="mt-5">
            <p className="mc-display mb-2 text-[0.62rem] tracking-[0.3em] text-[#c084fc]">Hourglass</p>
            <div className="grid grid-cols-4 gap-2">
              {CLOCKS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  className="mc-chip py-2.5"
                  data-active={clock === option.value}
                  onClick={() => setClock(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mc-rule my-5" />

          <MusterSection choice={muster} onChange={onMuster} />
        </div>

        <div className="mc-panel-foot shrink-0">
          <button
            type="button"
            className="mc-btn mc-btn-primary mt-5 flex w-full items-center justify-center gap-2 py-3.5 text-sm"
            onClick={start}
          >
            {tab === "online" ? (
              <>
                <Globe size={16} /> {onlineTab === "create" ? "Host Friend Room" : "Join Friend Game"}
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

      {/* The hall is driven differently by a finger than by a mouse, so the
          standing instruction names only the gestures this device actually has. */}
      <p className="mc-menu-hint mt-5 shrink-0 text-[0.68rem] tracking-[0.2em] text-[#7d6f57]">
        {hasKeyboard
          ? "DRAG TO ORBIT · SCROLL TO ZOOM · CLICK A FIGURE TO COMMAND IT"
          : "DRAG TO ORBIT · PINCH TO ZOOM · TAP A FIGURE TO COMMAND IT"}
      </p>
    </div>
  );
}
