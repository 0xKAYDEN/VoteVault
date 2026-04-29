import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Crown, Eye, EyeOff, Mail, CheckCircle2 } from "lucide-react";

const ResetPassword = () => {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const token           = searchParams.get("token");

  // ── Request mode (no token) ───────────────────────────────────────────────
  const [email, setEmail]           = useState("");
  const [emailSent, setEmailSent]   = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // ── Reset mode (has token) ────────────────────────────────────────────────
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [resetting, setResetting]       = useState(false);
  const [done, setDone]                 = useState(false);

  useEffect(() => { document.title = "Reset Password — VoteVault"; }, []);

  // ── Send reset email ──────────────────────────────────────────────────────
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Enter your email address"); return; }
    setSendingEmail(true);
    try {
      await api.auth.forgotPassword(email.trim());
      setEmailSent(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setSendingEmail(false);
    }
  };

  // ── Submit new password ───────────────────────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setResetting(true);
    try {
      await api.auth.resetPassword(token!, password);
      setDone(true);
      toast.success("Password reset successfully!");
    } catch (err: any) {
      // If token is invalid/expired, switch to request mode so user can get a new link
      if (err.message?.toLowerCase().includes('invalid') || err.message?.toLowerCase().includes('expired')) {
        toast.error("This reset link has expired. Please request a new one.");
        // Navigate to the request form (no token)
        navigate("/reset-password", { replace: true });
      } else {
        toast.error(err.message || "Failed to reset password.");
      }
    } finally {
      setResetting(false);
    }
  };

  // ── Success: password was reset ───────────────────────────────────────────
  if (done) {
    return (
      <div className="container py-16 max-w-md">
        <div className="glass rounded-2xl p-8 text-center space-y-4">
          <CheckCircle2 className="h-14 w-14 text-green-400 mx-auto" />
          <h1 className="font-display text-2xl font-bold">Password Reset!</h1>
          <p className="text-muted-foreground">Your password has been updated. You can now sign in.</p>
          <Button variant="hero" className="w-full" onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </div>
    );
  }

  // ── Success: email was sent ───────────────────────────────────────────────
  if (emailSent) {
    return (
      <div className="container py-16 max-w-md">
        <div className="glass rounded-2xl p-8 text-center space-y-4">
          <Mail className="h-14 w-14 text-primary mx-auto" />
          <h1 className="font-display text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            If <span className="text-foreground font-semibold">{email}</span> is registered, we've sent a password reset link. Check your inbox (and spam folder).
          </p>
          <p className="text-xs text-muted-foreground">The link expires in 24 hours.</p>
          <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>Back to Sign In</Button>
        </div>
      </div>
    );
  }

  // ── Mode: no token → request reset email ─────────────────────────────────
  if (!token) {
    return (
      <div className="container py-16 max-w-md">
        <div className="text-center mb-8">
          <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-crimson glow-crimson mb-3">
            <Crown className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold">Forgot Password?</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter your email and we'll send you a reset link.</p>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={sendingEmail} className="w-full glow-crimson-strong" size="lg">
              {sendingEmail ? "Sending…" : "Send Reset Link"}
            </Button>
            <div className="text-center">
              <Link to="/auth" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Mode: has token → enter new password ─────────────────────────────────
  return (
    <div className="container py-16 max-w-md">
      <div className="text-center mb-8">
        <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-crimson glow-crimson mb-3">
          <Crown className="h-7 w-7 text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold">Reset Password</h1>
        <p className="text-muted-foreground text-sm mt-1">Enter your new password below.</p>
      </div>

      <div className="glass-strong rounded-2xl p-6">
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <Label htmlFor="password">New Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative mt-1">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your new password"
                required
                minLength={6}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowConfirm(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={resetting} className="w-full glow-crimson-strong" size="lg">
            {resetting ? "Resetting…" : "Reset Password"}
          </Button>

          <div className="text-center">
            <Link to="/auth" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
