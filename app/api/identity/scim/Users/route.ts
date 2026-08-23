import { NextResponse } from "next/server";

import { applyScimProvision } from "@/lib/identity/scim-apply";
import { identityScimToken, parseScimUserPayload, scimAuthorized } from "@/lib/identity/scim";
import { allowRequestRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  if (!identityScimToken()) {
    return NextResponse.json({ detail: "SCIM is not configured." }, { status: 404 });
  }
  if (!allowRequestRateLimit("identity.scim", request)) {
    return NextResponse.json({ detail: "Too many attempts." }, { status: 429 });
  }
  if (!scimAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ detail: "Not authorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Expected JSON." }, { status: 400 });
  }

  const groupId = request.headers.get("x-group-id");
  const parsed = parseScimUserPayload(body, groupId);
  if (!parsed) {
    return NextResponse.json({ detail: "Need email, group, and an action." }, { status: 400 });
  }

  const result = await applyScimProvision(parsed);
  if (!result.ok) {
    return NextResponse.json({ detail: result.error }, { status: result.status });
  }
  if (result.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json({ id: result.id, schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"] }, { status: 201 });
}
