import { NextResponse } from "next/server";

import { applyScimProvision } from "@/lib/identity/scim-apply";
import { identityScimToken, parseScimUserPayload, scimAuthorized } from "@/lib/identity/scim";
import { allowRequestRateLimit } from "@/lib/security/rate-limit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!identityScimToken()) {
    return NextResponse.json({ detail: "SCIM is not configured." }, { status: 404 });
  }
  if (!allowRequestRateLimit("identity.scim", request)) {
    return NextResponse.json({ detail: "Too many attempts." }, { status: 429 });
  }
  if (!scimAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ detail: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Expected JSON." }, { status: 400 });
  }

  const groupId = request.headers.get("x-group-id");
  const parsed = parseScimUserPayload(
    {
      ...(typeof body === "object" && body ? body : {}),
      id,
      action:
        (body as { active?: boolean })?.active === false ? "deprovision" : "role_change",
    },
    groupId
  );
  if (!parsed) {
    return NextResponse.json({ detail: "Need email, group, and an action." }, { status: 400 });
  }

  const result = await applyScimProvision(parsed);
  if (!result.ok) {
    return NextResponse.json({ detail: result.error }, { status: result.status });
  }
  if (result.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json({ id: result.id ?? id });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!identityScimToken()) {
    return NextResponse.json({ detail: "SCIM is not configured." }, { status: 404 });
  }
  if (!allowRequestRateLimit("identity.scim", request)) {
    return NextResponse.json({ detail: "Too many attempts." }, { status: 429 });
  }
  if (!scimAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ detail: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const parsed = parseScimUserPayload(
    { ...body, id, action: "deprovision", active: false },
    request.headers.get("x-group-id")
  );
  if (!parsed) {
    return NextResponse.json({ detail: "Need email and group." }, { status: 400 });
  }
  const result = await applyScimProvision(parsed);
  if (!result.ok) {
    return NextResponse.json({ detail: result.error }, { status: result.status });
  }
  return new NextResponse(null, { status: 204 });
}
