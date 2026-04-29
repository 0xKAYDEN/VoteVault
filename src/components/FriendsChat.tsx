import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import {
  getSocket, onNewMessage, onMessageSent, onUnreadCount, onFriendStatusChange,
  onUserTyping, onUserStopTyping, onNewFriendRequest,
  offNewMessage, offMessageSent, offUnreadCount, offFriendStatusChange,
  offUserTyping, offUserStopTyping, offNewFriendRequest,
  sendMessage as socketSendMessage, markMessagesAsRead as socketMarkAsRead,
  sendTyping, sendStopTyping,
} from "@/lib/socket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageCircle, UserPlus, Check, X, Send, Circle, ArrowLeft, Smile } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const EMOJIS = ["😀","😂","😍","🥰","😎","🤔","😢","😡","👍","👎","❤️","🔥","🎉","💯","🙏","👀","💪","🤣","😅","🥳","😴","🤯","👋","✅","❌","⚡","🎮","🏆","💎","🌟"];

interface Friend { friend_id: string; username: string; display_name: string; avatar_url: string; is_online: boolean; last_seen: string; }
interface FriendRequest { id: number; sender_id: string; username: string; display_name: string; avatar_url: string; created_at: string; }
interface Conversation { friend_id: string; username: string; display_name: string; avatar_url: string; last_message: string; last_message_at: string; is_sent: boolean; unread_count: number; is_online: boolean; }

