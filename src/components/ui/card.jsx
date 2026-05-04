import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

export const Card = forwardRef(({ className, hover = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-elev-1',
      hover && 'transition-all hover:border-[color-mix(in_oklab,var(--border)_40%,var(--primary))] hover:shadow-elev-2 hover:-translate-y-px',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

export const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1.5 p-5 sm:p-6', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-base sm:text-lg font-semibold leading-tight tracking-tight', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-[var(--muted-foreground)]', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';
