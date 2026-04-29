import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Zap, Server, Star, Users, ArrowUpRight,
  MessageCircle, TrendingUp, Calendar, AlertCircle, Eye, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { DashboardStatsSkeleton, LoadingSpinner } from "@/components/LoadingStates";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, eachDayOfInterval, parseISO } from "date-fns";

// ── GitHub-style activity chart ───────────────────────────────────────────────
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TOTAL_WEEKS = 53; // always render 53 columns so the grid fills the card

function ActivityChart({
  data,
  year,
  years,
  onYearChange,
}: {
  data: Array<{ log_date: string; request_count: number }>;
  year: number;
  years: number[];
  onYearChange: (y: number) => void;
}) {
  const map: Record<string, number> = {};
  data.forEach(d => { map[d.log_date] = d.request_count; });

  const isCurrentYear = year === new Date().getFullYear();

  // Always end on "today" for current year, or Dec 31 for past years
  const gridEnd = isCurrentYear ? new Date() : new Date(year, 11, 31);

  // Start exactly 52 weeks (364 days) before the end, then rewind to the nearest Sunday
  const rawStart = new Date(gridEnd);
  rawStart.setDate(rawStart.getDate() - TOTAL_WEEKS * 7 + 1);
  // Snap back to Sunday
  const startDow = rawStart.getDay();
  rawStart.setDate(rawStart.getDate() - startDow);

  const allDays = eachDayOfInterval({ start: rawStart, end: gridEnd });

  // Pad end to complete the last week
  const padded: (Date | null)[] = [...allDays];
  while (padded.length % 7 !== 0) padded.push(null);

  // Split into week columns (7 rows each = Sun–Sat)
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

  const maxCount = Math.max(1, ...data.map(d => d.request_count));

  const getColor = (count: number) => {
    if (!count) return "bg-white/[0.07] border border-white/[0.05]";
    const pct = count / maxCount;
    if (pct < 0.25) return "bg-primary/25";
    if (pct < 0.5)  return "bg-primary/50";
    if (pct < 0.75) return "bg-primary/75";
    return "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.7)]";
  };

  // Month labels: show label on the first week that contains the 1st of a month
  const monthLabels: { label: string; col: number }[] = [];
  weeks.forEach((week, wi) => {
    const first = week.find(d => d !== null);
    if (first && first.getDate() <= 7) {
      // Avoid duplicate label for the same month
      const lbl = format(first, "MMM");
      if (!monthLabels.length || monthLabels[monthLabels.length - 1].label !== lbl) {
        monthLabels.push({ label: lbl, col: wi });
      }
    }
  });

  const totalRequests = data.reduce((s, d) => s + d.request_count, 0);
  const activeDays    = data.filter(d => d.request_count > 0).length;
  const peakDay       = data.reduce<typeof data[0] | null>(
    (best, d) => d.request_count > (best?.request_count ?? 0) ? d : best, null
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 className="font-display text-lg font-bold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          API Activity
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span><span className="text-foreground font-semibold">{totalRequests.toLocaleString()}</span> requests</span>
            <span><span className="text-foreground font-semibold">{activeDays}</span> active days</span>
            {peakDay && peakDay.request_count > 0 && (
              <span>
                Peak: <span className="text-foreground font-semibold">{peakDay.request_count.toLocaleString()}</span>
                <span className="opacity-60"> on {format(parseISO(peakDay.log_date), "MMM d")}</span>
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {years.map(y => (
              <button
                key={y}
                onClick={() => onYearChange(y)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  y === year
                    ? "bg-primary text-white"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart — fills full card width, no horizontal scroll */}
      <div className="w-full">
        {/* Month labels */}
        <div className="flex mb-1.5 pl-8">
          {weeks.map((_, wi) => {
            const lbl = monthLabels.find(m => m.col === wi);
            return (
              <div key={wi} className="flex-1 text-[10px] text-muted-foreground text-center leading-none truncate">
                {lbl?.label ?? ""}
              </div>
            );
          })}
        </div>

        {/* Day labels + week columns */}
        <div className="flex gap-1">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-[3px] w-7 shrink-0">
            {DAY_LABELS.map((d, i) => (
              <div
                key={d}
                className={`text-[9px] text-muted-foreground leading-none flex items-center justify-end pr-1 ${i % 2 === 0 ? "opacity-0 select-none" : ""}`}
                style={{ height: "calc((100% - 18px) / 7)" }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Week columns — flex-1 so they stretch to fill the card */}
          <div className="flex gap-[3px] flex-1 min-w-0">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px] flex-1 min-w-0">
                {week.map((day, di) => {
                  if (!day) return (
                    <div key={di} className="w-full aspect-square rounded-sm opacity-0" />
                  );
                  const dateStr = format(day, "yyyy-MM-dd");
                  const count   = map[dateStr] || 0;
                  return (
                    <div
                      key={di}
                      title={`${format(day, "EEE, MMM d yyyy")}: ${count.toLocaleString()} request${count !== 1 ? "s" : ""}`}
                      className={`w-full aspect-square rounded-sm transition-all cursor-default hover:scale-110 hover:z-10 relative ${getColor(count)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {[
          "bg-white/[0.07] border border-white/[0.05]",
          "bg-primary/25",
          "bg-primary/50",
          "bg-primary/75",
          "bg-primary",
        ].map((c, i) => (
          <div key={i} className={`w-3.5 h-3.5 rounded-sm ${c}`} />
        ))}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}

const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    servers: 0,
    totalVotes: 0,
    totalVisits: 0,
    avgRating: 0,
    votes24h: 0,
    recentReviews: []
  });
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<Array<{ log_date: string; request_count: number }>>([]);
  const [activityYear, setActivityYear] = useState(new Date().getFullYear());
  const [activityYears, setActivityYears] = useState<number[]>([new Date().getFullYear()]);
  const [activityLoading, setActivityLoading] = useState(true);

  const loadStats = async () => {
    try {
      const data = await api.servers.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscription = async () => {
    try {
      const data = await api.payments.getSubscription();
      setSubscription(data.subscription);
    } catch (err) {
      console.error("Error loading subscription:", err);
    }
  };

  const loadActivity = async (year?: number) => {
    setActivityLoading(true);
    try {
      const result = await api.apiKeys.getActivity(year);
      setActivity((result as any).data || []);
      setActivityYear((result as any).year || new Date().getFullYear());
      setActivityYears((result as any).years || [new Date().getFullYear()]);
    } catch (err) {
      console.error("Error loading activity:", err);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadStats();
      loadSubscription();
      loadActivity();
    }
  }, [user]);

  const tiles = [
    { label: "Your Servers", value: stats.servers, icon: Server },
    { label: "Total Votes", value: Number(stats.totalVotes).toLocaleString(), icon: Zap, accent: true },
    { label: "Total Visits", value: Number(stats.totalVisits).toLocaleString(), icon: Eye },
    { label: "Avg Rating", value: Number(stats.avgRating).toFixed(1), icon: Star },
  ];

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Add a server to start collecting votes. Each server gets its own analytics and an API key for verifying voters.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="shrink-0">
          <Link to="/dashboard/servers/new"><Server className="h-4 w-4 mr-1.5" />Add Server</Link>
        </Button>
      </div>

      {/* Subscription Status */}
      {subscription ? (
        <div className="glass rounded-2xl p-6 border-2 border-primary/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-crimson">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold flex items-center gap-2">
                  {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
                  <span className="text-sm font-normal text-primary-glow">Active</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Expires: {new Date(subscription.expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/pricing">Manage</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-6 border border-primary/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-white/5 border border-white/10">
                <Crown className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Free Plan</h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade to unlock premium features
                </p>
              </div>
            </div>
            <Button variant="default" size="sm" className="glow-crimson-strong" asChild>
              <Link to="/pricing">Upgrade</Link>
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <DashboardStatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tiles.map((t) => (
            <div key={t.label} className="glass rounded-2xl p-4">
              <div className={`grid h-9 w-9 place-items-center rounded-lg ${t.accent ? "bg-gradient-crimson" : "bg-white/5 border border-white/10"} mb-3`}>
                <t.icon className="h-4 w-4 text-white" />
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.label}</div>
              <div className="font-mono-num font-bold text-2xl mt-0.5">{t.value}</div>
            </div>
          ))}
        </div>
      )}
      <div className="glass rounded-2xl p-6">
        {activityLoading ? (
          <div className="h-32 shimmer rounded-xl" />
        ) : (
          <ActivityChart
            data={activity}
            year={activityYear}
            years={activityYears}
            onYearChange={(y) => loadActivity(y)}
          />
        )}
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Recent Reviews
        </h3>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-12 w-full mb-3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {stats.recentReviews.length > 0 ? (
            stats.recentReviews.map((r: any) => (
              <div key={r.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-sm">{r.display_name || r.username || "Anonymous"}</span>
                    <span className="text-muted-foreground text-xs ml-2">on {r.server_name}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`h-3 w-3 ${r.rating >= s ? "text-[hsl(45_95%_60%)] fill-current" : "text-white/10"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic mb-3">"{r.comment}"</p>
                {r.owner_response ? (
                  <div className="text-xs text-primary bg-primary/10 rounded-lg p-2 border border-primary/20">
                    <span className="font-bold uppercase tracking-tighter mr-2">Your Reply:</span>
                    {r.owner_response}
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-[10px]"
                    onClick={() => {
                      const reply = prompt("Enter your reply:");
                      if (reply) {
                        api.reviews.reply(r.id, reply)
                          .then(() => {
                            toast.success("Reply submitted");
                            loadStats();
                          })
                          .catch(err => toast.error(err.message));
                      }
                    }}
                  >
                    Reply
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">No reviews yet.</p>
          )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Add Server", icon: Server, to: "/dashboard/servers/new", desc: "List a new server" },
            { label: "Analytics", icon: TrendingUp, to: "/dashboard/analytics", desc: "View vote trends" },
            { label: "API Keys", icon: ArrowUpRight, to: "/dashboard/api-keys", desc: "Manage API access" },
            { label: "Premium", icon: Crown, to: "/dashboard/premium", desc: "Unlock features", gold: true },
          ].map(({ label, icon: Icon, to, desc, gold }) => (
            <Link
              key={label}
              to={to}
              className={cn(
                "glass rounded-xl p-4 flex flex-col gap-2 hover:scale-[1.02] transition-all border",
                gold ? "border-yellow-500/20 hover:border-yellow-500/40" : "border-white/5 hover:border-white/15"
              )}
            >
              <div className={cn("grid h-9 w-9 place-items-center rounded-lg", gold ? "bg-yellow-500/20" : "bg-white/5 border border-white/10")}>
                <Icon className={cn("h-4 w-4", gold ? "text-yellow-400" : "text-muted-foreground")} />
              </div>
              <div>
                <p className={cn("font-semibold text-sm", gold && "text-yellow-400")}>{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-display text-lg font-bold mb-2">Welcome to your dashboard</h3>
        <p className="text-muted-foreground text-sm">Add a server to start collecting votes. Each server gets its own analytics and an API key for verifying voters.</p>
      </div>
    </div>
  );
};

export default DashboardOverview;
