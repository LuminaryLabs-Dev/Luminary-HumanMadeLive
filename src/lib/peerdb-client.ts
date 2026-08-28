"use client";

export type PeerDbRecord = {
  recordId: string;
  worldId: string;
  type: string;
  ownerId: string;
  version: number;
  updatedAt: string;
  expiresAt: string | null;
  payload: Record<string, unknown>;
  signature?: string;
};

type PeerDbCallbacks = {
  onStatus?: (message: string) => void;
  onRecord?: (record: PeerDbRecord) => void;
};

export class PeerDbClient {
  private worker: SharedWorker | null = null;
  private callbacks: PeerDbCallbacks;

  constructor(callbacks: PeerDbCallbacks = {}) { this.callbacks = callbacks; }

  start() {
    if (typeof window === "undefined") return;
    if (typeof SharedWorker === "undefined") {
      this.callbacks.onStatus?.("Local cache active · shared worker unavailable");
      return;
    }
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    this.worker = new SharedWorker(`${basePath}/workers/mesh.sharedworker.js`, { name: "human-made-live-mesh" });
    this.worker.port.onmessage = (event) => {
      const message = event.data as { type?: string; status?: string; record?: PeerDbRecord };
      if (message.status) this.callbacks.onStatus?.(message.status);
      if (message.record) this.callbacks.onRecord?.(message.record);
    };
    this.worker.port.start();
    this.worker.port.postMessage({
      type: "boot",
      directoryPeers: (process.env.NEXT_PUBLIC_DIRECTORY_PEERS || "").split(",").map((id) => id.trim()).filter(Boolean),
      peerDbPeers: (process.env.NEXT_PUBLIC_PEERDB_PEERS || process.env.NEXT_PUBLIC_DIRECTORY_PEERS || "").split(",").map((id) => id.trim()).filter(Boolean),
    });
  }

  upsert(record: PeerDbRecord) { this.worker?.port.postMessage({ type: "record:upsert", record }); }
  requestRecords() { this.worker?.port.postMessage({ type: "records:request", worldId: "human-made-live" }); }

  close() { this.worker?.port.close(); this.worker = null; }
}
