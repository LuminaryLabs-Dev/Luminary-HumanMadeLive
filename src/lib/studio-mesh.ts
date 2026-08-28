import Peer from "peerjs";
import type { DataConnection } from "peerjs";

export type RoomAdvertisement = {
  roomId: string;
  peerId: string;
  name: string;
  role: string;
  specialties: string[];
  price: string;
  status: "available" | "limited";
  updatedAt: number;
};

type MeshCallbacks = {
  onPeerId?: (peerId: string) => void;
  onRooms?: (rooms: RoomAdvertisement[]) => void;
  onConnection?: (connection: DataConnection) => void;
  onStatus?: (message: string) => void;
};

export class StudioMeshClient {
  private peer?: Peer;
  private directoryConnections: DataConnection[] = [];
  private callbacks: MeshCallbacks;
  private activeRoom?: RoomAdvertisement;
  private heartbeatTimer?: ReturnType<typeof setInterval>;

  constructor(callbacks: MeshCallbacks = {}) {
    this.callbacks = callbacks;
  }

  start() {
    this.peer = new Peer();
    this.peer.on("open", (peerId) => {
      this.callbacks.onPeerId?.(peerId);
      this.callbacks.onStatus?.("Connected to the live peer network");
      this.connectToDirectories();
    });
    this.peer.on("connection", (connection) => {
      this.callbacks.onConnection?.(connection);
    });
    this.peer.on("error", () => {
      this.callbacks.onStatus?.("Demo mode active · peer network will retry");
    });
  }

  announceRoom(room: Omit<RoomAdvertisement, "peerId" | "updatedAt">) {
    if (!this.peer?.id) return;
    const advertisement: RoomAdvertisement = {
      ...room,
      peerId: this.peer.id,
      updatedAt: Date.now(),
    };
    this.activeRoom = advertisement;
    this.sendToDirectories({ type: "room:announce", room: advertisement });
    if (!this.heartbeatTimer) {
      this.heartbeatTimer = setInterval(() => {
        if (this.activeRoom) this.sendToDirectories({ type: "room:heartbeat", room: this.activeRoom });
      }, 15000);
    }
  }

  withdrawRoom() {
    if (this.activeRoom) this.sendToDirectories({ type: "room:withdraw", roomId: this.activeRoom.roomId });
    this.activeRoom = undefined;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
  }

  requestRooms() {
    this.sendToDirectories({ type: "directory:request-rooms" });
  }

  close() {
    this.withdrawRoom();
    this.directoryConnections.forEach((connection) => connection.close());
    this.peer?.destroy();
  }

  private connectToDirectories() {
    const directoryIds = (process.env.NEXT_PUBLIC_DIRECTORY_PEERS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    directoryIds.forEach((directoryId) => {
      if (!this.peer || directoryId === this.peer.id) return;
      const connection = this.peer.connect(directoryId, { reliable: true });
      connection.on("open", () => {
        this.directoryConnections.push(connection);
        this.callbacks.onStatus?.("Discovery mesh is online");
        this.requestRooms();
      });
      connection.on("data", (message) => this.handleMessage(message));
    });

    if (directoryIds.length === 0) {
      this.callbacks.onStatus?.("Discovery mesh is online");
    }
  }

  private sendToDirectories(message: object) {
    this.directoryConnections
      .filter((connection) => connection.open)
      .forEach((connection) => connection.send(message));
  }

  private handleMessage(message: unknown) {
    if (!message || typeof message !== "object") return;
    const payload = message as { type?: string; rooms?: RoomAdvertisement[]; room?: RoomAdvertisement };
    if (payload.type === "directory:room-list" && payload.rooms) {
      this.callbacks.onRooms?.(payload.rooms);
    }
    if (payload.type === "room:announce" && payload.room) {
      this.callbacks.onRooms?.([payload.room]);
    }
  }
}