export function FriendsChat() {
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    onNewMessage((data) => {
      if (activeChat === data.sender_id) {
        setMessages(prev => [...prev, data]);
        socketMarkAsRead(data.sender_id);
      } else {
        loadData();
      }
    });
    onMessageSent((data) => {
      if (activeChat === data.receiver_id) setMessages(prev => [...prev, data]);
      loadData();
    });
    onUnreadCount((count) => setUnreadCount(count));
    onFriendStatusChange((data) => {
      setFriends(prev => prev.map(f => f.friend_id === data.userId ? { ...f, is_online: data.isOnline, last_seen: data.lastSeen } : f));
      setConversations(prev => prev.map(c => c.friend_id === data.userId ? { ...c, is_online: data.isOnline } : c));
    });
    onUserTyping((data) => { if (activeChat === data.userId) setTypingUsers(prev => new Set(prev).add(data.userId)); });
    onUserStopTyping((data) => { setTypingUsers(prev => { const s = new Set(prev); s.delete(data.userId); return s; }); });
    onNewFriendRequest(() => loadData());

    return () => {
      offNewMessage(); offMessageSent(); offUnreadCount(); offFriendStatusChange();
      offUserTyping(); offUserStopTyping(); offNewFriendRequest();
    };
  }, [activeChat]);

  const handleTyping = () => {
    if (!activeChat) return;
    sendTyping(activeChat);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendStopTyping(activeChat), 2000);
  };

  const loadData = async () => {
    try {
      const [friendsData, requestsData, conversationsData, unreadData] = await Promise.all([
        api.friends.getList(), api.friends.getRequests(),
        api.chat.getRecent(), api.chat.getUnreadCount(),
      ]);
      setFriends(friendsData as any);
      setRequests(requestsData as any);
      setConversations(conversationsData as any);
      setUnreadCount(unreadData.count);
    } catch (error) { console.error("Error loading friends data:", error); }
  };

  useEffect(() => { if (open) loadData(); }, [open]);

  const acceptRequest = async (id: number) => {
    try { await api.friends.acceptRequest(id); toast.success("Friend request accepted"); loadData(); }
    catch (e: any) { toast.error(e.message || "Failed"); }
  };
  const rejectRequest = async (id: number) => {
    try { await api.friends.rejectRequest(id); loadData(); }
    catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const openChat = async (friendId: string) => {
    setActiveChat(friendId);
    setLoading(true);
    try {
      const msgs = await api.chat.getConversation(friendId);
      setMessages(msgs);
      socketMarkAsRead(friendId);
      loadData();
    } catch { } finally { setLoading(false); }
  };

  const sendMessage = async () => {
    if (!activeChat || !newMessage.trim()) return;
    const text = newMessage.trim();
    setNewMessage("");
    socketSendMessage(activeChat, text);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendStopTyping(activeChat);
  };

  const totalNotifications = requests.length + unreadCount;
  const activeFriend = conversations.find(c => c.friend_id === activeChat) || friends.find(f => f.friend_id === activeChat);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Users className="h-5 w-5" />
          {totalNotifications > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-crimson text-white text-[10px]">
              {totalNotifications > 9 ? "9+" : totalNotifications}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="glass-strong border-white/10 w-[380px] p-0 overflow-hidden" align="end">
        {activeChat ? (
          <ChatWindow
            friend={activeFriend}
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sendMessage={sendMessage}
            onBack={() => setActiveChat(null)}
            loading={loading}
            typingUsers={typingUsers}
            onTyping={handleTyping}
          />
        ) : (
          <Tabs defaultValue="chats" className="w-full">
            <div className="p-3 border-b border-white/10">
              <h3 className="font-semibold text-sm mb-2">Messages</h3>
              <TabsList className="w-full grid grid-cols-3 bg-white/5 h-8">
                <TabsTrigger value="chats" className="text-xs relative">
                  Chats
                  {unreadCount > 0 && <Badge className="ml-1 h-4 px-1 bg-primary text-[10px]">{unreadCount}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="friends" className="text-xs">Friends</TabsTrigger>
                <TabsTrigger value="requests" className="text-xs relative">
                  Requests
                  {requests.length > 0 && <Badge className="ml-1 h-4 px-1 bg-primary text-[10px]">{requests.length}</Badge>}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chats" className="p-0 m-0">
              <ScrollArea className="h-[380px]">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No conversations yet</div>
                ) : conversations.map(conv => (
                  <button key={conv.friend_id} onClick={() => openChat(conv.friend_id)}
                    className="w-full p-3 hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-11 w-11 border border-white/10">
                        <AvatarImage src={conv.avatar_url} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm">
                          {conv.display_name?.[0] || conv.username?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      {conv.is_online && <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500" />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-medium text-sm truncate">{conv.display_name || conv.username}</span>
                        {conv.unread_count > 0 && (
                          <Badge className="h-5 min-w-5 px-1.5 bg-primary text-[10px] flex-shrink-0">{conv.unread_count}</Badge>
                        )}
                      </div>
                      <p className={cn("text-xs truncate", conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                        {conv.is_sent ? "You: " : ""}{conv.last_message}
                      </p>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="friends" className="p-0 m-0">
              <ScrollArea className="h-[380px]">
                {friends.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No friends yet</div>
                ) : friends.map(friend => (
                  <FriendRow key={friend.friend_id} friend={friend} onChat={() => openChat(friend.friend_id)} />
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="requests" className="p-0 m-0">
              <ScrollArea className="h-[380px]">
                {requests.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No pending requests</div>
                ) : requests.map(req => (
                  <div key={req.id} className="p-3 hover:bg-white/5 flex items-center gap-3 border-b border-white/5">
                    <AvatarLink userId={req.sender_id} avatarUrl={req.avatar_url} name={req.display_name || req.username} online={false} onClose={() => setOpen(false)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{req.display_name || req.username}</p>
                      <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-green-500/50 text-green-400 hover:bg-green-500/10" onClick={() => acceptRequest(req.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => rejectRequest(req.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </PopoverContent>
    </Popover>
  );
}

function AvatarLink({ userId, avatarUrl, name, online, onClose }: { userId: string; avatarUrl: string; name: string; online: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => { onClose(); navigate(`/user/${userId}`); }}
      className="relative flex-shrink-0 hover:opacity-80 transition-opacity"
    >
      <Avatar className="h-11 w-11 border border-white/10">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback className="bg-primary/20 text-primary text-sm">{name?.[0] || "?"}</AvatarFallback>
      </Avatar>
      {online && <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500" />}
    </button>
  );
}

function FriendRow({ friend, onChat }: { friend: Friend; onChat: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="p-3 hover:bg-white/5 flex items-center gap-3 border-b border-white/5">
      <AvatarLink userId={friend.friend_id} avatarUrl={friend.avatar_url} name={friend.display_name || friend.username} online={friend.is_online} onClose={() => {}} />
      <div className="flex-1 min-w-0">
        <button onClick={() => navigate(`/user/${friend.friend_id}`)} className="font-medium text-sm hover:text-primary transition-colors truncate block text-left">
          {friend.display_name || friend.username}
        </button>
        <p className="text-xs text-muted-foreground">
          {friend.is_online ? <span className="text-green-400">● Online</span> : `Last seen ${new Date(friend.last_seen).toLocaleDateString()}`}
        </p>
      </div>
      <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={onChat}>
        <MessageCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ChatWindow({ friend, messages, newMessage, setNewMessage, sendMessage, onBack, loading, typingUsers, onTyping }: any) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const insertEmoji = (emoji: string) => {
    setNewMessage((prev: string) => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  // Group messages by date
  const grouped: { date: string; msgs: any[] }[] = [];
  messages.forEach((msg: any) => {
    const d = format(new Date(msg.created_at), "MMM d, yyyy");
    const last = grouped[grouped.length - 1];
    if (last && last.date === d) last.msgs.push(msg);
    else grouped.push({ date: d, msgs: [msg] });
  });

  const isMe = (msg: any) => msg.sender_id !== friend?.friend_id;

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <button
          onClick={() => navigate(`/user/${friend?.friend_id}`)}
          className="relative flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-9 w-9 border border-white/10">
            <AvatarImage src={friend?.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {friend?.display_name?.[0] || friend?.username?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          {friend?.is_online && <Circle className="absolute bottom-0 right-0 h-2.5 w-2.5 fill-green-500 text-green-500" />}
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={() => navigate(`/user/${friend?.friend_id}`)} className="font-semibold text-sm hover:text-primary transition-colors truncate block text-left">
            {friend?.display_name || friend?.username}
          </button>
          <p className="text-xs text-muted-foreground">
            {typingUsers.has(friend?.friend_id) ? (
              <span className="text-primary animate-pulse">typing...</span>
            ) : friend?.is_online ? (
              <span className="text-green-400">Active now</span>
            ) : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Avatar className="h-16 w-16 border-2 border-white/10">
              <AvatarImage src={friend?.avatar_url} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl">{friend?.display_name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{friend?.display_name || friend?.username}</p>
              <p className="text-xs text-muted-foreground mt-1">Say hello!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {grouped.map(group => (
              <div key={group.date}>
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] text-muted-foreground px-2">{group.date}</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                {group.msgs.map((msg: any, i: number) => {
                  const mine = isMe(msg);
                  const prevMine = i > 0 ? isMe(group.msgs[i - 1]) : !mine;
                  const showAvatar = !mine && prevMine !== mine;
                  return (
                    <div key={msg.id} className={cn("flex items-end gap-2 mb-0.5", mine ? "justify-end" : "justify-start")}>
                      {!mine && (
                        <div className="w-6 flex-shrink-0">
                          {showAvatar && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={friend?.avatar_url} />
                              <AvatarFallback className="text-[10px]">{friend?.display_name?.[0]}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[72%] rounded-2xl px-3 py-2 text-sm",
                        mine
                          ? "bg-primary text-white rounded-br-sm"
                          : "bg-white/10 text-foreground rounded-bl-sm"
                      )}>
                        <p className="break-words">{msg.message}</p>
                        <p className={cn("text-[10px] mt-0.5 text-right", mine ? "text-white/60" : "text-muted-foreground")}>
                          {format(new Date(msg.created_at), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-white/10 bg-white/[0.02]">
        {showEmoji && (
          <div className="mb-2 p-2 glass rounded-xl border border-white/10 flex flex-wrap gap-1.5">
            {EMOJIS.map(e => (
              <button key={e} onClick={() => insertEmoji(e)} className="text-lg hover:scale-125 transition-transform leading-none">
                {e}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" size="icon"
            className={cn("h-9 w-9 flex-shrink-0", showEmoji && "text-primary")}
            onClick={() => setShowEmoji(s => !s)}
          >
            <Smile className="h-5 w-5" />
          </Button>
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={e => { setNewMessage(e.target.value); onTyping(); }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Aa"
            className="flex-1 bg-white/5 border-white/10 rounded-full h-9 px-4 text-sm"
          />
          <Button
            size="icon"
            className={cn("h-9 w-9 flex-shrink-0 rounded-full transition-all", newMessage.trim() ? "bg-primary hover:bg-primary/90" : "bg-white/10 text-muted-foreground")}
            onClick={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
