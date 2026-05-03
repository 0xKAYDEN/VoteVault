import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  onNewMessage, onMessageSent, onUnreadCount, onFriendStatusChange,
  onUserTyping, onUserStopTyping, onMessagesRead,
  offNewMessage, offMessageSent, offUnreadCount, offFriendStatusChange,
  offUserTyping, offUserStopTyping, offMessagesRead,
  sendMessage as socketSend, markMessagesAsRead as socketMarkRead,
  sendTyping, sendStopTyping,
} from "@/lib/socket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send, Smile, Search, Circle, ArrowLeft, CheckCheck, Check,
  UserMinus, Ban, UserPlus, MoreVertical, Trash2, X, Users, MessageSquarePlus, Plus,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";

const EMOJIS = ["😀","😂","😍","🥰","😎","🤔","😢","😡","👍","👎","❤️","🔥","🎉","💯","🙏","👀","💪","🤣","😅","🥳","😴","🤯","👋","✅","❌","⚡","🎮","🏆","💎","🌟"];

function fmtTime(d: string) {
  const dt = new Date(d);
  if (isToday(dt)) return format(dt, "HH:mm");
  if (isYesterday(dt)) return "Yesterday";
  return format(dt, "MMM d");
}

const Messages = () => {
  const { friendId } = useParams<{ friendId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [msgRequests, setMsgRequests] = useState<any[]>([]);
  const [blocked, setBlocked] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeFriend, setActiveFriend] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [readBy, setReadBy] = useState<Set<string>>(new Set());
  const [showEmoji, setShowEmoji] = useState(false);
  const [search, setSearch] = useState("");
  const [sideTab, setSideTab] = useState("chats");
  const [findQuery, setFindQuery] = useState("");
  const [findResults, setFindResults] = useState<any[]>([]);
  const [findLoading, setFindLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [convs, frds, reqs, msgReqs, grps] = await Promise.all([
        api.chat.getRecent(),
        api.friends.getList(),
        api.friends.getRequests(),
        api.messageRequests.getAll(),
        api.groups.getAll(),
      ]);
      setConversations(convs as any);
      setFriends(frds as any);
      setRequests(reqs as any);
      setMsgRequests(msgReqs as any);
      setGroups(grps as any);
    } catch {}
    // Load blocked separately
    try {
      const r = await fetch("/api/user-experience/blocked", { credentials: "include" });
      if (r.ok) setBlocked(await r.json());
    } catch {}
  }, []);

  const openConversation = useCallback(async (fId: string) => {
    navigate(`/messages/${fId}`, { replace: true });
    setMsgLoading(true);
    setReadBy(new Set());
    try {
      const [msgs, frds] = await Promise.all([
        api.chat.getConversation(fId),
        api.friends.getList(),
      ]);
      setMessages(msgs);
      setFriends(frds as any);
      const friend = (frds as any[]).find((f: any) => f.friend_id === fId);
      if (friend) setActiveFriend(friend);
      socketMarkRead(fId);
      scrollToBottom();
      loadData();
    } catch {} finally { setMsgLoading(false); }
  }, [navigate, scrollToBottom, loadData]);

  // Socket
  useEffect(() => {
    onNewMessage((data) => {
      if (friendId === data.sender_id) {
        setMessages(prev => [...prev, data]);
        socketMarkRead(data.sender_id);
        scrollToBottom();
      }
      loadData();
    });
    onMessageSent((data) => {
      if (friendId === data.receiver_id) {
        setMessages(prev => prev.find(m => m.id === data.id) ? prev : [...prev, data]);
        scrollToBottom();
      }
      loadData();
    });
    onUnreadCount(() => loadData());
    onFriendStatusChange((data) => {
      const upd = (arr: any[]) => arr.map((f: any) =>
        f.friend_id === data.userId ? { ...f, is_online: data.isOnline } : f
      );
      setFriends(upd);
      setConversations(upd);
      if (activeFriend?.friend_id === data.userId)
        setActiveFriend((p: any) => p ? { ...p, is_online: data.isOnline } : p);
    });
    onUserTyping((data) => { if (friendId === data.userId) setTypingUsers(p => new Set(p).add(data.userId)); });
    onUserStopTyping((data) => { setTypingUsers(p => { const s = new Set(p); s.delete(data.userId); return s; }); });
    onMessagesRead((data) => { if (data.by === friendId) setReadBy(p => new Set(p).add(data.by)); });
    return () => {
      offNewMessage(); offMessageSent(); offUnreadCount(); offFriendStatusChange();
      offUserTyping(); offUserStopTyping(); offMessagesRead();
    };
  }, [friendId, activeFriend, scrollToBottom, loadData]);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  useEffect(() => {
    if (!friendId || loading) return;
    openConversation(friendId);
  }, [friendId, loading]);

  const sendMessage = () => {
    if (!friendId || !newMessage.trim()) return;
    socketSend(friendId, newMessage.trim());
    setNewMessage("");
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    sendStopTyping(friendId);
    setShowEmoji(false);
  };

  const handleTyping = () => {
    if (!friendId) return;
    sendTyping(friendId);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendStopTyping(friendId!), 2000);
  };

  // Friend management actions
  const acceptRequest = async (reqId: number) => {
    try { await api.friends.acceptRequest(reqId); toast.success("Friend request accepted"); loadData(); }
    catch (e: any) { toast.error(e.message); }
  };
  const rejectRequest = async (reqId: number) => {
    try { await api.friends.rejectRequest(reqId); loadData(); }
    catch {}
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) { toast.error("Enter a group name"); return; }
    setCreatingGroup(true);
    try {
      await api.groups.create({ name: groupName.trim(), memberIds: groupMembers });
      toast.success("Group created!");
      setCreateGroupOpen(false);
      setGroupName("");
      setGroupMembers([]);
      loadData();
    } catch (e: any) { toast.error(e.message || "Failed to create group"); }
    finally { setCreatingGroup(false); }
  };

  // Message request handlers
  const acceptMsgRequest = async (reqId: number, senderId: string) => {
    try {
      await api.messageRequests.accept(reqId);
      toast.success("Message request accepted — you can now chat!");
      loadData();
      openConversation(senderId);
    } catch (e: any) { toast.error(e.message || "Failed to accept"); }
  };
  const declineMsgRequest = async (reqId: number) => {
    try { await api.messageRequests.decline(reqId); toast.success("Request declined"); loadData(); }
    catch (e: any) { toast.error(e.message || "Failed to decline"); }
  };
  const removeFriend = async (fId: string, name: string) => {
    if (!confirm(`Remove ${name} from friends?`)) return;
    try { await api.friends.remove(fId); toast.success("Friend removed"); loadData(); if (friendId === fId) navigate("/messages"); }
    catch (e: any) { toast.error(e.message); }
  };
  const blockUser = async (fId: string, name: string) => {
    if (!confirm(`Block ${name}? They won't be able to message you.`)) return;
    try {
      await api.userExperience.blockUser(fId);
      await api.friends.remove(fId).catch(() => {});
      toast.success("User blocked");
      loadData();
      if (friendId === fId) navigate("/messages");
    } catch (e: any) { toast.error(e.message); }
  };
  const unblockUser = async (fId: string) => {
    try { await api.userExperience.unblockUser(fId); toast.success("User unblocked"); loadData(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleFindSearch = async (q: string) => {
    setFindQuery(q);
    if (q.trim().length < 2) { setFindResults([]); return; }
    setFindLoading(true);
    try {
      const results = await api.userExperience.searchUsers(q.trim());
      // Exclude self
      setFindResults(results.filter((r: any) => r.id !== user?.id));
    } catch { setFindResults([]); }
    finally { setFindLoading(false); }
  };

  const sendFriendRequest = async (targetId: string) => {
    try {
      await api.friends.sendRequest(targetId);
      setSentRequests(prev => new Set(prev).add(targetId));
      toast.success("Friend request sent!");
    } catch (e: any) { toast.error(e.message || "Failed to send request"); }
  };
  const deleteConversation = async (fId: string) => {
    if (!confirm("Delete this conversation? Messages will be removed for you.")) return;
    try {
      await fetch(`/api/chat/conversation/${fId}`, { method: "DELETE", credentials: "include" });
      toast.success("Conversation deleted");
      loadData();
      if (friendId === fId) { setMessages([]); navigate("/messages"); }
    } catch { toast.error("Failed to delete conversation"); }
  };

  const filteredConvs = conversations.filter((c: any) =>
    !search || (c.display_name || c.username || "").toLowerCase().includes(search.toLowerCase())
  );

  const grouped: { date: string; msgs: any[] }[] = [];
  messages.forEach((msg: any) => {
    const d = format(new Date(msg.created_at), "MMM d, yyyy");
    const last = grouped[grouped.length - 1];
    if (last && last.date === d) last.msgs.push(msg);
    else grouped.push({ date: d, msgs: [msg] });
  });

  const isMe = (msg: any) => msg.sender_id === user?.id;
  const lastMyMsg = [...messages].reverse().find(m => isMe(m));

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      <Helmet><title>Messages — VoteVault</title></Helmet>

      {/* ── Left sidebar ── */}
      <div className={cn("w-full md:w-80 flex-shrink-0 border-r border-white/10 flex flex-col glass-strong", friendId && "hidden md:flex")}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-xl font-bold">Messages</h1>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setCreateGroupOpen(true)}>
              <Plus className="h-3.5 w-3.5" />Group
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-9 bg-white/5 border-white/10 h-9 text-sm" />
          </div>
        </div>

        <Tabs value={sideTab} onValueChange={setSideTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-3 mt-2 mb-1 grid grid-cols-5 bg-white/5 h-8 flex-shrink-0">
            <TabsTrigger value="chats" className="text-xs">
              Chats
              {conversations.filter((c: any) => c.unread_count > 0).length > 0 && (
                <Badge className="ml-1 h-4 px-1 bg-primary text-[10px]">{conversations.filter((c: any) => c.unread_count > 0).length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="friends" className="text-xs">Friends</TabsTrigger>
            <TabsTrigger value="requests" className="text-xs">
              Requests
              {requests.length > 0 && <Badge className="ml-1 h-4 px-1 bg-primary text-[10px]">{requests.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="msg-requests" className="text-xs">
              Msgs
              {msgRequests.length > 0 && <Badge className="ml-1 h-4 px-1 bg-yellow-500 text-[10px]">{msgRequests.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="find" className="text-xs">Find</TabsTrigger>
          </TabsList>

          {/* Chats tab */}
          <TabsContent value="chats" className="flex-1 overflow-hidden m-0 p-0">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="space-y-2 p-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl shimmer" />)}</div>
              ) : filteredConvs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No conversations yet</div>
              ) : filteredConvs.map((conv: any) => (
                <div key={conv.friend_id} className={cn("flex items-center gap-2 px-2 py-1 border-b border-white/5 group", friendId === conv.friend_id && "bg-primary/10 border-l-2 border-l-primary")}>
                  <button onClick={() => openConversation(conv.friend_id)} className="flex items-center gap-3 flex-1 p-2 hover:bg-white/5 rounded-lg transition-colors min-w-0">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-11 w-11 border border-white/10">
                        <AvatarImage src={conv.avatar_url} />
                        <AvatarFallback className="bg-primary/20 text-primary">{(conv.display_name || conv.username || "?")[0]}</AvatarFallback>
                      </Avatar>
                      {conv.is_online && <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500" />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={cn("text-sm truncate", conv.unread_count > 0 ? "font-bold" : "font-medium")}>{conv.display_name || conv.username}</span>
                        <span className="text-[10px] text-muted-foreground ml-1 flex-shrink-0">{conv.last_message_at ? fmtTime(conv.last_message_at) : ""}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={cn("text-xs truncate", conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                          {conv.is_sent ? "You: " : ""}{conv.last_message}
                        </p>
                        {conv.unread_count > 0 && <Badge className="h-5 min-w-5 px-1.5 bg-primary text-[10px] ml-1 flex-shrink-0">{conv.unread_count}</Badge>}
                      </div>
                    </div>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-strong border-white/10">
                      <DropdownMenuItem asChild><Link to={`/user/${conv.friend_id}`}>View Profile</Link></DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem onClick={() => removeFriend(conv.friend_id, conv.display_name || conv.username)} className="text-orange-400">
                        <UserMinus className="h-4 w-4 mr-2" />Remove Friend
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteConversation(conv.friend_id)} className="text-red-400">
                        <Trash2 className="h-4 w-4 mr-2" />Delete Conversation
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => blockUser(conv.friend_id, conv.display_name || conv.username)} className="text-red-400">
                        <Ban className="h-4 w-4 mr-2" />Block User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {/* Group chats section */}
              {groups.length > 0 && (
                <>
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> Groups ({groups.length})
                    </p>
                  </div>
                  {groups.map((g: any) => (
                    <div key={g.id} className="flex items-center gap-2 px-2 py-1 border-b border-white/5">
                      <button
                        onClick={() => navigate(`/messages/group/${g.id}`, { replace: true })}
                        className="flex items-center gap-3 flex-1 p-2 hover:bg-white/5 rounded-lg transition-colors min-w-0"
                      >
                        <div className="h-11 w-11 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-medium truncate">{g.name}</span>
                            <span className="text-[10px] text-muted-foreground ml-1 flex-shrink-0">
                              {g.last_message_at ? fmtTime(g.last_message_at) : ""}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {g.last_message || `${g.member_count} members`}
                          </p>
                        </div>
                      </button>
                    </div>
                  ))}
                </>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Friends tab */}
          <TabsContent value="friends" className="flex-1 overflow-hidden m-0 p-0">
            <ScrollArea className="h-full">
              {/* Blocked section */}
              {blocked.length > 0 && (
                <div className="px-3 pt-3 pb-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Blocked ({blocked.length})</p>
                  {blocked.map((b: any) => (
                    <div key={b.blocked_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                      <Avatar className="h-9 w-9 opacity-50">
                        <AvatarImage src={b.avatar_url} />
                        <AvatarFallback className="text-xs">{(b.display_name || b.username || "?")[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate text-muted-foreground">{b.display_name || b.username}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs border-green-500/40 text-green-400 hover:bg-green-500/10" onClick={() => unblockUser(b.blocked_id)}>
                        Unblock
                      </Button>
                    </div>
                  ))}
                  <div className="h-px bg-white/10 my-3" />
                </div>
              )}
              <div className="px-3 pt-2 pb-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Friends ({friends.length})</p>
              </div>
              {friends.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">No friends yet</div>
              ) : friends.map((f: any) => (
                <div key={f.friend_id} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 group">
                  <Link to={`/user/${f.friend_id}`} className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarImage src={f.avatar_url} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">{(f.display_name || f.username || "?")[0]}</AvatarFallback>
                    </Avatar>
                    {f.is_online && <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500" />}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/user/${f.friend_id}`} className="text-sm font-medium hover:text-primary transition-colors truncate block">{f.display_name || f.username}</Link>
                    <p className="text-xs text-muted-foreground">{f.is_online ? <span className="text-green-400">● Online</span> : "Offline"}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openConversation(f.friend_id)} title="Message">
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-strong border-white/10">
                        <DropdownMenuItem onClick={() => removeFriend(f.friend_id, f.display_name || f.username)} className="text-orange-400">
                          <UserMinus className="h-4 w-4 mr-2" />Remove Friend
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => blockUser(f.friend_id, f.display_name || f.username)} className="text-red-400">
                          <Ban className="h-4 w-4 mr-2" />Block
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          {/* Requests tab */}
          <TabsContent value="requests" className="flex-1 overflow-hidden m-0 p-0">
            <ScrollArea className="h-full">
              {requests.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  No pending requests
                </div>
              ) : requests.map((req: any) => (
                <div key={req.id} className="flex items-center gap-3 p-3 border-b border-white/5 hover:bg-white/5">
                  <Link to={`/user/${req.sender_id}`} className="flex-shrink-0">
                    <Avatar className="h-11 w-11 border border-white/10">
                      <AvatarImage src={req.avatar_url} />
                      <AvatarFallback className="bg-primary/20 text-primary">{(req.display_name || req.username || "?")[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/user/${req.sender_id}`} className="text-sm font-medium hover:text-primary transition-colors truncate block">{req.display_name || req.username}</Link>
                    <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button size="sm" className="h-8 px-3 text-xs bg-primary hover:bg-primary/90" onClick={() => acceptRequest(req.id)}>
                      <UserPlus className="h-3.5 w-3.5 mr-1" />Accept
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-red-500/40 text-red-400 hover:bg-red-500/10" onClick={() => rejectRequest(req.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          {/* Message Requests tab */}
          <TabsContent value="msg-requests" className="flex-1 overflow-hidden m-0 p-0">
            <ScrollArea className="h-full">
              {msgRequests.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  <MessageSquarePlus className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  No message requests
                </div>
              ) : msgRequests.map((req: any) => (
                <div key={req.id} className="p-3 border-b border-white/5 hover:bg-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Link to={`/user/${req.sender_id}`} className="flex-shrink-0">
                      <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={req.avatar_url} />
                        <AvatarFallback className="bg-primary/20 text-primary">{(req.display_name || req.username || "?")[0]}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/user/${req.sender_id}`} className="text-sm font-medium hover:text-primary transition-colors truncate block">
                        {req.display_name || req.username}
                      </Link>
                      <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground bg-white/5 rounded-lg p-2 mb-2 italic">"{req.message}"</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-7 text-xs bg-primary hover:bg-primary/90"
                      onClick={() => acceptMsgRequest(req.id, req.sender_id)}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10"
                      onClick={() => declineMsgRequest(req.id)}>
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          {/* Find People tab */}
          <TabsContent value="find" className="flex-1 overflow-hidden m-0 p-0 flex flex-col">
            <div className="p-3 border-b border-white/10 flex-shrink-0">
              <p className="text-xs text-muted-foreground mb-2">Search by username, display name, or <span className="font-mono text-primary">username#1234</span></p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={findQuery}
                  onChange={e => handleFindSearch(e.target.value)}
                  placeholder="Search users..."
                  className="pl-9 bg-white/5 border-white/10 h-9 text-sm"
                />
                {findLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                )}
              </div>
            </div>
            <ScrollArea className="flex-1">
              {findQuery.length < 2 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  <UserPlus className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Find people to add as friends</p>
                  <p className="text-xs mt-1 opacity-70">Type at least 2 characters</p>
                </div>
              ) : findResults.length === 0 && !findLoading ? (
                <div className="p-6 text-center text-muted-foreground text-sm">No users found for "{findQuery}"</div>
              ) : (
                findResults.map((u: any) => {
                  const isFriend = friends.some((f: any) => f.friend_id === u.id);
                  const requested = sentRequests.has(u.id);
                  return (
                    <div key={u.id} className="flex items-center gap-3 p-3 border-b border-white/5 hover:bg-white/5">
                      <Link to={`/user/${u.id}`} className="flex-shrink-0">
                        <Avatar className="h-11 w-11 border border-white/10">
                          <AvatarImage src={u.avatar_url} />
                          <AvatarFallback className="bg-primary/20 text-primary text-sm">{(u.display_name || u.username || "?")[0]}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/user/${u.id}`} className="text-sm font-medium hover:text-primary transition-colors truncate block">
                          {u.display_name || u.username}
                        </Link>
                        <p className="text-xs font-mono text-muted-foreground">{u.tag || `${u.username}#${String(u.discriminator || 0).padStart(4, '0')}`}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {isFriend ? (
                          <span className="text-xs text-green-400 font-medium">Friends</span>
                        ) : requested ? (
                          <span className="text-xs text-muted-foreground">Sent</span>
                        ) : (
                          <Button size="sm" className="h-8 px-3 text-xs" onClick={() => sendFriendRequest(u.id)}>
                            <UserPlus className="h-3.5 w-3.5 mr-1" />Add
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Create Group Dialog ── */}
      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent className="glass-strong border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Create Group Chat
            </DialogTitle>
            <DialogDescription>
              Create a group with your friends. You can add more members later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Group Name</label>
              <Input
                placeholder="e.g. Game Night Squad"
                value={groupName}
                onChange={e => setGroupName(e.target.value.slice(0, 100))}
                className="bg-white/5 border-white/10"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Add Friends <span className="text-muted-foreground font-normal">({groupMembers.length} selected)</span>
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-white/10 p-2">
                {friends.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No friends to add</p>
                ) : friends.map((f: any) => {
                  const selected = groupMembers.includes(f.friend_id);
                  return (
                    <button
                      key={f.friend_id}
                      onClick={() => setGroupMembers(prev =>
                        selected ? prev.filter(id => id !== f.friend_id) : [...prev, f.friend_id]
                      )}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                        selected ? "bg-primary/15 border border-primary/30" : "hover:bg-white/5"
                      )}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={f.avatar_url} />
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {(f.display_name || f.username || "?")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm flex-1 truncate">{f.display_name || f.username}</span>
                      {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="hero"
                className="flex-1"
                disabled={creatingGroup || !groupName.trim()}
                onClick={handleCreateGroup}
              >
                {creatingGroup ? "Creating…" : "Create Group"}
              </Button>
              <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Chat area ── */}
      {friendId && activeFriend ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="h-16 px-4 border-b border-white/10 flex items-center gap-3 glass-strong flex-shrink-0">
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => navigate("/messages")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Link to={`/user/${activeFriend.friend_id}`} className="relative flex-shrink-0">
              <Avatar className="h-10 w-10 border border-white/10">
                <AvatarImage src={activeFriend.avatar_url} />
                <AvatarFallback className="bg-primary/20 text-primary">{(activeFriend.display_name || activeFriend.username || "?")[0]}</AvatarFallback>
              </Avatar>
              {activeFriend.is_online && <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500" />}
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/user/${activeFriend.friend_id}`} className="font-semibold text-sm hover:text-primary transition-colors block truncate">
                {activeFriend.display_name || activeFriend.username}
              </Link>
              <p className="text-xs text-muted-foreground">
                {typingUsers.has(activeFriend.friend_id) ? <span className="text-primary animate-pulse">typing...</span>
                  : activeFriend.is_online ? <span className="text-green-400">Active now</span> : "Offline"}
              </p>
            </div>
            {/* Chat actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-strong border-white/10">
                <DropdownMenuItem asChild><Link to={`/user/${activeFriend.friend_id}`}>View Profile</Link></DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => removeFriend(activeFriend.friend_id, activeFriend.display_name || activeFriend.username)} className="text-orange-400">
                  <UserMinus className="h-4 w-4 mr-2" />Remove Friend
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => deleteConversation(activeFriend.friend_id)} className="text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" />Delete Conversation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => blockUser(activeFriend.friend_id, activeFriend.display_name || activeFriend.username)} className="text-red-400">
                  <Ban className="h-4 w-4 mr-2" />Block User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
            {msgLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                <Avatar className="h-20 w-20 border-2 border-white/10">
                  <AvatarImage src={activeFriend.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl">{(activeFriend.display_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-lg">{activeFriend.display_name || activeFriend.username}</p>
                  <p className="text-sm text-muted-foreground mt-1">You're friends on VoteVault</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Say hello! 👋</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1 pb-2">
                {grouped.map(group => (
                  <div key={group.date}>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-[11px] text-muted-foreground px-2">{group.date}</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>
                    {group.msgs.map((msg: any, i: number) => {
                      const mine = isMe(msg);
                      const prevSame = i > 0 && isMe(group.msgs[i - 1]) === mine;
                      const nextSame = i < group.msgs.length - 1 && isMe(group.msgs[i + 1]) === mine;
                      const isLast = msg.id === lastMyMsg?.id;
                      return (
                        <div key={msg.id} className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start", prevSame ? "mt-0.5" : "mt-3")}>
                          {!mine && (
                            <div className="w-8 flex-shrink-0 self-end">
                              {!nextSame && (
                                <Link to={`/user/${activeFriend.friend_id}`}>
                                  <Avatar className="h-8 w-8 hover:opacity-80 transition-opacity">
                                    <AvatarImage src={activeFriend.avatar_url} />
                                    <AvatarFallback className="text-xs bg-primary/20 text-primary">{(activeFriend.display_name || "?")[0]}</AvatarFallback>
                                  </Avatar>
                                </Link>
                              )}
                            </div>
                          )}
                          <div className={cn("flex flex-col max-w-[65%]", mine ? "items-end" : "items-start")}>
                            <div className={cn(
                              "px-3 py-2 text-sm break-words",
                              mine ? "bg-primary text-white" : "bg-white/10 text-foreground",
                              mine ? (prevSame && nextSame ? "rounded-2xl rounded-r-sm" : prevSame ? "rounded-2xl rounded-br-sm" : nextSame ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-r-sm")
                                   : (prevSame && nextSame ? "rounded-2xl rounded-l-sm" : prevSame ? "rounded-2xl rounded-bl-sm" : nextSame ? "rounded-2xl rounded-tl-sm" : "rounded-2xl rounded-l-sm")
                            )}>
                              {msg.message}
                            </div>
                            {(!nextSame || isLast) && (
                              <div className={cn("flex items-center gap-1 mt-0.5 px-1", mine ? "flex-row-reverse" : "flex-row")}>
                                <span className="text-[10px] text-muted-foreground">{format(new Date(msg.created_at), "HH:mm")}</span>
                                {mine && (isLast && readBy.has(activeFriend.friend_id) ? <CheckCheck className="h-3 w-3 text-primary" />
                                  : msg.is_read ? <CheckCheck className="h-3 w-3 text-muted-foreground" />
                                  : <Check className="h-3 w-3 text-muted-foreground" />)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {typingUsers.has(activeFriend.friend_id) && (
                  <div className="flex items-end gap-2 mt-3">
                    <Avatar className="h-8 w-8"><AvatarImage src={activeFriend.avatar_url} /><AvatarFallback className="text-xs">{(activeFriend.display_name || "?")[0]}</AvatarFallback></Avatar>
                    <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                      {[0,1,2].map(i => <div key={i} className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-white/10 glass-strong flex-shrink-0">
            {showEmoji && (
              <div className="mb-2 p-2 glass rounded-xl border border-white/10 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {EMOJIS.map(e => <button key={e} onClick={() => { setNewMessage(m => m + e); inputRef.current?.focus(); }} className="text-xl hover:scale-125 transition-transform leading-none p-0.5">{e}</button>)}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className={cn("h-9 w-9 flex-shrink-0", showEmoji && "text-primary")} onClick={() => setShowEmoji(s => !s)}>
                <Smile className="h-5 w-5" />
              </Button>
              <Input ref={inputRef} value={newMessage} onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Aa" className="flex-1 bg-white/5 border-white/10 rounded-full h-10 px-4 text-sm" />
              <Button size="icon" onClick={sendMessage} disabled={!newMessage.trim()}
                className={cn("h-10 w-10 flex-shrink-0 rounded-full transition-all", newMessage.trim() ? "bg-primary hover:bg-primary/90 text-white" : "bg-white/10 text-muted-foreground")}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center gap-4 text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Send className="h-10 w-10 text-primary opacity-40" />
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">Your Messages</h2>
            <p className="text-muted-foreground text-sm">Select a conversation or manage your friends</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
