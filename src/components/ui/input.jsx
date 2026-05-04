import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

export const Input = forwardRef(({ className, type = 'text', ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      'flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm transition-all',
      'placeholder:text-[var(--muted-foreground)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--background)] focus-visible:border-transparent',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--foreground)] file:cursor-pointer file:mr-2',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';
