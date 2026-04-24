import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserTags } from "@/components/UserTag";
import { ArrowLeft, Calendar, MessageCircle, UserPlus, UserCheck, UserMinus } from "lucide-react";
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
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<string>('none');
  const [requestId, setRequestId] = useState<number | null>(null);

  const loadProfile = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/${userId}`);
      const data = await response.json();
      setProfile(data);
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
        <title>{profile.display_name || profile.username} - Conquer Top 100</title>
        <meta name="description" content={`View ${profile.display_name || profile.username}'s profile on Conquer Top 100`} />
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

                {!isOwnProfile && user && (
                  <div className="flex gap-2">
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
                  </div>
                )}
              </div>

              {profile.bio && (
                <p className="text-muted-foreground mb-4">{profile.bio}</p>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Future: Add user's servers, reviews, activity, etc. */}
      </div>
    </div>
  );
};

export default UserProfile;
