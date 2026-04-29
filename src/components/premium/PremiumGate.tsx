import { useNavigate } from 'react-router-dom';
import { Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePremium } from '@/hooks/usePremium';
import { cn } from '@/lib/utils';

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
  className?: string;
  /** If true, renders children but overlays a lock instead of hiding them */
  overlay?: boolean;
}

export function PremiumGate({ children, feature, className, overlay = false }: PremiumGateProps) {
  const { isPremium } = usePremium();
  const navigate = useNavigate();

  if (isPremium) return <>{children}</>;

  if (overlay) {
    return (
      <div className={cn('relative', className)}>
        <div className="pointer-events-none select-none opacity-30 blur-sm">{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 rounded-lg backdrop-blur-sm">
          <Lock className="h-8 w-8 text-yellow-400" />
          <p className="text-sm font-medium text-center px-4">
            {feature ? `${feature} requires Premium` : 'Premium feature'}
          </p>
          <Button
            size="sm"
            className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold hover:from-yellow-400 hover:to-amber-400"
            onClick={() => navigate('/pricing')}
          >
            <Crown className="h-4 w-4 mr-1" />
            Upgrade
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('glass rounded-xl p-6 text-center border border-yellow-500/20', className)}>
      <Crown className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
      <h3 className="font-semibold text-lg mb-1">{feature || 'Premium Feature'}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Upgrade to Premium to unlock this feature.
      </p>
      <Button
        className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold hover:from-yellow-400 hover:to-amber-400"
        onClick={() => navigate('/pricing')}
      >
        <Crown className="h-4 w-4 mr-1" />
        Upgrade to Premium
      </Button>
    </div>
  );
}
