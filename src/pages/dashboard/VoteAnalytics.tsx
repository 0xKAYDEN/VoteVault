import { useEffect, useState, useMemo, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import {
  Download, Filter, Calendar as CalendarIcon,
  BarChart3, Loader2, Search, FileDown,
  PieChart as PieChartIcon, TrendingUp, Info, Globe, Clock, Share2, MapPin, Wifi
} from "lucide-react";
import { format, startOfDay, endOfDay, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Convert ISO country code to flag emoji
const countryFlag = (code: string) => {
  if (!code || code.length !== 2) return "🌐";
  return code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(127397 + c.charCodeAt(0))
  );
};

const VoteAnalytics = () => {
  const { user } = useAuth();
  const [servers, setServers] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingVotes, setFetchingVotes] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [geoData, setGeoData] = useState<any>(null);
  const [fetchingGeo, setFetchingGeo] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

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
      } catch (err: any) {
        // Don't let 401 errors bubble up to the global interceptor
        if (err?.status !== 401) {
          console.error("Error loading servers for analytics:", err);
        }
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

  const loadGeo = async () => {
    if (!user || servers.length === 0) return;
    setFetchingGeo(true);
    try {
      const data = await api.votes.getGeoAnalytics({
        server_id: selectedServer,
        from: dateRange.from.toISOString(),
        to: endOfDay(dateRange.to).toISOString(),
      });
      setGeoData(data);
    } catch (error: any) {
      console.error("Failed to fetch geo data:", error.message);
    } finally {
      setFetchingGeo(false);
    }
  };

  useEffect(() => {
    if (!loading && servers.length > 0) {
      loadVotes();
      loadGeo();
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

  // Geographic distribution
  const geoDistribution = useMemo(() => {
    const geo: Record<string, number> = {};
    votes.forEach(v => {
      const country = v.voter_country || "Unknown";
      geo[country] = (geo[country] || 0) + 1;
    });
    return Object.entries(geo)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [votes]);

  // Peak voting times
  const peakTimes = useMemo(() => {
    const hours: Record<number, number> = {};
    votes.forEach(v => {
      const hour = new Date(v.voted_at).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      votes: hours[i] || 0
    }));
  }, [votes]);

  // Referrer tracking (simulated - would need backend support)
  const referrerData = useMemo(() => {
    const referrers: Record<string, number> = {};
    votes.forEach(v => {
      const ref = v.referrer || "Direct";
      referrers[ref] = (referrers[ref] || 0) + 1;
    });
    return Object.entries(referrers)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [votes]);

  // Demographics (device/browser - simulated)
  const demographics = useMemo(() => {
    const suspicious = votes.filter(v => v.is_suspicious).length;
    const verified = votes.length - suspicious;
    const conversionRate = votes.length > 0 ? ((verified / votes.length) * 100).toFixed(2) : "0";
    return {
      totalVotes: votes.length,
      verified,
      suspicious,
      conversionRate,
      avgVotesPerDay: votes.length > 0 ? (votes.length / Math.max(1, dateRange.to.getTime() - dateRange.from.getTime()) * 86400000).toFixed(2) : "0"
    };
  }, [votes, dateRange]);

  const exportToCSV = () => {
    if (votes.length === 0) return toast.error("No data to export");

    const headers = ["ID", "Server", "Voted At", "Challenge Type", "Country", "Country Code", "Region", "City", "ISP", "Referrer", "Is Suspicious"];
    const csvRows = [
      headers.join(","),
      ...votes.map(v => [
        v.id,
        v.server_name || "Unknown",
        v.voted_at,
        v.challenge_type_passed || "N/A",
        v.voter_country || "N/A",
        v.voter_country_code || "N/A",
        v.voter_region || "N/A",
        v.voter_city || "N/A",
        v.voter_isp || "N/A",
        v.referrer || "Direct",
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

  const exportToPDF = async () => {
    if (!pdfRef.current) return toast.error("PDF content not ready");
    setExportingPDF(true);
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save(`vote-analytics-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("PDF export completed");
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    } finally {
      setExportingPDF(false);
    }
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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={fetchingVotes || votes.length === 0}>
            <FileDown className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF} disabled={exportingPDF || votes.length === 0}>
            {exportingPDF ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            PDF
          </Button>
        </div>
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

            <Button variant="hero" onClick={() => { loadVotes(); loadGeo(); }} disabled={fetchingVotes}>
              {fetchingVotes ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Filter className="h-4 w-4 mr-2" />}
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-strong border-white/5">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Total Votes</p>
            <p className="text-2xl font-bold font-mono-num text-primary-glow mt-1">{demographics.totalVotes}</p>
          </CardContent>
        </Card>
        <Card className="glass-strong border-white/5">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Verified</p>
            <p className="text-2xl font-bold font-mono-num text-emerald-400 mt-1">{demographics.verified}</p>
          </CardContent>
        </Card>
        <Card className="glass-strong border-white/5">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Conversion Rate</p>
            <p className="text-2xl font-bold font-mono-num text-blue-400 mt-1">{demographics.conversionRate}%</p>
          </CardContent>
        </Card>
        <Card className="glass-strong border-white/5">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Avg/Day</p>
            <p className="text-2xl font-bold font-mono-num text-purple-400 mt-1">{demographics.avgVotesPerDay}</p>
          </CardContent>
        </Card>
      </div>

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

      {/* Tabs: Vote Log | Geo | Referrers | ISP */}
      <Tabs defaultValue="log">
        <TabsList className="glass border border-white/10">
          <TabsTrigger value="log">Vote Log</TabsTrigger>
          <TabsTrigger value="geo" className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" /> Geography
          </TabsTrigger>
          <TabsTrigger value="referrers" className="flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" /> Sources
          </TabsTrigger>
          <TabsTrigger value="isp" className="flex items-center gap-1">
            <Wifi className="h-3.5 w-3.5" /> ISP
          </TabsTrigger>
        </TabsList>

        {/* Vote Log */}
        <TabsContent value="log">
          <Card className="glass-strong border-white/5">
            <CardHeader>
              <CardTitle className="text-lg">Recent Vote Log</CardTitle>
              <CardDescription>Last 100 votes with full location data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-white/10 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 text-left border-b border-white/10">
                      <th className="p-3 font-medium">Server</th>
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium">Challenge</th>
                      <th className="p-3 font-medium">Country</th>
                      <th className="p-3 font-medium">City / Region</th>
                      <th className="p-3 font-medium">ISP</th>
                      <th className="p-3 font-medium">Source</th>
                      <th className="p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {votes.length === 0 ? (
                      <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No votes found for this period.</td></tr>
                    ) : (
                      votes.slice(0, 100).map((v) => (
                        <tr key={v.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 font-medium">{v.server_name || "—"}</td>
                          <td className="p-3 text-muted-foreground whitespace-nowrap">{format(new Date(v.voted_at), "MMM dd, HH:mm")}</td>
                          <td className="p-3">
                            <span className="text-[10px] uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded text-muted-foreground">
                              {v.challenge_type_passed || "API"}
                            </span>
                          </td>
                          <td className="p-3">
                            {v.voter_country_code && (
                              <span className="mr-1">{countryFlag(v.voter_country_code)}</span>
                            )}
                            <span className="text-sm">{v.voter_country || "—"}</span>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {[v.voter_city, v.voter_region].filter(Boolean).join(", ") || "—"}
                          </td>
                          <td className="p-3 text-muted-foreground text-xs max-w-[140px] truncate">{v.voter_isp || "—"}</td>
                          <td className="p-3 text-muted-foreground text-xs max-w-[120px] truncate">{v.referrer || "Direct"}</td>
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
        </TabsContent>

        {/* Geography */}
        <TabsContent value="geo">
          {fetchingGeo ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Country table */}
              <Card className="glass-strong border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> Votes by Country
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!geoData?.byCountry?.length ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No geo data yet — votes will be tracked going forward.</p>
                  ) : (
                    <div className="space-y-2">
                      {geoData.byCountry.map((row: any, i: number) => {
                        const max = geoData.byCountry[0]?.votes || 1;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-lg w-7 text-center">{countryFlag(row.country_code)}</span>
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-0.5">
                                <span>{row.country || "Unknown"}</span>
                                <span className="font-mono text-muted-foreground">{row.votes}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${(row.votes / max) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* City table */}
              <Card className="glass-strong border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> Top Cities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!geoData?.byCity?.length ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No city data yet.</p>
                  ) : (
                    <div className="rounded-md border border-white/10 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10">
                            <th className="p-2 text-left font-medium">City</th>
                            <th className="p-2 text-left font-medium">Country</th>
                            <th className="p-2 text-right font-medium">Votes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {geoData.byCity.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-white/5">
                              <td className="p-2">{row.city}</td>
                              <td className="p-2 text-muted-foreground">
                                {countryFlag(row.country_code)} {row.country}
                              </td>
                              <td className="p-2 text-right font-mono">{row.votes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Referrers / Sources */}
        <TabsContent value="referrers">
          <Card className="glass-strong border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" /> Vote Sources
              </CardTitle>
              <CardDescription>Where your voters came from</CardDescription>
            </CardHeader>
            <CardContent>
              {!geoData?.byReferrer?.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">No referrer data yet.</p>
              ) : (
                <div className="space-y-2">
                  {geoData.byReferrer.map((row: any, i: number) => {
                    const max = geoData.byReferrer[0]?.votes || 1;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-0.5">
                            <span className="truncate max-w-xs text-muted-foreground">{row.source}</span>
                            <span className="font-mono ml-2 flex-shrink-0">{row.votes}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${(row.votes / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ISP */}
        <TabsContent value="isp">
          <Card className="glass-strong border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" /> ISP / Network Breakdown
              </CardTitle>
              <CardDescription>Internet service providers your voters use</CardDescription>
            </CardHeader>
            <CardContent>
              {!geoData?.byIsp?.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">No ISP data yet.</p>
              ) : (
                <div className="rounded-md border border-white/10 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="p-3 text-left font-medium">ISP / Network</th>
                        <th className="p-3 text-right font-medium">Votes</th>
                        <th className="p-3 text-right font-medium">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {geoData.byIsp.map((row: any, i: number) => {
                        const total = geoData.byIsp.reduce((s: number, r: any) => s + r.votes, 0);
                        return (
                          <tr key={i} className="hover:bg-white/5">
                            <td className="p-3">{row.isp}</td>
                            <td className="p-3 text-right font-mono">{row.votes}</td>
                            <td className="p-3 text-right text-muted-foreground">
                              {((row.votes / total) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="glass rounded-xl p-4 flex items-start gap-3 border border-white/5">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm">Location Data</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Geolocation is resolved from the voter's IP using ip-api.com and cached. Country, city, region, ISP, and coordinates are recorded per vote. Only new votes (after this update) will have location data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoteAnalytics;
