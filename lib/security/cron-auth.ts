import { bearerToken, secretsEqual } from "@/lib/security/secrets";

export function cronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const alt = request.headers.get("x-cron-secret") ?? "";
  return secretsEqual(bearerToken(header), secret) || secretsEqual(alt, secret);
}
