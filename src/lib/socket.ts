import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const initializeSocket = (token: string) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(API_URL, {
    auth: {
      token
    },
    autoConnect: true
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
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

// Chat events
export const sendMessage = (receiverId: string, message: string) => {
  if (socket) {
    socket.emit('send_message', { receiverId, message });
  }
};

export const markMessagesAsRead = (friendId: string) => {
  if (socket) {
    socket.emit('mark_read', { friendId });
  }
};

export const sendTyping = (receiverId: string) => {
  if (socket) {
    socket.emit('typing', { receiverId });
  }
};

export const sendStopTyping = (receiverId: string) => {
  if (socket) {
    socket.emit('stop_typing', { receiverId });
  }
};

export const notifyFriendRequest = (receiverId: string) => {
  if (socket) {
    socket.emit('friend_request_sent', { receiverId });
  }
};

// Event listeners
export const onNewMessage = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('new_message', callback);
  }
};

export const onMessageSent = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('message_sent', callback);
  }
};

export const onUnreadCount = (callback: (count: number) => void) => {
  if (socket) {
    socket.on('unread_count', callback);
  }
};

export const onFriendStatusChange = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('friend_status_change', callback);
  }
};

export const onUserTyping = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('user_typing', callback);
  }
};

export const onUserStopTyping = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('user_stop_typing', callback);
  }
};

export const onNewFriendRequest = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('new_friend_request', callback);
  }
};

// Remove event listeners
export const offNewMessage = () => {
  if (socket) {
    socket.off('new_message');
  }
};

export const offMessageSent = () => {
  if (socket) {
    socket.off('message_sent');
  }
};

export const offUnreadCount = () => {
  if (socket) {
    socket.off('unread_count');
  }
};

export const offFriendStatusChange = () => {
  if (socket) {
    socket.off('friend_status_change');
  }
};

export const offUserTyping = () => {
  if (socket) {
    socket.off('user_typing');
  }
};

export const offUserStopTyping = () => {
  if (socket) {
    socket.off('user_stop_typing');
  }
};

export const offNewFriendRequest = () => {
  if (socket) {
    socket.off('new_friend_request');
  }
};
