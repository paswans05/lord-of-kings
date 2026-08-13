import { useState, useEffect } from "react";
import { Crown, Swords, Settings as SettingsIcon, Users, Globe } from "lucide-react";

import type { Difficulty, Faction, DemoOptions } from "../core/types";
import { Crest } from "./Heraldry";
import { MusterSection, type MusterChoice } from "./Muster";
import { useHasKeyboard } from "./inputMode";
import { LobbyPage } from "./LobbyPage";

export interface MatchConfig {
  mode: "ai" | "hotseat" | "online" | "demo";
  difficulty: Difficulty;
  playerColor: Faction;
  clockMinutes: number | null;
  demo?: DemoOptions;
  online?: {
    roomCode: string;
    isHost: boolean;
    isPrivate?: boolean;
    playerName: string;
  };
}

interface MainMenuProps {
  onStart: (config: MatchConfig) => void;
  onOpenSettings: () => void;
  muster: MusterChoice;
  onMuster: (choice: MusterChoice) => void;
  attract?: boolean;
  onInteract?: () => void;
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

export function MainMenu({ onStart, onOpenSettings, muster, onMuster, onInteract }: MainMenuProps) {
  const hasKeyboard = useHasKeyboard();
  const [tab, setTab] = useState<"ai" | "hotseat" | "online">("online");
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
      className="mc-menu mc-modal-pad pointer-events-auto absolute inset-0 flex flex-col items-center justify-between overflow-hidden p-2 sm:p-4"
      onPointerDown={onInteract}
      onPointerMove={onInteract}
    >
      {/* Title Header - Compact */}
      <div className="mc-unfurl mc-menu-hero shrink-0 text-center relative mb-1">
        <p className="mc-display text-[0.62rem] tracking-[0.55em] text-[#c084fc] font-semibold drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]">
          DRAVIDA 3D CHESS
        </p>
        <h1 className="mc-display mc-title-glow mt-0.5 text-2xl font-extrabold text-white sm:text-4xl">
          KING&apos;S FALL
        </h1>
        <p className="mt-0.5 text-xs italic text-[#e2ebfc]">
          Chess in the great hall of Magadha
        </p>
      </div>

      {/* Main Menu Card - Compact & Zero-Scroll Layout */}
      <div className="mc-slate mc-goldleaf mc-rise flex w-full max-w-2xl flex-1 flex-col p-3 sm:p-4 justify-between min-h-0 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="mb-2 grid shrink-0 grid-cols-3 gap-1.5">
          <button
            type="button"
            className="mc-chip flex items-center justify-center gap-1.5 px-1 py-2 text-xs font-semibold"
            data-active={tab === "ai"}
            onClick={() => setTab("ai")}
          >
            <Swords size={13} /> Computer
          </button>
          <button
            type="button"
            className="mc-chip flex items-center justify-center gap-1.5 px-1 py-2 text-xs font-semibold"
            data-active={tab === "hotseat"}
            onClick={() => setTab("hotseat")}
          >
            <Users size={13} /> 2 Players
          </button>
          <button
            type="button"
            className="mc-chip flex items-center justify-center gap-1.5 px-1 py-2 text-xs font-semibold"
            data-active={(tab as string) === "online"}
            onClick={() => setTab("online")}
          >
            <Globe size={13} /> Online
          </button>
        </div>

        {/* 2-Column Side-by-Side Options Grid - EVERYTHING VISIBLE NO SCROLL */}
        <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-hidden">
          {/* Column 1: Mode specific options */}
          <div className="flex flex-col justify-between space-y-2">
            {tab === "ai" ? (
              <div className="space-y-2">
                <div>
                  <p className="mc-display mb-1 text-[0.6rem] tracking-[0.3em] text-[#c084fc]">Opponent AI</p>
                  <div className="grid grid-cols-3 gap-1">
                    {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
                      <button
                        key={level}
                        type="button"
                        className="mc-chip py-1.5 text-xs"
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
                        className="mc-chip flex items-center justify-center gap-1.5 py-1.5 text-xs"
                        data-active={playerColor === color}
                        onClick={() => setPlayerColor(color)}
                      >
                        <Crest faction={color} size={15} active={playerColor === color} />
                        {color === "w" ? "Vikramaditya" : "Suryadev"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs italic text-[#e0ebff] leading-relaxed">
                Two commanders, one board. The view holds its angle between turns —{" "}
                {hasKeyboard ? (
                  <>flip it with <span className="mc-display text-[#c084fc]">F</span>, or</>
                ) : (
                  <>flip it from camera menu, or</>
                )}{" "}
                switch on automatic swing in settings.
              </div>
            )}
          </div>

          {/* Column 2: Hourglass & Muster Choice */}
          <div className="flex flex-col justify-between space-y-2">
            <div>
              <p className="mc-display mb-1 text-[0.6rem] tracking-[0.3em] text-[#c084fc]">Hourglass Timer</p>
              <div className="grid grid-cols-4 gap-1">
                {CLOCKS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className="mc-chip py-1 text-xs"
                    data-active={clock === option.value}
                    onClick={() => setClock(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <MusterSection choice={muster} onChange={onMuster} />
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="shrink-0 mt-3 space-y-1.5">
          <button
            type="button"
            className="mc-btn mc-btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-sm font-bold shadow-md"
            onClick={startLocalMatch}
          >
            <Crown size={16} /> Take the field
          </button>

          <button
            type="button"
            className="mc-btn flex w-full items-center justify-center gap-1.5 py-1 text-xs"
            onClick={onOpenSettings}
          >
            <SettingsIcon size={14} /> Settings
          </button>
        </div>
      </div>

      {/* Footer hint */}
      <p className="mc-menu-hint mt-1 shrink-0 text-[0.62rem] tracking-[0.2em] text-[#7d6f57]">
        {hasKeyboard
          ? "DRAG TO ORBIT · SCROLL TO ZOOM · CLICK A FIGURE TO COMMAND IT"
          : "DRAG TO ORBIT · PINCH TO ZOOM · TAP A FIGURE TO COMMAND IT"}
      </p>
    </div>
  );
}
