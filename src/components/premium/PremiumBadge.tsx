import { Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  plan?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export function PremiumBadge({ plan, size = 'sm', className, showLabel = false }: PremiumBadgeProps) {
  if (!plan) return null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
            'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 text-yellow-400',
            className
          )}
        >
          <Crown className={cn(sizeClasses[size], 'text-yellow-400')} />
          {showLabel && <span>Premium</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>Premium Member</p>
      </TooltipContent>
    </Tooltip>
  );
}
