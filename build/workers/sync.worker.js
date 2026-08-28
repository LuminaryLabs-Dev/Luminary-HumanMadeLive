/* Offline queue worker for PeerDB writes. The SharedWorker remains the live transport. */
const pending = [];

self.onmessage = (event) => {
  const message = event.data || {};
  if (message.type === "queue" && message.record) pending.push(message.record);
  if (message.type === "drain") {
    while (pending.length) self.postMessage({ type: "record", record: pending.shift() });
  }
};
