import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { decodePngRgba, FATHERS_FOREST, tintPngRgba } from "../lib/brand/lockup-png";
import {
  CERTIFICATE_MISUSE_DISCLAIMER,
  CERTIFICATE_PROOF_LABEL,
  isCertificateSerial,
  mintCertificateSerial,
  parseVerifySerial,
} from "../lib/certificates/copy";
import { renderCertificatePdf } from "../lib/certificates/pdf";
import {
  certificateDownloadPath,
  certificatePreviewPath,
  certificateVerifyPath,
  resolveCertificateIssuerName,
} from "../lib/certificates/types";
import { certificatesRequireClaim } from "../lib/flags";

function readRepo(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
}

describe("certificate lockup", () => {
  it("tints the official Fathers.com lockup forest green", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../public/brand/fathers-com-logo-white.png", import.meta.url))
    );
    const tinted = tintPngRgba(source, FATHERS_FOREST);
    const { rgba } = decodePngRgba(tinted);
    let forest = 0;
    for (let i = 0; i < rgba.length; i += 4) {
      if (
        (rgba[i + 3] ?? 0) > 200 &&
        rgba[i] === FATHERS_FOREST.r &&
        rgba[i + 1] === FATHERS_FOREST.g &&
        rgba[i + 2] === FATHERS_FOREST.b
      ) {
        forest += 1;
      }
    }
    assert.ok(forest > 1000);
  });

  it("embeds the lockup instead of the old shield drawing", async () => {
    const pdf = readRepo("lib/certificates/pdf.ts");
    assert.match(pdf, /BRAND_LOCKUP_FILE/);
    assert.match(pdf, /drawFathersLockup/);
    assert.doesNotMatch(pdf, /M 20 41\.2 L 36\.2 31\.8/);
    assert.match(readRepo("lib/brand/lockup-png.ts"), /fathers-com-logo-white\.png/);

    const bytes = await renderCertificatePdf({
      fatherName: "NWA Father",
      trainingName: "Fathering Fundamentals – Seven Secrets of Effective Fathers",
      completedOn: "August 19, 2026",
      serialNumber: "FC-2026-06321614",
      managerName: "Brenda",
    });
    assert.equal(Buffer.from(bytes.subarray(0, 4)).toString(), "%PDF");
    assert.ok(bytes.length > 2000);
  });
});

describe("certificate issuer name", () => {
  it("uses the stored leader name instead of a generic designation", () => {
    assert.equal(
      resolveCertificateIssuerName({
        storedName: "Brenda Cole",
        profileName: null,
        leaderName: "Fathers.com Leader",
      }),
      "Brenda Cole"
    );
    assert.equal(
      resolveCertificateIssuerName({
        storedName: null,
        profileName: null,
        leaderName: "James Hale",
      }),
      "James Hale"
    );
    assert.equal(resolveCertificateIssuerName({}), "");

    const data = readRepo("lib/certificates/data.ts");
    const issue = readRepo("lib/manager/mutations.ts");
    const migration = readRepo("supabase/migrations/20260820060000_certificate_issuer_name.sql");
    assert.match(data, /issuer_name/);
    assert.match(data, /resolveCertificateIssuerName/);
    assert.doesNotMatch(data, /Fathers\.com Leader/);
    assert.match(issue, /issuer_name: managerName/);
    assert.match(migration, /issuer_name/);
  });
});

describe("certificate preview", () => {
  it("opens a preview before the download file", () => {
    assert.equal(certificatePreviewPath("c1"), "/father/certificates/c1");
    assert.equal(certificateDownloadPath("c1"), "/api/certificates/c1/download");

    const home = readRepo("components/father/home-earned.tsx");
    assert.match(home, /certificatePreviewPath/);
    assert.match(home, /size="snapshot"/);
    assert.doesNotMatch(home, /certificateDownloadPath/);

    const list = readRepo("components/certificates/issued-list.tsx");
    assert.match(list, /certificatePreviewPath/);
    assert.match(list, /common\.preview/);
    assert.match(list, /CertificateDownloadLink/);

    const page = readRepo("app/(father)/father/certificates/[id]/page.tsx");
    assert.match(page, /CertificateFace/);
    assert.match(page, /CertificateDownloadLink/);
    assert.match(page, /account\.certificatePreviewLead/);

    const face = readRepo("components/certificates/certificate-face.tsx");
    assert.match(face, /tone="forest"/);
    assert.match(face, /BrandMark/);
    assert.match(face, /justify-center/);
    assert.match(face, /h-5/);
    assert.match(face, /h-9 sm:h-10/);
    assert.match(face, /labels\.disclaimer/);
  });
});

