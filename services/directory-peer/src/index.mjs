import Peer from "peerjs";

const directoryId = process.env.DIRECTORY_PEER_ID || undefined;
const meshPeers = (process.env.MESH_PEERS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const rooms = new Map();
const ttlMs = Number(process.env.ROOM_TTL_MS || 45000);

const peer = new Peer(directoryId, {
  host: process.env.PEER_SERVER_HOST || "0.peerjs.com",
  port: Number(process.env.PEER_SERVER_PORT || 443),
  path: process.env.PEER_SERVER_PATH || "/",
  secure: process.env.PEER_SERVER_SECURE !== "false",
});

peer.on("open", (id) => {
  console.log(JSON.stringify({ event: "directory-open", id, meshPeers }));
  meshPeers.forEach(connectToMeshPeer);
});

peer.on("connection", (connection) => bindConnection(connection));
peer.on("error", (error) => console.error(JSON.stringify({ event: "directory-error", message: error.message })));

function connectToMeshPeer(remoteId) {
  if (!remoteId || remoteId === peer.id) return;
  const connection = peer.connect(remoteId, { reliable: true });
  bindConnection(connection);
}

function bindConnection(connection) {
  connection.on("open", () => connection.send({ type: "directory:hello", peerId: peer.id }));
  connection.on("data", (message) => handleMessage(connection, message));
  connection.on("error", (error) => console.error(JSON.stringify({ event: "connection-error", message: error.message })));
}

function handleMessage(connection, message) {
  if (!message || typeof message !== "object") return;
  const payload = message;
  if (payload.type === "directory:request-rooms") {
    connection.send({ type: "directory:room-list", rooms: [...rooms.values()] });
    return;
  }
  if (payload.type === "room:announce" && payload.room?.roomId) {
    const nextRoom = { ...payload.room, updatedAt: Date.now() };
    rooms.set(nextRoom.roomId, nextRoom);
    connection.send({ type: "room:announce", room: nextRoom });
    return;
  }
  if (payload.type === "room:heartbeat" && payload.room?.roomId) {
    const existing = rooms.get(payload.room.roomId);
    if (existing) rooms.set(existing.roomId, { ...existing, ...payload.room, updatedAt: Date.now() });
    return;
  }
  if (payload.type === "room:withdraw" && payload.roomId) {
    rooms.delete(payload.roomId);
  }
}

setInterval(() => {
  const cutoff = Date.now() - ttlMs;
  for (const [roomId, room] of rooms) {
    if (room.updatedAt < cutoff) rooms.delete(roomId);
  }
}, Math.max(10000, Math.floor(ttlMs / 2)));
