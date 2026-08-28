export class ReplicationService {
  constructor(peer, peerIds, onMessage) { this.peer = peer; this.peerIds = peerIds; this.onMessage = onMessage; this.connections = new Map(); }
  connectAll() { this.peerIds.forEach((id) => { if (!id || id === this.peer.id || this.connections.has(id)) return; const connection = this.peer.connect(id, { reliable: true }); this.connections.set(id, connection); connection.on("open", () => connection.send({ type: "peerdb:hello", peerId: this.peer.id })); connection.on("data", this.onMessage); connection.on("close", () => this.connections.delete(id)); }); }
  broadcast(message, exceptPeerId) { this.connections.forEach((connection, id) => { if (id !== exceptPeerId && connection.open) connection.send(message); }); }
  sendToPeers(message) { this.connections.forEach((connection) => { if (connection.open) connection.send(message); }); }
}
