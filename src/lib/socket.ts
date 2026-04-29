import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const initializeSocket = (token: string) => {
  // If already connected with the same token, reuse
  if (socket?.connected) return socket;

  // Disconnect stale socket before creating a new one
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(API_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    // socket.io handles reconnection automatically unless we called disconnect()
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// ── Chat events ───────────────────────────────────────────────────────────────

export const sendMessage = (receiverId: string, message: string) => {
  socket?.emit('send_message', { receiverId, message });
};

export const markMessagesAsRead = (friendId: string) => {
  socket?.emit('mark_read', { friendId });
};

export const sendTyping = (receiverId: string) => {
  socket?.emit('typing', { receiverId });
};

export const sendStopTyping = (receiverId: string) => {
  socket?.emit('stop_typing', { receiverId });
};

export const notifyFriendRequest = (receiverId: string) => {
  socket?.emit('friend_request_sent', { receiverId });
};

// ── Event listeners ───────────────────────────────────────────────────────────

export const onNewMessage       = (cb: (data: any) => void)          => { socket?.on('new_message', cb); };
export const onMessageSent      = (cb: (data: any) => void)          => { socket?.on('message_sent', cb); };
export const onUnreadCount      = (cb: (count: number) => void)      => { socket?.on('unread_count', cb); };
export const onFriendStatusChange = (cb: (data: any) => void)        => { socket?.on('friend_status_change', cb); };
export const onUserTyping       = (cb: (data: any) => void)          => { socket?.on('user_typing', cb); };
export const onUserStopTyping   = (cb: (data: any) => void)          => { socket?.on('user_stop_typing', cb); };
export const onNewFriendRequest = (cb: (data: any) => void)          => { socket?.on('new_friend_request', cb); };
export const onMessagesRead     = (cb: (data: { by: string }) => void) => { socket?.on('messages_read', cb); };

// ── Remove listeners ──────────────────────────────────────────────────────────

export const offNewMessage        = () => { socket?.off('new_message'); };
export const offMessageSent       = () => { socket?.off('message_sent'); };
export const offUnreadCount       = () => { socket?.off('unread_count'); };
export const offFriendStatusChange = () => { socket?.off('friend_status_change'); };
export const offUserTyping        = () => { socket?.off('user_typing'); };
export const offUserStopTyping    = () => { socket?.off('user_stop_typing'); };
export const offNewFriendRequest  = () => { socket?.off('new_friend_request'); };
export const offMessagesRead      = () => { socket?.off('messages_read'); };
