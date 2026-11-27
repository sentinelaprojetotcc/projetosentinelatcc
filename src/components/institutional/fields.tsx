import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  type?: "text" | "email";
  autoComplete?: string;
  required?: boolean;
  maxLength?: number;
  inputMode?: "numeric" | "email" | "text";
  disabled?: boolean;
};

export function InstitutionalField({ id, label, value, onChange, error, placeholder, type = "text",
  autoComplete, required = true, maxLength, inputMode, disabled }: TextFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}{required && <span className="ml-1 text-primary" aria-hidden="true">*</span>}</Label>
      <Input id={id} name={id} value={value} onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder} type={type} autoComplete={autoComplete} maxLength={maxLength}
        inputMode={inputMode} required={required} disabled={disabled}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
        className={cn("h-11", error && "border-destructive focus-visible:ring-destructive")} />
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function InstitutionalPassword({ id, label, value, onChange, error, autoComplete = "new-password", disabled }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  error?: string; autoComplete?: string; disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}<span className="ml-1 text-primary" aria-hidden="true">*</span></Label>
      <div className="relative">
        <Input id={id} name={id} type={visible ? "text" : "password"} value={value}
          onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete}
          required disabled={disabled} aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn("h-11 pr-12", error && "border-destructive focus-visible:ring-destructive")} />
        <button type="button" onClick={() => setVisible((value) => !value)} disabled={disabled}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
