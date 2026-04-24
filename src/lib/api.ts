import { apiClient } from './apiClient';

// Type definitions for API responses
export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  roles: string[];
  is_verified: boolean;
  google_id?: string;
}

export interface Server {
  id: number;
  public_id: string;
  owner_id: string;
  name: string;
  slug: string;
  short_description: string;
  long_description?: string;
  banner_url?: string;
  logo_url?: string;
  website_url?: string;
  discord_url?: string;
  version?: string;
  rate?: string;
  region?: string;
  exp_rate?: number;
  is_online: boolean;
  is_featured: boolean;
  is_verified: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  vote_count: number;
  rating_avg: number;
  rating_count: number;
  player_count: number;
  profile_visits: number;
  features?: string;
  events_time?: string;
  upcoming_updates?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  public_id: string;
  server_id: number;
  user_id: string;
  rating: number;
  comment?: string;
  owner_response?: string;
  created_at: string;
}

export interface Vote {
  id: number;
  public_id: string;
  server_id: number;
  voter_user_id: string;
  voted_at: string;
}

export interface ApiKey {
  id: number;
  public_id: string;
  owner_id: string;
  server_id?: number;
  key_prefix: string;
  label?: string;
  last_used_at?: string;
  revoked: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  public_id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface Payment {
  id: number;
  user_id: string;
  plan: 'basic' | 'pro' | 'enterprise';
  amount: number;
  tx_hash: string;
  status: 'pending' | 'active' | 'rejected' | 'expired';
  rejection_reason?: string;
  created_at: string;
  activated_at?: string;
  expires_at?: string;
}

export interface FriendRequest {
  id: number;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface ChatMessage {
  id: number;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// API endpoints organized by resource
export const api = {
  // Authentication
  auth: {
    login: (credentials: { email: string; password: string; twoFactorToken?: string; recaptchaToken: string }) =>
      apiClient.post<{ token: string; user: User; requires2FA?: boolean }>('/auth/login', credentials),

    googleLogin: (idToken: string) =>
      apiClient.post<{ token: string; user: User }>('/auth/google-login', { idToken }),

    register: (data: { email: string; password: string; username: string; display_name?: string; recaptchaToken: string }) =>
      apiClient.post<{ token: string; user: User }>('/auth/register', data),

    getMe: () =>
      apiClient.get<User>('/auth/me'),

    updateProfile: (data: { display_name?: string; avatar_url?: string; bio?: string }) =>
      apiClient.put<{ message: string }>('/auth/update-profile', data),

    updateEmail: (data: { email: string }) =>
      apiClient.put<{ message: string }>('/auth/update-email', data),

    updatePassword: (data: { currentPassword: string; newPassword: string }) =>
      apiClient.put<{ message: string }>('/auth/update-password', data),

    verifyEmail: (token: string) =>
      apiClient.get<{ message: string }>(`/auth/verify-email?token=${token}`),

    forgotPassword: (email: string) =>
      apiClient.post<{ message: string }>('/auth/forgot-password', { email }),

    resetPassword: (token: string, password: string) =>
      apiClient.post<{ message: string }>('/auth/reset-password', { token, password }),
  },

  // Servers
  servers: {
    getAll: (params?: { status?: string; search?: string; region?: string; version?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return apiClient.get<Server[]>(`/servers${query ? `?${query}` : ''}`);
    },

    getBySlug: (slug: string) =>
      apiClient.get<Server>(`/servers/${slug}`),

    getById: (id: number) =>
      apiClient.get<Server>(`/servers/id/${id}`),

    create: (data: Partial<Server> & { recaptchaToken: string }) =>
      apiClient.post<{ id: number; public_id: string; slug: string }>('/servers', data),

    update: (id: number, data: Partial<Server>) =>
      apiClient.put<{ message: string }>(`/servers/${id}`, data),

    delete: (id: number) =>
      apiClient.delete<{ message: string }>(`/servers/${id}`),

    incrementVisits: (id: number) =>
      apiClient.post<{ message: string }>(`/servers/${id}/visit`),

    getDashboardStats: () =>
      apiClient.get<any>('/servers/dashboard/stats'),

    getMyServers: () =>
      apiClient.get<Server[]>('/servers/dashboard/my'),
  },

  // Reviews
  reviews: {
    getByServerId: (serverId: number, page: number = 1) =>
      apiClient.get<Review[]>(`/reviews/${serverId}?page=${page}`),

    submit: (data: { server_id: number; rating: number; comment?: string }) =>
      apiClient.post<{ message: string }>('/reviews', data),

    update: (reviewId: number, data: { rating?: number; comment?: string }) =>
      apiClient.put<{ message: string }>(`/reviews/${reviewId}`, data),

    reply: (reviewId: number, reply: string) =>
      apiClient.post<{ message: string }>(`/reviews/${reviewId}/reply`, { reply }),
  },

  // Votes
  votes: {
    checkCooldown: (serverId: number) =>
      apiClient.get<{ cooldownLeft: number | null }>(`/votes/cooldown/${serverId}`),

    submit: (data: { server_id: number; challenge_type_passed: string; voter_fingerprint?: string; tracking_param?: string; recaptchaToken: string }) =>
      apiClient.post<{ message: string }>('/votes', data),

    getAnalytics: (params: { server_id?: string; from?: string; to?: string; challenge_type?: string; public?: string; tracking_param?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return apiClient.get<Vote[]>(`/votes/analytics?${query}`);
    },

    getVoteLink: (serverId: number, trackingParam?: string) => {
      const query = trackingParam ? `?tracking_param=${trackingParam}` : '';
      return apiClient.get<{ voteUrl: string; tracking_param: string | null; instructions: string }>(`/votes/tracking/${serverId}/link${query}`);
    },

    getVotesByTracking: (serverId: number, params?: { tracking_param?: string; limit?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return apiClient.get<{ votes: Vote[]; summary: any[]; total: number }>(`/votes/tracking/${serverId}/votes${query ? `?${query}` : ''}`);
    },
  },

  // API Keys
  apiKeys: {
    getAll: () =>
      apiClient.get<ApiKey[]>('/api-keys'),

    create: (data: { server_id?: number; label?: string }) =>
      apiClient.post<{ key: string; key_prefix: string }>('/api-keys', data),

    revoke: (id: number) =>
      apiClient.post<{ message: string }>(`/api-keys/${id}/revoke`),
  },

  // Upload
  upload: {
    image: (file: File) =>
      apiClient.upload<{ url: string }>('/upload', file, 'image'),
  },

  // Admin
  admin: {
    getStats: () =>
      apiClient.get<any>('/admin/stats'),

    getServers: () =>
      apiClient.get<Server[]>('/admin/servers'),

    updateServerStatus: (id: number, status: string) =>
      apiClient.put<{ message: string }>(`/admin/servers/${id}/status`, { status }),

    verifyServer: (id: number, is_verified: boolean) =>
      apiClient.put<{ message: string }>(`/admin/servers/${id}/verify`, { is_verified }),

    getUsers: () =>
      apiClient.get<User[]>('/admin/users'),

    updateUserRoles: (userId: string, roles: string[]) =>
      apiClient.put<{ message: string }>(`/admin/users/${userId}/roles`, { roles }),
  },

  // Categories
  categories: {
    getAll: () =>
      apiClient.get<Category[]>('/categories'),

    getBySlug: (slug: string) =>
      apiClient.get<Category>(`/categories/${slug}`),

    getServersByCategory: (slug: string) =>
      apiClient.get<Server[]>(`/categories/${slug}/servers`),

    getServerCategories: (serverId: number) =>
      apiClient.get<Category[]>(`/categories/server/${serverId}`),

    addToServer: (serverId: number, categoryId: number) =>
      apiClient.post<{ message: string }>(`/categories/server/${serverId}`, { categoryId }),

    removeFromServer: (serverId: number, categoryId: number) =>
      apiClient.delete<{ message: string }>(`/categories/server/${serverId}/${categoryId}`),
  },

  // Friends
  friends: {
    sendRequest: (receiverId: string) =>
      apiClient.post<{ message: string }>('/friends/request', { receiverId }),

    getRequests: () =>
      apiClient.get<FriendRequest[]>('/friends/requests'),

    acceptRequest: (requestId: number) =>
      apiClient.post<{ message: string }>(`/friends/requests/${requestId}/accept`),

    rejectRequest: (requestId: number) =>
      apiClient.post<{ message: string }>(`/friends/requests/${requestId}/reject`),

    getList: () =>
      apiClient.get<User[]>('/friends/list'),

    remove: (friendId: string) =>
      apiClient.delete<{ message: string }>(`/friends/${friendId}`),

    checkStatus: (targetUserId: string) =>
      apiClient.get<{ status: string }>(`/friends/status/${targetUserId}`),
  },

  // Chat
  chat: {
    send: (receiverId: string, message: string) =>
      apiClient.post<{ message: string }>('/chat/send', { receiverId, message }),

    getConversation: (friendId: string, limit: number = 50, offset: number = 0) =>
      apiClient.get<ChatMessage[]>(`/chat/conversation/${friendId}?limit=${limit}&offset=${offset}`),

    markAsRead: (friendId: string) =>
      apiClient.post<{ message: string }>(`/chat/read/${friendId}`),

    getUnreadCount: () =>
      apiClient.get<{ count: number }>('/chat/unread-count'),

    getRecent: () =>
      apiClient.get<any[]>('/chat/recent'),
  },

  // Notifications
  notifications: {
    getAll: () =>
      apiClient.get<Notification[]>('/notifications'),

    getUnreadCount: () =>
      apiClient.get<{ count: number }>('/notifications/unread-count'),

    markAsRead: (notificationId: number) =>
      apiClient.put<{ message: string }>(`/notifications/${notificationId}/read`),

    markAllAsRead: () =>
      apiClient.put<{ message: string }>('/notifications/read-all'),

    delete: (notificationId: number) =>
      apiClient.delete<{ message: string }>(`/notifications/${notificationId}`),
  },

  // Payments
  payments: {
    verify: (data: { plan: string; txHash: string; amount: number }) =>
      apiClient.post<{ message: string; status: string }>('/payments/verify', data),

    getMyPayments: () =>
      apiClient.get<{ payments: Payment[] }>('/payments/my-payments'),

    getSubscription: () =>
      apiClient.get<{ subscription: Payment | null }>('/payments/subscription'),

    getPending: () =>
      apiClient.get<Payment[]>('/payments/pending'),

    activate: (paymentId: number) =>
      apiClient.post<{ message: string }>(`/payments/${paymentId}/activate`),

    reject: (paymentId: number, reason: string) =>
      apiClient.post<{ message: string }>(`/payments/${paymentId}/reject`, { reason }),
  },

  // Favorites
  favorites: {
    toggle: (serverId: number) =>
      apiClient.post<{ message: string; isFavorite: boolean }>('/server-enhancements/favorites', { serverId }),

    getAll: () =>
      apiClient.get<Server[]>('/server-enhancements/favorites'),

    check: (serverId: number) =>
      apiClient.get<{ isFavorite: boolean }>(`/server-enhancements/favorites/check/${serverId}`),
  },

  // Tags
  tags: {
    getAll: () =>
      apiClient.get<string[]>('/server-enhancements/tags/all'),

    getServerTags: (serverId: number) =>
      apiClient.get<string[]>(`/server-enhancements/${serverId}/tags`),

    getServersByTag: (tag: string) =>
      apiClient.get<Server[]>(`/server-enhancements/by-tag/${tag}`),

    addToServer: (serverId: number, tags: string[]) =>
      apiClient.post<{ message: string }>(`/server-enhancements/${serverId}/tags`, { tags }),

    removeFromServer: (serverId: number, tag: string) =>
      apiClient.delete<{ message: string }>(`/server-enhancements/${serverId}/tags/${tag}`),
  },

  // Two-Factor Authentication
  twoFactor: {
    getStatus: () =>
      apiClient.get<{ enabled: boolean }>('/2fa/status'),

    generateSecret: () =>
      apiClient.post<{ secret: string; qrCode: string }>('/2fa/generate'),

    enable: (token: string) =>
      apiClient.post<{ message: string; backupCodes: string[] }>('/2fa/enable', { token }),

    disable: (password: string) =>
      apiClient.post<{ message: string }>('/2fa/disable', { password }),

    verify: (userId: string, token: string) =>
      apiClient.post<{ valid: boolean }>('/2fa/verify', { userId, token }),
  },

  // Achievements
  achievements: {
    getAll: () =>
      apiClient.get<any[]>('/achievements'),

    getUserAchievements: (userId: string) =>
      apiClient.get<any[]>(`/achievements/user/${userId}`),

    getProgress: () =>
      apiClient.get<any[]>('/achievements/progress'),
  },

  // Stats
  stats: {
    getSiteStats: () =>
      apiClient.get<any>('/stats/site'),

    getServerStats: (serverId: number) =>
      apiClient.get<any>(`/stats/server/${serverId}`),
  },

  // User Profiles
  users: {
    getProfile: (userId: string) =>
      apiClient.get<User>(`/users/${userId}`),

    getServers: (userId: string) =>
      apiClient.get<Server[]>(`/users/${userId}/servers`),

    getReviews: (userId: string) =>
      apiClient.get<Review[]>(`/users/${userId}/reviews`),
  },
};

// Export types
export * from './apiClient';
