import { Flame, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePremium } from '@/hooks/usePremium';

interface VoteStreakDisplayProps {
  streak?: { current_streak: number; longest_streak: number };
  xp?: { total_xp: number; level: number };
  compact?: boolean;
  className?: string;
}

export function VoteStreakDisplay({ streak, xp, compact = false, className }: VoteStreakDisplayProps) {
  const { isPremium } = usePremium();
  const currentStreak = streak?.current_streak ?? 0;
  const longestStreak = streak?.longest_streak ?? 0;
  const totalXp = xp?.total_xp ?? 0;
  const level = xp?.level ?? 1;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        {currentStreak > 0 && (
          <span className="flex items-center gap-1 text-sm font-medium text-orange-400">
            <Flame className="h-4 w-4" />
            {currentStreak}
          </span>
        )}
        <span className="flex items-center gap-1 text-sm font-medium text-blue-400">
          <Zap className="h-4 w-4" />
          Lv.{level}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      <div className="glass rounded-lg p-3 text-center">
        <Flame className={cn('h-6 w-6 mx-auto mb-1', currentStreak > 0 ? 'text-orange-400' : 'text-muted-foreground')} />
        <div className="text-2xl font-bold">{currentStreak}</div>
        <div className="text-xs text-muted-foreground">Day Streak</div>
        {isPremium && currentStreak > 0 && (
          <div className="text-xs text-yellow-400 mt-1">+bonus XP</div>
        )}
      </div>
      <div className="glass rounded-lg p-3 text-center">
        <Zap className="h-6 w-6 mx-auto mb-1 text-blue-400" />
        <div className="text-2xl font-bold">{totalXp.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">Total XP · Lv.{level}</div>
        {isPremium && (
          <div className="text-xs text-yellow-400 mt-1">2× XP active</div>
        )}
      </div>
      {longestStreak > 0 && (
        <div className="col-span-2 text-center text-xs text-muted-foreground">
          Best streak: <span className="text-orange-400 font-medium">{longestStreak} days</span>
        </div>
      )}
    </div>
  );
}
