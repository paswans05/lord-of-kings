import { Peer, type DataConnection, type MediaConnection } from "peerjs";
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
  playerName?: string;
}

export interface NetworkResignPayload {
  type: "RESIGN";
  color: Faction;
}

export interface NetworkUndoPayload {
  type: "UNDO";
  count?: number;
}

export interface NetworkChatPayload {
  type: "CHAT";
  text: string;
  sender: string;
  t: number;
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

export interface NetworkPremiumStatusPayload {
  type: "PREMIUM_STATUS";
  isUnlocked: boolean;
}

export type NetworkMessage =
  | NetworkMovePayload
  | NetworkHandshakePayload
  | NetworkResignPayload
  | NetworkUndoPayload
  | NetworkChatPayload
  | NetworkPingPayload
  | NetworkPongPayload
  | NetworkRoomFullPayload
  | NetworkPremiumStatusPayload;

export interface MultiplayerEvents {
  onConnecting?: (attempt: number) => void;
  onConnect: () => void;
  onDisconnect: (reason?: string) => void;
  onMove: (from: SquareId, to: SquareId, promotion?: PieceKind) => void;
  onHandshake: (color: Faction, muster: MusterChoice, playerName?: string) => void;
  onResign: (color: Faction) => void;
  onUndo?: (count?: number) => void;
  onChatMessage?: (msg: { text: string; sender: string; t: number }) => void;
  onVoiceStateChange?: (active: boolean, micMuted: boolean) => void;
  onPremiumStatus?: (isUnlocked: boolean) => void;
  onPing: (pingMs: number) => void;
  onError: (error: string) => void;
}

const PEER_PREFIX = "lok3d-v1-";

const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" },
      { urls: "stun:stun.services.mozilla.com" },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
    ],
  },
};

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function verifyRoomPeer(roomCode: string): Promise<boolean> {
  return new Promise((resolve) => {
    const peerId = `${PEER_PREFIX}${roomCode.trim().toUpperCase()}`;
    let resolved = false;

    const tempPeer = new Peer(PEER_CONFIG);

    const finish = (isOnline: boolean) => {
      if (resolved) return;
      resolved = true;
      try {
        tempPeer.destroy();
      } catch {}
      resolve(isOnline);
    };

    const timer = setTimeout(() => finish(false), 3500);

    tempPeer.on("open", () => {
      try {
        const conn = tempPeer.connect(peerId, { reliable: false });
        conn.on("open", () => {
          clearTimeout(timer);
          try {
            conn.close();
          } catch {}
          finish(true);
        });
        conn.on("error", () => {
          clearTimeout(timer);
          finish(false);
        });
      } catch {
        clearTimeout(timer);
        finish(false);
      }
    });

    tempPeer.on("error", () => {
      clearTimeout(timer);
      finish(false);
    });
  });
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
      this.peer = new Peer(fullPeerId, PEER_CONFIG);

      this.peer.on("open", () => {
        console.log(`[Multiplayer] Room created: ${this.roomCode}`);
        this.events.onConnecting?.(1);
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
        console.warn("[Multiplayer] PeerJS error:", err);
        if (err.type === "unavailable-id") {
          this.events.onError?.("Room code already in use. Please create a new room.");
        } else {
          this.events.onError?.(`Network message: ${err.message || err.type}`);
        }
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
      this.events.onConnecting?.(this.joinAttempts);
      console.log(`[Multiplayer] Connecting to host: ${this.roomCode} (attempt ${this.joinAttempts})`);

      try {
        if (this.peer && !this.peer.destroyed) {
          const conn = this.peer.connect(fullPeerId, { reliable: true });
          this.bindConnection(conn);
        } else {
          if (this.peer) {
            try { this.peer.destroy(); } catch {}
          }
          this.peer = new Peer(PEER_CONFIG);

          this.peer.on("open", () => {
            if (!this.peer || this.isConnected) return;
            const conn = this.peer.connect(fullPeerId, { reliable: true });
            this.bindConnection(conn);
          });

          this.peer.on("error", (err) => {
            console.warn(`[Multiplayer] PeerJS connect info (attempt ${this.joinAttempts}):`, err.message || err.type);
            if (!this.isConnected && this.joinAttempts < 15) {
              this.retryTimer = setTimeout(attemptConnect, 2000);
            } else if (!this.isConnected) {
              this.events.onError?.("Could not connect to room. Ensure host is in game room.");
            }
          });
        }
      } catch (e) {
        console.warn("[Multiplayer] PeerJS join fallback:", e);
        if (!this.isConnected && this.joinAttempts < 15) {
          this.retryTimer = setTimeout(attemptConnect, 2000);
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
        this.events.onHandshake?.(msg.playerColor, msg.muster, msg.playerName);
        break;
      case "MOVE":
        this.events.onMove?.(msg.from, msg.to, msg.promotion);
        break;
      case "RESIGN":
        this.events.onResign?.(msg.color);
        break;
      case "UNDO":
        this.events.onUndo?.(msg.count);
        break;
      case "CHAT":
        this.events.onChatMessage?.({ text: msg.text, sender: msg.sender, t: msg.t });
        break;
      case "PREMIUM_STATUS":
        this.events.onPremiumStatus?.(msg.isUnlocked);
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

  public sendHandshake(playerColor: Faction, muster: MusterChoice, playerName?: string): void {
    const payload: NetworkHandshakePayload = { type: "HANDSHAKE", playerColor, muster, playerName };
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

  public sendUndo(count?: number): void {
    const payload: NetworkUndoPayload = { type: "UNDO", count };
    this.send(payload);
  }

  public sendPremiumStatus(isUnlocked: boolean): void {
    const payload: NetworkPremiumStatusPayload = { type: "PREMIUM_STATUS", isUnlocked };
    this.send(payload);
  }

  public sendChat(text: string, senderName: string): void {
    const payload: NetworkChatPayload = { type: "CHAT", text, sender: senderName, t: Date.now() };
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
    this.stopVoiceChat();
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

  // ---------------------------------------------------------------- Voice Chat
  private mediaCall: MediaConnection | null = null;
  private localAudioStream: MediaStream | null = null;
  private remoteAudioElement: HTMLAudioElement | null = null;
  public isVoiceActive = false;
  public isMicMuted = false;

  public async startVoiceChat(): Promise<boolean> {
    if (this.isVoiceActive) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.localAudioStream = stream;
      this.isVoiceActive = true;
      this.isMicMuted = false;

      if (this.peer) {
        this.peer.on("call", (call) => {
          call.answer(stream);
          this.bindMediaCall(call);
        });

        if (this.connection && this.connection.peer) {
          const call = this.peer.call(this.connection.peer, stream);
          this.bindMediaCall(call);
        }
      }

      this.events.onVoiceStateChange?.(true, false);
      return true;
    } catch (err) {
      console.warn("[Multiplayer] Mic access failed:", err);
      this.events.onError?.("Microphone access denied or unavailable.");
      return false;
    }
  }

  private bindMediaCall(call: MediaConnection): void {
    this.mediaCall = call;
    call.on("stream", (remoteStream) => {
      if (!this.remoteAudioElement) {
        this.remoteAudioElement = new Audio();
        this.remoteAudioElement.autoplay = true;
      }
      this.remoteAudioElement.srcObject = remoteStream;
      void this.remoteAudioElement.play().catch(() => {});
    });
    call.on("close", () => {
      this.stopVoiceChat();
    });
  }

  public toggleMic(): boolean {
    if (!this.localAudioStream) return false;
    const tracks = this.localAudioStream.getAudioTracks();
    this.isMicMuted = !this.isMicMuted;
    for (const track of tracks) {
      track.enabled = !this.isMicMuted;
    }
    this.events.onVoiceStateChange?.(this.isVoiceActive, this.isMicMuted);
    return this.isMicMuted;
  }

  public stopVoiceChat(): void {
    if (this.localAudioStream) {
      for (const track of this.localAudioStream.getTracks()) {
        track.stop();
      }
      this.localAudioStream = null;
    }
    if (this.mediaCall) {
      this.mediaCall.close();
      this.mediaCall = null;
    }
    if (this.remoteAudioElement) {
      this.remoteAudioElement.srcObject = null;
      this.remoteAudioElement = null;
    }
    this.isVoiceActive = false;
    this.isMicMuted = false;
    this.events.onVoiceStateChange?.(false, false);
  }
}
