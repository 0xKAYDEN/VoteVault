import { Bell, Check, Trash2, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  friend_request: "👥",
  message: "💬",
  review: "⭐",
  vote: "⚡",
  system: "🔔",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      const [notifData, countData] = await Promise.all([
        api.notifications.getAll(),
        api.notifications.getUnreadCount(),
      ]);
      // Backend returns { notifications, total, page, totalPages } or plain array (fallback)
      const notifs = Array.isArray(notifData) ? notifData : (notifData?.notifications ?? []);
      setNotifications(notifs);
      setUnreadCount(countData.count);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  // Poll unread count every 30s even when closed
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => {
      api.notifications.getUnreadCount()
        .then(d => setUnreadCount(d.count))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) loadNotifications();
  }, [open]);

  const markAsRead = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await api.notifications.markAsRead(id);
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.notifications.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => {
        const notif = notifications.find(n => n.id === id);
        return notif && !notif.is_read ? Math.max(0, prev - 1) : prev;
      });
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.is_read) await markAsRead(notif.id);
    if (notif.link) {
      setOpen(false);
      navigate(notif.link);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-crimson text-white text-[10px]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="glass-strong border-white/10 w-96 p-0" align="end">
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7 gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[420px]">
          {notifications.length === 0 ? (
            <div className="p-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={cn(
                    "flex items-start gap-3 p-3 border-b border-white/5 transition-colors cursor-pointer group",
                    !notif.is_read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-white/5"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-base",
                    !notif.is_read ? "bg-primary/20" : "bg-white/5"
                  )}>
                    {TYPE_ICONS[notif.type] || "🔔"}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm leading-snug", !notif.is_read && "font-medium")}>
                        {notif.message}
                      </p>
                      {!notif.is_read && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.is_read && (
                      <button
                        onClick={e => markAsRead(notif.id, e)}
                        className="h-6 w-6 rounded flex items-center justify-center hover:bg-white/10 text-muted-foreground hover:text-foreground"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={e => deleteNotification(notif.id, e)}
                      className="h-6 w-6 rounded flex items-center justify-center hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
