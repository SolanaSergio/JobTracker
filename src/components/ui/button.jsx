import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm shadow-[color-mix(in_oklab,var(--primary)_30%,transparent)] hover:bg-[color-mix(in_oklab,var(--primary)_90%,white)]',
        destructive:
          'bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[color-mix(in_oklab,var(--destructive)_90%,white)]',
        outline:
          'border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--accent)]',
        secondary:
          'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[color-mix(in_oklab,var(--secondary)_85%,white)]',
        ghost: 'text-[var(--foreground)] hover:bg-[var(--accent)]',
        link: 'text-[var(--primary)] underline-offset-4 hover:underline',
        success:
          'bg-[var(--success)] text-white hover:bg-[color-mix(in_oklab,var(--success)_90%,white)]',
      },
      size: {
        default: 'h-9 px-4 py-2 [&_svg]:size-4',
        sm: 'h-8 rounded-md px-3 text-xs [&_svg]:size-3.5',
        lg: 'h-11 rounded-lg px-6 text-base [&_svg]:size-5',
        xl: 'h-12 rounded-xl px-8 text-base [&_svg]:size-5',
        icon: 'h-9 w-9 [&_svg]:size-4',
        'icon-sm': 'h-8 w-8 [&_svg]:size-3.5',
        'icon-lg': 'h-11 w-11 [&_svg]:size-5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export const Button = forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = 'Button';

export { buttonVariants };
