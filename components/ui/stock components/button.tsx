import { TextClassContext } from '@/components/ui/stock components/text';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Platform, Pressable } from 'react-native';

const buttonVariants = cva(
  cn(
    'group relative shrink-0 flex-row items-center justify-center gap-2 overflow-hidden rounded-md shadow-none', // 👈 CHANGED: added "relative overflow-hidden" so the sweep is clipped to button bounds
    Platform.select({
      web: "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all duration-200 ease-out before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700 before:ease-out hover:-translate-y-0.5 hover:shadow-md hover:before:translate-x-full focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 active:translate-y-0 active:shadow-sm disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0", // 👈 CHANGED: added the ::before pseudo-element that animates from -100% to 100% on hover
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-primary shadow-sm shadow-black/5 active:bg-primary/90',
          Platform.select({ web: 'hover:bg-primary/90 hover:shadow-primary/25' })
        ),
        destructive: cn(
          'bg-destructive shadow-sm shadow-black/5 active:bg-destructive/90 dark:bg-destructive/60',
          Platform.select({
            web: 'hover:bg-destructive/90 hover:shadow-destructive/25 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
          })
        ),
        outline: cn(
          'border border-border bg-background shadow-sm shadow-black/5 active:bg-accent dark:border-input dark:bg-input/30 dark:active:bg-input/50',
          Platform.select({
            web: 'before:via-foreground/10 hover:border-primary/50 hover:bg-accent dark:hover:bg-input/50', // 👈 CHANGED: dimmer sweep for outline since it has a light background
          })
        ),
        secondary: cn(
          'bg-secondary shadow-sm shadow-black/5 active:bg-secondary/80',
          Platform.select({ web: 'before:via-foreground/10 hover:bg-secondary/80' }) // 👈 CHANGED: dimmer sweep for light secondary background
        ),
        ghost: cn(
          'active:bg-accent dark:active:bg-accent/50',
          Platform.select({
            web: 'before:hidden hover:bg-accent hover:shadow-none dark:hover:bg-accent/50',
          }) // 👈 CHANGED: hide sweep on ghost (no background to sweep across)
        ),
        link: Platform.select({ web: 'before:hidden hover:translate-y-0 hover:shadow-none' }) ?? '', // 👈 CHANGED: hide sweep on link variant
      },
      size: {
        default: cn('h-10 px-4 py-2 sm:h-9', Platform.select({ web: 'has-[>svg]:px-3' })),
        sm: cn('h-9 gap-1.5 rounded-md px-3 sm:h-8', Platform.select({ web: 'has-[>svg]:px-2.5' })),
        lg: cn('h-11 rounded-md px-6 sm:h-10', Platform.select({ web: 'has-[>svg]:px-4' })),
        icon: 'h-10 w-10 sm:h-9 sm:w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  cn(
    'text-sm font-medium text-foreground',
    Platform.select({ web: 'pointer-events-none transition-colors' })
  ),
  {
    variants: {
      variant: {
        default: 'text-primary-foreground',
        destructive: 'text-white',
        outline: cn(
          'group-active:text-accent-foreground',
          Platform.select({ web: 'group-hover:text-accent-foreground' })
        ),
        secondary: 'text-secondary-foreground',
        ghost: 'group-active:text-accent-foreground',
        link: cn(
          'text-primary group-active:underline',
          Platform.select({ web: 'underline-offset-4 hover:underline group-hover:underline' })
        ),
      },
      size: {
        default: '',
        sm: '',
        lg: '',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && 'opacity-50', buttonVariants({ variant, size }), className)}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
