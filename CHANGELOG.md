# Changelog

## 0.1.0

- Added the first Human-Made Live Next.js static application.
- Added live artist directory, specialty filtering, search, availability status, and commission request modal.
- Added PeerJS client initialization with graceful demo fallback.
- Added the first StudioMesh directory-peer service with room announcements, heartbeats, gossip-ready connections, and expiry.
- Added static build packaging into `build/`.

## Unreleased

- Added temporary guest identities with editable studio names and browser recovery.
- Added PeerDB client persistence through a SharedWorker and IndexedDB, with separate PeerJS IDs for live connections.
- Added PeerDB node replication scaffolding, tombstone-ready record logs, and an auth peer for Google ID-token verification.
- Added optional Google-verified studio linking without storing Google credentials or tokens in the mesh.
