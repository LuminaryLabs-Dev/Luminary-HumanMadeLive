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
