//dwellwell-client/src/components/ui/label.tsx
import * as React from "react";

export function Label({
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className="text-sm font-medium text-body"
      {...props}
    >
      {children}
    </label>
  );
}
