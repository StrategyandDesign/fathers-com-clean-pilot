import { redirect } from "next/navigation";

import { AuthContinue } from "@/components/auth/auth-continue";
import { authGoReplaceScript, isAuthContinuePath } from "@/lib/auth/continue";
import { safeInternalPath } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function AuthGoPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeInternalPath((await searchParams).next);
  if (!next || isAuthContinuePath(next.split("?")[0] ?? next)) {
    redirect("/login");
  }

  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${encodeURI(next)}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: authGoReplaceScript(next),
        }}
      />
      <AuthContinue next={next} />
    </>
  );
}
