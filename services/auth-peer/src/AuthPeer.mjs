import { createServer } from "node:http";
import Peer from "peerjs";
import { verifyGoogleCredential } from "./GoogleTokenVerifier.mjs";
import { issueSession } from "./SessionIssuer.mjs";

const worldId = process.env.WORLD_ID || "human-made-live";
const peer = new Peer(process.env.AUTH_PEER_ID || undefined, { host: process.env.PEER_SERVER_HOST || "0.peerjs.com", port: Number(process.env.PEER_SERVER_PORT || 443), path: process.env.PEER_SERVER_PATH || "/", secure: process.env.PEER_SERVER_SECURE !== "false" });
const meshPeers = (process.env.PEERDB_PEERS || "").split(",").map((value) => value.trim()).filter(Boolean);
const connections = [];
peer.on("open", (id) => { meshPeers.forEach((meshId) => { const connection = peer.connect(meshId, { reliable: true }); connection.on("open", () => connections.push(connection)); }); console.log(JSON.stringify({ event: "auth-peer-ready", worldId, id })); });

function publish(record) { connections.filter((connection) => connection.open).forEach((connection) => connection.send({ type: "peerdb:record-upsert", record })); }
function json(response, status, body) { response.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": process.env.CORS_ORIGIN || "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, OPTIONS" }); response.end(JSON.stringify(body)); }
function body(request) { return new Promise((resolve, reject) => { let data = ""; request.on("data", (chunk) => { data += chunk; if (data.length > 1000000) reject(new Error("Request too large")); }); request.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch { reject(new Error("Invalid JSON")); } }); request.on("error", reject); }); }

createServer(async (request, response) => {
  if (request.method === "OPTIONS") return json(response, 204, {});
  if (request.method === "GET" && request.url === "/health") return json(response, 200, { ok: true, worldId });
  if (request.method !== "POST" || request.url !== "/auth/google") return json(response, 404, { error: "Not found" });
  try {
    const input = await body(request);
    const google = await verifyGoogleCredential(input.credential);
    const now = new Date().toISOString();
    const record = { recordId: `identity_${google.googleSub}`, worldId, type: "identity", ownerId: input.guestId, version: 1, updatedAt: now, expiresAt: null, payload: { studioId: input.studioId, googleSub: google.googleSub, email: google.email, displayName: input.displayName || google.name || "Unnamed studio", avatarUrl: google.avatarUrl, verificationProvider: "google", verifiedAt: now } };
    publish(record);
    const session = issueSession({ worldId, guestId: input.guestId, studioId: input.studioId, googleSub: google.googleSub });
    return json(response, 200, { identity: { googleSub: google.googleSub, verifiedAt: now, verificationProvider: "google" }, session });
  } catch (error) { return json(response, 400, { error: error instanceof Error ? error.message : "Authentication failed" }); }
}).listen(Number(process.env.AUTH_PORT || 8788), () => console.log(JSON.stringify({ event: "auth-http-ready", port: Number(process.env.AUTH_PORT || 8788) })));
