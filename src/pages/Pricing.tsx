import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Zap, Users, BarChart3, Star, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth.context";
import { cn } from "@/lib/utils";

const Pricing = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => { document.title = "Pricing — VoteVault"; }, []);

  const handleSelectPlan = (plan: string) => {
    if (!profile) { navigate("/auth"); return; }
    navigate("/payment", { state: { plan } });
  };

  return (
    <div className="container py-16 max-w-7xl">
      {/* Hero */}
      <div className="text-center mb-16 animate-fade-in">
        <span className="text-xs uppercase tracking-widest text-primary">Pricing Plans</span>
        <h1 className="font-display text-5xl md:text-6xl font-bold mt-2 mb-4">
          Choose Your <span className="text-crimson-gradient">Plan</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Boost your server's visibility or unlock premium profile features. Pay securely with USDT (TRC20).
        </p>
      </div>

      {/* User Premium */}
      <section className="mb-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2 mb-4">
            <Crown className="h-5 w-5 text-yellow-400" />
            <span className="font-semibold text-yellow-400">User Premium</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Level Up Your Profile</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Stand out with exclusive badges, themes, unlimited friends, and double XP rewards.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Monthly */}
          <div className="glass rounded-2xl p-8 border border-yellow-500/20 hover:border-yellow-500/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-yellow-400">Monthly</span>
              <Crown className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="mb-6">
              <span className="font-display text-5xl font-bold text-yellow-400">$4.99</span>
              <span className="text-muted-foreground ml-2">/ month</span>
            </div>
            <Button onClick={() => handleSelectPlan("user_premium_monthly")} className="w-full mb-6 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold hover:from-yellow-400 hover:to-amber-400">
              Get Premium
            </Button>
            <div className="space-y-2.5">
              {["Premium badge & profile themes", "Animated avatar support", "1000-char bio", "Profile banner", "Unlimited friends", "Custom status", "Friend groups", "Vote streak bonuses", "Double XP", "Exclusive achievements", "Vote history export", "Custom emojis"].map((f, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Yearly */}
          <div className="glass rounded-2xl p-8 border-2 border-yellow-500/50 hover:border-yellow-500/70 transition-all relative shadow-[0_0_30px_rgba(234,179,8,0.15)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
              SAVE 18%
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-yellow-400">Yearly</span>
              <Crown className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="mb-6">
              <span className="font-display text-5xl font-bold text-yellow-400">$49</span>
              <span className="text-muted-foreground ml-2">/ year</span>
              <div className="text-sm text-green-400 mt-2">$4.08/month · Save $10.88 annually</div>
            </div>
            <Button onClick={() => handleSelectPlan("user_premium_yearly")} className="w-full mb-6 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold hover:from-yellow-400 hover:to-amber-400 shadow-lg">
              Get Premium Yearly
            </Button>
            <div className="space-y-2.5">
              {["All monthly features included", "18% discount vs monthly", "Best value for long-term users"].map((f, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Server Plans */}
      <section className="mb-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">Server Plans</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Boost Your Server</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">From free listing to full visibility — pick the plan that fits your server.</p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Free */}
          <div className="glass rounded-2xl p-6 border border-white/10 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-white/5">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Free</h3>
                <p className="text-xs text-muted-foreground">Get started today</p>
              </div>
            </div>
            <div className="mb-5">
              <span className="font-display text-4xl font-bold text-muted-foreground">$0</span>
              <span className="text-muted-foreground ml-2">/ forever</span>
            </div>
            <Button variant="outline" className="w-full mb-5" onClick={() => navigate("/auth?mode=signup")}>
              Get Started Free
            </Button>
            <div className="space-y-2 flex-1">
              {[
                "List your server publicly",
                "Basic server profile page",
                "Receive votes from players",
                "Standard search placement",
                "Up to 3 categories",
                "Community reviews",
                "Basic vote tracking",
                "API: 500 req/day · 10/min",
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Starter */}
          <PlanCard
            name="Starter"
            price="$4.99"
            period="month"
            description="More visibility, more votes"
            icon={<Zap className="h-6 w-6" />}
            features={[
              "Everything in Free",
              "Priority search placement",
              "Custom banner & logo upload",
              "Vote analytics & referrer tracking",
              "Basic vote analytics dashboard",
              "Server verified badge",
              "API: 5,000 req/day · 60/min",
              "Email support",
            ]}
            onSelect={() => handleSelectPlan("starter")}
          />

          {/* Pro */}
          <PlanCard
            name="Pro"
            price="$14.99"
            period="month"
            description="For growing communities"
            icon={<Star className="h-6 w-6" />}
            features={[
              "Everything in Starter",
              "Top 10 placement boost",
              "Advanced analytics & geo data",
              "Vote tracking with referrers (extended)",
              "API: 50,000 req/day · 300/min",
              "Discord webhook integration",
              "Priority support",
            ]}
            highlighted
            badge="Most Popular"
            onSelect={() => handleSelectPlan("pro")}
          />

          {/* Enterprise */}
          <PlanCard
            name="Enterprise"
            price="$39.99"
            period="month"
            description="For established servers"
            icon={<Shield className="h-6 w-6" />}
            features={[
              "Everything in Pro",
              "Guaranteed top 3 placement",
              "Custom branding & themes",
              "API: Unlimited · 1,000/min",
              "Dedicated account manager",
              "Custom integrations",
              "24/7 priority support",
            ]}
            onSelect={() => handleSelectPlan("enterprise")}
          />
        </div>

        {/* Comparison note */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          All paid plans are billed monthly in USDT (TRC20). Cancel anytime.
        </p>
      </section>

      {/* Why USDT */}
      <div className="glass rounded-2xl p-10 max-w-4xl mx-auto">
        <h2 className="font-display text-2xl font-bold mb-8 text-center">Why USDT (TRC20)?</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h3 className="font-semibold mb-2">Secure & Transparent</h3>
            <p className="text-sm text-muted-foreground">Blockchain-verified transactions with full transparency. No chargebacks.</p>
          </div>
          <div>
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚡</span>
            </div>
            <h3 className="font-semibold mb-2">Instant Activation</h3>
            <p className="text-sm text-muted-foreground">Your plan activates within minutes after payment verification.</p>
          </div>
          <div>
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🌍</span>
            </div>
            <h3 className="font-semibold mb-2">Global Payments</h3>
            <p className="text-sm text-muted-foreground">Accept payments from anywhere in the world. No bank required.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function PlanCard({ name, price, period, description, icon, features, highlighted, badge, onSelect }: {
  name: string; price: string; period: string; description: string; icon: React.ReactNode;
  features: string[]; highlighted?: boolean; badge?: string; onSelect: () => void;
}) {
  return (
    <div className={cn(
      "glass rounded-2xl p-8 transition-all hover:scale-[1.02]",
      highlighted ? "border-2 border-primary shadow-[0_0_40px_rgba(220,38,38,0.2)]" : "border border-white/10"
    )}>
      {badge && (
        <div className="text-xs uppercase tracking-widest text-primary-glow mb-4 font-bold">{badge}</div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", highlighted ? "bg-primary/20 text-primary" : "bg-white/5")}>
          {icon}
        </div>
        <div>
          <h3 className="font-display text-2xl font-bold">{name}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mb-6">
        <span className={cn("font-display text-4xl font-bold", highlighted ? "text-primary-glow" : "text-gradient")}>{price}</span>
        <span className="text-muted-foreground ml-2">/ {period}</span>
      </div>
      <Button onClick={onSelect} className={cn("w-full mb-6", highlighted && "glow-crimson-strong")} variant={highlighted ? "default" : "outline"}>
        Get Started
      </Button>
      <div className="space-y-2.5">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <Check className={cn("h-4 w-4 flex-shrink-0 mt-0.5", highlighted ? "text-primary-glow" : "text-primary")} />
            <span className="text-sm text-foreground/90">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Pricing;
