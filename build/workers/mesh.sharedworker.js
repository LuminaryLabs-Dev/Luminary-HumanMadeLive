/* StudioMesh SharedWorker: one browser connection, local IndexedDB cache, short-lived room replication. */
importScripts("https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js");

const ports = new Set();
const records = new Map();
const directoryConnections = new Map();
let peer = null;
let databasePromise = null;

function status(message) { ports.forEach((port) => port.postMessage({ status: message })); }
function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve) => {
    const request = indexedDB.open("human-made-live-peerdb", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("records", { keyPath: "recordId" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
  return databasePromise;
}
async function loadLocalRecords() {
  const db = await openDatabase();
  if (!db) return;
  const request = db.transaction("records", "readonly").objectStore("records").getAll();
  request.onsuccess = () => (request.result || []).forEach((record) => records.set(record.recordId, record));
}
async function saveLocalRecord(record) {
  records.set(record.recordId, record);
  const db = await openDatabase();
  if (db) db.transaction("records", "readwrite").objectStore("records").put(record);
}
function sendToDirectories(message) { directoryConnections.forEach((connection) => { if (connection.open) connection.send(message); }); }
function handleDirectoryMessage(message) {
  if (!message || typeof message !== "object") return;
  if (message.type === "peerdb:record-list") (message.records || []).forEach((record) => saveLocalRecord(record));
  if (message.type === "peerdb:record-upsert" && message.record) saveLocalRecord(message.record);
}
function connectDirectory(directoryId) {
  if (!peer || !directoryId || directoryId === peer.id || directoryConnections.has(directoryId)) return;
  const connection = peer.connect(directoryId, { reliable: true });
  directoryConnections.set(directoryId, connection);
  connection.on("open", () => { connection.send({ type: "peerdb:request-records", worldId: "human-made-live" }); status("PeerDB mesh connected"); });
  connection.on("data", handleDirectoryMessage);
  connection.on("close", () => directoryConnections.delete(directoryId));
}
async function boot(directoryPeers, peerDbPeers) {
  await loadLocalRecords();
  const configuredPeers = peerDbPeers.length ? peerDbPeers : directoryPeers;
  if (peer) { configuredPeers.forEach(connectDirectory); return; }
  try {
    peer = new Peer();
    peer.on("open", (id) => { status("PeerDB session connected"); configuredPeers.forEach(connectDirectory); });
    peer.on("error", () => status("Local cache active · PeerDB mesh will retry"));
  } catch { status("Local cache active · PeerDB mesh unavailable"); }
}
onconnect = (event) => {
  const port = event.ports[0];
  ports.add(port);
  port.start();
  port.onmessage = async (messageEvent) => {
    const message = messageEvent.data || {};
    if (message.type === "boot") await boot(message.directoryPeers || [], message.peerDbPeers || []);
    if (message.type === "record:upsert" && message.record) { await saveLocalRecord(message.record); sendToDirectories({ type: "peerdb:record-upsert", record: message.record }); port.postMessage({ record: message.record }); }
    if (message.type === "records:request") Array.from(records.values()).filter((record) => record.worldId === message.worldId).forEach((record) => port.postMessage({ record }));
  };
};
