import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Crown, Loader2, Eye, EyeOff, Mail, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import ReCAPTCHA from "react-google-recaptcha";
import { ButtonLoading } from "@/components/LoadingStates";

// reCAPTCHA v2 Site Key - set VITE_RECAPTCHA_V2_SITE_KEY in your .env
const RECAPTCHA_V2_SITE_KEY = import.meta.env.VITE_RECAPTCHA_V2_SITE_KEY;
if (!RECAPTCHA_V2_SITE_KEY) {
  console.warn("[Auth] VITE_RECAPTCHA_V2_SITE_KEY is not set. reCAPTCHA will not render.");
}

const Auth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, login, register } = useAuth();
  const [tab, setTab] = useState(params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginRecaptchaToken, setLoginRecaptchaToken] = useState<string | null>(null);
  const [signupRecaptchaToken, setSignupRecaptchaToken] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [registered, setRegistered] = useState(false);          // show "check email" screen
  const [unverifiedEmail, setUnverifiedEmail] = useState("");   // blocked login — show resend
  const [resending, setResending] = useState(false);
  const loginRecaptchaRef = useRef<ReCAPTCHA>(null);
  const signupRecaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => { document.title = "Sign In — VoteVault"; }, []);
  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);

  const handleSignIn = async () => {
    if (!loginRecaptchaToken) {
      toast.error("Please complete the reCAPTCHA verification");
      return;
    }

    setBusy(true);
    try {
      const response = await login({ email, password, twoFactorToken, recaptchaToken: loginRecaptchaToken, rememberMe });

      if (response?.requires2FA) {
        setRequires2FA(true);
        toast.info("Please enter your 2FA code");
      } else {
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (error: any) {
      // Email not verified — show resend option
      if (error?.requiresVerification || error?.message?.includes('verify your email')) {
        setUnverifiedEmail(email);
      }
      toast.error(error.message);
      loginRecaptchaRef.current?.reset();
      setLoginRecaptchaToken(null);
    } finally {
      setBusy(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await api.auth.resendVerification(unverifiedEmail);
      toast.success("Verification email sent — check your inbox.");
      setUnverifiedEmail("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend");
    } finally {
      setResending(false);
    }
  };

  const handleSignUp = async () => {
    if (!signupRecaptchaToken) {
      toast.error("Please complete the reCAPTCHA verification");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      await register({ email, password, username, recaptchaToken: signupRecaptchaToken });
      setRegistered(true);
    } catch (error: any) {
      toast.error(error.message);
      signupRecaptchaRef.current?.reset();
      setSignupRecaptchaToken(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-16 max-w-md">

      {/* ── Registration success: check your email ── */}
      {registered ? (
        <div className="glass rounded-2xl p-8 text-center space-y-5 animate-fade-in">
          <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 mx-auto">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm">
            We sent a verification link to <span className="text-foreground font-semibold">{email}</span>.
            Click the link to activate your account before signing in.
          </p>
          <p className="text-xs text-muted-foreground">Didn't get it? Check your spam folder.</p>
          <Button
            variant="outline"
            className="w-full"
            disabled={resending}
            onClick={async () => {
              setResending(true);
              try {
                await api.auth.resendVerification(email);
                toast.success("New verification email sent!");
              } catch (e: any) {
                toast.error(e?.message || "Failed to resend");
              } finally {
                setResending(false);
              }
            }}
          >
            {resending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Resend verification email
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setRegistered(false)}>
            Back to Sign In
          </Button>
        </div>
      ) : (
        <>
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
                {/* Unverified email banner */}
                {unverifiedEmail && (
                  <div className="glass rounded-xl p-3 border border-yellow-500/30 flex items-start gap-3">
                    <Mail className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-yellow-400 font-semibold">Email not verified</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Check your inbox or resend the link.</p>
                    </div>
                    <Button
                      size="sm" variant="outline"
                      className="text-xs shrink-0 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                      disabled={resending}
                      onClick={handleResendVerification}
                    >
                      {resending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Resend"}
                    </Button>
                  </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); handleSignIn(); }} className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10" required />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showLoginPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/5 border-white/10 pr-10"
                        required
                      />
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        {showLoginPassword
                          ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                          : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ReCAPTCHA
                      ref={loginRecaptchaRef}
                      sitekey={RECAPTCHA_V2_SITE_KEY}
                      onChange={(token) => setLoginRecaptchaToken(token)}
                      onExpired={() => setLoginRecaptchaToken(null)}
                      theme="dark"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 accent-primary"
                    />
                    <span className="text-sm text-muted-foreground">Remember me for 30 days</span>
                  </label>

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

                  <Button type="submit" variant="hero" className="w-full" disabled={busy || !loginRecaptchaToken}>
                    <ButtonLoading isLoading={busy} loadingText="Signing in...">Sign In</ButtonLoading>
                  </Button>
                  <div className="text-center">
                    <Link to="/reset-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      Forgot your password?
                    </Link>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="space-y-4">
                  <div>
                    <Label>Username</Label>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-white/5 border-white/10" required />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10" required />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showSignupPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/5 border-white/10 pr-10"
                        required
                      />
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                      >
                        {showSignupPassword
                          ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                          : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">At least 6 characters.</p>
                  </div>
                  <div>
                    <Label>Confirm Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-white/5 border-white/10 pr-10"
                        required
                      />
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword
                          ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                          : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ReCAPTCHA
                      ref={signupRecaptchaRef}
                      sitekey={RECAPTCHA_V2_SITE_KEY}
                      onChange={(token) => setSignupRecaptchaToken(token)}
                      onExpired={() => setSignupRecaptchaToken(null)}
                      theme="dark"
                    />
                  </div>

                  <Button type="submit" variant="hero" className="w-full" disabled={busy || !signupRecaptchaToken}>
                    <ButtonLoading isLoading={busy} loadingText="Creating account...">Create Account</ButtonLoading>
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing you agree to our terms. <Link to="/" className="text-primary hover:underline">Back home</Link>
          </p>
        </>
      )}
    </div>
  );
};

export default Auth;
