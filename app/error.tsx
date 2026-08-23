"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-md px-6 py-[20vh] text-center">
      <p className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">Fathers.com</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Something went wrong.</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Refresh the page. If it happens again, sign out and sign back in.
      </p>
      <button type="button" onClick={() => reset()} className="mt-6 text-sm underline underline-offset-4">
        Try again
      </button>
    </main>
  );
}
