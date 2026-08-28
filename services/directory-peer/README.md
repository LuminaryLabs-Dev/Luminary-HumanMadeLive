# StudioMesh directory peer

This small always-on Node process is the discovery layer for Human-Made Live. It stores only short-lived room advertisements in memory and lets browsers discover artists without routing the private commission conversation through the directory.

Run several directory peers with `MESH_PEERS` pointing at one another. Room advertisements expire when heartbeats stop. The browser can connect to one or more peer IDs through `NEXT_PUBLIC_DIRECTORY_PEERS`.

PeerServer still performs the initial PeerJS signaling. The directory peers are ordinary PeerJS peers that exchange room metadata after they connect.
