/* Presence worker: sends heartbeats for a temporary studio and expires locally. */
let timer = null;
let currentRoom = null;

self.onmessage = (event) => {
  const message = event.data || {};
  if (message.type === "start") {
    currentRoom = message.room;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (currentRoom) self.postMessage({ type: "heartbeat", room: { ...currentRoom, updatedAt: Date.now() } });
    }, message.intervalMs || 15000);
  }
  if (message.type === "stop") {
    currentRoom = null;
    if (timer) clearInterval(timer);
    timer = null;
  }
};
