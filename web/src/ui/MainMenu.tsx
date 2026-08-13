import { useState, useEffect } from "react";
import { Crown, Swords, Settings as SettingsIcon, Users, Globe } from "lucide-react";

import type { DemoOptions, Difficulty, Faction } from "../core/types";
import { Crest } from "./Heraldry";
import { useHasKeyboard } from "./inputMode";
import { MusterSection, type MusterChoice } from "./Muster";
import { LobbyPage } from "./LobbyPage";

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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");
    if (roomParam) {
      setTab("online");
    }
  }, []);

  const startLocalMatch = (): void => {
    onStart({
      mode: tab,
      difficulty,
      playerColor,
      clockMinutes: clock,
    });
  };

  // If Online mode is active (default landing screen), render standalone LobbyPage component!
  if (tab === "online") {
    return (
      <LobbyPage
        onStart={onStart}
        onOpenSettings={onOpenSettings}
        muster={muster}
        onMuster={onMuster}
        onSwitchTab={(newTab) => setTab(newTab)}
        hasKeyboard={hasKeyboard}
      />
    );
  }

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
            data-active={(tab as string) === "online"}
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
          ) : (
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
            onClick={startLocalMatch}
          >
            <Crown size={16} /> Take the field
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

      <p className="mc-menu-hint mt-5 shrink-0 text-[0.68rem] tracking-[0.2em] text-[#7d6f57]">
        {hasKeyboard
          ? "DRAG TO ORBIT · SCROLL TO ZOOM · CLICK A FIGURE TO COMMAND IT"
          : "DRAG TO ORBIT · PINCH TO ZOOM · TAP A FIGURE TO COMMAND IT"}
      </p>
    </div>
  );
}
