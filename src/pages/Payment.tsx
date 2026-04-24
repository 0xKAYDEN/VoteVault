import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth.context";
import { toast } from "sonner";
import { api } from "@/lib/api";

const PLANS = {
  basic: { name: "Basic", price: "10", features: ["Priority listing", "Custom banner", "Basic analytics"] },
  pro: { name: "Pro", price: "25", features: ["Everything in Basic", "Featured badge", "Advanced analytics", "API boost"] },
  enterprise: { name: "Enterprise", price: "50", features: ["Everything in Pro", "Top placement", "Custom branding", "Unlimited API"] },
};

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const plan = location.state?.plan || "basic";
  const planDetails = PLANS[plan as keyof typeof PLANS] || PLANS.basic;

  // TODO: Replace with your actual USDT TRC20 wallet address
  // Get a TRC20 wallet from: TronLink, Trust Wallet, or any TRC20-compatible wallet
  const USDT_ADDRESS = "TN1ZCfcKKmigD8NBCdvdAndw6GKHtKNxDU"; // ⚠️ REPLACE THIS WITH YOUR ACTUAL WALLET

  useEffect(() => {
    document.title = "Payment — VoteVault";
    if (!profile) {
      navigate("/auth");
    }
  }, [profile, navigate]);

  const copyAddress = () => {
    navigator.clipboard.writeText(USDT_ADDRESS);
    setCopied(true);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPayment = async () => {
    if (!txHash.trim()) {
      toast.error("Please enter your transaction hash");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/payments/verify", {
        plan,
        txHash: txHash.trim(),
        amount: planDetails.price,
      });

      toast.success("Payment submitted! We'll verify and activate your plan within 10 minutes.");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="container py-16 max-w-4xl">
      <div className="mb-8 animate-fade-in">
        <h1 className="font-display text-4xl font-bold mb-2">
          Complete Your <span className="text-crimson-gradient">Payment</span>
        </h1>
        <p className="text-muted-foreground">
          You're subscribing to the {planDetails.name} plan
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass rounded-lg p-6">
          <h2 className="font-display text-2xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-semibold">{planDetails.name}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-muted-foreground">Billing Period</span>
              <span className="font-semibold">Monthly</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-display text-2xl font-bold text-primary-glow">
                {planDetails.price} USDT
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-2">Included Features:</p>
            {planDetails.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary-glow" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-lg p-6">
            <h2 className="font-display text-xl font-bold mb-4">Payment Instructions</h2>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  1. Send USDT (TRC20) to this address:
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={USDT_ADDRESS}
                    readOnly
                    className="font-mono-num text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyAddress}
                    className="flex-shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="glass-strong rounded-lg p-4 border border-primary/20">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-primary-glow flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-foreground">Important:</p>
                    <p className="text-muted-foreground">
                      Only send USDT on the TRC20 network. Sending other tokens or using wrong network will result in loss of funds.
                    </p>
                    <p className="text-muted-foreground">
                      Amount: Exactly {planDetails.price} USDT
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="txHash" className="text-sm font-semibold mb-2 block">
                  2. Enter your transaction hash:
                </Label>
                <Input
                  id="txHash"
                  placeholder="0x..."
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="font-mono-num"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  You can find this in your wallet after sending the payment
                </p>
              </div>

              <Button
                onClick={handleSubmitPayment}
                disabled={submitting || !txHash.trim()}
                className="w-full glow-crimson-strong"
                size="lg"
              >
                {submitting ? "Submitting..." : "Submit Payment"}
              </Button>
            </div>
          </div>

          <div className="glass rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-2">What happens next?</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>We verify your transaction on the blockchain</li>
              <li>Your plan activates within 10 minutes</li>
              <li>You'll receive a confirmation email</li>
              <li>All premium features unlock immediately</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
