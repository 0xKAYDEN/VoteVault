import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Copy, Check, AlertCircle, Crown, Loader2, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth.context";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";

// ── Wallet addresses from env ─────────────────────────────────────────────────
const TRC20_ADDRESS = import.meta.env.VITE_USDT_WALLET  || "TN1ZCfcKKmigD8NBCdvdAndw6GKHtKNxDU";
const BEP20_ADDRESS = import.meta.env.VITE_BEP20_WALLET || "0xYourBEP20WalletAddressHere";

const NETWORKS = [
  {
    id:      "trc20",
    label:   "TRC20",
    full:    "TRC20 (TRON)",
    address: TRC20_ADDRESS,
    color:   "border-red-500/40 text-red-400 bg-red-500/5",
    activeColor: "border-red-500 bg-red-500/15 text-red-300",
    warning: "TRC20 network only. Wrong network = lost funds.",
    hashLen: 64,   // TRON tx hash = 64 hex chars
  },
  {
    id:      "bep20",
    label:   "BEP20",
    full:    "BEP20 (BSC)",
    address: BEP20_ADDRESS,
    color:   "border-yellow-500/40 text-yellow-400 bg-yellow-500/5",
    activeColor: "border-yellow-500 bg-yellow-500/15 text-yellow-300",
    warning: "BEP20 (Binance Smart Chain) only. Wrong network = lost funds.",
    hashLen: 64,   // BSC tx hash = 64 hex chars (0x + 64 = 66 chars, but we strip 0x)
  },
] as const;

type NetworkId = typeof NETWORKS[number]["id"];

// ── Plans ─────────────────────────────────────────────────────────────────────
type PlanInfo = { name: string; price: string; period: string; features: string[]; isPremium?: boolean };
const PLANS: Record<string, PlanInfo> = {
  user_premium_monthly: { name: "User Premium", price: "4.99", period: "month", isPremium: true, features: ["Premium badge & themes","Animated avatar","1000-char bio","Profile banner","Unlimited friends","Custom status","Friend groups","Vote streak bonuses","Double XP","Exclusive achievements","Vote history export","Ad-free","Priority support","Custom emojis"] },
  user_premium_yearly:  { name: "User Premium (Yearly)", price: "49", period: "year", isPremium: true, features: ["All monthly Premium features","Save 18% vs monthly"] },
  starter:    { name: "Starter",    price: "4.99",  period: "month", features: ["Priority search placement","Custom banner & logo","Vote analytics & referrer tracking","Server verified badge","API: 5,000 req/day","Email support"] },
  pro:        { name: "Pro",        price: "14.99", period: "month", features: ["Everything in Starter","Top 10 placement boost","Advanced analytics & geo data","API: 50,000 req/day","Discord webhooks","Priority support"] },
  enterprise: { name: "Enterprise", price: "39.99", period: "month", features: ["Everything in Pro","Guaranteed top 3 placement","Custom branding","API: Unlimited","Dedicated manager","24/7 support"] },
  basic:      { name: "Starter",    price: "4.99",  period: "month", features: ["Priority listing","Custom banner","Basic analytics"] },
};

