import { deskStampLabel, loadSharedMark } from "@/lib/dev/shared-mark";
import { VersionStampPill } from "@/components/dev/version-stamp-pill";

/** Bottom-right Shared 1-1.N from shared-mark.json. Same label as SHARED.md. */
export function VersionStamp() {
  if (process.env.NODE_ENV === "production") return null;
  const shared = loadSharedMark();
  if (!shared) return null;
  const label = deskStampLabel(shared.patch);

  return <VersionStampPill label={label} title={shared.title} href={shared.url} />;
}
