import { Link } from "react-router-dom";
import { Crown, MessageSquare, Github } from "lucide-react";

const LINKS = {
  Platform: [
    { label: "Top Servers", to: "/" },
    { label: "Categories", to: "/categories" },
    { label: "Community", to: "/threads" },
    { label: "Pricing", to: "/pricing" },
    { label: "API Docs", to: "/api-docs" },
  ],
  Account: [
    { label: "Sign In", to: "/auth" },
    { label: "Register", to: "/auth?mode=signup" },
    { label: "Dashboard", to: "/dashboard" },
    { label: "Premium", to: "/dashboard/premium" },
  ],
  Support: [
    { label: "Contact Us", to: "/contact" },
    { label: "Report a Bug", to: "/contact" },
    { label: "Terms of Service", to: "/terms" },
    { label: "Privacy Policy", to: "/privacy" },
  ],
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-white/10 glass-strong">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-crimson shadow-[0_0_15px_hsl(0_80%_50%/0.4)]">
                <Crown className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display text-lg font-bold">
                <span className="text-gradient">VOTE</span>{" "}
                <span className="text-crimson-gradient">VAULT</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              The premium server ranking platform. Discover, vote, and dominate.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://discord.gg/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#5865F2] transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Discord
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
                {section}
              </h4>
              <ul className="space-y-2">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {year} VoteVault. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
