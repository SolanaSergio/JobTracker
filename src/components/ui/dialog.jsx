import { forwardRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = 'DialogOverlay';

export const DialogContent = forwardRef(({ className, children, hideClose = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 grid w-full gap-4 border border-[var(--border)] bg-[var(--card)] shadow-elev-3',
        'left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 max-h-[92vh] overflow-y-auto',
        'rounded-xl sm:rounded-2xl',
        'p-5 sm:p-6 max-w-lg sm:max-w-2xl',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        className
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-[var(--muted-foreground)] opacity-70 transition-opacity hover:opacity-100 hover:bg-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = 'DialogContent';

export const DialogHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col gap-1.5 text-left pr-6', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

export const DialogFooter = ({ className, ...props }) => (
  <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

export const DialogTitle = forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold leading-tight tracking-tight', className)} {...props} />
));
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-[var(--muted-foreground)]', className)} {...props} />
));
DialogDescription.displayName = 'DialogDescription';
