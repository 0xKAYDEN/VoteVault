import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Zap, Star, MessageCircle, Server, TrendingUp, Activity, Calendar, MessageSquare, Reply } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TOTAL_WEEKS = 53;

function ActivityGrid({ data, year, years, onYearChange }: {
  data: Array<{ log_date: string; request_count: number }>;
  year: number;
  years: number[];
  onYearChange: (y: number) => void;
}) {
  const map: Record<string, number> = {};
  data.forEach(d => { map[d.log_date] = d.request_count; });

  const isCurrentYear = year === new Date().getFullYear();
  const gridEnd = isCurrentYear ? new Date() : new Date(year, 11, 31);
  const rawStart = new Date(gridEnd);
  rawStart.setDate(rawStart.getDate() - TOTAL_WEEKS * 7 + 1);
  rawStart.setDate(rawStart.getDate() - rawStart.getDay());

  const allDays = eachDayOfInterval({ start: rawStart, end: gridEnd });
  const padded: (Date | null)[] = [...allDays];
  while (padded.length % 7 !== 0) padded.push(null);

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

  const monthLabels: { label: string; col: number }[] = [];
  weeks.forEach((week, wi) => {
    const first = week.find(d => d !== null);
    if (first && first.getDate() <= 7) {
      const lbl = format(first, "MMM");
      if (!monthLabels.length || monthLabels[monthLabels.length - 1].label !== lbl)
        monthLabels.push({ label: lbl, col: wi });
    }
  });

  const totalRequests = data.reduce((s, d) => s + d.request_count, 0);
  const activeDays = data.filter(d => d.request_count > 0).length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span><span className="text-foreground font-semibold">{totalRequests.toLocaleString()}</span> API requests</span>
          <span><span className="text-foreground font-semibold">{activeDays}</span> active days</span>
        </div>
        <div className="flex gap-1">
          {years.map(y => (
            <button key={y} onClick={() => onYearChange(y)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${y === year ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}>
              {y}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full">
        <div className="flex mb-1.5 pl-8">
          {weeks.map((_, wi) => {
            const lbl = monthLabels.find(m => m.col === wi);
            return <div key={wi} className="flex-1 text-[10px] text-muted-foreground text-center leading-none truncate">{lbl?.label ?? ""}</div>;
          })}
        </div>
        <div className="flex gap-1">
          <div className="flex flex-col gap-[3px] w-7 shrink-0">
            {DAY_LABELS.map((d, i) => (
              <div key={d} className={`text-[9px] text-muted-foreground leading-none flex items-center justify-end pr-1 ${i % 2 === 0 ? "opacity-0 select-none" : ""}`}
                style={{ height: "calc((100% - 18px) / 7)" }}>{d}</div>
            ))}
          </div>
          <div className="flex gap-[3px] flex-1 min-w-0">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px] flex-1 min-w-0">
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="w-full aspect-square rounded-sm opacity-0" />;
                  const dateStr = format(day, "yyyy-MM-dd");
                  const count = map[dateStr] || 0;
                  return (
                    <div key={di}
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
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {["bg-white/[0.07] border border-white/[0.05]","bg-primary/25","bg-primary/50","bg-primary/75","bg-primary"].map((c, i) => (
          <div key={i} className={`w-3.5 h-3.5 rounded-sm ${c}`} />
        ))}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}

const DashboardActivity = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [votes, setVotes] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [activityYear, setActivityYear] = useState(new Date().getFullYear());
  const [activityYears, setActivityYears] = useState<number[]>([new Date().getFullYear()]);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [activitySummary, setActivitySummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voteRange, setVoteRange] = useState("30");

  useEffect(() => {
    document.title = "Activity — VoteVault";
    if (!user) return;
    Promise.all([
      api.servers.getDashboardStats(),
      api.apiKeys.getActivity(),
      api.users.getMyActivity(50),
    ]).then(([s, a, ua]) => {
      setStats(s);
      setActivity((a as any).data || []);
      setActivityYear((a as any).year || new Date().getFullYear());
      setActivityYears((a as any).years || [new Date().getFullYear()]);
      setUserActivity((ua as any).activities || []);
      setActivitySummary((ua as any).summary || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  // Load vote history for the chart
  useEffect(() => {
    if (!user) return;
    const days = Number(voteRange);
    api.votes.getAnalytics({
      from: subDays(new Date(), days).toISOString(),
      to: new Date().toISOString(),
    }).then(data => setVotes(data || [])).catch(() => {});
  }, [user, voteRange]);

  const loadActivity = async (year: number) => {
    const result = await api.apiKeys.getActivity(year);
    setActivity((result as any).data || []);
    setActivityYear((result as any).year || year);
    setActivityYears((result as any).years || [year]);
  };

  // Vote chart data
  const voteChartData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), Number(voteRange) - 1), end: new Date() });
    return days.map(day => ({
      date: format(day, "MMM dd"),
      votes: votes.filter(v => isSameDay(new Date(v.voted_at), day)).length,
    }));
  }, [votes, voteRange]);

  const totalVotes = voteChartData.reduce((s, d) => s + d.votes, 0);
  const peakVotes = Math.max(...voteChartData.map(d => d.votes), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Activity</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Track your votes, reviews, threads, and API usage.</p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading ? [...Array(4)].map((_, i) => <div key={i} className="glass rounded-xl h-20 shimmer" />) : [
          { label: "Votes Cast", value: Number(activitySummary?.total_votes || 0).toLocaleString(), icon: Zap, color: "text-primary-glow" },
          { label: "Reviews Written", value: Number(activitySummary?.total_reviews || 0).toLocaleString(), icon: Star, color: "text-yellow-400" },
          { label: "Threads Started", value: Number(activitySummary?.total_threads || 0).toLocaleString(), icon: MessageSquare, color: "text-blue-400" },
          { label: "Replies Posted", value: Number(activitySummary?.total_replies || 0).toLocaleString(), icon: Reply, color: "text-green-400" },
        ].map(t => (
          <div key={t.label} className="glass rounded-xl p-4">
            <t.icon className={`h-5 w-5 ${t.color} mb-2`} />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t.label}</p>
            <p className={`font-mono-num font-bold text-2xl mt-0.5 ${t.color}`}>{t.value}</p>
          </div>
        ))}
      </div>

      {/* Vote activity chart */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Vote Activity
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="text-foreground font-semibold">{voteChartData.reduce((s, d) => s + d.votes, 0)}</span> votes · peak <span className="text-foreground font-semibold">{Math.max(...voteChartData.map(d => d.votes), 0)}</span>/day
            </p>
          </div>
          <Select value={voteRange} onValueChange={setVoteRange}>
            <SelectTrigger className="w-32 h-8 text-xs bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={voteChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="voteGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false}
                interval={Number(voteRange) <= 7 ? 0 : Math.floor(Number(voteRange) / 7)} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <RechartsTooltip
                contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                itemStyle={{ color: "hsl(var(--primary))" }}
              />
              <Area type="monotone" dataKey="votes" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#voteGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* API Activity heatmap */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-display text-lg font-bold flex items-center gap-2 mb-5">
          <Activity className="h-5 w-5 text-primary" /> API Activity
        </h3>
        {loading ? <div className="h-32 shimmer rounded-xl" /> : (
          <ActivityGrid
            data={activity}
            year={activityYear}
            years={activityYears}
            onYearChange={loadActivity}
          />
        )}
      </div>

      {/* Full activity feed */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-display text-lg font-bold flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" /> Recent Activity
        </h3>
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 shimmer rounded-lg" />)}</div>
        ) : userActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No activity yet.</p>
        ) : (
          <div className="space-y-1">
            {userActivity.map((item: any, i: number) => {
              const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
                vote:   { icon: Zap,           color: "text-primary bg-primary/10",    label: "Voted on" },
                review: { icon: Star,          color: "text-yellow-400 bg-yellow-500/10", label: "Reviewed" },
                thread: { icon: MessageSquare, color: "text-blue-400 bg-blue-500/10",  label: "Started thread" },
                reply:  { icon: Reply,         color: "text-green-400 bg-green-500/10", label: "Replied in" },
              };
              const cfg = typeConfig[item.type] || typeConfig.vote;
              const Icon = cfg.icon;
              const link = item.type === 'vote' || item.type === 'review'
                ? `/server/${item.target_slug}`
                : `/threads/${item.target_slug}`;

              return (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", cfg.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="text-muted-foreground">{cfg.label} </span>
                      <Link to={link} className="font-medium hover:text-primary transition-colors truncate">
                        {item.target_name}
                      </Link>
                      {item.type === 'review' && item.extra && (
                        <span className="text-yellow-400 ml-1">{'★'.repeat(Number(item.extra))}</span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(item.created_at), "MMM d, HH:mm")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardActivity;
