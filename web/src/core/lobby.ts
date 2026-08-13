/**
 * Global Lobby Service: Tracks online user count & active public/private room directory.
 * Uses BroadcastChannel + localStorage heartbeats to synchronize active rooms & commanders.
 */

export interface PublicRoomInfo {
  roomCode: string;
  hostName: string;
  isPrivate: boolean;
  playerCount: number; // 1 or 2
  createdAt: number;
  lastHeartbeat: number;
}

export interface LobbyStats {
  onlineUsersCount: number;
  publicRooms: PublicRoomInfo[];
}

const STORAGE_KEY_ROOMS = "lok3d_lobby_rooms_v1";
const STORAGE_KEY_USERS = "lok3d_lobby_users_v1";
const LOBBY_CHANNEL_NAME = "lok3d_global_lobby_channel_v1";

export class LobbyService {
  private static instance: LobbyService | null = null;
  private clientId: string;
  private playerName: string = "Commander";
  private currentRoomCode: string | null = null;
  private currentRoomIsPrivate: boolean = false;
  private currentRoomPlayerCount: number = 1;
  private channel: BroadcastChannel | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(stats: LobbyStats) => void> = new Set();

  private constructor() {
    this.clientId = `usr_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    if (typeof window !== "undefined") {
      this.playerName = window.localStorage.getItem("kg.playername") || "Commander";
      if (typeof BroadcastChannel !== "undefined") {
        this.channel = new BroadcastChannel(LOBBY_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data?.type === "HEARTBEAT" || event.data?.type === "ROOM_UPDATE") {
            this.notifyListeners();
          }
        };
      }
      this.startHeartbeat();
    }
  }

  public static getInstance(): LobbyService {
    if (!LobbyService.instance) {
      LobbyService.instance = new LobbyService();
    }
    return LobbyService.instance;
  }

  public setPlayerName(name: string): void {
    this.playerName = name || "Commander";
    this.sendHeartbeat();
  }

  /** Register active hosted room */
  public registerHostRoom(roomCode: string, isPrivate: boolean): void {
    this.currentRoomCode = roomCode.toUpperCase();
    this.currentRoomIsPrivate = isPrivate;
    this.currentRoomPlayerCount = 1;

    this.updateRoomInStorage({
      roomCode: this.currentRoomCode,
      hostName: this.playerName,
      isPrivate: isPrivate,
      playerCount: 1,
      createdAt: Date.now(),
      lastHeartbeat: Date.now(),
    });

    this.sendHeartbeat();
  }

  /** Mark room as joined by guest (2/2 capacity full -> auto remove from public list) */
  public markRoomJoined(roomCode: string): void {
    const code = roomCode.toUpperCase();
    if (this.currentRoomCode === code) {
      this.currentRoomPlayerCount = 2;
    }
    const rooms = this.getRoomsFromStorage();
    const target = rooms.find((r) => r.roomCode === code);
    if (target) {
      target.playerCount = 2;
      target.lastHeartbeat = Date.now();
      this.saveRoomsToStorage(rooms);
      this.notifyListeners();
    }
  }

  /** Leave/Close hosted room */
  public leaveRoom(): void {
    if (this.currentRoomCode) {
      const code = this.currentRoomCode;
      this.currentRoomCode = null;
      this.removeRoomFromStorage(code);
    }
    this.sendHeartbeat();
  }

  public subscribe(callback: (stats: LobbyStats) => void): () => void {
    this.listeners.add(callback);
    callback(this.getStats());
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getStats(): LobbyStats {
    const now = Date.now();
    // Clean stale rooms (>15s since heartbeat or playerCount >= 2 or isPrivate)
    const allRooms = this.getRoomsFromStorage().filter((r) => now - r.lastHeartbeat < 15000);
    this.saveRoomsToStorage(allRooms);

    // Only public rooms with exactly 1 player are joinable from home page
    const publicJoinableRooms = allRooms.filter(
      (r) => !r.isPrivate && r.playerCount < 2
    );

    // Clean stale users (>15s since heartbeat)
    const users = this.getUsersFromStorage().filter((u) => now - u.lastSeen < 15000);
    this.saveUsersToStorage(users);

    const onlineCount = Math.max(1, users.length);

    return {
      onlineUsersCount: onlineCount,
      publicRooms: publicJoinableRooms,
    };
  }

  private startHeartbeat(): void {
    this.sendHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 4000);
  }

  private sendHeartbeat(): void {
    const now = Date.now();

    // 1. Update user heartbeat
    const users = this.getUsersFromStorage().filter((u) => now - u.lastSeen < 15000);
    const existingIdx = users.findIndex((u) => u.id === this.clientId);
    if (existingIdx >= 0) {
      users[existingIdx].lastSeen = now;
      users[existingIdx].name = this.playerName;
    } else {
      users.push({ id: this.clientId, name: this.playerName, lastSeen: now });
    }
    this.saveUsersToStorage(users);

    // 2. Update hosted room heartbeat if active
    if (this.currentRoomCode) {
      const rooms = this.getRoomsFromStorage();
      const idx = rooms.findIndex((r) => r.roomCode === this.currentRoomCode);
      if (idx >= 0) {
        rooms[idx].lastHeartbeat = now;
        rooms[idx].playerCount = this.currentRoomPlayerCount;
        rooms[idx].isPrivate = this.currentRoomIsPrivate;
      } else {
        rooms.push({
          roomCode: this.currentRoomCode,
          hostName: this.playerName,
          isPrivate: this.currentRoomIsPrivate,
          playerCount: this.currentRoomPlayerCount,
          createdAt: now,
          lastHeartbeat: now,
        });
      }
      this.saveRoomsToStorage(rooms);
    }

    if (this.channel) {
      this.channel.postMessage({ type: "HEARTBEAT", clientId: this.clientId });
    }

    this.notifyListeners();
  }

  private notifyListeners(): void {
    const stats = this.getStats();
    for (const listener of this.listeners) {
      listener(stats);
    }
  }

  private getRoomsFromStorage(): PublicRoomInfo[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ROOMS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveRoomsToStorage(rooms: PublicRoomInfo[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
    } catch {}
  }

  private updateRoomInStorage(room: PublicRoomInfo): void {
    const rooms = this.getRoomsFromStorage().filter((r) => r.roomCode !== room.roomCode);
    rooms.push(room);
    this.saveRoomsToStorage(rooms);
  }

  private removeRoomFromStorage(roomCode: string): void {
    const rooms = this.getRoomsFromStorage().filter((r) => r.roomCode !== roomCode);
    this.saveRoomsToStorage(rooms);
  }

  private getUsersFromStorage(): { id: string; name: string; lastSeen: number }[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveUsersToStorage(users: { id: string; name: string; lastSeen: number }[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch {}
  }
}

export const lobbyService = LobbyService.getInstance();
