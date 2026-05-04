import { Loader2 } from 'lucide-react';
import { Toaster as SonnerToaster, toast } from 'sonner';
import { useTheme } from '../../lib/theme';
import { cn } from '../../lib/cn';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-[var(--secondary)] relative overflow-hidden', className)}
      {...props}
    >
      <span className="absolute inset-0 shimmer" />
    </div>
  );
}

export function Spinner({ className, size = 18 }) {
  return <Loader2 className={cn('animate-spin text-[var(--muted-foreground)]', className)} size={size} />;
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-4 rounded-2xl border border-dashed border-[var(--border)]', className)}>
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--muted-foreground)]">
          <Icon size={24} />
        </div>
      )}
      {title && <h3 className="text-base font-semibold text-[var(--foreground)] mb-1.5">{title}</h3>}
      {description && <p className="text-sm text-[var(--muted-foreground)] max-w-md mb-5">{description}</p>}
      {action}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center p-12">
      <Spinner size={28} />
    </div>
  );
}

export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <SonnerToaster
      theme={resolvedTheme}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'group-[.toaster]:bg-[var(--card)] group-[.toaster]:text-[var(--card-foreground)] group-[.toaster]:border-[var(--border)] group-[.toaster]:shadow-xl',
          description: 'group-[.toast]:text-[var(--muted-foreground)]',
          actionButton: 'group-[.toast]:bg-[var(--primary)] group-[.toast]:text-[var(--primary-foreground)]',
          cancelButton: 'group-[.toast]:bg-[var(--secondary)] group-[.toast]:text-[var(--secondary-foreground)]',
        },
      }}
    />
  );
}

export { toast };