// ── Component ─────────────────────────────────────────────────────────────────
const Payment = () => {
  const location    = useLocation();
  const navigate    = useNavigate();
  const { profile } = useAuth();

  const [networkId, setNetworkId]   = useState<NetworkId>("trc20");
  const [copied, setCopied]         = useState(false);
  const [txHash, setTxHash]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState<{ status: "active" | "pending"; autoActivated: boolean } | null>(null);

  const plan        = location.state?.plan || "starter";
  const planDetails = PLANS[plan] ?? PLANS.starter;
  const gold        = planDetails.isPremium;
  const network     = NETWORKS.find(n => n.id === networkId)!;

  useEffect(() => {
    document.title = "Payment — VoteVault";
    if (!profile) navigate("/auth");
  }, [profile, navigate]);

  // Reset tx hash when switching networks
  const switchNetwork = (id: NetworkId) => {
    setNetworkId(id);
    setTxHash("");
    setCopied(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(network.address);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 2000);
  };

  // Normalise BSC hash: strip leading 0x if present
  const normalisedHash = txHash.trim().replace(/^0x/i, "");

  const handleSubmit = async () => {
    if (!normalisedHash) { toast.error("Enter your transaction hash"); return; }
    if (!/^[a-fA-F0-9]{64}$/.test(normalisedHash)) {
      toast.error("Invalid hash — must be 64 hex characters (BSC hashes start with 0x, that's fine)");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.payments.verify({
        plan,
        txHash: normalisedHash,
        amount: Number(planDetails.price),
        network: networkId,
      } as any) as any;
      setResult({ status: res.status, autoActivated: res.autoActivated });
      if (res.autoActivated) {
        toast.success("Payment verified automatically! Your plan is now active.");
        setTimeout(() => navigate("/dashboard/premium"), 3000);
      } else {
        toast.success("Payment submitted! Activation within 10 minutes.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit payment");
    } finally { setSubmitting(false); }
  };

  if (!profile) return null;

  // ── Success screen ────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="container py-16 max-w-lg text-center">
        <div className="glass rounded-2xl p-10 space-y-5">
          {result.autoActivated ? (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto" />
              <h1 className="font-display text-3xl font-bold">Payment Verified!</h1>
              <p className="text-muted-foreground">Your <strong className="text-foreground">{planDetails.name}</strong> plan is now active. Redirecting…</p>
            </>
          ) : (
            <>
              <Clock className="h-16 w-16 text-yellow-400 mx-auto" />
              <h1 className="font-display text-3xl font-bold">Payment Submitted</h1>
              <p className="text-muted-foreground">We're verifying your transaction. Your plan will activate within <strong className="text-foreground">10 minutes</strong>.</p>
              <Button variant="hero" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Main page ─────────────────────────────────────────────────────────────
  return (
    <div className="container py-16 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">
          Complete Your <span className="text-crimson-gradient">Payment</span>
        </h1>
        <p className="text-muted-foreground">
          Subscribing to <span className="font-semibold text-foreground">{planDetails.name}</span>
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* ── Order Summary ─────────────────────────────────────────────── */}
        <div className="glass rounded-xl p-6">
          <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            {gold && <Crown className="h-5 w-5 text-yellow-400" />} Order Summary
          </h2>
          <div className="space-y-3 mb-5">
            <div className="flex justify-between pb-3 border-b border-white/10">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-semibold">{planDetails.name}</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-white/10">
              <span className="text-muted-foreground">Billing</span>
              <span className="font-semibold capitalize">{planDetails.period}</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-white/10">
              <span className="text-muted-foreground">Network</span>
              <span className="font-semibold text-green-400">{network.full}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Total</span>
              <span className={`font-display text-2xl font-bold ${gold ? "text-yellow-400" : "text-primary-glow"}`}>
                {planDetails.price} USDT
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold mb-1">Included:</p>
            {planDetails.features.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${gold ? "text-yellow-400" : "text-primary-glow"}`} />
                <span className="text-sm text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Payment Instructions ──────────────────────────────────────── */}
        <div className="space-y-5">
          <div className="glass rounded-xl p-6 space-y-5">
            <h2 className="font-display text-xl font-bold">Payment Instructions</h2>

            {/* Network selector */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">1. Choose network:</Label>
              <div className="grid grid-cols-2 gap-2">
                {NETWORKS.map(n => (
                  <button
                    key={n.id}
                    onClick={() => switchNetwork(n.id)}
                    className={`rounded-xl border-2 p-3 text-sm font-bold transition-all ${
                      networkId === n.id ? n.activeColor : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                    }`}
                  >
                    <div className="text-base font-display">{n.label}</div>
                    <div className="text-[10px] font-normal opacity-70">{n.full}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3 py-1">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Scan with Bybit, Binance, or any wallet
              </p>
              <div className="bg-white p-3 rounded-xl shadow-lg">
                <QRCodeSVG
                  key={network.id}          /* re-render when network changes */
                  value={network.address}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                <span className="font-semibold text-foreground">{network.full}</span><br />
                <span className="text-yellow-400 font-semibold">Send exactly {planDetails.price} USDT</span>
              </p>
            </div>

            {/* Address */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">2. Send USDT to this address:</Label>
              <div className="flex gap-2">
                <Input value={network.address} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={copyAddress} className="flex-shrink-0">
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Warning */}
            <div className="glass-strong rounded-lg p-3 border border-primary/20 flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary-glow flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">{network.warning}</p>
                <p className="text-muted-foreground mt-0.5">
                  Send exactly <strong>{planDetails.price} USDT</strong>.
                </p>
              </div>
            </div>

            {/* TX Hash */}
            <div>
              <Label htmlFor="txHash" className="text-sm font-semibold mb-2 block">
                3. Enter transaction hash:
              </Label>
              <Input
                id="txHash"
                placeholder={networkId === "bep20" ? "0x… or 64-char hex hash" : "64-character hex hash…"}
                value={txHash}
                onChange={e => setTxHash(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Find this in your wallet after sending. We'll verify it automatically.
                {networkId === "bep20" && " BSC hashes starting with 0x are accepted."}
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !txHash.trim()}
              size="lg"
              className={`w-full ${gold
                ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold hover:from-yellow-400 hover:to-amber-400"
                : "glow-crimson-strong"}`}
            >
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Verifying…</>
                : "Submit & Verify Payment"}
            </Button>
          </div>

          <div className="glass rounded-xl p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-2">What happens next?</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>We verify your transaction on the blockchain automatically</li>
              <li>If verified instantly, your plan activates immediately</li>
              <li>Otherwise, activation within 10 minutes by our team</li>
              <li>You will receive a confirmation email</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
