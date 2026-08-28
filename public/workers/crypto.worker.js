/* Small Web Crypto worker for future signed/encrypted private room records. */
self.onmessage = async (event) => {
  const message = event.data || {};
  if (message.type === "digest" && message.value !== undefined) {
    const bytes = new TextEncoder().encode(JSON.stringify(message.value));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    self.postMessage({ type: "digest", digest: Array.from(new Uint8Array(digest)) });
  }
};
