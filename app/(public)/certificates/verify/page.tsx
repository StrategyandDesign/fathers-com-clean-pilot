import { redirect } from "next/navigation";

import { certificateVerifyPath, parseVerifySerial } from "@/lib/certificates/copy";

export default async function CertificatesVerifyRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ serial?: string }>;
}) {
  const params = await searchParams;
  const serial = parseVerifySerial(params.serial);
  if (serial) {
    redirect(certificateVerifyPath(serial));
  }
  redirect("/verify");
}
