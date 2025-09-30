// dwellwell-client/src/components/ui/checkbox.tsx
import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn(
        'h-5 w-5 rounded border-token bg-card text-brand-primary focus:ring-brand-primary',
        className
      )}
      {...props}
    />
  );
}
