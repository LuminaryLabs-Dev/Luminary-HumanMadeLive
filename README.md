# Human-Made Live

Human-Made Live is a static Next.js proof of concept for a peer-first creative network. It helps customers find artists who have actively marked themselves available and begin a private commission conversation.

## Development

```bash
npm install
npm run dev
```

## Static deployment

The website is exported with Next.js static output. To produce the deployable folder:

```bash
NEXT_PUBLIC_BASE_PATH=/human-made-live npm run build:static
```

The generated `build/` folder is ready to copy into a static host at `/human-made-live/`.

## Peer layer

The browser initializes a PeerJS client for live connectivity and can connect to configured StudioMesh directory peers through `NEXT_PUBLIC_DIRECTORY_PEERS`. The directory peers hold short-lived room advertisements in memory, gossip them across the mesh, and expire rooms when heartbeats stop. The public directory also includes a graceful demo mode so the experience remains usable while the peer service is not configured.

## Temporary studios and PeerDB

On first visit, the browser creates a temporary guest identity and asks the artist to choose an editable studio name. The profile is cached in IndexedDB/local storage and published as a signed-record-shaped object to the PeerDB mesh. The live room is announced separately and disappears when its heartbeat stops or the artist closes the studio.

PeerDB is separate from PeerJS signaling. Run multiple `services/peerdb-node` processes to replicate persistent profiles, portfolio metadata, and commission state. Configure their PeerJS IDs with `NEXT_PUBLIC_PEERDB_PEERS`. The browser SharedWorker keeps one mesh connection per origin and shares cached records across tabs.

Google is an optional upgrade. The `services/auth-peer` gateway verifies the Google ID token, links the existing guest/studio IDs, and returns verification metadata so the same studio receives a Google-verified star. No Supabase is used, and no Google password or OAuth token is written to PeerDB.
