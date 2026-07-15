import { cn } from '../utils/cn';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'w-7 h-7', md: 'w-8 h-8', lg: 'w-10 h-10' };
const iconSizes = { sm: 16, md: 18, lg: 22 };

export function Logo({ className, size = 'md' }: LogoProps) {
  const s = iconSizes[size];
  return (
    <div className={cn('relative flex items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-rose-500 shadow-sm', sizes[size], className)}>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" stroke="white" strokeWidth="1.5" fill="none" />
        <path d="M12 12L6 9v6l6 3 6-3V9l-6 3z" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="1.5" />
        <circle cx="12" cy="9" r="1.5" fill="white" />
      </svg>
      {size === 'lg' && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-teal-400 border-2 border-surface" />
      )}
    </div>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="9" r="1.5" fill="currentColor" />
    </svg>
  );
}
