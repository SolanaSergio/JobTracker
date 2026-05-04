import { forwardRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export const SheetOverlay = forwardRef(({ className, ...props }, ref) => (
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
SheetOverlay.displayName = 'SheetOverlay';

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-[var(--card)] shadow-elev-3 transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out flex flex-col overflow-y-auto',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom: 'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom rounded-t-2xl',
        left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        right: 'inset-y-0 right-0 h-full w-3/4 max-w-md border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
      },
    },
    defaultVariants: { side: 'right' },
  }
);

export const SheetContent = forwardRef(({ side = 'right', className, children, hideClose = false, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
      {children}
      {!hideClose && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1.5 opacity-70 transition-opacity hover:opacity-100 hover:bg-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = 'SheetContent';

export const SheetHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col gap-1.5 p-5 sm:p-6 pb-2 text-left', className)} {...props} />
);

export const SheetFooter = ({ className, ...props }) => (
  <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end p-5 sm:p-6 pt-2 mt-auto border-t border-[var(--border)]', className)} {...props} />
);

export const SheetTitle = forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold tracking-tight', className)} {...props} />
));
SheetTitle.displayName = 'SheetTitle';

export const SheetDescription = forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-[var(--muted-foreground)]', className)} {...props} />
));
SheetDescription.displayName = 'SheetDescription';
