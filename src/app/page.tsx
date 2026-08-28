"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DataConnection } from "peerjs";
import { StudioMeshClient } from "../lib/studio-mesh";

type Artist = {
  id: string;
  name: string;
  initials: string;
  role: string;
  location: string;
  specialties: string[];
  price: string;
  response: string;
  color: string;
  featured: string;
  status: "available" | "limited";
  verified: boolean;
};

const artists: Artist[] = [
  {
    id: "maya-chen",
    name: "Maya Chen",
    initials: "MC",
    role: "Illustrator & poster artist",
    location: "Brooklyn, NY",
    specialties: ["Posters", "Editorial", "Murals"],
    price: "from $180",
    response: "Usually replies in 8 min",
    color: "coral",
    featured: "A neighborhood concert poster with hand-drawn energy.",
    status: "available",
    verified: true,
  },
  {
    id: "theo-walker",
    name: "Theo Walker",
    initials: "TW",
    role: "Brand designer & art director",
    location: "Chicago, IL",
    specialties: ["Branding", "Menus", "Campaigns"],
    price: "from $320",
    response: "Usually replies in 12 min",
    color: "blue",
    featured: "A warm identity system for independent food businesses.",
    status: "available",
    verified: true,
  },
  {
    id: "noor-rahman",
    name: "Noor Rahman",
    initials: "NR",
    role: "3D artist & motion designer",
    location: "Toronto, CA",
    specialties: ["3D", "Motion", "Product art"],
    price: "from $450",
    response: "Usually replies in 20 min",
    color: "violet",
    featured: "Small worlds and product moments made for the screen.",
    status: "limited",
    verified: true,
  },
  {
    id: "sam-rivera",
    name: "Sam Rivera",
    initials: "SR",
    role: "Photographer & visual storyteller",
    location: "Austin, TX",
    specialties: ["Portraits", "Food", "Small business"],
    price: "from $240",
    response: "Usually replies in 15 min",
    color: "gold",
    featured: "Honest images for people, places, and products with a pulse.",
    status: "available",
    verified: true,
  },
];