describe("certificate misuse disclaimer", () => {
  it("prints counsel-approved misuse lines on the printable document", async () => {
    assert.match(CERTIFICATE_MISUSE_DISCLAIMER, /not a finding of court fitness/i);
    assert.match(CERTIFICATE_MISUSE_DISCLAIMER, /not a finding of reunification safety/i);
    assert.match(CERTIFICATE_MISUSE_DISCLAIMER, /not clinical treatment/i);
    assert.match(CERTIFICATE_MISUSE_DISCLAIMER, /not a substitute for professional evaluation/i);
    assert.doesNotMatch(CERTIFICATE_MISUSE_DISCLAIMER, /—/);

    const pdfSource = readRepo("lib/certificates/pdf.ts");
    const copySource = readRepo("lib/certificates/copy.ts");
    assert.match(pdfSource, /CERTIFICATE_MISUSE_DISCLAIMER/);
    assert.match(copySource, /not a finding of court fitness/);
    assert.match(copySource, /reunification safety/);
    assert.match(copySource, /clinical treatment/);
    assert.match(copySource, /professional evaluation/);
    assert.doesNotMatch(copySource, /evidence-based/i);
    assert.doesNotMatch(pdfSource, /evidence-based/i);

    const bytes = await renderCertificatePdf({
      fatherName: "NWA Father",
      trainingName: "Fathering Fundamentals",
      completedOn: "August 19, 2026",
      serialNumber: "FC-2026-06321614",
      managerName: "Brenda",
    });
    assert.equal(Buffer.from(bytes.subarray(0, 4)).toString(), "%PDF");
    assert.ok(bytes.length > 2000);
  });

  it("keeps the same disclaimer on preview, issue, and public verify", () => {
    const en = readRepo("lib/i18n/messages/en.ts");
    assert.match(en, /not a finding of court fitness/);
    assert.match(en, /not a finding of reunification safety/);
    assert.match(en, /Leader-issued completion proof/);
    assert.doesNotMatch(en, /claim-gated/);

    const face = readRepo("components/certificates/certificate-face.tsx");
    assert.match(face, /manager\.cert\.disclaimer/);

    const fatherPreview = readRepo("app/(father)/father/certificates/[id]/page.tsx");
    assert.match(fatherPreview, /CertificateDisclaimer/);
    assert.match(fatherPreview, /certificateVerifyPath/);

    const leaderPreview = readRepo(
      "app/(manager)/manager/participants/[id]/certificates/[trainingId]/page.tsx"
    );
    assert.match(leaderPreview, /CertificateDisclaimer/);
    assert.match(leaderPreview, /certificateVerifyPath/);
  });
});

describe("public certificate verify", () => {
  it("exposes unauthenticated verify routes for live serials", () => {
    const index = readRepo("app/(public)/verify/page.tsx");
    const serialPage = readRepo("app/(public)/verify/[serial]/page.tsx");
    const alias = readRepo("app/(public)/certificates/verify/page.tsx");
    const lookup = readRepo("lib/certificates/verify.ts");

    assert.match(index, /CertificateVerifyForm/);
    assert.doesNotMatch(index, /requireRole/);
    assert.match(serialPage, /lookupPublicCertificate/);
    assert.match(serialPage, /allowActionRateLimit\("certificates.verify"\)/);
    assert.doesNotMatch(serialPage, /requireRole/);
    assert.match(alias, /redirect\(certificateVerifyPath/);
    assert.match(lookup, /verify_certificate_serial/);
    assert.doesNotMatch(lookup, /assessment/);
    assert.doesNotMatch(lookup, /clinical/);

    assert.equal(certificateVerifyPath("fc-2026-06321614"), "/verify/FC-2026-06321614");
    assert.equal(parseVerifySerial("FC-2026-06321614"), "FC-2026-06321614");
    assert.equal(parseVerifySerial("not-a-serial"), "");
    assert.equal(isCertificateSerial("FC-2026-06321614"), true);
  });
});

describe("certificate claim gate", () => {
  it("keeps certificates_require_claim off and wires claim_id behind the flag", () => {
    assert.equal(certificatesRequireClaim(), false);
    assert.equal(CERTIFICATE_PROOF_LABEL, "Leader-issued completion proof");

    const flags = readRepo("lib/flags.ts");
    const issue = readRepo("lib/manager/mutations.ts");
    const migration = readRepo(
      "supabase/migrations/20260823040000_certificate_verify_and_claims.sql"
    );

    assert.match(flags, /certificates_require_claim/);
    assert.match(flags, /CERTIFICATES_REQUIRE_CLAIM/);
    assert.match(issue, /resolveFatherClaimId/);
    assert.match(issue, /certificatesRequireClaim\(\)/);
    assert.match(issue, /mintCertificateSerial/);
    assert.match(issue, /claim_id: claimId/);
    assert.match(migration, /participant_claims/);
    assert.match(migration, /certificates.claim_id/);
    assert.match(migration, /verify_certificate_serial/);

    const serial = mintCertificateSerial(new Date("2026-08-23T00:00:00Z"));
    assert.match(serial, /^FC-2026-[A-Z0-9]{8}$/);
  });
});

describe("nudge templates stay off court auto-text", () => {
  it("does not add court, reunification, or fitness language to nudges", () => {
    const nudge = readRepo("lib/manager/nudge-panel.ts");
    const copy = readRepo("lib/notifications/copy.ts");
    assert.doesNotMatch(nudge, /court|reunification|fitness/i);
    assert.doesNotMatch(copy, /court|reunification|fitness/i);
  });
});
