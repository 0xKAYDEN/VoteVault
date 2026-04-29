import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export interface PremiumStatus {
  isPremium: boolean;
  plan: string | null;
  expiresAt: string | null;
  features: Record<string, boolean>;
  streak: { current_streak: number; longest_streak: number };
  xp: { total_xp: number; level: number };
}

export function usePremium() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery<PremiumStatus>({
    queryKey: ['premium-status', user?.id],
    queryFn: () => api.premium.getStatus(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return {
    isPremium: data?.isPremium ?? false,
    plan: data?.plan ?? null,
    expiresAt: data?.expiresAt ?? null,
    features: data?.features ?? {},
    streak: data?.streak ?? { current_streak: 0, longest_streak: 0 },
    xp: data?.xp ?? { total_xp: 0, level: 1 },
    isLoading,
    refetch,
  };
}
