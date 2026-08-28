import Peer from "peerjs";
import { mkdir } from "node:fs/promises";
import { PeerDatabase } from "./PeerDatabase.mjs";
import { ReplicationService } from "./ReplicationService.mjs";

const worldId = process.env.WORLD_ID || "human-made-live";
const nodeId = process.env.PEERDB_NODE_ID || undefined;
const peerIds = (process.env.PEERDB_PEERS || "").split(",").map((value) => value.trim()).filter(Boolean);
const dataDir = process.env.PEERDB_DATA_DIR || "./data";
await mkdir(dataDir, { recursive: true });
const database = new PeerDatabase(`${dataDir}/records.jsonl`);
await database.open();
const peer = new Peer(nodeId, { host: process.env.PEER_SERVER_HOST || "0.peerjs.com", port: Number(process.env.PEER_SERVER_PORT || 443), path: process.env.PEER_SERVER_PATH || "/", secure: process.env.PEER_SERVER_SECURE !== "false" });
let replication;

peer.on("open", (id) => { replication = new ReplicationService(peer, peerIds, (message) => handleMessage(null, message)); replication.connectAll(); console.log(JSON.stringify({ event: "peerdb-ready", worldId, nodeId: id })); });
peer.on("connection", (connection) => { connection.on("data", (message) => handleMessage(connection.peer, message, connection)); });
peer.on("error", (error) => console.error(JSON.stringify({ event: "peerdb-error", message: error.message })));

async function handleMessage(sourcePeerId, message, connection) {
  if (!message || typeof message !== "object") return;
  if (message.type === "peerdb:request-records") { connection?.send({ type: "peerdb:record-list", records: database.list(message.worldId || worldId) }); return; }
  if (message.type === "peerdb:record-upsert" && message.record?.recordId) { const changed = await database.upsert(message.record); if (changed) { replication?.broadcast({ type: "peerdb:record-upsert", record: message.record }, sourcePeerId); } }
  if (message.type === "peerdb:record-delete" && message.recordId) { await database.remove(message.recordId, message.version || 0); replication?.broadcast(message, sourcePeerId); }
}
