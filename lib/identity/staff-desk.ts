/** Pilot may not have public.staff_has_active_desk. Missing RPC is allow. */
export function isMissingStaffDeskFunction(error: {
  code?: string | null;
  message?: string | null;
} | null) {
  if (!error) return false;
  const code = String(error.code ?? "");
  const text = String(error.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    code === "42883" ||
    code === "PGRST202" ||
    code === "PGRST204" ||
    /staff_has_active_desk/i.test(text) ||
    /could not find the function/i.test(text) ||
    /function .* does not exist/i.test(text) ||
    /schema cache/i.test(text)
  );
}
