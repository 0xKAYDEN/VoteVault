import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Check, X, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth.context";
import { api } from "@/lib/api";
import { toast } from "sonner";

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

const AdminPayments = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Payment Management — Admin";

    if (!profile) {
      navigate("/auth");
      return;
    }

    const roles = profile.roles || [];
    if (!roles.includes("admin")) {
      navigate("/");
      return;
    }

    fetchPayments();
  }, [profile, navigate]);

  const fetchPayments = async () => {
    try {
      const data = await api.payments.getPending();
      setPayments(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (paymentId: number) => {
    if (!confirm("Are you sure you want to activate this payment? This will grant the user premium access.")) {
      return;
    }

    setProcessing(paymentId);
    try {
      await api.payments.activate(paymentId);
      toast.success("Payment activated successfully!");
      fetchPayments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to activate payment");
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
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to reject payment");
    } finally {
      setProcessing(null);
    }
  };

  const getTronScanUrl = (txHash: string) => {
    return `https://tronscan.org/#/transaction/${txHash}`;
  };

  const getPlanBadge = (plan: string) => {
    const colors = {
      basic: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      pro: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      enterprise: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    };
    return colors[plan as keyof typeof colors] || colors.basic;
  };

  if (loading) {
    return (
      <div className="container py-16">
        <div className="text-center">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">
          Payment <span className="text-crimson-gradient">Management</span>
        </h1>
        <p className="text-muted-foreground">
          Review and verify pending USDT payments
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="glass rounded-lg p-12 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-display text-xl font-semibold mb-2">No Pending Payments</h3>
          <p className="text-muted-foreground">
            All payments have been processed. New submissions will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="glass rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-xl font-bold mb-1">
                      {payment.username}
                    </h3>
                    <p className="text-sm text-muted-foreground">{payment.email}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPlanBadge(
                        payment.plan
                      )}`}
                    >
                      {payment.plan.toUpperCase()}
                    </span>
                    <span className="font-display text-lg font-bold text-primary-glow">
                      ${payment.amount} USDT
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                    <p className="text-sm">
                      {new Date(payment.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Transaction Hash</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-background/50 px-3 py-2 rounded border border-border font-mono-num break-all">
                        {payment.tx_hash}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        asChild
                        className="flex-shrink-0"
                      >
                        <a
                          href={getTronScanUrl(payment.tx_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="glass-strong rounded-lg p-4 border border-primary/20">
                    <div className="flex gap-3 mb-4">
                      <AlertCircle className="h-5 w-5 text-primary-glow flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold mb-1">Verification Steps:</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                          <li>Click the link icon to view on TronScan</li>
                          <li>Verify amount matches ${payment.amount} USDT</li>
                          <li>Verify transaction is confirmed</li>
                          <li>Check receiving address matches yours</li>
                        </ol>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleActivate(payment.id)}
                        disabled={processing === payment.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {processing === payment.id ? "Processing..." : "Activate"}
                      </Button>
                      <Button
                        onClick={() => handleReject(payment.id)}
                        disabled={processing === payment.id}
                        variant="destructive"
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
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
  );
};

export default AdminPayments;
