import { Button } from "@/components/ui/button";
import { fieldClassName } from "@/lib/ui";

export function CertificateVerifyForm({
  serial = "",
  label,
  placeholder,
  submit,
}: {
  serial?: string;
  label: string;
  placeholder: string;
  submit: string;
}) {
  return (
    <form action="/verify" method="get" className="space-y-3">
      <label className="block space-y-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <input
          className={fieldClassName}
          type="text"
          name="serial"
          defaultValue={serial}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          maxLength={32}
        />
      </label>
      <Button type="submit">{submit}</Button>
    </form>
  );
}
