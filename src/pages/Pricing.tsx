import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth.context";

const PricingTier = ({
  name,
  price,
  period,
  description,
  features,
  highlighted = false,
  onSelect,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  onSelect: () => void;
}) => (
  <div
    className={`glass rounded-lg p-8 ${
      highlighted ? "border-2 border-primary glow-crimson" : ""
    } glass-hover transition-all`}
  >
    {highlighted && (
      <div className="text-xs uppercase tracking-widest text-primary-glow mb-4">
        Most Popular
      </div>
    )}
    <h3 className="font-display text-2xl font-bold mb-2">{name}</h3>
    <p className="text-sm text-muted-foreground mb-6">{description}</p>
    <div className="mb-6">
      <span className="font-display text-4xl font-bold text-gradient">{price}</span>
      <span className="text-muted-foreground ml-2">USDT / {period}</span>
    </div>
    <Button
      onClick={onSelect}
      className={`w-full mb-6 ${highlighted ? "glow-crimson-strong" : ""}`}
      variant={highlighted ? "default" : "outline"}
    >
      Get Started
    </Button>
    <div className="space-y-3">
      {features.map((feature, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <Check className="h-5 w-5 text-primary-glow flex-shrink-0 mt-0.5" />
          <span className="text-sm text-foreground/90">{feature}</span>
        </div>
      ))}
    </div>
  </div>
);

const Pricing = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    document.title = "Pricing — VoteVault";
  }, []);

  const handleSelectPlan = (plan: string) => {
    if (!profile) {
      navigate("/auth");
      return;
    }
    navigate("/payment", { state: { plan } });
  };

  return (
    <div className="container py-16 max-w-7xl">
      <div className="text-center mb-16 animate-fade-in">
        <span className="text-xs uppercase tracking-widest text-primary">Pricing Plans</span>
        <h1 className="font-display text-5xl font-bold mt-2 mb-4">
          Choose Your <span className="text-crimson-gradient">Plan</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Boost your server's visibility and unlock powerful features with our premium plans.
          Pay securely with USDT cryptocurrency.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <PricingTier
          name="Basic"
          price="10"
          period="month"
          description="Perfect for small servers getting started"
          features={[
            "Priority listing in search results",
            "Custom server banner upload",
            "Basic analytics dashboard",
            "Remove ads from your server page",
            "Email support",
          ]}
          onSelect={() => handleSelectPlan("basic")}
        />

        <PricingTier
          name="Pro"
          price="25"
          period="month"
          description="Best for growing servers"
          features={[
            "Everything in Basic",
            "Featured badge on listing",
            "Advanced analytics & demographics",
            "API rate limit increase (5x)",
            "Discord webhook integration",
            "Vote tracking & rewards system",
            "Priority support",
          ]}
          highlighted
          onSelect={() => handleSelectPlan("pro")}
        />

        <PricingTier
          name="Enterprise"
          price="50"
          period="month"
          description="For established servers"
          features={[
            "Everything in Pro",
            "Top placement guarantee",
            "Custom branding options",
            "Unlimited API requests",
            "Dedicated account manager",
            "Custom integrations",
            "24/7 priority support",
          ]}
          onSelect={() => handleSelectPlan("enterprise")}
        />
      </div>

      <div className="glass rounded-lg p-8 max-w-3xl mx-auto">
        <h2 className="font-display text-2xl font-bold mb-4 text-center">
          Why Choose USDT Payment?
        </h2>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-semibold mb-2">Secure</h3>
            <p className="text-sm text-muted-foreground">
              Blockchain-verified transactions with full transparency
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold mb-2">Fast</h3>
            <p className="text-sm text-muted-foreground">
              Instant activation after payment confirmation
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">🌍</div>
            <h3 className="font-semibold mb-2">Global</h3>
            <p className="text-sm text-muted-foreground">
              Accept payments from anywhere in the world
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
