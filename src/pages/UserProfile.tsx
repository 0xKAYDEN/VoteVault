import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserTags } from "@/components/UserTag";
import { SocialLinks } from "@/components/SocialLinks";
import { AchievementDisplay } from "@/components/AchievementDisplay";
import { ArrowLeft, Calendar, MessageCircle, UserPlus, UserCheck, UserMinus, Pencil, Save, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  roles: string[];
  achievements: any[];
  social_discord?: string;
  social_twitter?: string;
  social_youtube?: string;
  social_twitch?: string;
  social_website?: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<string>('none');
  const [requestId, setRequestId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    social_discord: "",
    social_twitter: "",
    social_youtube: "",
    social_twitch: "",
    social_website: "",
  });

  const loadProfile = async () => {
    if (!userId) return;

    try {
      const data = await api.users.getProfile(userId);
      setProfile(data);
      setFormData({
        display_name: data.display_name || "",
        bio: data.bio || "",
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
      setRequestId(status.requestId || null);
    } catch (error) {
      console.error("Error checking friend status:", error);
    }
  };

  useEffect(() => {
    loadProfile();
    loadFriendStatus();
  }, [userId, user]);

  const sendFriendRequest = async () => {
    if (!userId) return;

    try {
      await api.friends.sendRequest(userId);
      toast.success("Friend request sent");
      loadFriendStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to send friend request");
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

  const handleSave = async () => {
    try {
      await api.auth.updateProfile(formData);
      toast.success("Profile updated successfully");
      setEditing(false);
      loadProfile();
    } catch (error) {
      toast.error("Failed to update profile");
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
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>{profile.display_name || profile.username} - VoteVault</title>
        <meta name="description" content={`View ${profile.display_name || profile.username}'s profile on VoteVault`} />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>

        <div className="glass rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24 border-2 border-white/10">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="bg-gradient-crimson text-white text-2xl font-bold">
                {profile.display_name?.[0] || profile.username?.[0] || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="font-display text-3xl font-bold mb-2">
                    {profile.display_name || profile.username}
                  </h1>
                  {profile.username && profile.display_name && (
                    <p className="text-muted-foreground text-sm mb-2">@{profile.username}</p>
                  )}
                  <UserTags roles={profile.roles} />
                </div>

                <div className="flex gap-2">
                  {isOwnProfile && !editing && (
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                  {isOwnProfile && editing && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button variant="hero" size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </>
                  )}
                  {!isOwnProfile && user && (
                    <>
                      {friendStatus === 'none' && (
                        <Button variant="outline" size="sm" onClick={sendFriendRequest}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Friend
                        </Button>
                      )}
                      {friendStatus === 'request_sent' && (
                        <Button variant="outline" size="sm" disabled>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Request Sent
                        </Button>
                      )}
                      {friendStatus === 'request_received' && (
                        <Button variant="outline" size="sm" onClick={acceptFriendRequest}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Accept Request
                        </Button>
                      )}
                      {friendStatus === 'friends' && (
                        <>
                          <Button variant="hero" size="sm">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                          <Button variant="outline" size="sm" onClick={removeFriend}>
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove Friend
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {editing ? (
                <div className="space-y-4">
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
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Social Media Links</Label>
                    <div className="grid gap-2">
                      <Input
                        value={formData.social_discord}
                        onChange={(e) => setFormData({ ...formData, social_discord: e.target.value })}
                        placeholder="Discord: username#1234"
                        className="text-sm"
                      />
                      <Input
                        value={formData.social_twitter}
                        onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })}
                        placeholder="Twitter: twitter.com/username"
                        className="text-sm"
                      />
                      <Input
                        value={formData.social_youtube}
                        onChange={(e) => setFormData({ ...formData, social_youtube: e.target.value })}
                        placeholder="YouTube: youtube.com/@username"
                        className="text-sm"
                      />
                      <Input
                        value={formData.social_twitch}
                        onChange={(e) => setFormData({ ...formData, social_twitch: e.target.value })}
                        placeholder="Twitch: twitch.tv/username"
                        className="text-sm"
                      />
                      <Input
                        value={formData.social_website}
                        onChange={(e) => setFormData({ ...formData, social_website: e.target.value })}
                        placeholder="Website: yourwebsite.com"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {profile.bio && (
                    <p className="text-muted-foreground mb-4">{profile.bio}</p>
                  )}

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

          {!editing && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="font-semibold mb-3">Achievements ({profile.achievements?.length || 0})</h3>
              <AchievementDisplay achievements={profile.achievements || []} />
            </div>
          )}
        </div>

        {/* Future: Add user's servers, reviews, activity, etc. */}
      </div>
    </div>
  );
};

export default UserProfile;
