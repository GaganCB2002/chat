import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

const variants = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 active:scale-[0.97] shadow-sm',
  secondary: 'bg-surface-secondary text-text hover:bg-surface-tertiary border border-border ',
  ghost: 'text-text-secondary hover:text-text hover:bg-black/5 dark:hover:bg-white/5',
  danger: 'text-accent-rose hover:bg-red-50 dark:hover:bg-red-900/20',
};

const sizes = {
  sm: 'text-xs px-2.5 py-1 rounded-md',
  md: 'text-sm px-4 py-2 rounded-lg',
  icon: 'p-2 rounded-lg',
  'icon-xs': 'p-1.5 rounded-md',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'ghost', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-medium select-none disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-all duration-150',
        variants[variant], sizes[size], className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
export { Button };
