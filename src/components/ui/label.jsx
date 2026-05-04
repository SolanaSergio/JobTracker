import { forwardRef } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../../lib/cn';

export const Label = forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  />
));
Label.displayName = 'Label';
