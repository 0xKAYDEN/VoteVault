import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area
} from "recharts";
import { 
  Download, Filter, Calendar as CalendarIcon, 
  BarChart3, Loader2, Search, FileDown, 
  PieChart, TrendingUp, Info
} from "lucide-react";
import { format, startOfDay, endOfDay, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const VoteAnalytics = () => {
  const { user } = useAuth();
  const [servers, setServers] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingVotes, setFetchingVotes] = useState(false);

  // Filters
  const [selectedServer, setSelectedServer] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [challengeType, setChallengeType] = useState<string>("all");

  // Load servers
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await api.servers.getMyServers();
        setServers(data || []);
      } catch (err) {
        console.error("Error loading servers for analytics:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Load votes based on filters
  const loadVotes = async () => {
    if (!user || servers.length === 0) return;
    setFetchingVotes(true);
    
    try {
      const data = await api.votes.getAnalytics({
        server_id: selectedServer,
        from: dateRange.from.toISOString(),
        to: endOfDay(dateRange.to).toISOString(),
        challenge_type: challengeType
      });
      setVotes(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch votes: " + error.message);
    } finally {
      setFetchingVotes(false);
    }
  };

  useEffect(() => {
    if (!loading && servers.length > 0) {
      loadVotes();
    }
  }, [loading, servers, selectedServer, dateRange, challengeType]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!votes) return [];

    const days = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to,
    });

    return days.map(day => {
      const count = votes.filter(v => {
        const vDate = new Date(v.voted_at);
        return isSameDay(vDate, day);
      }).length;
      return {
        date: format(day, "MMM dd"),
        votes: count,
      };
    });
  }, [votes, dateRange]);

  const challengeData = useMemo(() => {
    const types: Record<string, number> = {};
    votes.forEach(v => {
      const type = v.challenge_type_passed || "unknown";
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [votes]);

  const serverDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    votes.forEach(v => {
      const name = v.server_name || "Unknown";
      dist[name] = (dist[name] || 0) + 1;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [votes]);

  const exportToCSV = () => {
    if (votes.length === 0) return toast.error("No data to export");

    const headers = ["ID", "Server", "Voted At", "Challenge Type", "Country", "City", "Is Suspicious"];
    const csvRows = [
      headers.join(","),
      ...votes.map(v => [
        v.id,
        v.server_name || "Unknown",
        v.voted_at,
        v.challenge_type_passed || "N/A",
        v.voter_country || "N/A",
        v.voter_city || "N/A",
        v.is_suspicious ? "Yes" : "No"
      ].map(field => `"${field}"`).join(","))
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `votes-export-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export started");
  };

  const chartConfig = {
    votes: {
      label: "Votes",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <h2 className="text-xl font-bold mb-2">No Servers Found</h2>
        <p className="text-muted-foreground mb-6">You need to add a server before you can see vote analytics.</p>
        <Button variant="hero" asChild><a href="/dashboard/servers/new">Add Your First Server</a></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Vote Analytics</h1>
          <p className="text-muted-foreground text-sm">Analyze your server's voting performance.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV} disabled={fetchingVotes || votes.length === 0}>
          <FileDown className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-strong border-white/5">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Server</Label>
              <Select value={selectedServer} onValueChange={setSelectedServer}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="All Servers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Servers</SelectItem>
                  {servers.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-white/5 border-white/10", !dateRange && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass-strong border-white/10" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range: any) => range?.from && range?.to && setDateRange(range)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Challenge Type</Label>
              <Select value={challengeType} onValueChange={setChallengeType}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sequence">Sequence</SelectItem>
                  <SelectItem value="math">Math</SelectItem>
                  <SelectItem value="none">None / API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="hero" onClick={loadVotes} disabled={fetchingVotes}>
              {fetchingVotes ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Filter className="h-4 w-4 mr-2" />}
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Chart */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="glass-strong border-white/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Votes Over Time</CardTitle>
                <CardDescription>Daily vote volume for the selected period</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-primary-glow font-mono-num text-2xl font-bold">
                <TrendingUp className="h-5 w-5" />
                {votes.length}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ChartContainer config={chartConfig}>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-votes)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-votes)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} 
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="votes" 
                    stroke="var(--color-votes)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorVotes)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Challenge Type Distribution */}
        <Card className="glass-strong border-white/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              Challenge Success
            </CardTitle>
            <CardDescription>Distribution of verification methods used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={challengeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-strong border border-white/10 p-2 rounded-lg text-xs shadow-xl">
                            <p className="font-bold text-primary">{payload[0].payload.name}</p>
                            <p className="text-white/80">{payload[0].value} votes</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Server Distribution */}
        <Card className="glass-strong border-white/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Server Performance
            </CardTitle>
            <CardDescription>Vote distribution across your servers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serverDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <RechartsTooltip 
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-strong border border-white/10 p-2 rounded-lg text-xs shadow-xl">
                            <p className="font-bold text-primary">{payload[0].payload.name}</p>
                            <p className="text-white/80">{payload[0].value} votes</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suspicious Votes Info */}
      {/* Suspicious Votes Info */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="glass-strong border-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Recent Vote Log</CardTitle>
            <CardDescription>The last 100 votes matching your filters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-left border-b border-white/10">
                    <th className="p-3 font-medium">Server</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Challenge</th>
                    <th className="p-3 font-medium">Location</th>
                    <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {votes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">No votes found for this period.</td>
                    </tr>
                  ) : (
                    votes.slice(-100).reverse().map((v) => (
                      <tr key={v.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 font-medium">{v.servers?.name}</td>
                        <td className="p-3 text-muted-foreground">{format(new Date(v.voted_at), "MMM dd, HH:mm")}</td>
                        <td className="p-3">
                          <span className="text-[10px] uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded text-muted-foreground">
                            {v.challenge_type_passed || "API"}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {v.voter_country ? `${v.voter_country}${v.voter_city ? `, ${v.voter_city}` : ""}` : "Unknown"}
                        </td>
                        <td className="p-3">
                          {v.is_suspicious ? (
                            <span className="text-[10px] uppercase tracking-wider bg-red-500/10 text-red-400 px-2 py-0.5 rounded">Suspicious</span>
                          ) : (
                            <span className="text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">Verified</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="glass rounded-xl p-4 flex items-start gap-3 border border-white/5">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm">Security Analytics</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            The charts above show all successful votes. Suspicious votes are flagged based on fingerprinting and IP analysis.
            Votes from the same IP within the cooldown period are automatically blocked and not recorded here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoteAnalytics;
