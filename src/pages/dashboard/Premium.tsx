import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Crown, Flame, Zap, Users, MessageCircle, Star, Shield,
  Download, Smile, Palette, Image, Check, Plus, Trash2, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PremiumBadge } from "@/components/premium/PremiumBadge";
import { VoteStreakDisplay } from "@/components/premium/VoteStreakDisplay";
import { usePremium } from "@/hooks/usePremium";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  active,
}: {
  icon: any;
  title: string;
  description: string;
  active: boolean;
}) => (
  <div className={cn(
    'glass rounded-xl p-4 flex gap-3 transition-all',
    active ? 'border border-yellow-500/30' : 'opacity-60'
  )}>
    <div className={cn('rounded-lg p-2 h-fit', active ? 'bg-yellow-500/20' : 'bg-white/5')}>
      <Icon className={cn('h-5 w-5', active ? 'text-yellow-400' : 'text-muted-foreground')} />
    </div>
    <div>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="font-medium text-sm">{title}</span>
        {active ? (
          <Check className="h-3 w-3 text-green-400" />
        ) : (
          <Lock className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

const Premium = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isPremium, plan, expiresAt, streak, xp, features } = usePremium();

  // Friend groups
  const { data: groups = [], refetch: refetchGroups } = useQuery({
    queryKey: ['friend-groups'],
    queryFn: () => api.premium.getGroups(),
    enabled: isPremium,
  });

  const [newGroupName, setNewGroupName] = useState('');
  const createGroupMutation = useMutation({
    mutationFn: (name: string) => api.premium.createGroup({ name }),
    onSuccess: () => { toast.success('Group created'); setNewGroupName(''); refetchGroups(); },
    onError: () => toast.error('Failed to create group'),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: number) => api.premium.deleteGroup(id),
    onSuccess: () => { toast.success('Group deleted'); refetchGroups(); },
  });

  // Custom emojis
  const { data: emojis = [], refetch: refetchEmojis } = useQuery({
    queryKey: ['custom-emojis'],
    queryFn: () => api.premium.getEmojis(),
    enabled: isPremium,
  });

  const [newEmoji, setNewEmoji] = useState({ name: '', url: '' });
  const addEmojiMutation = useMutation({
    mutationFn: (data: { name: string; url: string }) => api.premium.addEmoji(data),
    onSuccess: () => { toast.success('Emoji added'); setNewEmoji({ name: '', url: '' }); refetchEmojis(); },
    onError: () => toast.error('Failed to add emoji'),
  });

  const deleteEmojiMutation = useMutation({
    mutationFn: (id: number) => api.premium.deleteEmoji(id),
    onSuccess: () => { toast.success('Emoji deleted'); refetchEmojis(); },
  });

  // Vote history export
  const exportMutation = useMutation({
    mutationFn: () => api.premium.exportVoteHistory(),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data.votes, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vote-history-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.total} votes`);
    },
    onError: () => toast.error('Failed to export vote history'),
  });

  useEffect(() => {
    document.title = "Premium — VoteVault";
  }, []);

  if (!isPremium) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Premium</h1>
          <p className="text-muted-foreground">Unlock exclusive features</p>
        </div>

        <div className="glass rounded-2xl p-8 text-center border border-yellow-500/20">
          <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Upgrade to Premium</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Get exclusive profile customization, unlimited friends, vote streak bonuses, double XP, and much more.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold hover:from-yellow-400 hover:to-amber-400"
            onClick={() => navigate('/pricing')}
          >
            <Crown className="h-5 w-5 mr-2" />
            View Premium Plans
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {ALL_FEATURES.map((f) => <FeatureCard key={f.title} {...f} active={false} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Premium <PremiumBadge plan={plan} showLabel />
          </h1>
          <p className="text-muted-foreground text-sm">
            {expiresAt ? `Active until ${new Date(expiresAt).toLocaleDateString()}` : 'Active'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <VoteStreakDisplay streak={streak} xp={xp} />

      {/* Active Features */}
      <div>
        <h2 className="font-semibold mb-3">Your Premium Features</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {ALL_FEATURES.map((f) => <FeatureCard key={f.title} {...f} active={true} />)}
        </div>
      </div>

      {/* Friend Groups */}
      <div className="glass rounded-xl p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-yellow-400" />
          Friend Groups
        </h2>
        <div className="flex gap-2 mb-4">
          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name..."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && newGroupName.trim() && createGroupMutation.mutate(newGroupName.trim())}
          />
          <Button
            size="sm"
            onClick={() => newGroupName.trim() && createGroupMutation.mutate(newGroupName.trim())}
            disabled={createGroupMutation.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No groups yet. Create one to organize your friends.</p>
        ) : (
          <div className="space-y-2">
            {groups.map((g: any) => (
              <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: g.color }} />
                  <span className="font-medium text-sm">{g.name}</span>
                  <Badge variant="secondary" className="text-xs">{g.members?.length || 0} members</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteGroupMutation.mutate(g.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Emojis */}
      <div className="glass rounded-xl p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Smile className="h-5 w-5 text-yellow-400" />
          Custom Emojis ({emojis.length}/20)
        </h2>
        <div className="flex gap-2 mb-4">
          <Input
            value={newEmoji.name}
            onChange={(e) => setNewEmoji({ ...newEmoji, name: e.target.value })}
            placeholder=":emoji_name:"
            className="w-36"
          />
          <Input
            value={newEmoji.url}
            onChange={(e) => setNewEmoji({ ...newEmoji, url: e.target.value })}
            placeholder="Image URL..."
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={() => newEmoji.name && newEmoji.url && addEmojiMutation.mutate(newEmoji)}
            disabled={addEmojiMutation.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {emojis.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No custom emojis yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {emojis.map((e: any) => (
              <div key={e.id} className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1 group">
                <img src={e.url} alt={e.name} className="h-5 w-5 object-contain" />
                <span className="text-xs text-muted-foreground">:{e.name}:</span>
                <button
                  onClick={() => deleteEmojiMutation.mutate(e.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vote History Export */}
      <div className="glass rounded-xl p-5">
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          <Download className="h-5 w-5 text-yellow-400" />
          Vote History Export
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Download your complete voting history as JSON.</p>
        <Button
          variant="outline"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
        >
          <Download className="h-4 w-4 mr-2" />
          {exportMutation.isPending ? 'Exporting...' : 'Export Vote History'}
        </Button>
      </div>
    </div>
  );
};

const ALL_FEATURES = [
  { icon: Crown, title: 'Premium Badge', description: 'Exclusive badge on your profile' },
  { icon: Image, title: 'Animated Avatar', description: 'Use animated GIF avatars' },
  { icon: Palette, title: 'Profile Themes', description: 'Choose from 8 exclusive color themes' },
  { icon: MessageCircle, title: 'Extended Bio', description: '1000 character bio (vs 200 free)' },
  { icon: Image, title: 'Profile Banner', description: 'Custom banner image on your profile' },
  { icon: Users, title: 'Unlimited Friends', description: 'No limit (free: 50 max)' },
  { icon: MessageCircle, title: 'Custom Status', description: 'Set a custom online status message' },
  { icon: Users, title: 'Friend Groups', description: 'Organize friends into groups' },
  { icon: Flame, title: 'Vote Streak Bonuses', description: 'Earn bonus XP for consecutive votes' },
  { icon: Zap, title: 'Double XP', description: 'Earn achievements 2× faster' },
  { icon: Star, title: 'Exclusive Achievements', description: 'Premium-only achievement badges' },
  { icon: Download, title: 'Vote History Export', description: 'Full history with JSON export' },
  { icon: Shield, title: 'Ad-Free Browsing', description: 'No ads across the platform' },
  { icon: Star, title: 'Early Access', description: 'Try new features before public release' },
  { icon: MessageCircle, title: 'Priority Support', description: 'Faster response to support tickets' },
  { icon: Smile, title: 'Custom Emojis', description: 'Use custom emojis in reviews and chat' },
];

export default Premium;
