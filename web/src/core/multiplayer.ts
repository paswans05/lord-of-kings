import { Peer, type DataConnection } from "peerjs";
import type { Faction, PieceKind, SquareId } from "./types";
import type { MusterChoice } from "../ui/Muster";

export interface NetworkMovePayload {
  type: "MOVE";
  from: SquareId;
  to: SquareId;
  promotion?: PieceKind;
}

export interface NetworkHandshakePayload {
  type: "HANDSHAKE";
  playerColor: Faction;
  muster: MusterChoice;
}

export interface NetworkResignPayload {
  type: "RESIGN";
  color: Faction;
}

export type NetworkMessage = NetworkMovePayload | NetworkHandshakePayload | NetworkResignPayload;

export interface MultiplayerEvents {
  onConnect: () => void;
  onDisconnect: (reason?: string) => void;
  onMove: (from: SquareId, to: SquareId, promotion?: PieceKind) => void;
  onHandshake: (color: Faction, muster: MusterChoice) => void;
  onResign: (color: Faction) => void;
  onError: (error: string) => void;
}

const PEER_PREFIX = "lok3d-v1-";

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export class MultiplayerService {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private events: Partial<MultiplayerEvents> = {};
  public isHost = false;
  public roomCode = "";

  constructor(events: Partial<MultiplayerEvents>) {
    this.events = events;
  }

  /** Create a new multiplayer room as Host. */
  public createRoom(roomCode = generateRoomCode()): string {
    this.roomCode = roomCode.toUpperCase();
    this.isHost = true;
    const fullPeerId = `${PEER_PREFIX}${this.roomCode}`;

    // Setup local BroadcastChannel fallback for multi-tab testing
    this.setupBroadcastChannel(this.roomCode);

    try {
      this.peer = new Peer(fullPeerId, {
        debug: 1,
      });

      this.peer.on("open", () => {
        console.log(`[Multiplayer] Room created: ${this.roomCode}`);
      });

      this.peer.on("connection", (conn) => {
        console.log("[Multiplayer] Guest connected via PeerJS");
        this.bindConnection(conn);
      });

      this.peer.on("error", (err) => {
        console.warn("[Multiplayer] PeerJS error, relying on BroadcastChannel fallback:", err);
      });
    } catch (e) {
      console.warn("[Multiplayer] PeerJS initialization fallback:", e);
    }

    return this.roomCode;
  }

  /** Join an existing room code as Guest. */
  public joinRoom(roomCode: string): void {
    this.roomCode = roomCode.trim().toUpperCase();
    this.isHost = false;
    const fullPeerId = `${PEER_PREFIX}${this.roomCode}`;

    this.setupBroadcastChannel(this.roomCode);

    try {
      this.peer = new Peer({ debug: 1 });

      this.peer.on("open", () => {
        if (!this.peer) return;
        console.log(`[Multiplayer] Connecting to host: ${this.roomCode}`);
        const conn = this.peer.connect(fullPeerId);
        this.bindConnection(conn);
      });

      this.peer.on("error", (err) => {
        console.warn("[Multiplayer] PeerJS join error, using BroadcastChannel:", err);
        // Fallback check
        this.broadcastChannel?.postMessage({ type: "GUEST_PING" });
      });
    } catch (e) {
      console.warn("[Multiplayer] PeerJS join fallback:", e);
    }
  }

  private setupBroadcastChannel(roomCode: string): void {
    if (typeof BroadcastChannel === "undefined") return;
    this.broadcastChannel = new BroadcastChannel(`lok3d-room-${roomCode}`);

    this.broadcastChannel.onmessage = (event) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "GUEST_PING" && this.isHost) {
        this.broadcastChannel?.postMessage({ type: "HOST_PONG" });
        this.events.onConnect?.();
      } else if (data.type === "HOST_PONG" && !this.isHost) {
        this.events.onConnect?.();
      } else {
        this.handleMessage(data as NetworkMessage);
      }
    };
  }

  private bindConnection(conn: DataConnection): void {
    this.connection = conn;

    conn.on("open", () => {
      console.log("[Multiplayer] Direct WebRTC data channel connected!");
      this.events.onConnect?.();
    });

    conn.on("data", (data) => {
      this.handleMessage(data as NetworkMessage);
    });

    conn.on("close", () => {
      console.log("[Multiplayer] Peer connection closed");
      this.events.onDisconnect?.("Peer disconnected");
    });

    conn.on("error", (err) => {
      console.error("[Multiplayer] DataConnection error:", err);
      this.events.onError?.(err.message || "Connection error");
    });
  }

  private handleMessage(msg: NetworkMessage): void {
    console.log("[Multiplayer] Received network message:", msg);
    switch (msg.type) {
      case "HANDSHAKE":
        this.events.onHandshake?.(msg.playerColor, msg.muster);
        break;
      case "MOVE":
        this.events.onMove?.(msg.from, msg.to, msg.promotion);
        break;
      case "RESIGN":
        this.events.onResign?.(msg.color);
        break;
    }
  }

  public sendHandshake(playerColor: Faction, muster: MusterChoice): void {
    const payload: NetworkHandshakePayload = { type: "HANDSHAKE", playerColor, muster };
    this.send(payload);
  }

  public sendMove(from: SquareId, to: SquareId, promotion?: PieceKind): void {
    const payload: NetworkMovePayload = { type: "MOVE", from, to, promotion };
    this.send(payload);
  }

  public sendResign(color: Faction): void {
    const payload: NetworkResignPayload = { type: "RESIGN", color };
    this.send(payload);
  }

  private send(msg: NetworkMessage): void {
    if (this.connection && this.connection.open) {
      this.connection.send(msg);
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(msg);
    }
  }

  public disconnect(): void {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }
}
