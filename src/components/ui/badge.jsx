import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]',
        secondary: 'border-[var(--border)] bg-[var(--secondary)] text-[var(--secondary-foreground)]',
        destructive: 'border-transparent bg-[var(--destructive)]/15 text-[var(--destructive)]',
        success: 'border-transparent bg-[var(--success)]/15 text-[var(--success)]',
        warning: 'border-transparent bg-[var(--warning)]/15 text-[var(--warning)]',
        info: 'border-transparent bg-[var(--info)]/15 text-[var(--info)]',
        outline: 'border-[var(--border)] text-[var(--muted-foreground)]',
        status: 'status-soft border',
      },
    },
    defaultVariants: { variant: 'secondary' },
  }
);

export function Badge({ className, variant, status, ...props }) {
  const statusClass = status ? `status-${status}` : '';
  return <span className={cn(badgeVariants({ variant: status ? 'status' : variant }), statusClass, className)} {...props} />;
}

export { badgeVariants };
