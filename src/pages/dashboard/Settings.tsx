import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Lock, Mail, User, Shield, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Settings = () => {
  const { profile, refresh } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [profileData, setProfileData] = useState({
    display_name: profile?.display_name || "",
    avatar_url: profile?.avatar_url || "",
    bio: profile?.bio || "",
  });

  const [emailData, setEmailData] = useState({
    email: (profile as any)?.email || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    load2FAStatus();
  }, []);

  const load2FAStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/2fa/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setTwoFactorEnabled(data.enabled);
    } catch (error) {
      console.error("Error loading 2FA status:", error);
    }
  };

  const generate2FA = async () => {
    setTwoFactorLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/2fa/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setShowSetup2FA(true);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to generate 2FA" });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const enable2FA = async () => {
    if (!verificationCode) {
      return toast({ variant: "destructive", title: "Error", description: "Please enter verification code" });
    }

    setTwoFactorLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ token: verificationCode })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enable 2FA');
      }

      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setShowSetup2FA(false);
      setTwoFactorEnabled(true);
      toast({ title: "Success", description: "2FA enabled successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm("Are you sure you want to disable 2FA? This will make your account less secure.")) {
      return;
    }

    setTwoFactorLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ password: "" })
      });

      if (!response.ok) {
        throw new Error('Failed to disable 2FA');
      }

      setTwoFactorEnabled(false);
      toast({ title: "Success", description: "2FA disabled successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast({ title: "Copied", description: "Copied to clipboard" });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await api.auth.updateProfile(profileData);
      toast({ title: "Success", description: "Profile updated successfully" });
      refresh();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await api.auth.updateEmail(emailData);
      toast({ title: "Success", description: "Email updated. Please verify your new email." });
      refresh();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast({ variant: "destructive", title: "Error", description: "Passwords do not match" });
    }
    setPasswordLoading(true);
    try {
      await api.auth.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast({ title: "Success", description: "Password updated successfully" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.upload.image(file);
      const fullUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${res.url}`;
      setProfileData({ ...profileData, avatar_url: fullUrl });
      toast({ title: "Success", description: "Photo uploaded. Save changes to apply." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-10">
      <div>
        <h1 className="text-3xl font-display font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile and security preferences.</p>
      </div>

      <div className="grid gap-8">
        {/* Profile Section */}
        <Card className="glass border-white/10 overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Profile Information</CardTitle>
            <CardDescription>Update your public appearance.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-2 border-white/10 ring-2 ring-primary/20">
                    <AvatarImage src={profileData.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                      {profile?.display_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer disabled:cursor-not-allowed"
                  >
                    {uploading ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-bold">Profile Photo</h4>
                  <p className="text-xs text-muted-foreground">Click the photo to upload a new one. Max 2MB (JPG, PNG, WebP).</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={profileData.display_name}
                    onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                    placeholder="How others see you"
                    className="bg-white/5 border-white/10 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar_url_input">Avatar URL (Direct)</Label>
                  <Input
                    id="avatar_url_input"
                    value={profileData.avatar_url}
                    onChange={(e) => setProfileData({ ...profileData, avatar_url: e.target.value })}
                    placeholder="Or paste a link to an image"
                    className="bg-white/5 border-white/10 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Tell the community about yourself"
                  className="bg-white/5 border-white/10 min-h-[100px] focus:ring-primary/50"
                />
              </div>

              <Button type="submit" disabled={profileLoading} className="shadow-lg shadow-primary/20">
                {profileLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Profile Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Email & Security Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Email Change */}
          <Card className="glass border-white/10">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <CardTitle className="flex items-center gap-2 text-lg"><Mail className="h-4 w-4 text-primary" /> Email Address</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Current Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailData.email}
                    onChange={(e) => setEmailData({ email: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <Button type="submit" variant="outline" disabled={emailLoading} className="w-full">
                  {emailLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Email
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="glass border-white/10">
            <CardHeader className="bg-white/[0.02] border-b border-white/5">
              <CardTitle className="flex items-center gap-2 text-lg"><Lock className="h-4 w-4 text-primary" /> Password</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="curr_pass">Current Password</Label>
                  <Input
                    id="curr_pass"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_pass">New Password</Label>
                  <Input
                    id="new_pass"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conf_pass">Confirm New Password</Label>
                  <Input
                    id="conf_pass"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <Button type="submit" variant="outline" disabled={passwordLoading} className="w-full">
                  {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Two-Factor Authentication Section */}
        <Card className="glass border-white/10">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Two-Factor Authentication</CardTitle>
            <CardDescription>Add an extra layer of security to your account using Google Authenticator.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <h4 className="font-medium">Status</h4>
                  <p className="text-sm text-muted-foreground">
                    {twoFactorEnabled ? "2FA is enabled" : "2FA is disabled"}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${twoFactorEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {twoFactorEnabled ? "Enabled" : "Disabled"}
                </div>
              </div>

              {twoFactorEnabled ? (
                <Button
                  variant="destructive"
                  onClick={disable2FA}
                  disabled={twoFactorLoading}
                >
                  {twoFactorLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Disable 2FA
                </Button>
              ) : (
                <Button
                  variant="hero"
                  onClick={generate2FA}
                  disabled={twoFactorLoading}
                >
                  {twoFactorLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Enable 2FA
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2FA Setup Dialog */}
        <Dialog open={showSetup2FA} onOpenChange={setShowSetup2FA}>
          <DialogContent className="glass-strong border-white/10">
            <DialogHeader>
              <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                Scan the QR code with Google Authenticator or enter the secret key manually.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {qrCode && (
                <div className="flex justify-center">
                  <img src={qrCode} alt="QR Code" className="border border-white/10 rounded-lg" />
                </div>
              )}

              <div className="space-y-2">
                <Label>Secret Key (Manual Entry)</Label>
                <div className="flex gap-2">
                  <Input
                    value={secret}
                    readOnly
                    className="bg-white/5 border-white/10 font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(secret)}
                  >
                    {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="bg-white/5 border-white/10"
                  maxLength={6}
                />
              </div>

              <Button
                variant="hero"
                onClick={enable2FA}
                disabled={twoFactorLoading || !verificationCode}
                className="w-full"
              >
                {twoFactorLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Verify and Enable
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Backup Codes Dialog */}
        <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
          <DialogContent className="glass-strong border-white/10">
            <DialogHeader>
              <DialogTitle>Backup Codes</DialogTitle>
              <DialogDescription>
                Save these backup codes in a safe place. Each code can be used once if you lose access to your authenticator.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-2 p-4 bg-white/5 rounded-lg border border-white/10 font-mono text-sm">
                {backupCodes.map((code, i) => (
                  <div key={i} className="text-center py-1">
                    {code}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => copyToClipboard(backupCodes.join('\n'))}
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All Codes
              </Button>
              <Button
                variant="hero"
                onClick={() => setShowBackupCodes(false)}
                className="w-full"
              >
                I've Saved My Codes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Settings;
