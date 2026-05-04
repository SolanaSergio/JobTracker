import { forwardRef } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent } from './dialog';
import { cn } from '../../lib/cn';

export const Command = forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn('flex h-full w-full flex-col overflow-hidden rounded-xl bg-[var(--popover)] text-[var(--popover-foreground)]', className)}
    {...props}
  />
));
Command.displayName = 'Command';

export const CommandDialog = ({ children, ...props }) => (
  <Dialog {...props}>
    <DialogContent
      hideClose
      className="overflow-hidden p-0 max-w-2xl gap-0 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[var(--muted-foreground)] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
    >
      <DialogPrimitive.Title className="sr-only">Command Menu</DialogPrimitive.Title>
      <DialogPrimitive.Description className="sr-only">Search, navigate, and quickly run actions.</DialogPrimitive.Description>
      <Command>{children}</Command>
    </DialogContent>
  </Dialog>
);

export const CommandInput = forwardRef(({ className, ...props }, ref) => (
  <div className="flex items-center border-b border-[var(--border)] px-3 gap-2" cmdk-input-wrapper="">
    <Search className="h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-[var(--muted-foreground)] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = 'CommandInput';

export const CommandList = forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.List ref={ref} className={cn('max-h-[400px] overflow-y-auto overflow-x-hidden p-2', className)} {...props} />
));
CommandList.displayName = 'CommandList';

export const CommandEmpty = forwardRef((props, ref) => (
  <CommandPrimitive.Empty ref={ref} className="py-8 text-center text-sm text-[var(--muted-foreground)]" {...props} />
));
CommandEmpty.displayName = 'CommandEmpty';

export const CommandGroup = forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Group ref={ref} className={cn('overflow-hidden p-1 text-[var(--foreground)]', className)} {...props} />
));
CommandGroup.displayName = 'CommandGroup';

export const CommandSeparator = forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator ref={ref} className={cn('-mx-1 h-px bg-[var(--border)]', className)} {...props} />
));
CommandSeparator.displayName = 'CommandSeparator';

export const CommandItem = forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none',
      'data-[selected=true]:bg-[var(--accent)] data-[selected=true]:text-[var(--accent-foreground)]',
      'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
      '[&_svg]:size-4 [&_svg]:shrink-0',
      className
    )}
    {...props}
  />
));
CommandItem.displayName = 'CommandItem';

export const CommandShortcut = ({ className, ...props }) => (
  <span className={cn('ml-auto text-xs tracking-widest text-[var(--muted-foreground)]', className)} {...props} />
);
