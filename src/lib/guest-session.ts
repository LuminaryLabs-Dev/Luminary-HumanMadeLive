"use client";

const STORAGE_KEY = "human-made-live:guest-session:v1";

export type GuestSession = {
  guestId: string;
  studioId: string;
  displayName: string;
  peerId: string | null;
  googleSub: string | null;
  verifiedAt: string | null;
  verificationProvider: "google" | null;
  createdAt: string;
  updatedAt: string;
};

function id(prefix: string) {
  const uuid = globalThis.crypto?.randomUUID?.();
  return `${prefix}_${uuid || `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`}`;
}

export function createGuestSession(): GuestSession {
  const now = new Date().toISOString();
  return {
    guestId: id("guest"),
    studioId: id("studio"),
    displayName: "",
    peerId: null,
    googleSub: null,
    verifiedAt: null,
    verificationProvider: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function loadGuestSession(): GuestSession {
  if (typeof window === "undefined") return createGuestSession();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...createGuestSession(), ...JSON.parse(saved) };
  } catch {
    // A private browsing context may deny storage. The in-memory session still works.
  }
  const session = createGuestSession();
  saveGuestSession(session);
  return session;
}

export function saveGuestSession(session: GuestSession) {
  const next = { ...session, updatedAt: new Date().toISOString() };
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* memory-only fallback */ }
  }
  return next;
}

export function publicStudioRecord(session: GuestSession, available: boolean) {
  return {
    recordId: session.studioId,
    worldId: "human-made-live",
    type: "studio",
    ownerId: session.guestId,
    version: 1,
    updatedAt: new Date().toISOString(),
    expiresAt: null,
    payload: {
      studioId: session.studioId,
      displayName: session.displayName || "Unnamed studio",
      available,
      verified: Boolean(session.googleSub),
      verificationProvider: session.verificationProvider,
    },
  };
}
