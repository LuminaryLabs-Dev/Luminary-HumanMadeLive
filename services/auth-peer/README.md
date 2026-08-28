# Auth peer

This gateway accepts a Google Identity Services ID token, verifies its signature, issuer, and audience with `google-auth-library`, then publishes a minimal identity-link record to the PeerDB nodes.

Required environment:

- `GOOGLE_CLIENT_ID`
- `SESSION_SECRET`
- `PEERDB_PEERS`
- `PEER_SERVER_HOST`, `PEER_SERVER_PORT`, and related PeerJS settings

The gateway does not store Google passwords, refresh tokens, access tokens, or private cookies in PeerDB. `CORS_ORIGIN` should be set to the exact production origin before deployment.
