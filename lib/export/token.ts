import { createHash, randomBytes } from "node:crypto";

export function hashExportToken(token: string) {
  return createHash("sha256").update(token.trim(), "utf8").digest("hex");
}

export function mintExportFeedToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashExportToken(token) };
}