const filters = ["All artists", "Posters", "Branding", "Illustration", "3D", "Photography"];

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState("All artists");
  const [query, setQuery] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [notice, setNotice] = useState("Discovery mesh is online");
  const [peerId, setPeerId] = useState<string | null>(null);
  const [pendingConnection, setPendingConnection] = useState<DataConnection | null>(null);
  const meshRef = useRef<StudioMeshClient | null>(null);

  useEffect(() => {
    const mesh = new StudioMeshClient({
      onPeerId: setPeerId,
      onStatus: setNotice,
      onConnection: (connection) => {
        setPendingConnection(connection);
        setNotice("A commission room request is waiting");
      },
    });
    meshRef.current = mesh;
    try {
      mesh.start();
    } catch {
      setNotice("Demo mode active · discovery mesh is simulated");
    }

    return () => {
      mesh.close();
      meshRef.current = null;
    };
  }, []);

  const filteredArtists = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return artists.filter((artist) => {
      const matchesFilter = activeFilter === "All artists" || artist.specialties.some((item) => item.toLowerCase().includes(activeFilter.slice(0, -1).toLowerCase()));
      const matchesQuery = !normalized || `${artist.name} ${artist.role} ${artist.location} ${artist.specialties.join(" ")}`.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  function openCommission(artist: Artist) {
    setSelectedArtist(artist);
    setNotice(`Commission request ready for ${artist.name}`);
  }

  function toggleStudio() {
    setIsStudioOpen((open) => !open);
    setNotice(isStudioOpen ? "Your studio is now hidden" : "Your studio is visible to live visitors");
    if (!isStudioOpen) {
      meshRef.current?.announceRoom({
        roomId: `studio-${peerId || "local"}`,
        name: "Crimson Wheeler",
        role: "Creative technologist",
        specialties: ["Games", "Tech art", "Web experiences"],
        price: "by conversation",
        status: "available",
      });
    }
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Human-Made Live home">
          <span className="wordmark-mark">✳</span>
          <span>human-made<span className="wordmark-live">live</span></span>
        </a>
        <nav className="topnav" aria-label="Main navigation">
          <a className="nav-active" href="#artists">Browse artists</a>
          <a href="#how-it-works">How it works</a>
          <button className="text-button" onClick={toggleStudio}>{isStudioOpen ? "Close studio" : "Open your studio"}</button>
        </nav>
        <button className="profile-button" onClick={toggleStudio} aria-label="Open studio profile">CW</button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> LIVE CREATIVE NETWORK</div>
          <h1>Find a real artist<br /><em>who is ready now.</em></h1>
          <p className="hero-lede">Human-made design, illustration, photography, and art from people who are actually here to make something with you.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#artists">Explore artists <span>↘</span></a>
            <button className="secondary-button" onClick={toggleStudio}>{isStudioOpen ? "Your studio is open" : "I am an artist"}</button>
          </div>
        </div>
        <div className="hero-art" aria-label="Abstract collage of human-made artwork">
          <div className="art-sun" />
          <div className="art-card art-card-one"><span>MAKE<br />IT<br /><i>human</i></span></div>
          <div className="art-card art-card-two"><span>NO<br />PROMPTS.<br /><b>JUST<br />PEOPLE.</b></span></div>
          <div className="art-ribbon">OPEN<br />STUDIO<br /><small>↗</small></div>
          <div className="art-sticker">✦</div>
        </div>
      </section>

      <section className="network-strip" aria-label="Network status">
        <div><span className="status-pulse" /> <strong>{artists.length} artists</strong> are open to a conversation</div>
        <div className="mesh-status">{notice}<span className="status-line" /></div>
        <div className="network-note">Peer-connected · human-led</div>
      </section>

      <section className="directory-section" id="artists">
        <div className="section-heading">
          <div><div className="section-kicker">THE LIVE DIRECTORY</div><h2>Artists at work</h2></div>
          <p>Every card is a person, not a content farm.<br />Connect directly when the green dot is on.</p>
        </div>
        <div className="directory-tools">
          <div className="filters" role="tablist" aria-label="Artist specialties">
            {filters.map((filter) => <button key={filter} className={activeFilter === filter ? "filter active" : "filter"} onClick={() => setActiveFilter(filter)}>{filter}</button>)}
          </div>
          <label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, style, or place" /></label>
        </div>
        <div className="artist-grid">
          {filteredArtists.map((artist) => (
            <article className="artist-card" key={artist.id}>
              <div className={`artist-visual ${artist.color}`}>
                <span className="artist-initials">{artist.initials}</span>
                <span className="availability"><span className="live-dot" /> {artist.status === "available" ? "AVAILABLE NOW" : "LIMITED OPENINGS"}</span>
                <span className="visual-mark">✦</span>
              </div>
              <div className="artist-info">
                <div className="artist-name-line"><h3>{artist.name}</h3>{artist.verified && <span className="verified">✓</span>}</div>
                <p className="artist-role">{artist.role}</p>
                <p className="artist-location">{artist.location}</p>
                <p className="artist-featured">“{artist.featured}”</p>
                <div className="tag-row">{artist.specialties.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
                <div className="artist-footer"><div><strong>{artist.price}</strong><span>{artist.response}</span></div><button className="connect-button" onClick={() => openCommission(artist)}>Connect <span>↗</span></button></div>
              </div>
            </article>
          ))}
        </div>
        {filteredArtists.length === 0 && <div className="empty-state">No live artists match that search yet.</div>}
      </section>

      <section className="how-section" id="how-it-works">
        <div><div className="section-kicker">A SMALLER INTERNET</div><h2>Start with a person.<br /><em>Make something real.</em></h2></div>
        <div className="steps"><div><b>01</b><h3>Find someone open</h3><p>Browse artists who have chosen to be visible right now.</p></div><div><b>02</b><h3>Connect directly</h3><p>Open a private room and talk through the work together.</p></div><div><b>03</b><h3>Commission the idea</h3><p>Agree on the scope, price, and next step without the noise.</p></div></div>
      </section>

      <footer className="footer"><div className="footer-mark">✳</div><div><strong>Human-Made Live</strong><span>Real people. Real work. Live.</span></div><span className="footer-peer">Peer-first creative network · {peerId ? "connected" : "connecting"}</span></footer>

      {selectedArtist && <div className="modal-backdrop" role="presentation" onClick={() => setSelectedArtist(null)}><section className="commission-modal" role="dialog" aria-modal="true" aria-labelledby="commission-title" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setSelectedArtist(null)} aria-label="Close">×</button><div className="modal-kicker"><span className="live-dot" /> PRIVATE COMMISSION ROOM</div><h2 id="commission-title">Connect with {selectedArtist.name}</h2><p>{selectedArtist.response}. Tell them what you are making and they can decide whether it is a fit.</p><label>Your project brief<textarea placeholder="What would you like this artist to make?" /></label><div className="modal-actions"><button className="secondary-button" onClick={() => setSelectedArtist(null)}>Keep browsing</button><button className="primary-button" onClick={() => { setSelectedArtist(null); setNotice(`Request sent to ${selectedArtist.name}`); }}>Send request <span>↗</span></button></div><small>PeerJS room handshake will begin after the artist accepts.</small></section></div>}
    </main>
  );
}
