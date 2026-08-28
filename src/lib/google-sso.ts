"use client";

import type { GuestSession } from "./guest-session";

type GoogleCredentialResponse = { credential: string };
type GoogleButtonOptions = { theme?: string; size?: string; text?: string; shape?: string; width?: number };
type GoogleIdentity = {
  accounts: {
    id: {
      initialize(options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void;
      renderButton(element: HTMLElement, options: GoogleButtonOptions): void;
      cancel(): void;
    };
  };
};

declare global { interface Window { google?: GoogleIdentity; } }

function loadGoogleScript() {
  if (window.google) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    if (existing) { existing.addEventListener("load", () => resolve(), { once: true }); existing.addEventListener("error", () => reject(new Error("Google Identity Services failed to load")), { once: true }); return; }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Identity Services failed to load"));
    document.head.appendChild(script);
  });
}

export async function renderGoogleButton(element: HTMLElement, onCredential: (credential: string) => void) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Google SSO is not configured yet");
  await loadGoogleScript();
  if (!window.google) throw new Error("Google Identity Services is unavailable");
  window.google.accounts.id.initialize({ client_id: clientId, callback: (response) => onCredential(response.credential) });
  window.google.accounts.id.renderButton(element, { theme: "outline", size: "large", text: "continue_with", shape: "pill", width: 300 });
}

export async function claimWithGoogle(credential: string, session: GuestSession) {
  const authPeerUrl = process.env.NEXT_PUBLIC_AUTH_PEER_URL;
  if (!authPeerUrl) throw new Error("Google SSO is not configured yet");
  const response = await fetch(`${authPeerUrl.replace(/\/$/, "")}/auth/google`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ credential, guestId: session.guestId, studioId: session.studioId, displayName: session.displayName }),
  });
  const result = await response.json() as { error?: string; identity?: { googleSub: string; verifiedAt: string; verificationProvider: "google" } };
  if (!response.ok || !result.identity) throw new Error(result.error || "Google sign-in could not be completed");
  return result.identity;
}
