"use client";

import { useEffect, useRef, useState } from "react";
import { claimWithGoogle, renderGoogleButton } from "../lib/google-sso";
import { saveGuestSession, type GuestSession } from "../lib/guest-session";

type Props = {
  session: GuestSession;
  onClose: () => void;
  onSaved: (session: GuestSession) => void;
  onStatus: (message: string) => void;
};

export function StudioIdentityModal({ session, onClose, onSaved, onStatus }: Props) {
  const [name, setName] = useState(session.displayName);
  const [busy, setBusy] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const googleButton = useRef<HTMLDivElement>(null);
  const googleConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  useEffect(() => {
    if (!googleButton.current || session.googleSub || !googleConfigured) return;
    renderGoogleButton(googleButton.current, async (credential) => {
      setBusy(true);
      setGoogleError(null);
      try {
        const named = { ...session, displayName: name.trim() || "Unnamed studio" };
        const identity = await claimWithGoogle(credential, named);
        const saved = saveGuestSession({ ...named, googleSub: identity.googleSub, verifiedAt: identity.verifiedAt, verificationProvider: identity.verificationProvider });
        onSaved(saved);
        onStatus("Studio saved · Google-verified star added");
        onClose();
      } catch (error) {
        setGoogleError(error instanceof Error ? error.message : "Google sign-in failed");
      } finally { setBusy(false); }
    }).catch((error) => setGoogleError(error instanceof Error ? error.message : "Google SSO is not configured yet"));
  }, [googleConfigured, name, onClose, onSaved, onStatus, session]);

  function continueWithGoogleFallback() {
    setGoogleError("Google SSO is not configured in this deployment yet");
  }

  function continueAsGuest() {
    const trimmed = name.trim();
    if (!trimmed) { setGoogleError("Choose a studio name first"); return; }
    const saved = saveGuestSession({ ...session, displayName: trimmed });
    onSaved(saved);
    onStatus("Temporary studio saved to this browser");
    onClose();
  }

  return <div className="modal-backdrop" role="presentation" onClick={onClose}><section className="commission-modal identity-modal" role="dialog" aria-modal="true" aria-labelledby="studio-identity-title" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={onClose} aria-label="Close">×</button><div className="modal-kicker"><span className="live-dot" /> TEMPORARY STUDIO</div><h2 id="studio-identity-title">Name your studio.</h2><p>This room is temporary and live. Save it now, then connect Google later to keep it and receive a verification star.</p><label>Studio name<input className="identity-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="Maya’s Illustration Studio" /></label><div className="identity-actions"><button className="primary-button" onClick={continueAsGuest}>Enter as guest <span>↗</span></button>{googleConfigured ? <div className="google-button" ref={googleButton} aria-label="Continue with Google" /> : <button className="google-fallback" onClick={continueWithGoogleFallback}>Continue with Google</button>}</div>{busy && <small>Verifying and saving your studio…</small>}{googleError && <small className="identity-error">{googleError}</small>}<small>Your Google password and OAuth tokens never enter the PeerDB mesh.</small></section></div>;
}
