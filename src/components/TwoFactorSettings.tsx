import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Shield, Copy, Check } from "lucide-react";

export function TwoFactorSettings() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await api.twoFactor.getStatus();
      setEnabled(data.enabled);
    } catch (error: any) {
      toast.error("Failed to load 2FA status");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSecret = async () => {
    try {
      const data = await api.twoFactor.generateSecret();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setSetupMode(true);
    } catch (error: any) {
      toast.error("Failed to generate 2FA secret");
    }
  };

  const handleEnable = async () => {
    if (!verificationCode) {
      toast.error("Please enter verification code");
      return;
    }

    try {
      const data = await api.twoFactor.enable(verificationCode);
      setBackupCodes(data.backupCodes);
      setEnabled(true);
      toast.success("2FA enabled successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to enable 2FA");
    }
  };

  const handleDisable = async () => {
    if (!disablePassword) {
      toast.error("Please enter your password");
      return;
    }

    try {
      await api.twoFactor.disable(disablePassword);
      setEnabled(false);
      setSetupMode(false);
      setBackupCodes([]);
      setDisablePassword("");
      toast.success("2FA disabled successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to disable 2FA");
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success("Secret copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied to clipboard");
  };

  if (loading) {
    return <div className="glass rounded-lg p-6">Loading...</div>;
  }

  return (
    <div className="glass rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 border border-primary/30">
          <Shield className="h-5 w-5 text-primary-glow" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold">Two-Factor Authentication</h3>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account
          </p>
        </div>
      </div>

      {!enabled && !setupMode && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Two-factor authentication (2FA) adds an extra layer of security by requiring a code from your phone in addition to your password.
          </p>
          <Button onClick={handleGenerateSecret} className="glow-crimson-strong">
            Enable 2FA
          </Button>
        </div>
      )}

      {!enabled && setupMode && !backupCodes.length && (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Step 1: Scan QR Code</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            {qrCode && (
              <div className="bg-white p-4 rounded-lg inline-block">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-2">Or enter this secret manually:</h4>
            <div className="flex gap-2">
              <Input value={secret} readOnly className="font-mono-num" />
              <Button variant="outline" size="icon" onClick={copySecret}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Step 2: Enter Verification Code</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Enter the 6-digit code from your authenticator app
            </p>
            <div className="flex gap-2">
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="font-mono-num"
              />
              <Button onClick={handleEnable} className="glow-crimson-strong">
                Verify & Enable
              </Button>
            </div>
          </div>

          <Button variant="outline" onClick={() => setSetupMode(false)}>
            Cancel
          </Button>
        </div>
      )}

      {backupCodes.length > 0 && (
        <div className="space-y-4">
          <div className="glass-strong rounded-lg p-4 border border-primary/20">
            <h4 className="font-semibold mb-2 text-primary-glow">⚠️ Save Your Backup Codes</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Store these backup codes in a safe place. You can use them to access your account if you lose your phone.
            </p>
            <div className="bg-background/50 rounded p-4 mb-4">
              <div className="grid grid-cols-2 gap-2 font-mono-num text-sm">
                {backupCodes.map((code, idx) => (
                  <div key={idx}>{code}</div>
                ))}
              </div>
            </div>
            <Button onClick={copyBackupCodes} variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Copy All Codes
            </Button>
          </div>
          <Button onClick={() => { setBackupCodes([]); setSetupMode(false); }}>
            Done
          </Button>
        </div>
      )}

      {enabled && !setupMode && (
        <div className="space-y-4">
          <div className="glass-strong rounded-lg p-4 border border-green-500/20">
            <p className="text-sm text-green-400 font-semibold">✓ 2FA is enabled</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your account is protected with two-factor authentication
            </p>
          </div>

          <div>
            <Label htmlFor="disablePassword">Enter password to disable 2FA</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="disablePassword"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Your password"
              />
              <Button onClick={handleDisable} variant="destructive">
                Disable 2FA
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
