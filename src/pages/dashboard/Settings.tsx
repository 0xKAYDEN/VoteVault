import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail, Shield, Copy, Check, Eye, EyeOff } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";

const Settings = () => {
  const { profile, refresh } = useAuth();
  const { toast } = useToast();

  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [emailData, setEmailData] = useState({ email: (profile as any)?.email || "" });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });

  useEffect(() => {
    document.title = "Account Settings — VoteVault";
    api.twoFactor.getStatus().then(d => setTwoFactorEnabled(d.enabled)).catch(() => {});
  }, []);

  // Keep email in sync when profile loads
  useEffect(() => {
    if ((profile as any)?.email) setEmailData({ email: (profile as any).email });
  }, [profile]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await api.auth.updateEmail(emailData);
      toast({ title: "Email updated", description: "Please verify your new email address." });
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
    if (passwordData.newPassword.length < 6) {
      return toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters" });
    }
    setPasswordLoading(true);
    try {
      await api.auth.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast({ title: "Password updated", description: "Your password has been changed." });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const generate2FA = async () => {
    setTwoFactorLoading(true);
    try {
      const data = await api.twoFactor.generateSecret();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setShowSetup2FA(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to generate 2FA" });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const enable2FA = async () => {
    if (!verificationCode) return toast({ variant: "destructive", title: "Error", description: "Enter the verification code" });
    setTwoFactorLoading(true);
    try {
      const data = await api.twoFactor.enable(verificationCode);
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setShowSetup2FA(false);
      setTwoFactorEnabled(true);
      toast({ title: "2FA enabled" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm("Disable 2FA? This makes your account less secure.")) return;
    setTwoFactorLoading(true);
    try {
      await api.twoFactor.disable("");
      setTwoFactorEnabled(false);
      toast({ title: "2FA disabled" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl pb-10">
      <div>
        <h1 className="text-3xl font-display font-bold">Account Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your login credentials and security.{" "}
          <Link to={`/user/${profile?.id}`} className="text-primary hover:underline">
            Edit your public profile →
          </Link>
        </p>
      </div>

      {/* Email */}
      <Card className="glass border-white/10">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-4 w-4 text-primary" /> Email Address
          </CardTitle>
          <CardDescription>Change the email used to sign in.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={emailData.email}
                onChange={e => setEmailData({ email: e.target.value })}
                className="bg-white/5 border-white/10 mt-1"
                required
              />
            </div>
            <Button type="submit" variant="outline" disabled={emailLoading}>
              {emailLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update Email
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="glass border-white/10">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-4 w-4 text-primary" /> Password
          </CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <PasswordField
              id="curr_pass" label="Current Password"
              value={passwordData.currentPassword}
              onChange={v => setPasswordData(p => ({ ...p, currentPassword: v }))}
              show={showCurrent} onToggle={() => setShowCurrent(s => !s)}
            />
            <PasswordField
              id="new_pass" label="New Password"
              value={passwordData.newPassword}
              onChange={v => setPasswordData(p => ({ ...p, newPassword: v }))}
              show={showNew} onToggle={() => setShowNew(s => !s)}
            />
            <PasswordField
              id="conf_pass" label="Confirm New Password"
              value={passwordData.confirmPassword}
              onChange={v => setPasswordData(p => ({ ...p, confirmPassword: v }))}
              show={showConfirm} onToggle={() => setShowConfirm(s => !s)}
            />
            <Button type="submit" variant="outline" disabled={passwordLoading}>
              {passwordLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card className="glass border-white/10">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security using Google Authenticator.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div>
              <p className="font-medium text-sm">Status</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {twoFactorEnabled ? "Your account is protected with 2FA" : "2FA is not enabled"}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${twoFactorEnabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
              {twoFactorEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          {twoFactorEnabled ? (
            <Button variant="destructive" onClick={disable2FA} disabled={twoFactorLoading}>
              {twoFactorLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Disable 2FA
            </Button>
          ) : (
            <Button variant="hero" onClick={generate2FA} disabled={twoFactorLoading}>
              {twoFactorLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enable 2FA
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 2FA Setup Dialog */}
      <Dialog open={showSetup2FA} onOpenChange={setShowSetup2FA}>
        <DialogContent className="glass-strong border-white/10">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>Scan the QR code with Google Authenticator or enter the key manually.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="QR Code" className="border border-white/10 rounded-lg" />
              </div>
            )}
            <div>
              <Label>Secret Key</Label>
              <div className="flex gap-2 mt-1">
                <Input value={secret} readOnly className="bg-white/5 border-white/10 font-mono text-sm" />
                <Button size="sm" variant="outline" onClick={() => copy(secret)}>
                  {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label>Verification Code</Label>
              <Input
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                placeholder="6-digit code"
                className="bg-white/5 border-white/10 mt-1"
                maxLength={6}
              />
            </div>
            <Button variant="hero" onClick={enable2FA} disabled={twoFactorLoading || !verificationCode} className="w-full">
              {twoFactorLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
            <DialogDescription>Save these codes somewhere safe. Each can be used once.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2 p-4 bg-white/5 rounded-lg border border-white/10 font-mono text-sm">
              {backupCodes.map((code, i) => (
                <div key={i} className="text-center py-1 tracking-wider">{code}</div>
              ))}
            </div>
            <Button variant="outline" onClick={() => copy(backupCodes.join('\n'))} className="w-full">
              <Copy className="h-4 w-4 mr-2" /> Copy All Codes
            </Button>
            <Button variant="hero" onClick={() => setShowBackupCodes(false)} className="w-full">
              I've Saved My Codes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function PasswordField({ id, label, value, onChange, show, onToggle }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; show: boolean; onToggle: () => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="bg-white/5 border-white/10 pr-10"
          required
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default Settings;
