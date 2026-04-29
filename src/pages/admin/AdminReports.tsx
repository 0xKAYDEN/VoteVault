import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Flag, Server, User, Star, MessageSquare, CheckCircle, XCircle,
  Clock, Eye, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  reviewing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  resolved:  "bg-green-500/20 text-green-400 border-green-500/30",
  dismissed: "bg-white/10 text-muted-foreground border-white/10",
};

const TYPE_ICONS: Record<string, any> = {
  server: Server,
  user: User,
  review: Star,
  thread: MessageSquare,
};

const TYPE_COLORS: Record<string, string> = {
  server: "text-blue-400",
  user: "text-purple-400",
  review: "text-yellow-400",
  thread: "text-green-400",
};

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  harassment: "Harassment",
  inappropriate: "Inappropriate Content",
  cheating: "Cheating / Vote Manipulation",
  vote_manipulation: "Vote Manipulation",
  fake: "Fake / Fraudulent",
  other: "Other",
};

export default function AdminReports() {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [updating, setUpdating] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { status: statusFilter };
      if (typeFilter !== "all") params.type = typeFilter;
      const data = await api.admin.getReports(params);
      setReports(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter, typeFilter]);

  const updateStatus = async (reportId: number, status: string) => {
    setUpdating(reportId);
    try {
      await api.admin.updateReportStatus(reportId, status, notes[reportId]);
      toast.success(`Report marked as ${status}`);
      load();
      setExpanded(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to update report");
    } finally {
      setUpdating(null);
    }
  };

  const counts = {
    total: reports.length,
    pending: reports.filter(r => r.status === "pending").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="h-6 w-6 text-primary" /> Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {counts.total} report{counts.total !== 1 ? "s" : ""}
            {counts.pending > 0 && <span className="text-yellow-400 ml-2">· {counts.pending} pending</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 h-9 bg-white/5 border-white/10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="server">Servers</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="review">Reviews</SelectItem>
              <SelectItem value="thread">Threads</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 bg-white/5 border-white/10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="glass rounded-xl h-20 shimmer" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">No {statusFilter} reports{typeFilter !== "all" ? ` for ${typeFilter}s` : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => {
            const TypeIcon = TYPE_ICONS[report.reported_type] || Flag;
            const isOpen = expanded === report.id;

            return (
              <div key={report.id} className="glass rounded-xl overflow-hidden border border-white/5">
                {/* Report header row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : report.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
                >
                  {/* Type icon */}
                  <div className={cn("h-10 w-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0", TYPE_COLORS[report.reported_type])}>
                    <TypeIcon className="h-5 w-5" />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-sm capitalize">{report.reported_type} Report</span>
                      <Badge className={cn("text-[10px] border", STATUS_COLORS[report.status])}>
                        {report.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded">
                        {REASON_LABELS[report.reason] || report.reason}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>
                        by <span className="text-foreground">{report.reporter_display_name || report.reporter_username}</span>
                      </span>
                      <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                      {/* Entity preview */}
                      {report.entity && (
                        <span className="text-primary">
                          {report.reported_type === "server" && `→ ${report.entity.name}`}
                          {report.reported_type === "user" && `→ ${report.entity.display_name || report.entity.username}`}
                          {report.reported_type === "review" && `→ Review on ${report.entity.server_name}`}
                          {report.reported_type === "thread" && `→ "${report.entity.title}"`}
                        </span>
                      )}
                    </div>
                  </div>

                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-white/10 p-4 space-y-4 bg-white/[0.02]">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Reporter */}
                      <div className="glass rounded-lg p-3">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Reporter</p>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={report.reporter_avatar} />
                            <AvatarFallback className="text-xs">{(report.reporter_display_name || "?")[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <Link to={`/user/${report.reporter_id}`} className="text-sm font-medium hover:text-primary transition-colors">
                              {report.reporter_display_name || report.reporter_username}
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Reported entity */}
                      <div className="glass rounded-lg p-3">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Reported {report.reported_type}</p>
                        {report.entity ? (
                          <div className="flex items-center gap-2">
                            {report.reported_type === "server" && (
                              <>
                                {report.entity.logo_url && <img src={report.entity.logo_url} className="h-8 w-8 rounded object-cover" alt="" />}
                                <Link to={`/server/${report.entity.slug}`} className="text-sm font-medium hover:text-primary transition-colors">
                                  {report.entity.name}
                                </Link>
                              </>
                            )}
                            {report.reported_type === "user" && (
                              <>
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={report.entity.avatar_url} />
                                  <AvatarFallback className="text-xs">{(report.entity.display_name || "?")[0]}</AvatarFallback>
                                </Avatar>
                                <Link to={`/user/${report.entity.id}`} className="text-sm font-medium hover:text-primary transition-colors">
                                  {report.entity.display_name || report.entity.username}
                                </Link>
                              </>
                            )}
                            {report.reported_type === "review" && (
                              <div>
                                <p className="text-sm font-medium">{report.entity.server_name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">"{report.entity.comment}"</p>
                              </div>
                            )}
                            {report.reported_type === "thread" && (
                              <Link to={`/threads/${report.entity.public_id}`} className="text-sm font-medium hover:text-primary transition-colors line-clamp-1">
                                {report.entity.title}
                              </Link>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Entity not found (may have been deleted)</p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {report.description && (
                      <div className="glass rounded-lg p-3">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Description</p>
                        <p className="text-sm text-foreground/90">{report.description}</p>
                      </div>
                    )}

                    {/* Admin notes */}
                    {report.admin_notes && (
                      <div className="glass rounded-lg p-3 border border-primary/20">
                        <p className="text-xs uppercase tracking-widest text-primary mb-1">Admin Notes</p>
                        <p className="text-sm">{report.admin_notes}</p>
                      </div>
                    )}

                    {/* Action area */}
                    {report.status === "pending" || report.status === "reviewing" ? (
                      <div className="space-y-3">
                        <Textarea
                          value={notes[report.id] || ""}
                          onChange={e => setNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                          placeholder="Add admin notes (optional)..."
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex flex-wrap gap-2">
                          {report.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                              onClick={() => updateStatus(report.id, "reviewing")}
                              disabled={updating === report.id}
                            >
                              {updating === report.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                              Mark Reviewing
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => updateStatus(report.id, "resolved")}
                            disabled={updating === report.id}
                          >
                            {updating === report.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-muted-foreground hover:bg-white/5"
                            onClick={() => updateStatus(report.id, "dismissed")}
                            disabled={updating === report.id}
                          >
                            {updating === report.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                            Dismiss
                          </Button>
                          {/* Quick action links */}
                          {report.reported_type === "server" && report.entity && (
                            <Link to={`/server/${report.entity.slug}`} target="_blank">
                              <Button size="sm" variant="outline" className="border-white/20">
                                <Server className="h-4 w-4 mr-1" />View Server
                              </Button>
                            </Link>
                          )}
                          {report.reported_type === "user" && report.entity && (
                            <Link to={`/user/${report.entity.id}`} target="_blank">
                              <Button size="sm" variant="outline" className="border-white/20">
                                <User className="h-4 w-4 mr-1" />View Profile
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4" />
                        <span>This report has been {report.status}.</span>
                        <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto" onClick={() => updateStatus(report.id, "pending")}>
                          Reopen
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
