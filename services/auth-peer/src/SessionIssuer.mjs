import { createHmac, randomUUID } from "node:crypto";

export function issueSession(claims) {
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is not configured");
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "HML_SESSION" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...claims, sessionId: randomUUID(), issuedAt: Date.now() })).toString("base64url");
  const signature = createHmac("sha256", process.env.SESSION_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}
