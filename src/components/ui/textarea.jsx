import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

export const Textarea = forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[80px] w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm transition-all resize-y',
      'placeholder:text-[var(--muted-foreground)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--background)] focus-visible:border-transparent',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
