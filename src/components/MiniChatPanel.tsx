import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  onNewMessage, offNewMessage,
  sendMessage as socketSend,
  markMessagesAsRead as socketMarkRead,
  onMessagesRead, offMessagesRead,
} from "@/lib/socket";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { CheckCheck, Check } from "lucide-react";

interface MiniChat {
  friendId: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  messages: any[];
  unread: number;
  minimized: boolean;
}

export function MiniChatPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [panels, setPanels] = useState<MiniChat[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [readBy, setReadBy] = useState<Record<string, boolean>>({});
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToBottom = (friendId: string) => {
    setTimeout(() => {
      const el = scrollRefs.current[friendId];
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  };

  useEffect(() => {
    onNewMessage(async (data) => {
      const senderId = data.sender_id;

      // Check if panel already open
      setPanels(prev => {
        const exists = prev.find(p => p.friendId === senderId);
        if (exists) {
          return prev.map(p => p.friendId === senderId
            ? { ...p, messages: [...p.messages, data], unread: p.minimized ? p.unread + 1 : 0 }
            : p
          );
        }
        // Open new mini panel
        return prev.length < 3 ? [...prev, {
          friendId: senderId,
          name: data.display_name || data.username || "Friend",
          avatar: data.avatar_url || "",
          isOnline: true,
          messages: [data],
          unread: 1,
          minimized: false,
        }] : prev;
      });

      // Mark as read if panel is open and not minimized
      setPanels(prev => {
        const panel = prev.find(p => p.friendId === senderId);
        if (panel && !panel.minimized) {
          socketMarkRead(senderId);
        }
        return prev;
      });

      scrollToBottom(senderId);
    });

    onMessagesRead((data) => {
      setReadBy(prev => ({ ...prev, [data.by]: true }));
    });

    return () => { offNewMessage(); offMessagesRead(); };
  }, []);

  const openPanel = async (friendId: string, name: string, avatar: string) => {
    const exists = panels.find(p => p.friendId === friendId);
    if (exists) {
      setPanels(prev => prev.map(p => p.friendId === friendId ? { ...p, minimized: false, unread: 0 } : p));
      socketMarkRead(friendId);
      scrollToBottom(friendId);
      return;
    }

    try {
      const msgs = await api.chat.getConversation(friendId);
      setPanels(prev => [...prev.slice(-2), {
        friendId, name, avatar, isOnline: false,
        messages: msgs, unread: 0, minimized: false,
      }]);
      socketMarkRead(friendId);
      scrollToBottom(friendId);
    } catch {}
  };

  const closePanel = (friendId: string) => {
    setPanels(prev => prev.filter(p => p.friendId !== friendId));
  };

  const toggleMinimize = (friendId: string) => {
    setPanels(prev => prev.map(p =>
      p.friendId === friendId ? { ...p, minimized: !p.minimized, unread: !p.minimized ? p.unread : 0 } : p
    ));
  };

  const sendMsg = (friendId: string) => {
    const text = inputs[friendId]?.trim();
    if (!text) return;
    setInputs(prev => ({ ...prev, [friendId]: "" }));
    socketSend(friendId, text);
    setReadBy(prev => ({ ...prev, [friendId]: false }));
    scrollToBottom(friendId);
  };

  if (!user || panels.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 flex items-end gap-3 z-40 pointer-events-none">
      {panels.map((panel, idx) => (
        <div
          key={panel.friendId}
          className="pointer-events-auto flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-white/10 glass-strong"
          style={{ width: 300, marginRight: idx > 0 ? 0 : undefined }}
        >
          {/* Header */}
          <button
            onClick={() => toggleMinimize(panel.friendId)}
            className="flex items-center gap-2 p-2.5 bg-primary/10 hover:bg-primary/20 transition-colors w-full"
          >
            <div className="relative flex-shrink-0">
              <Avatar className="h-8 w-8 border border-white/10">
                <AvatarImage src={panel.avatar} />
                <AvatarFallback className="text-xs bg-primary/20 text-primary">{panel.name[0]}</AvatarFallback>
              </Avatar>
              {panel.isOnline && <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border border-background" />}
            </div>
            <span className="flex-1 text-left text-sm font-semibold truncate">{panel.name}</span>
            {panel.unread > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold h-5 min-w-5 px-1 rounded-full flex items-center justify-center">
                {panel.unread}
              </span>
            )}
            <div className="flex gap-1 ml-1">
              <div className="h-6 w-6 rounded-full hover:bg-white/10 flex items-center justify-center">
                <Minimize2 className="h-3 w-3 text-muted-foreground" />
              </div>
              <div
                className="h-6 w-6 rounded-full hover:bg-red-500/20 flex items-center justify-center"
                onClick={e => { e.stopPropagation(); closePanel(panel.friendId); }}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-red-400" />
              </div>
            </div>
          </button>

          {/* Body */}
          {!panel.minimized && (
            <>
              <div
                ref={el => { scrollRefs.current[panel.friendId] = el; }}
                className="h-64 overflow-y-auto px-3 py-2 space-y-1 bg-background/80"
              >
                {panel.messages.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Say hello! 👋</p>
                ) : panel.messages.map((msg: any, i: number) => {
                  const mine = msg.sender_id === user.id;
                  const isLast = i === panel.messages.length - 1;
                  return (
                    <div key={msg.id || i} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div className="max-w-[80%]">
                        <div className={cn(
                          "px-3 py-1.5 rounded-2xl text-sm break-words",
                          mine ? "bg-primary text-white rounded-br-sm" : "bg-white/10 rounded-bl-sm"
                        )}>
                          {msg.message}
                        </div>
                        {isLast && mine && (
                          <div className="flex justify-end items-center gap-1 mt-0.5 pr-1">
                            <span className="text-[10px] text-muted-foreground">{format(new Date(msg.created_at), "HH:mm")}</span>
                            {readBy[panel.friendId] ? (
                              <CheckCheck className="h-3 w-3 text-primary" />
                            ) : msg.is_read ? (
                              <CheckCheck className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <Check className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="p-2 border-t border-white/10 flex gap-2 bg-background/80">
                <Input
                  value={inputs[panel.friendId] || ""}
                  onChange={e => setInputs(prev => ({ ...prev, [panel.friendId]: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") sendMsg(panel.friendId); }}
                  placeholder="Aa"
                  className="flex-1 h-8 text-sm bg-white/5 border-white/10 rounded-full px-3"
                />
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 flex-shrink-0"
                  onClick={() => sendMsg(panel.friendId)}
                  disabled={!inputs[panel.friendId]?.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Open full chat link */}
              <button
                onClick={() => navigate(`/messages/${panel.friendId}`)}
                className="text-[10px] text-muted-foreground hover:text-primary text-center py-1.5 border-t border-white/5 transition-colors bg-background/80"
              >
                Open full conversation →
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
