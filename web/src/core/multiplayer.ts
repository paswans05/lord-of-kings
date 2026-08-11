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

export interface NetworkPingPayload {
  type: "PING";
  t: number;
}

export interface NetworkPongPayload {
  type: "PONG";
  t: number;
}

export interface NetworkRoomFullPayload {
  type: "ROOM_FULL";
}

export type NetworkMessage =
  | NetworkMovePayload
  | NetworkHandshakePayload
  | NetworkResignPayload
  | NetworkPingPayload
  | NetworkPongPayload
  | NetworkRoomFullPayload;

export interface MultiplayerEvents {
  onConnect: () => void;
  onDisconnect: (reason?: string) => void;
  onMove: (from: SquareId, to: SquareId, promotion?: PieceKind) => void;
  onHandshake: (color: Faction, muster: MusterChoice) => void;
  onResign: (color: Faction) => void;
  onPing: (pingMs: number) => void;
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
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private joinAttempts = 0;
  public pingMs = 0;
  public isHost = false;
  public roomCode = "";
  public isConnected = false;

  constructor(events: Partial<MultiplayerEvents>) {
    this.events = events;
  }

  /** Create a new multiplayer room as Host. */
  public createRoom(roomCode = generateRoomCode()): string {
    this.roomCode = roomCode.toUpperCase();
    this.isHost = true;
    const fullPeerId = `${PEER_PREFIX}${this.roomCode}`;

    this.setupBroadcastChannel(this.roomCode);

    try {
      this.peer = new Peer(fullPeerId, { debug: 1 });

      this.peer.on("open", () => {
        console.log(`[Multiplayer] Room created: ${this.roomCode}`);
      });

      this.peer.on("connection", (conn) => {
        if (this.isConnected) {
          console.warn("[Multiplayer] 3rd player connection attempt. Rejecting (Room Full).");
          conn.send({ type: "ROOM_FULL" });
          setTimeout(() => conn.close(), 500);
          return;
        }
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

  /** Join an existing room code as Guest with auto-retry. */
  public joinRoom(roomCode: string): void {
    this.roomCode = roomCode.trim().toUpperCase();
    this.isHost = false;
    const fullPeerId = `${PEER_PREFIX}${this.roomCode}`;

    this.setupBroadcastChannel(this.roomCode);
    this.broadcastChannel?.postMessage({ type: "GUEST_PING" });

    const attemptConnect = (): void => {
      if (this.isConnected) return;
      this.joinAttempts += 1;
      console.log(`[Multiplayer] Connecting to host: ${this.roomCode} (attempt ${this.joinAttempts})`);

      try {
        if (this.peer && !this.peer.destroyed) {
          const conn = this.peer.connect(fullPeerId);
          this.bindConnection(conn);
        } else {
          this.peer = new Peer({ debug: 1 });

          this.peer.on("open", () => {
            if (!this.peer || this.isConnected) return;
            const conn = this.peer.connect(fullPeerId);
            this.bindConnection(conn);
          });

          this.peer.on("error", (err) => {
            console.warn(`[Multiplayer] PeerJS connect info (attempt ${this.joinAttempts}):`, err.message);
            // Retries every 2.5 seconds up to 12 attempts until host is active
            if (!this.isConnected && this.joinAttempts < 12) {
              this.retryTimer = setTimeout(attemptConnect, 2500);
            }
          });
        }
      } catch (e) {
        console.warn("[Multiplayer] PeerJS join fallback:", e);
        if (!this.isConnected && this.joinAttempts < 12) {
          this.retryTimer = setTimeout(attemptConnect, 2500);
        }
      }
    };

    attemptConnect();
  }

  private setupBroadcastChannel(roomCode: string): void {
    if (typeof BroadcastChannel === "undefined") return;
    this.broadcastChannel = new BroadcastChannel(`lok3d-room-${roomCode}`);

    this.broadcastChannel.onmessage = (event) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "GUEST_PING" && this.isHost) {
        if (this.isConnected) {
          this.broadcastChannel?.postMessage({ type: "ROOM_FULL" });
          return;
        }
        this.broadcastChannel?.postMessage({ type: "HOST_PONG" });
        this.handleConnect();
      } else if (data.type === "HOST_PONG" && !this.isHost) {
        this.handleConnect();
      } else if (data.type === "ROOM_FULL") {
        this.handleRoomFull();
      } else {
        this.handleMessage(data as NetworkMessage);
      }
    };
  }

  private bindConnection(conn: DataConnection): void {
    this.connection = conn;

    conn.on("open", () => {
      console.log("[Multiplayer] Direct WebRTC data channel connected!");
      this.handleConnect();
    });

    conn.on("data", (data) => {
      this.handleMessage(data as NetworkMessage);
    });

    conn.on("close", () => {
      console.log("[Multiplayer] Peer connection closed");
      this.isConnected = false;
      this.stopPingInterval();
      this.events.onDisconnect?.("Peer disconnected");
    });

    conn.on("error", (err) => {
      console.error("[Multiplayer] DataConnection error:", err);
      this.events.onError?.(err.message || "Connection error");
    });
  }

  private handleConnect(): void {
    if (this.isConnected) return;
    this.isConnected = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.startPingInterval();
    this.events.onConnect?.();
  }

  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: "PING", t: Date.now() });
      }
    }, 2000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(msg: NetworkMessage): void {
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
      case "PING":
        this.send({ type: "PONG", t: msg.t });
        break;
      case "PONG":
        this.pingMs = Math.max(4, Math.round(Date.now() - msg.t));
        this.events.onPing?.(this.pingMs);
        break;
      case "ROOM_FULL":
        this.handleRoomFull();
        break;
    }
  }

  private handleRoomFull(): void {
    console.warn("[Multiplayer] Room is full! Rejecting 3rd player.");
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.isConnected = false;
    this.disconnect();
    this.events.onError?.("⚠️ ROOM IS FULL! This match already has 2 commanders playing.");
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
    this.isConnected = false;
    this.stopPingInterval();
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
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
