import { BrandLogo } from "@/components/brand/logo";
import { LegalLinks } from "@/components/legal/legal-links";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-4 py-5 sm:px-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <header>
        <BrandLogo href="/" />
      </header>
      <div className="mt-8 flex-1 sm:mt-10">{children}</div>
      <LegalLinks className="mt-10" />
    </div>
  );
}
