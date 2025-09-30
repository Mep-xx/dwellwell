// dwellwell-client/src/components/ui/switch.tsx
import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  checked: boolean;
  onCheckedChange?: (value: boolean) => void;
}

export function Switch({ checked, onCheckedChange, className, ...props }: SwitchProps) {
  const id = props.id || props.name || undefined;

  return (
    <label
      className={cn("relative inline-flex cursor-pointer items-center", className)}
      htmlFor={id}
    >
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      <div className="h-6 w-11 rounded-full bg-muted transition-all peer-checked:bg-brand-primary peer-focus:ring-2 peer-focus:ring-brand-primary" />
      <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-card shadow transition-transform peer-checked:translate-x-5" />
    </label>
  );
}
