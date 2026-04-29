import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();

  // Resend form
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link.");
      return;
    }

    api.auth.verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified. Redirecting to sign in…");
      })
      .catch((err: any) => {
        setStatus("error");
        setMessage(err?.message || "This verification link is invalid or has already been used.");
      });
  }, [token]);

  // Auto-redirect to /auth 3 seconds after successful verification
  useEffect(() => {
    if (status !== "success") return;
    if (countdown <= 0) { navigate("/auth"); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown, navigate]);

  const handleResend = async () => {
    if (!resendEmail.trim()) { toast.error("Enter your email address"); return; }
    setResending(true);
    try {
      await api.auth.resendVerification(resendEmail.trim());
      setResent(true);
      toast.success("Verification email sent — check your inbox.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center space-y-5">

        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <h1 className="font-display text-2xl font-bold">Verifying your email…</h1>
            <p className="text-muted-foreground text-sm">Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-14 w-14 text-green-400 mx-auto" />
            <h1 className="font-display text-2xl font-bold">Email Verified!</h1>
            <p className="text-muted-foreground text-sm">{message}</p>
            <p className="text-xs text-muted-foreground">
              Redirecting in <span className="text-primary font-semibold">{countdown}</span>s…
            </p>
            <Button variant="hero" onClick={() => navigate("/auth")} className="w-full">
              Sign In Now
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-14 w-14 text-destructive mx-auto" />
            <h1 className="font-display text-2xl font-bold">Verification Failed</h1>
            <p className="text-muted-foreground text-sm">{message}</p>

            {/* Resend section */}
            {!resent ? (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">Need a new verification link?</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={resendEmail}
                    onChange={e => setResendEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleResend()}
                    className="bg-white/5 border-white/10"
                  />
                  <Button onClick={handleResend} disabled={resending} variant="outline" className="shrink-0">
                    {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center text-sm text-green-400">
                <Mail className="h-4 w-4" />
                Check your inbox for a new verification link.
              </div>
            )}

            <Button variant="ghost" asChild className="w-full text-muted-foreground">
              <Link to="/auth">Back to Sign In</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
