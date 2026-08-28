# PeerDB node

PeerDB nodes are the persistent layer behind Human-Made Live. Each node keeps an append-only JSONL record log and exchanges records with the other configured nodes over PeerJS.

Run three nodes with unique `PEERDB_NODE_ID` values. Set `PEERDB_PEERS` on every node to the other node IDs, and use the same `WORLD_ID` for instances that should share a dataset. The browser should use those IDs in `NEXT_PUBLIC_PEERDB_PEERS`.

The first release uses deterministic last-write-wins ordering by version, timestamp, and record ID. Live presence still belongs in the directory layer and should expire through TTL; saved profiles do not.
