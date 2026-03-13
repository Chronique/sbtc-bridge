import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export function Badge({ variant = 'neutral', className, children }: {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      {
        'bg-emerald-500/15 text-emerald-400': variant === 'success',
        'bg-amber-500/15 text-amber-400': variant === 'warning',
        'bg-red-500/15 text-red-400': variant === 'error',
        'bg-blue-500/15 text-blue-400': variant === 'info',
        'bg-white/8 text-zinc-400': variant === 'neutral',
      },
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-emerald-400': variant === 'success',
        'bg-amber-400 animate-pulse': variant === 'warning',
        'bg-red-400': variant === 'error',
        'bg-blue-400': variant === 'info',
        'bg-zinc-500': variant === 'neutral',
      })} />
      {children}
    </span>
  );
}
