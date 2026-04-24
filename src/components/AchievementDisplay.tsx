import { Trophy, Award, Star, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  unlocked_at?: string;
}

interface AchievementDisplayProps {
  achievements: Achievement[];
  showLocked?: boolean;
}

const rarityColors = {
  common: "text-gray-400 border-gray-400/30",
  uncommon: "text-green-400 border-green-400/30",
  rare: "text-blue-400 border-blue-400/30",
  epic: "text-purple-400 border-purple-400/30",
  legendary: "text-yellow-400 border-yellow-400/30",
};

const rarityGlow = {
  common: "shadow-[0_0_10px_rgba(156,163,175,0.3)]",
  uncommon: "shadow-[0_0_10px_rgba(74,222,128,0.3)]",
  rare: "shadow-[0_0_10px_rgba(96,165,250,0.3)]",
  epic: "shadow-[0_0_10px_rgba(192,132,252,0.3)]",
  legendary: "shadow-[0_0_10px_rgba(250,204,21,0.3)]",
};

export function AchievementDisplay({ achievements, showLocked = false }: AchievementDisplayProps) {
  if (!achievements || achievements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No achievements yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {achievements.map((achievement) => (
        <div
          key={achievement.id}
          className={cn(
            "glass rounded-lg p-3 border-2 transition-all hover:scale-105",
            rarityColors[achievement.rarity],
            rarityGlow[achievement.rarity]
          )}
          title={achievement.description}
        >
          <div className="text-center">
            <div className="text-3xl mb-1">{achievement.icon}</div>
            <div className="text-xs font-semibold truncate">{achievement.name}</div>
            <div className="text-[10px] text-muted-foreground capitalize">{achievement.rarity}</div>
            {achievement.unlocked_at && (
              <div className="text-[9px] text-muted-foreground mt-1">
                {new Date(achievement.unlocked_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AchievementBadge({ achievement }: { achievement: Achievement }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border",
        rarityColors[achievement.rarity]
      )}
      title={achievement.description}
    >
      <span>{achievement.icon}</span>
      <span className="font-semibold">{achievement.name}</span>
    </div>
  );
}
