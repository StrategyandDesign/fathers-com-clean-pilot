import {
  ORGANIZATION_TYPES,
  ORGANIZATION_TYPE_LABELS,
  organizationTypeHint,
  type OrganizationType,
} from "@/lib/organization-type";
import { fieldClassName } from "@/lib/ui";

export function OrganizationTypeField({
  defaultValue,
  required = true,
  error,
}: {
  defaultValue?: OrganizationType | null;
  required?: boolean;
  error?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-muted-foreground">Organization type</span>
      <select
        className={fieldClassName}
        name="organization_type"
        defaultValue={defaultValue ?? ""}
        required={required}
        aria-invalid={error || undefined}
      >
        <option value="" disabled>
          Choose a type
        </option>
        {ORGANIZATION_TYPES.map((type) => (
          <option key={type} value={type}>
            {ORGANIZATION_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
      <span className="block text-xs text-muted-foreground">
        {organizationTypeHint(defaultValue)}
      </span>
    </label>
  );
}
