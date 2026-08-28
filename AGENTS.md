# Agent Notes

- Keep the first release static-deployable.
- Preserve `/human-made-live/` as the production base path.
- Treat PeerJS as the real-time connection layer, not the permanent source of truth for artist records.
- Keep the public UI focused on artists, availability, and commission requests.
- Temporary guest studios use a browser-local session plus PeerDB persistence; `peerId` is never a permanent identity.
- Google SSO is an optional account upgrade. Verify ID tokens in `services/auth-peer` and store only the Google `sub` and verification metadata.
- Keep private room traffic direct between peers; directory and PeerDB nodes should receive metadata and replicated records only.
