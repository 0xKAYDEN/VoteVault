import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import {
  getSocket,
  onNewMessage,
  onMessageSent,
  onUnreadCount,
  onFriendStatusChange,
  onUserTyping,
  onUserStopTyping,
  onNewFriendRequest,
  offNewMessage,
  offMessageSent,
  offUnreadCount,
  offFriendStatusChange,
  offUserTyping,
  offUserStopTyping,
  offNewFriendRequest,
  sendMessage as socketSendMessage,
  markMessagesAsRead as socketMarkAsRead,
  sendTyping,
  sendStopTyping
} from "@/lib/socket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Users, MessageCircle, UserPlus, Check, X, Send, Circle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Friend {
  friend_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  is_online: boolean;
  last_seen: string;
}

interface FriendRequest {
  id: number;
  sender_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
}

interface Conversation {
  friend_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  last_message: string;
  last_message_at: string;
  is_sent: boolean;
  unread_count: number;
  is_online: boolean;
}

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

    // Listen for new messages
    onNewMessage((data) => {
      if (activeChat === data.sender_id) {
        setMessages(prev => [...prev, data]);
        socketMarkAsRead(data.sender_id);
      } else {
        loadData();
      }
    });

    // Listen for sent message confirmation
    onMessageSent((data) => {
      if (activeChat === data.receiver_id) {
        setMessages(prev => [...prev, data]);
      }
      loadData();
    });

    // Listen for unread count updates
    onUnreadCount((count) => {
      setUnreadCount(count);
    });

    // Listen for friend status changes
    onFriendStatusChange((data) => {
      setFriends(prev => prev.map(f =>
        f.friend_id === data.userId
          ? { ...f, is_online: data.isOnline, last_seen: data.lastSeen }
          : f
      ));
      setConversations(prev => prev.map(c =>
        c.friend_id === data.userId
          ? { ...c, is_online: data.isOnline }
          : c
      ));
    });

    // Listen for typing indicators
    onUserTyping((data) => {
      if (activeChat === data.userId) {
        setTypingUsers(prev => new Set(prev).add(data.userId));
      }
    });

    onUserStopTyping((data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    // Listen for new friend requests
    onNewFriendRequest(() => {
      loadData();
    });

    return () => {
      offNewMessage();
      offMessageSent();
      offUnreadCount();
      offFriendStatusChange();
      offUserTyping();
      offUserStopTyping();
      offNewFriendRequest();
    };
  }, [activeChat]);

  const handleTyping = () => {
    if (!activeChat) return;

    sendTyping(activeChat);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping(activeChat);
    }, 2000);
  };

  const loadData = async () => {
    try {
      const [friendsData, requestsData, conversationsData, unreadData] = await Promise.all([
        api.friends.getList(),
        api.friends.getRequests(),
        api.chat.getRecent(),
        api.chat.getUnreadCount(),
      ]);

      setFriends(friendsData);
      setRequests(requestsData);
      setConversations(conversationsData);
      setUnreadCount(unreadData.count);
    } catch (error) {
      console.error("Error loading friends data:", error);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const acceptRequest = async (requestId: number) => {
    try {
      await api.friends.acceptRequest(requestId);
      toast.success("Friend request accepted");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to accept request");
    }
  };

  const rejectRequest = async (requestId: number) => {
    try {
      await api.friends.rejectRequest(requestId);
      toast.success("Friend request rejected");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject request");
    }
  };

  const openChat = async (friendId: string) => {
    setActiveChat(friendId);
    setLoading(true);
    try {
      const msgs = await api.chat.getConversation(friendId);
      setMessages(msgs);
      socketMarkAsRead(friendId);
      loadData();
    } catch (error) {
      console.error("Error loading chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!activeChat || !newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage("");

    // Send via WebSocket for real-time delivery
    socketSendMessage(activeChat, messageText);

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendStopTyping(activeChat);
  };

  const totalNotifications = requests.length + unreadCount;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Users className="h-5 w-5" />
          {totalNotifications > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-crimson text-white text-[10px]">
              {totalNotifications > 9 ? '9+' : totalNotifications}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="glass-strong border-white/10 w-96 p-0" align="end">
        {activeChat ? (
          <ChatWindow
            friend={conversations.find(c => c.friend_id === activeChat) || friends.find(f => f.friend_id === activeChat)}
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
            <TabsList className="w-full grid grid-cols-3 bg-white/5">
              <TabsTrigger value="chats" className="relative">
                Chats
                {unreadCount > 0 && (
                  <Badge className="ml-1 h-4 px-1 bg-primary text-[10px]">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="requests" className="relative">
                Requests
                {requests.length > 0 && (
                  <Badge className="ml-1 h-4 px-1 bg-primary text-[10px]">{requests.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chats" className="p-0 m-0">
              <ScrollArea className="h-96">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.friend_id}
                      onClick={() => openChat(conv.friend_id)}
                      className="w-full p-3 hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10 border border-white/10">
                          <AvatarImage src={conv.avatar_url} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {conv.display_name?.[0] || conv.username?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        {conv.is_online && (
                          <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">{conv.display_name || conv.username}</span>
                          {conv.unread_count > 0 && (
                            <Badge className="h-5 px-1.5 bg-primary text-[10px]">{conv.unread_count}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.is_sent ? "You: " : ""}{conv.last_message}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="friends" className="p-0 m-0">
              <ScrollArea className="h-96">
                {friends.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No friends yet
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div key={friend.friend_id} className="p-3 hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5">
                      <Link to={`/user/${friend.friend_id}`} className="relative">
                        <Avatar className="h-10 w-10 border border-white/10">
                          <AvatarImage src={friend.avatar_url} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {friend.display_name?.[0] || friend.username?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        {friend.is_online && (
                          <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500" />
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/user/${friend.friend_id}`} className="font-medium text-sm hover:text-primary transition-colors truncate block">
                          {friend.display_name || friend.username}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {friend.is_online ? "Online" : `Last seen ${new Date(friend.last_seen).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openChat(friend.friend_id)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="requests" className="p-0 m-0">
              <ScrollArea className="h-96">
                {requests.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No pending requests
                  </div>
                ) : (
                  requests.map((req) => (
                    <div key={req.id} className="p-3 hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5">
                      <Link to={`/user/${req.sender_id}`}>
                        <Avatar className="h-10 w-10 border border-white/10">
                          <AvatarImage src={req.avatar_url} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {req.display_name?.[0] || req.username?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/user/${req.sender_id}`} className="font-medium text-sm hover:text-primary transition-colors truncate block">
                          {req.display_name || req.username}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-green-500/50 text-green-400"
                          onClick={() => acceptRequest(req.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-red-500/50 text-red-400"
                          onClick={() => rejectRequest(req.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ChatWindow({ friend, messages, newMessage, setNewMessage, sendMessage, onBack, loading, typingUsers, onTyping }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[500px]">
      <div className="p-3 border-b border-white/10 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ←
        </Button>
        <Avatar className="h-8 w-8 border border-white/10">
          <AvatarImage src={friend?.avatar_url} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {friend?.display_name?.[0] || friend?.username?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{friend?.display_name || friend?.username}</div>
          <div className="text-xs text-muted-foreground">
            {typingUsers.has(friend?.friend_id) ? (
              <span className="text-primary">typing...</span>
            ) : friend?.is_online ? (
              "Online"
            ) : (
              "Offline"
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-8">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">No messages yet</div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.sender_id === friend?.friend_id ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[70%] rounded-lg p-2 ${msg.sender_id === friend?.friend_id ? 'bg-white/10' : 'bg-primary/20'}`}>
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t border-white/10 flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            onTyping();
          }}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="bg-white/5 border-white/10"
        />
        <Button size="sm" variant="hero" onClick={sendMessage}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
