import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ExternalLink, Check, X, Clock, AlertCircle, Gift,
  Power, PowerOff, Search, Crown, Zap, Star, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth.context";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Payment {
  id: number;
  user_id: string;
  username: string;
  email: string;
  plan: string;
  amount: string;
  tx_hash: string;
  status: string;
  created_at: string;
  rejection_reason?: string;
}

const PLAN_OPTIONS = [
  { value: "starter",              label: "Starter (30 days)",            icon: <Zap className="h-4 w-4 text-primary" /> },
  { value: "pro",                  label: "Pro (30 days)",                 icon: <Star className="h-4 w-4 text-purple-400" /> },
  { value: "enterprise",           label: "Enterprise (30 days)",          icon: <Shield className="h-4 w-4 text-amber-400" /> },
  { value: "user_premium_monthly", label: "User Premium Monthly (30 days)",icon: <Crown className="h-4 w-4 text-yellow-400" /> },
  { value: "user_premium_yearly",  label: "User Premium Yearly (365 days)",icon: <Crown className="h-4 w-4 text-yellow-400" /> },
];

const AdminPayments = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  // Kill switch
  const [paymentsEnabled, setPaymentsEnabled] = useState<boolean>(true);
  const [togglingKillSwitch, setTogglingKillSwitch] = useState(false);

  // Grant subscription
  const [grantUserId, setGrantUserId] = useState("");
  const [grantPlan, setGrantPlan] = useState("starter");
  const [grantDays, setGrantDays] = useState("");
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    document.title = "Payment Management — Admin";
    if (!profile) { navigate("/auth"); return; }
    const roles = profile.roles || [];
    if (!roles.includes("admin")) { navigate("/"); return; }
    fetchPayments();
    fetchKillSwitchStatus();
  }, [profile, navigate]);

  const fetchPayments = async () => {
    try {
      const data = await api.payments.getPending();
      setPayments(data);
    } catch (error: any) {
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchKillSwitchStatus = async () => {
    try {
      const data = await api.payments.getAdminStatus();
      setPaymentsEnabled(data.enabled);
    } catch {}
  };

  const handleToggleKillSwitch = async () => {
    if (!confirm(`Are you sure you want to ${paymentsEnabled ? "DISABLE" : "ENABLE"} the payment system?`)) return;
    setTogglingKillSwitch(true);
    try {
      const data = await api.payments.setAdminStatus(!paymentsEnabled);
      setPaymentsEnabled(data.enabled);
      toast.success(`Payments ${data.enabled ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update payment status");
    } finally {
      setTogglingKillSwitch(false);
    }
  };

  const handleActivate = async (paymentId: number) => {
    if (!confirm("Activate this payment? This will grant the user premium access.")) return;
    setProcessing(paymentId);
    try {
      await api.payments.activate(paymentId);
      toast.success("Payment activated!");
      fetchPayments();
    } catch {
      toast.error("Failed to activate payment");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (paymentId: number) => {
    const reason = prompt("Enter rejection reason (will be sent to user):");
    if (!reason) return;
    setProcessing(paymentId);
    try {
      await api.payments.reject(paymentId, reason);
      toast.success("Payment rejected");
      fetchPayments();
    } catch {
      toast.error("Failed to reject payment");
    } finally {
      setProcessing(null);
    }
  };

  const handleGrantSubscription = async () => {
    if (!grantUserId.trim()) { toast.error("Enter a user ID"); return; }
    if (!grantPlan) { toast.error("Select a plan"); return; }
    if (!confirm(`Grant ${grantPlan} to user ${grantUserId}?`)) return;

    setGranting(true);
    try {
      const res = await api.payments.grantSubscription({
        userId: grantUserId.trim(),
        plan: grantPlan,
        days: grantDays ? Number(grantDays) : undefined,
      });
      toast.success(res.message);
      setGrantUserId("");
      setGrantDays("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to grant subscription");
    } finally {
      setGranting(false);
    }
  };

  const getTronScanUrl = (txHash: string) => `https://tronscan.org/#/transaction/${txHash}`;

  const getPlanBadge = (plan: string) => {
    if (plan.includes("enterprise")) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    if (plan.includes("pro"))        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    if (plan.includes("premium"))    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  };

  if (loading) {
    return <div className="container py-16 text-center text-muted-foreground">Loading payments…</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1">
          Payment <span className="text-crimson-gradient">Management</span>
        </h1>
        <p className="text-muted-foreground text-sm">Review pending payments, grant subscriptions, and control the payment system.</p>
      </div>

      {/* ── Controls row ─────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Kill switch */}
        <div className={cn(
          "glass rounded-2xl p-5 border",
          paymentsEnabled ? "border-green-500/20" : "border-red-500/30 bg-red-500/5"
        )}>
          <div className="flex items-center gap-3 mb-3">
            {paymentsEnabled
              ? <Power className="h-5 w-5 text-green-400" />
              : <PowerOff className="h-5 w-5 text-red-400" />}
            <div>
              <h3 className="font-semibold text-sm">Payment System</h3>
              <p className={cn("text-xs", paymentsEnabled ? "text-green-400" : "text-red-400")}>
                {paymentsEnabled ? "● Online — accepting payments" : "● Offline — payments disabled"}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Disabling payments shows a maintenance message on the payment page. Existing subscriptions are unaffected.
          </p>
          <Button
            onClick={handleToggleKillSwitch}
            disabled={togglingKillSwitch}
            variant={paymentsEnabled ? "destructive" : "default"}
            size="sm"
            className="w-full"
          >
            {togglingKillSwitch ? "Updating…" : paymentsEnabled ? "Disable Payments" : "Enable Payments"}
          </Button>
        </div>

        {/* Grant subscription */}
        <div className="glass rounded-2xl p-5 border border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <Gift className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-sm">Grant Subscription</h3>
              <p className="text-xs text-muted-foreground">Give any user a plan for free</p>
            </div>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="User ID (UUID)"
              value={grantUserId}
              onChange={e => setGrantUserId(e.target.value)}
              className="text-xs h-8"
            />
            <div className="grid grid-cols-2 gap-2">
              <Select value={grantPlan} onValueChange={setGrantPlan}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map(p => (
                    <SelectItem key={p.value} value={p.value} className="text-xs">
                      <span className="flex items-center gap-1.5">{p.icon}{p.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Days (optional)"
                type="number"
                min={1}
                value={grantDays}
                onChange={e => setGrantDays(e.target.value)}
                className="text-xs h-8"
              />
            </div>
            <Button
              onClick={handleGrantSubscription}
              disabled={granting || !grantUserId.trim()}
              size="sm"
              variant="hero"
              className="w-full"
            >
              {granting ? "Granting…" : "Grant Subscription"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Pending payments ─────────────────────────────────────────────── */}
      <div>
        <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-400" />
          Pending Payments
          {payments.length > 0 && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
              {payments.length}
            </span>
          )}
        </h2>

        {payments.length === 0 ? (
          <div className="glass rounded-xl p-10 text-center">
            <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground text-sm">No pending payments. All caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="glass rounded-xl p-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold">{payment.username}</p>
                      <p className="text-xs text-muted-foreground">{payment.email}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{payment.user_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", getPlanBadge(payment.plan))}>
                        {payment.plan.replace(/_/g, " ").toUpperCase()}
                      </span>
                      <span className="font-bold text-primary-glow">${payment.amount} USDT</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(payment.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-black/20 px-2 py-1.5 rounded border border-white/10 font-mono break-all">
                          {payment.tx_hash}
                        </code>
                        <Button variant="outline" size="icon" className="h-7 w-7 flex-shrink-0" asChild>
                          <a href={getTronScanUrl(payment.tx_hash)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div className="glass-strong rounded-lg p-3 border border-primary/20">
                      <div className="flex gap-2 mb-3">
                        <AlertCircle className="h-4 w-4 text-primary-glow flex-shrink-0 mt-0.5" />
                        <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-0.5">
                          <li>Click link icon → verify on TronScan</li>
                          <li>Confirm amount = ${payment.amount} USDT</li>
                          <li>Confirm transaction is confirmed</li>
                          <li>Verify receiving address matches yours</li>
                        </ol>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleActivate(payment.id)}
                          disabled={processing === payment.id}
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          {processing === payment.id ? "Processing…" : "Activate"}
                        </Button>
                        <Button
                          onClick={() => handleReject(payment.id)}
                          disabled={processing === payment.id}
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayments;
