import type { Difficulty, Faction, DemoOptions } from "../core/types";
import type { MusterChoice } from "./Muster";
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

export function MainMenu({ onStart, onOpenSettings, muster, onMuster }: MainMenuProps) {
  const hasKeyboard = useHasKeyboard();

  return (
    <LobbyPage
      onStart={onStart}
      onOpenSettings={onOpenSettings}
      muster={muster}
      onMuster={onMuster}
      hasKeyboard={hasKeyboard}
    />
  );
}
