import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";import { Helmet } from "react-helmet-async";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UserTags } from "@/components/UserTag";
import { SocialLinks } from "@/components/SocialLinks";
import { AchievementDisplay } from "@/components/AchievementDisplay";
import { PremiumBadge } from "@/components/premium/PremiumBadge";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { VoteStreakDisplay } from "@/components/premium/VoteStreakDisplay";
import {
  ArrowLeft, Calendar, MessageCircle, UserPlus, UserCheck, UserMinus,
  Pencil, Save, X, Crown, Flame, Zap, Image, Smile, Upload, Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  roles: string[];
  achievements: any[];
  isPremium?: boolean;
  premiumPlan?: string | null;
  banner_url?: string;
  profile_theme?: string;
  is_animated_avatar?: boolean;
  custom_status?: string;
  custom_status_emoji?: string;
  xp?: { total_xp: number; level: number };
  streak?: { current_streak: number; longest_streak: number };
  social_discord?: string;
  social_twitter?: string;
  social_youtube?: string;
  social_twitch?: string;
  social_website?: string;
}

const PROFILE_THEMES: Record<string, { primary: string; border: string; bg: string }> = {
  default: { primary: 'text-red-400', border: 'border-red-500/30', bg: 'from-red-500/10' },
  ocean: { primary: 'text-blue-400', border: 'border-blue-500/30', bg: 'from-blue-500/10' },
  forest: { primary: 'text-green-400', border: 'border-green-500/30', bg: 'from-green-500/10' },
  sunset: { primary: 'text-orange-400', border: 'border-orange-500/30', bg: 'from-orange-500/10' },
  purple: { primary: 'text-purple-400', border: 'border-purple-500/30', bg: 'from-purple-500/10' },
  gold: { primary: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'from-yellow-500/10' },
  rose: { primary: 'text-pink-400', border: 'border-pink-500/30', bg: 'from-pink-500/10' },
  cyan: { primary: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'from-cyan-500/10' },
};

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { isPremium, features } = usePremium();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<string>('none');
  const [requestId, setRequestId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [themes, setThemes] = useState<any[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [msgRequestOpen, setMsgRequestOpen] = useState(false);
  const [msgRequestText, setMsgRequestText] = useState("");
  const [msgRequestStatus, setMsgRequestStatus] = useState<any>(null);
  const [sendingMsgRequest, setSendingMsgRequest] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    avatar_url: "",
    bio: "",
    banner_url: "",
    profile_theme: "default",
    custom_status: "",
    custom_status_emoji: "",
    social_discord: "",
    social_twitter: "",
    social_youtube: "",
    social_twitch: "",
    social_website: "",
  });

  const isOwnProfile = user?.id === userId;
  const theme = PROFILE_THEMES[profile?.profile_theme || 'default'] || PROFILE_THEMES.default;

  const loadProfile = async () => {
    if (!userId) return;
    try {
      const data = await api.users.getProfile(userId);
      setProfile(data);
      setFormData({
        display_name: data.display_name || "",
        avatar_url: data.avatar_url || "",
        bio: data.bio || "",
        banner_url: data.banner_url || "",
        profile_theme: data.profile_theme || "default",
        custom_status: data.custom_status || "",
        custom_status_emoji: data.custom_status_emoji || "",
        social_discord: data.social_discord || "",
        social_twitter: data.social_twitter || "",
        social_youtube: data.social_youtube || "",
        social_twitch: data.social_twitch || "",
        social_website: data.social_website || "",
      });
    } catch (error) {
      console.error("Error loading user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriendStatus = async () => {
    if (!userId || !user) return;
    try {
      const status = await api.friends.checkStatus(userId);
      setFriendStatus(status.status);
      setRequestId((status as any).requestId || null);
    } catch (error) {
      console.error("Error checking friend status:", error);
    }
  };

  useEffect(() => {
    loadProfile();
    loadFriendStatus();
    api.premium.getThemes().then(setThemes).catch(() => {});
    if (user && userId && user.id !== userId) {
      api.userExperience.checkBlocked(userId)
        .then(d => setIsBlocked(d.isBlocked))
        .catch(() => {});
      api.messageRequests.check(userId)
        .then(d => setMsgRequestStatus(d))
        .catch(() => {});
    }
  }, [userId, user]);

  const sendFriendRequest = async () => {
    if (!userId) return;
    try {
      await api.friends.sendRequest(userId);
      toast.success("Friend request sent");
      loadFriendStatus();
    } catch (error: any) {
      if (error?.requiresPremium) {
        toast.error("Friend limit reached. Upgrade to Premium for unlimited friends.");
      } else {
        toast.error(error.message || "Failed to send friend request");
      }
    }
  };

  const acceptFriendRequest = async () => {
    if (!requestId) return;
    try {
      await api.friends.acceptRequest(requestId);
      toast.success("Friend request accepted");
      loadFriendStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to accept request");
    }
  };

  const removeFriend = async () => {
    if (!userId) return;
    try {
      await api.friends.remove(userId);
      toast.success("Friend removed");
      loadFriendStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove friend");
    }
  };

  const toggleBlock = async () => {
    if (!userId) return;
    setBlockLoading(true);
    try {
      if (isBlocked) {
        await api.userExperience.unblockUser(userId);
        setIsBlocked(false);
        toast.success("User unblocked");
      } else {
        if (!confirm(`Block ${profile?.display_name || profile?.username}? They won't be able to message you or send friend requests.`)) return;
        await api.userExperience.blockUser(userId);
        setIsBlocked(true);
        // Also remove friend if they were friends
        await api.friends.remove(userId).catch(() => {});
        setFriendStatus('none');
        toast.success("User blocked");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed");
    } finally {
      setBlockLoading(false);
    }
  };

  const handleSendMsgRequest = async () => {
    if (!msgRequestText.trim() || !userId) return;
    setSendingMsgRequest(true);
    try {
      await api.messageRequests.send({ receiverId: userId, message: msgRequestText.trim() });
      toast.success("Message request sent!");
      setMsgRequestOpen(false);
      setMsgRequestText("");
      setMsgRequestStatus((prev: any) => ({ ...prev, sent: { status: "pending" } }));
    } catch (e: any) {
      if (e?.message?.includes("already friends") || (e as any)?.alreadyFriends) {
        navigate(`/messages/${userId}`);
      } else {
        toast.error(e?.message || "Failed to send message request");
      }
    } finally {
      setSendingMsgRequest(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error("Only JPG, PNG, WebP or GIF images are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const data = await api.upload.image(file);
      const fullUrl = data.url.startsWith('http')
        ? data.url
        : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${data.url}`;
      setFormData(f => ({ ...f, avatar_url: fullUrl }));
      toast.success("Image uploaded — click Save to apply");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    try {
      // Use premium profile endpoint for premium fields
      await api.premium.updateProfile(formData);
      toast.success("Profile updated successfully");
      setEditing(false);
      loadProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="container py-10 md:py-14">
        <div className="glass rounded-xl h-64 shimmer" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-10 md:py-14">
        <div className="glass rounded-xl p-12 text-center">
          <h2 className="text-2xl font-bold mb-2">User not found</h2>
          <p className="text-muted-foreground mb-6">This user profile doesn't exist.</p>
          <Button variant="hero" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const bioLimit = isOwnProfile ? (isPremium ? 1000 : 200) : 1000;

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>{profile.display_name || profile.username} - VoteVault</title>
        <meta name="description" content={`View ${profile.display_name || profile.username}'s profile on VoteVault`} />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
        </Button>

        {/* Profile Banner */}
        {profile.banner_url && (
          <div className="relative h-40 md:h-52 rounded-t-2xl overflow-hidden mb-0">
            <img src={profile.banner_url} alt="Profile banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
          </div>
        )}

        <div className={cn(
          'glass rounded-2xl p-6 md:p-8',
          profile.banner_url && 'rounded-t-none',
          profile.isPremium && `border ${theme.border}`
        )}>
          {/* Premium theme gradient overlay */}
          {profile.isPremium && profile.profile_theme && profile.profile_theme !== 'default' && (
            <div className={cn('absolute inset-0 rounded-2xl bg-gradient-to-br opacity-5 pointer-events-none', theme.bg, 'to-transparent')} />
          )}

          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar className={cn('h-24 w-24 border-2', profile.isPremium ? `border-yellow-500/50` : 'border-white/10')}>
                <AvatarImage
                  src={profile.avatar_url}
                  className={profile.is_animated_avatar ? '' : ''}
                />
                <AvatarFallback className="bg-gradient-crimson text-white text-2xl font-bold">
                  {profile.display_name?.[0] || profile.username?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              {profile.isPremium && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                  <Crown className="h-3 w-3 text-black" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className={cn('font-display text-3xl font-bold', profile.isPremium && theme.primary)}>
                      {profile.display_name || profile.username}
                    </h1>
                    {profile.isPremium && <PremiumBadge plan={profile.premiumPlan} showLabel />}
                  </div>
                  {profile.username && profile.display_name && (
                    <p className="text-muted-foreground text-sm mb-1">@{profile.username}</p>
                  )}
                  {/* User tag — copyable */}
                  {(profile as any).tag && (
                    <button
                      onClick={() => { navigator.clipboard.writeText((profile as any).tag); toast.success("Tag copied!"); }}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mb-2 font-mono"
                      title="Click to copy your tag"
                    >
                      <span className="bg-white/5 border border-white/10 rounded px-2 py-0.5">{(profile as any).tag}</span>
                      <span className="opacity-50">📋</span>
                    </button>
                  )}

                  {/* Custom Status */}
                  {profile.custom_status && (
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                      {profile.custom_status_emoji && <span>{profile.custom_status_emoji}</span>}
                      <span className="italic">{profile.custom_status}</span>
                    </p>
                  )}

                  <UserTags roles={profile.roles} />

                  {/* XP / Streak compact */}
                  {(profile.xp || profile.streak) && (
                    <div className="flex items-center gap-3 mt-2">
                      {(profile.streak?.current_streak ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-orange-400">
                          <Flame className="h-3 w-3" />
                          {profile.streak!.current_streak} day streak
                        </span>
                      )}
                      {(profile.xp?.total_xp ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-blue-400">
                          <Zap className="h-3 w-3" />
                          Lv.{profile.xp!.level} · {profile.xp!.total_xp.toLocaleString()} XP
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {isOwnProfile && !editing && (
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                      <Pencil className="h-4 w-4 mr-2" />Edit Profile
                    </Button>
                  )}
                  {isOwnProfile && editing && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                        <X className="h-4 w-4 mr-2" />Cancel
                      </Button>
                      <Button variant="hero" size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />Save
                      </Button>
                    </>
                  )}
                  {!isOwnProfile && user && (
                    <>
                      {!isBlocked && friendStatus === 'none' && (
                        <Button variant="outline" size="sm" onClick={sendFriendRequest}>
                          <UserPlus className="h-4 w-4 mr-2" />Add Friend
                        </Button>
                      )}
                      {!isBlocked && friendStatus === 'request_sent' && (
                        <Button variant="outline" size="sm" disabled>
                          <UserCheck className="h-4 w-4 mr-2" />Request Sent
                        </Button>
                      )}
                      {!isBlocked && friendStatus === 'request_received' && (
                        <Button variant="outline" size="sm" onClick={acceptFriendRequest}>
                          <UserCheck className="h-4 w-4 mr-2" />Accept Request
                        </Button>
                      )}
                      {!isBlocked && friendStatus === 'friends' && (
                        <>
                          <Button variant="hero" size="sm" onClick={() => navigate(`/messages/${userId}`)}>
                            <MessageCircle className="h-4 w-4 mr-2" />Message
                          </Button>
                          <Button variant="outline" size="sm" onClick={removeFriend}>
                            <UserMinus className="h-4 w-4 mr-2" />Remove Friend
                          </Button>
                        </>
                      )}
                      {/* Non-friend message request */}
                      {!isBlocked && friendStatus === 'none' && user && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={msgRequestStatus?.sent?.status === 'pending'}
                          onClick={() => setMsgRequestOpen(true)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {msgRequestStatus?.sent?.status === 'pending' ? 'Request Sent' : 'Message'}
                        </Button>
                      )}
                      {/* Block / Unblock — always visible for non-own profiles */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleBlock}
                        disabled={blockLoading}
                        className={isBlocked ? "border-green-500/40 text-green-400 hover:bg-green-500/10" : "border-red-500/40 text-red-400 hover:bg-red-500/10"}
                      >
                        {isBlocked ? "Unblock" : "Block"}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Edit Form */}
              {editing ? (
                <div className="space-y-4">
                  {/* Avatar upload */}
                  <div>
                    <Label>Profile Picture</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Avatar className="h-16 w-16 border-2 border-white/20">
                        <AvatarImage src={formData.avatar_url || profile?.avatar_url} />
                        <AvatarFallback className="bg-gradient-crimson text-white text-xl font-bold">
                          {profile?.display_name?.[0] || profile?.username?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingAvatar}
                          onClick={() => avatarInputRef.current?.click()}
                          className="w-full"
                        >
                          {uploadingAvatar
                            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading…</>
                            : <><Upload className="h-4 w-4 mr-2" />Upload Image</>}
                        </Button>
                        <Input
                          placeholder="Or paste image URL…"
                          value={formData.avatar_url}
                          onChange={e => setFormData(f => ({ ...f, avatar_url: e.target.value }))}
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="Your display name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">
                      Bio
                      <span className="text-xs text-muted-foreground ml-2">
                        {formData.bio.length}/{bioLimit}
                        {!isPremium && <span className="text-yellow-500 ml-1">(Premium: 1000)</span>}
                      </span>
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, bioLimit) })}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>

                  {/* Premium-only fields */}
                  {isPremium ? (
                    <>
                      <div>
                        <Label htmlFor="custom_status" className="flex items-center gap-1">
                          <Crown className="h-3 w-3 text-yellow-400" />
                          Custom Status
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={formData.custom_status_emoji}
                            onChange={(e) => setFormData({ ...formData, custom_status_emoji: e.target.value })}
                            placeholder="😊"
                            className="w-16 text-center"
                            maxLength={2}
                          />
                          <Input
                            id="custom_status"
                            value={formData.custom_status}
                            onChange={(e) => setFormData({ ...formData, custom_status: e.target.value.slice(0, 255) })}
                            placeholder="What are you up to?"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="banner_url" className="flex items-center gap-1">
                          <Crown className="h-3 w-3 text-yellow-400" />
                          Profile Banner URL
                        </Label>
                        <Input
                          id="banner_url"
                          value={formData.banner_url}
                          onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                          placeholder="https://example.com/banner.jpg"
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-1">
                          <Crown className="h-3 w-3 text-yellow-400" />
                          Profile Theme
                        </Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {themes.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, profile_theme: t.id })}
                              className={cn(
                                'rounded-lg p-2 text-xs border transition-all',
                                formData.profile_theme === t.id
                                  ? 'border-white/50 bg-white/10'
                                  : 'border-white/10 hover:border-white/30'
                              )}
                              style={{ borderColor: formData.profile_theme === t.id ? t.colors.primary : undefined }}
                            >
                              <div
                                className="h-4 w-full rounded mb-1"
                                style={{ backgroundColor: t.colors.primary }}
                              />
                              {t.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="glass rounded-lg p-3 border border-yellow-500/20 flex items-center gap-3">
                      <Crown className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                      <div className="flex-1 text-sm">
                        <span className="text-yellow-400 font-medium">Premium features: </span>
                        <span className="text-muted-foreground">Custom status, profile banner, themes & more</span>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold text-xs"
                        onClick={() => navigate('/pricing')}
                      >
                        Upgrade
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Social Media Links</Label>
                    <div className="grid gap-2">
                      <Input value={formData.social_discord} onChange={(e) => setFormData({ ...formData, social_discord: e.target.value })} placeholder="Discord: username#1234" className="text-sm" />
                      <Input value={formData.social_twitter} onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })} placeholder="Twitter: twitter.com/username" className="text-sm" />
                      <Input value={formData.social_youtube} onChange={(e) => setFormData({ ...formData, social_youtube: e.target.value })} placeholder="YouTube: youtube.com/@username" className="text-sm" />
                      <Input value={formData.social_twitch} onChange={(e) => setFormData({ ...formData, social_twitch: e.target.value })} placeholder="Twitch: twitch.tv/username" className="text-sm" />
                      <Input value={formData.social_website} onChange={(e) => setFormData({ ...formData, social_website: e.target.value })} placeholder="Website: yourwebsite.com" className="text-sm" />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {profile.bio && <p className="text-muted-foreground mb-4">{profile.bio}</p>}
                  <div className="mb-4">
                    <SocialLinks
                      social_discord={profile.social_discord}
                      social_twitter={profile.social_twitter}
                      social_youtube={profile.social_youtube}
                      social_twitch={profile.social_twitch}
                      social_website={profile.social_website}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats row */}
          {!editing && (profile.xp || profile.streak) && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <VoteStreakDisplay streak={profile.streak} xp={profile.xp} />
            </div>
          )}
        </div>
      </div>

      {/* Tabs: Achievements | Servers | Reviews | Vote History */}
      {!editing && (
        <ProfileTabs userId={userId!} profile={profile} isOwnProfile={isOwnProfile} />
      )}

      {/* ── Message Request Dialog ── */}
      <Dialog open={msgRequestOpen} onOpenChange={setMsgRequestOpen}>
        <DialogContent className="glass-strong border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message Request</DialogTitle>
            <DialogDescription>
              You're not friends with <strong>{profile?.display_name || profile?.username}</strong> yet.
              Send a message request — they can accept or decline it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              placeholder="Write a short message to introduce yourself…"
              value={msgRequestText}
              onChange={e => setMsgRequestText(e.target.value.slice(0, 500))}
              rows={4}
              className="bg-white/5 border-white/10 resize-none"
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-right">{msgRequestText.length}/500</p>
            <div className="flex gap-2">
              <Button variant="hero" className="flex-1"
                disabled={sendingMsgRequest || !msgRequestText.trim()}
                onClick={handleSendMsgRequest}>
                {sendingMsgRequest ? "Sending…" : "Send Request"}
              </Button>
              <Button variant="outline" onClick={() => setMsgRequestOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function ProfileTabs({ userId, profile, isOwnProfile }: { userId: string; profile: any; isOwnProfile: boolean }) {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") as any || 'achievements';
  const [tab, setTab] = useState<'achievements' | 'servers' | 'reviews' | 'threads' | 'votes'>(
    ['achievements', 'servers', 'reviews', 'threads', 'votes'].includes(initialTab) ? initialTab : 'achievements'
  );
  const [servers, setServers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (tab === 'achievements') return;
    if (loaded[tab]) return;

    if (tab === 'servers') {
      api.users.getServers(userId).then(setServers).catch(() => {}).finally(() => setLoaded(p => ({ ...p, servers: true })));
    } else if (tab === 'reviews') {
      api.users.getReviews(userId).then(setReviews).catch(() => {}).finally(() => setLoaded(p => ({ ...p, reviews: true })));
    } else if (tab === 'threads') {
      api.users.getThreads(userId).then(setThreads).catch(() => {}).finally(() => setLoaded(p => ({ ...p, threads: true })));
    } else if (tab === 'votes' && isOwnProfile) {
      api.premium.getVoteHistory()
        .then(d => setVotes(d.votes || []))
        .catch(() => {})
        .finally(() => setLoaded(p => ({ ...p, votes: true })));
    }
  }, [tab, userId]);

  const tabs = [
    { id: 'achievements', label: `Achievements (${profile.achievements?.length || 0})` },
    { id: 'servers', label: 'Servers' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'threads', label: 'Threads' },
    ...(isOwnProfile ? [{ id: 'votes', label: 'Vote History' }] : []),
  ] as const;

  return (
    <div className="mt-4">
      {/* Tab bar */}
      <div className="flex gap-1 glass rounded-xl p-1 mb-4 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as 'achievements' | 'servers' | 'reviews' | 'threads' | 'votes')}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t.id
                ? 'bg-primary/20 text-primary-glow border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'achievements' && (
        <div className="glass rounded-2xl p-6">
          <AchievementDisplay achievements={profile.achievements || []} />
          {!profile.achievements?.length && (
            <p className="text-sm text-muted-foreground text-center py-6">No achievements yet.</p>
          )}
        </div>
      )}

      {tab === 'servers' && (
        <div className="glass rounded-2xl p-6">
          {!loaded.servers ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg shimmer" />)}</div>
          ) : servers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No servers listed.</p>
          ) : (
            <div className="space-y-3">
              {servers.map((s: any) => (
                <Link key={s.id} to={`/server/${s.slug}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                  {s.logo_url && <img src={s.logo_url} alt={s.name} className="h-10 w-10 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.short_description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3 text-primary" />{s.vote_count}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'reviews' && (
        <div className="glass rounded-2xl p-6">
          {!loaded.reviews ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg shimmer" />)}</div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No reviews written yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r: any) => (
                <div key={r.id} className="p-4 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <Link to={`/server/${r.server_slug || r.server_id}`} className="font-semibold text-sm hover:underline">{r.server_name || 'Server'}</Link>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={s <= r.rating ? 'text-yellow-400' : 'text-white/20'}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'threads' && (
        <div className="glass rounded-2xl p-6">
          {!loaded.threads ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg shimmer" />)}</div>
          ) : threads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No threads posted yet.</p>
          ) : (
            <div className="space-y-2">
              {threads.map((t: any) => (
                <Link key={t.public_id} to={`/threads/${t.public_id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{t.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{t.category_name}</span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />{t.reply_count}
                      </span>
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'votes' && isOwnProfile && (
        <div className="glass rounded-2xl p-6">
          {!loaded.votes ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded shimmer" />)}</div>
          ) : votes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No votes recorded yet.</p>
          ) : (
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-white/5 border-b border-white/10">
                  <th className="p-3 text-left font-medium">Server</th>
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Challenge</th>
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {votes.slice(0, 50).map((v: any) => (
                    <tr key={v.public_id} className="hover:bg-white/5">
                      <td className="p-3">{v.server_name}</td>
                      <td className="p-3 text-muted-foreground">{new Date(v.voted_at).toLocaleDateString()}</td>
                      <td className="p-3 text-muted-foreground">{v.challenge_type_passed || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserProfile;
