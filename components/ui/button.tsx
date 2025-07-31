import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active shadow-sm hover:shadow-md active:shadow-sm transform hover:-translate-y-0.5 active:translate-y-0',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive-hover shadow-sm hover:shadow-md active:shadow-sm transform hover:-translate-y-0.5 active:translate-y-0',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/20 shadow-sm hover:shadow-md',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-sm hover:shadow-md',
        ghost: 'hover:bg-accent hover:text-accent-foreground hover:shadow-sm',
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary-hover',
        success: 'bg-success text-success-foreground hover:bg-success-hover shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0',
        warning: 'bg-warning text-warning-foreground hover:bg-warning-hover shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0',
        info: 'bg-info text-info-foreground hover:bg-info-hover shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0',
      },
      size: {
        xs: 'h-8 px-2 text-xs rounded-sm min-w-[2rem]',
        sm: 'h-9 px-3 text-sm rounded-md min-w-[2.25rem]',
        default: 'h-10 px-4 py-2 min-w-[2.5rem] min-h-[2.75rem] touch:min-h-[3rem]', // 44px minimum for touch
        lg: 'h-12 px-6 text-base rounded-lg min-w-[3rem] min-h-[3rem]', // 48px for better touch
        xl: 'h-14 px-8 text-lg rounded-lg min-w-[3.5rem]',
        icon: 'h-10 w-10 min-h-[2.75rem] min-w-[2.75rem] touch:min-h-[3rem] touch:min-w-[3rem]',
        'icon-sm': 'h-8 w-8 min-h-[2rem] min-w-[2rem]',
        'icon-lg': 'h-12 w-12 min-h-[3rem] min-w-[3rem]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
