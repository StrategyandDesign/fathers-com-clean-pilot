import { ChevronDown } from "lucide-react";

import { recordExportSendIntent, saveExportDestination } from "@/lib/export/actions";
import {
  EXPORT_DESTINATION_KIND_LABEL,
  EXPORT_DESTINATION_KINDS,
} from "@/lib/export/kinds";
import { describePushOutcome } from "@/lib/export/push";
import type { ExportPushEvent, OrgExportDestination } from "@/lib/export/data";
import { Button } from "@/components/ui/button";
import { fieldClassName, interactiveControlClassName } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function DestinationCard({
  groups,
  destinations,
  events,
  returnTo,
  title,
  lead,
}: {
  groups: Array<{ id: string; name: string }>;
  destinations: OrgExportDestination[];
  events: ExportPushEvent[];
  returnTo: string;
  title: string;
  lead: string;
}) {
  const defaultGroupId = groups.length === 1 ? groups[0]?.id ?? "" : "";

  return (
    <details className="group overflow-hidden rounded-xl border border-border bg-card open:[&_svg]:rotate-180">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-6",
          interactiveControlClassName,
          "[&::-webkit-details-marker]:hidden"
        )}
      >
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{lead}</p>
        </div>
        <ChevronDown
          aria-hidden
          className="size-5 shrink-0 text-muted-foreground transition-transform duration-150"
        />
      </summary>
      <div className="space-y-5 border-t border-border px-4 py-5 sm:px-6 sm:pb-6">
        {destinations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No destination metadata yet. Save a label and kind. This desk does not send files to an
            outside host.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {destinations.map((row) => (
              <li key={row.id} className="space-y-1 px-4 py-3">
                <p className="font-medium">{row.label}</p>
                <p className="text-sm text-muted-foreground">
                  {EXPORT_DESTINATION_KIND_LABEL[row.destinationKind]}
                  {row.hasFeedToken ? " · local token on file" : ""}
                </p>
                {row.endpointHint ? (
                  <p className="break-all text-xs text-muted-foreground">Hint: {row.endpointHint}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <form action={saveExportDestination} className="space-y-3">
          <input type="hidden" name="return_to" value={returnTo} />
          {groups.length > 1 ? (
            <label className="block space-y-2">
              <span className="text-sm text-muted-foreground">Organization</span>
              <select className={fieldClassName} name="group_id" required defaultValue="">
                <option value="">Choose an organization</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" name="group_id" value={defaultGroupId} />
          )}
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">Label</span>
            <input className={fieldClassName} name="label" maxLength={80} required />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">Kind</span>
            <select className={fieldClassName} name="destination_kind" required defaultValue="other">
              {EXPORT_DESTINATION_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {EXPORT_DESTINATION_KIND_LABEL[kind]}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">Endpoint hint (not used to send)</span>
            <input className={fieldClassName} name="endpoint_hint" maxLength={300} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">Notes</span>
            <input className={fieldClassName} name="notes" maxLength={280} />
          </label>
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            Save destination metadata
          </Button>
        </form>

        <form action={recordExportSendIntent} className="space-y-3 rounded-lg border border-border p-4">
          <input type="hidden" name="return_to" value={returnTo} />
          <input type="hidden" name="packet_kind" value="qi_packet" />
          {groups.length > 1 ? (
            <label className="block space-y-2">
              <span className="text-sm text-muted-foreground">Organization</span>
              <select className={fieldClassName} name="group_id" required defaultValue="">
                <option value="">Choose an organization</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" name="group_id" value={defaultGroupId} />
          )}
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">Destination</span>
            <select className={fieldClassName} name="destination_id" defaultValue="">
              <option value="">None configured</option>
              {destinations.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="confirm_local_only"
              className="mt-1 size-4 accent-primary"
              required
            />
            <span>I understand this desk does not send files to an outside host.</span>
          </label>
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            Record send intent
          </Button>
        </form>

        {events.length > 0 ? (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {events.map((event) => (
              <li key={event.id}>
                {describePushOutcome(event.eventKind)} ({event.createdAt.slice(0, 10)})
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </details>
  );
}
