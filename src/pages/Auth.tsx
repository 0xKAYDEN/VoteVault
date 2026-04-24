import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Crown, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, login, register } = useAuth();
  const [tab, setTab] = useState(params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = "Sign In — Conquer Top 100"; }, []);
  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);

  const handleSignIn = async () => {
    setBusy(true);
    try {
      const response = await login({ email, password, twoFactorToken });

      if (response?.requires2FA) {
        setRequires2FA(true);
        toast.info("Please enter your 2FA code");
      } else {
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async () => {
    setBusy(true);
    try {
      await register({ email, password, username });
      toast.success("Account created!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-16 max-w-md">
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-crimson glow-crimson mb-3">
          <Crown className="h-7 w-7 text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold">Welcome, Warrior</h1>
        <p className="text-muted-foreground text-sm mt-1">Sign in to vote, review, and list servers.</p>
      </div>

      <div className="glass-strong rounded-2xl p-6 animate-scale-in">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 mb-6 bg-white/5">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
            {requires2FA && (
              <div>
                <Label>Two-Factor Code</Label>
                <Input
                  type="text"
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value)}
                  placeholder="Enter 6-digit code or backup code"
                  className="bg-white/5 border-white/10"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground mt-1">Enter code from your authenticator app or use a backup code.</p>
              </div>
            )}
            <Button variant="hero" className="w-full" onClick={handleSignIn} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10" />
              <p className="text-xs text-muted-foreground mt-1">At least 6 characters.</p>
            </div>
            <Button variant="hero" className="w-full" onClick={handleSignUp} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        By continuing you agree to our terms. <Link to="/" className="text-primary hover:underline">Back home</Link>
      </p>
    </div>
  );
};

export default Auth;
