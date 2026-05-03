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
  youtube_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  twitch_url?: string;
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
  active_players: number;
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
    login: (credentials: { email: string; password: string; twoFactorToken?: string; recaptchaToken: string; rememberMe?: boolean }) =>
      apiClient.post<{ token: string; user: User; requires2FA?: boolean }>('/auth/login', credentials),

    googleLogin: (idToken: string) =>
      apiClient.post<{ token: string; user: User }>('/auth/google-login', { idToken }),

    register: (data: { email: string; password: string; username: string; display_name?: string; recaptchaToken: string }) =>
      apiClient.post<{ token: string; user: User }>('/auth/register', data),

    getMe: () =>
      apiClient.get<User>('/auth/me'),

    updateProfile: (data: {
      display_name?: string;
      avatar_url?: string;
      bio?: string;
      social_discord?: string;
      social_twitter?: string;
      social_youtube?: string;
      social_twitch?: string;
      social_website?: string;
    }) =>
      apiClient.put<{ message: string }>('/auth/update-profile', data),

    updateEmail: (data: { email: string }) =>
      apiClient.put<{ message: string }>('/auth/update-email', data),

    updatePassword: (data: { currentPassword: string; newPassword: string }) =>
      apiClient.put<{ message: string }>('/auth/update-password', data),

    verifyEmail: (token: string) =>
      apiClient.get<{ message: string }>(`/auth/verify-email?token=${token}`),

    logout: () =>
      apiClient.post<{ message: string }>('/auth/logout'),

    forgotPassword: (email: string) =>
      apiClient.post<{ message: string }>('/auth/forgot-password', { email }),

    resendVerification: (email: string) =>
      apiClient.post<{ message: string }>('/auth/resend-verification', { email }),

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

    getMyReviews: (params?: { page?: number; limit?: number; server_id?: string; rating?: string; replied?: string }) => {
      const q = new URLSearchParams();
      if (params?.page)      q.set('page', String(params.page));
      if (params?.limit)     q.set('limit', String(params.limit));
      if (params?.server_id) q.set('server_id', params.server_id);
      if (params?.rating)    q.set('rating', params.rating);
      if (params?.replied)   q.set('replied', params.replied);
      return apiClient.get<any>(`/servers/dashboard/reviews?${q.toString()}`);
    },
  },

  // Reviews
  reviews: {
    getByServerId: (serverId: number, page: number = 1) =>
      apiClient.get<{ reviews: Review[]; total: number; page: number; totalPages: number }>(`/reviews/${serverId}?page=${page}`),

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

    submit: (data: { server_id: number; challenge_type_passed: string; voter_fingerprint?: string; tracking_param?: string; recaptchaToken?: string }) =>
      apiClient.post<{ message: string }>('/votes', data),

    getAnalytics: (params: { server_id?: string | number; from?: string; to?: string; challenge_type?: string; public?: string | boolean; tracking_param?: string }) => {
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

    getGeoAnalytics: (params: { server_id?: string; from?: string; to?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return apiClient.get<{
        byCountry: Array<{ country: string; country_code: string; votes: number }>;
        byCity: Array<{ city: string; country: string; country_code: string; votes: number }>;
        byIsp: Array<{ isp: string; votes: number }>;
        byReferrer: Array<{ source: string; votes: number }>;
        points: Array<{ lat: number; lon: number; country: string; city: string; voted_at: string }>;
      }>(`/votes/geo?${query}`);
    },
  },

  // API Keys
  apiKeys: {
    getAll: () =>
      apiClient.get<{ keys: ApiKey[]; quota: { plan: string; limits: { daily: number | null; perMinute: number }; dailyUsed: number; dailyRemaining: number | null; totalRequests: number; resetAt: string } }>('/api-keys'),

    create: (data: { server_id?: number; label?: string }) =>
      apiClient.post<{ key: string; key_prefix: string }>('/api-keys', data),

    revoke: (id: number) =>
      apiClient.post<{ message: string }>(`/api-keys/${id}/revoke`),

    getActivity: (year?: number) =>
      apiClient.get<{ data: Array<{ log_date: string; request_count: number }>; year: number; years: number[] }>(`/api-keys/activity${year ? `?year=${year}` : ''}`),
  },

  // Upload
  upload: {
    image: (file: File) =>
      apiClient.upload<{ url: string }>('/upload', file, 'image'),
  },

  // Favorites
  favorites: {
    getAll: () =>
      apiClient.get<any[]>('/favorites'),
    toggle: (serverId: number | string) =>
      apiClient.post<{ favorited: boolean; message: string }>(`/favorites/${serverId}`),
    check: (serverId: number | string) =>
      apiClient.get<{ favorited: boolean }>(`/favorites/${serverId}/check`),
  },

  // Message Requests
  messageRequests: {
    send: (data: { receiverId: string; message: string }) =>
      apiClient.post<{ message: string }>('/message-requests', data),
    getAll: () =>
      apiClient.get<any[]>('/message-requests'),
    accept: (requestId: number) =>
      apiClient.post<{ message: string; senderId: string }>(`/message-requests/${requestId}/accept`),
    decline: (requestId: number) =>
      apiClient.post<{ message: string }>(`/message-requests/${requestId}/decline`),
    check: (targetId: string) =>
      apiClient.get<{ sent: any; received: any }>(`/message-requests/check/${targetId}`),
  },

  // Group Chats
  groups: {
    create: (data: { name: string; memberIds?: string[] }) =>
      apiClient.post<{ id: number; name: string; message: string }>('/groups', data),
    getAll: () =>
      apiClient.get<any[]>('/groups'),
    getMessages: (groupId: number, params?: { limit?: number; offset?: number }) =>
      apiClient.get<any[]>(`/groups/${groupId}/messages${params?.offset ? `?offset=${params.offset}` : ''}`),
    sendMessage: (groupId: number, message: string) =>
      apiClient.post<any>(`/groups/${groupId}/messages`, { message }),
    getMembers: (groupId: number) =>
      apiClient.get<any[]>(`/groups/${groupId}/members`),
    addMember: (groupId: number, memberId: string) =>
      apiClient.post<{ message: string }>(`/groups/${groupId}/members`, { memberId }),
    leave: (groupId: number) =>
      apiClient.delete<{ message: string }>(`/groups/${groupId}/leave`),
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

    getReports: (params?: { status?: string; type?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return apiClient.get<any[]>(`/admin/reports${q ? `?${q}` : ''}`);
    },

    updateReportStatus: (reportId: number, status: string, adminNotes?: string) =>
      apiClient.put<{ message: string }>(`/admin/reports/${reportId}/status`, { status, adminNotes }),

    banUser: (data: { userId: string; reason: string; banType: string; expiresAt?: string }) =>
      apiClient.post<{ message: string }>('/admin/users/ban', data),

    unbanUser: (userId: string) =>
      apiClient.delete<{ message: string }>(`/admin/users/${userId}/ban`),

    suspendUser: (userId: string, reason: string, hours: number) =>
      apiClient.post<{ message: string; expiresAt: string }>(`/admin/users/${userId}/suspend`, { reason, hours }),

    awardAchievement: (userId: string, achievementId: number) =>
      apiClient.post<{ message: string }>(`/admin/users/${userId}/achievement`, { achievementId }),

    getAchievements: () =>
      apiClient.get<any[]>('/admin/achievements'),
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
    checkStatus: () =>
      apiClient.get<{ enabled: boolean }>('/payments/status'),

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

    grantSubscription: (data: { userId: string; plan: string; days?: number }) =>
      apiClient.post<{ message: string }>('/payments/grant', data),

    getAdminStatus: () =>
      apiClient.get<{ enabled: boolean }>('/payments/admin/status'),

    setAdminStatus: (enabled: boolean) =>
      apiClient.post<{ message: string; enabled: boolean }>('/payments/admin/status', { enabled }),
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

  // Advanced Analytics
  analytics: {
    getRealtime: () =>
      apiClient.get<any>('/analytics/realtime'),

    getTrends: (params: { server_id?: string; from?: string; to?: string; granularity?: 'day' | 'week' | 'month' }) => {
      const query = new URLSearchParams(params as any).toString();
      return apiClient.get<any[]>(`/analytics/trends?${query}`);
    },

    getGeo: (params: { server_id?: string; from?: string; to?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return apiClient.get<any>(`/analytics/geo?${query}`);
    },

    getPeakTimes: (params: { server_id?: string; from?: string; to?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return apiClient.get<any>(`/analytics/peak-times?${query}`);
    },

    getReferrers: (params: { server_id?: string; from?: string; to?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return apiClient.get<any>(`/analytics/referrers?${query}`);
    },

    getDemographics: (params: { server_id?: string; from?: string; to?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return apiClient.get<any>(`/analytics/demographics?${query}`);
    },
  },

  // User Profiles
  users: {
    getProfile: (userId: string) =>
      apiClient.get<any>(`/users/${userId}`),

    getServers: (userId: string) =>
      apiClient.get<Server[]>(`/users/${userId}/servers`),

    getReviews: (userId: string) =>
      apiClient.get<Review[]>(`/users/${userId}/reviews`),

    getThreads: (userId: string) =>
      apiClient.get<any[]>(`/users/${userId}/threads`),

    getMyActivity: (limit?: number) =>
      apiClient.get<{ activities: any[]; summary: any }>(`/users/me/activity${limit ? `?limit=${limit}` : ''}`),
  },

  // User Experience / Reports
  userExperience: {
    submitReport: (data: { reportedType: 'user' | 'server' | 'review'; reportedId: string; reason: string; description?: string }) =>
      apiClient.post<{ message: string }>('/user-experience/report', data),

    blockUser: (userId: string) =>
      apiClient.post<{ message: string }>('/user-experience/block', { userId }),

    unblockUser: (userId: string) =>
      apiClient.delete<{ message: string }>(`/user-experience/block/${userId}`),

    checkBlocked: (targetUserId: string) =>
      apiClient.get<{ isBlocked: boolean }>(`/user-experience/blocked/check/${targetUserId}`),

    searchUsers: (query: string) =>
      apiClient.get<Array<{ id: string; username: string; display_name: string; avatar_url: string; discriminator: number; tag: string; roles: string[] }>>(`/user-experience/search?query=${encodeURIComponent(query)}`),
  },

  // Threads
  threads: {
    getCategories: () =>
      apiClient.get<any[]>('/threads/categories'),

    getAll: (params?: { category?: string; page?: number; search?: string; author?: string }) => {
      const clean: Record<string, string> = {};
      if (params?.category) clean.category = params.category;
      if (params?.page && params.page > 1) clean.page = String(params.page);
      if (params?.search) clean.search = params.search;
      if (params?.author) clean.author = params.author;
      const query = new URLSearchParams(clean).toString();
      return apiClient.get<any>(`/threads${query ? `?${query}` : ''}`);
    },

    get: (publicId: string) =>
      apiClient.get<any>(`/threads/${publicId}`),

    create: (data: { category_id: number; title: string; body: string }) =>
      apiClient.post<{ public_id: string; message: string }>('/threads', data),

    update: (publicId: string, data: { title?: string; body?: string }) =>
      apiClient.put<{ message: string }>(`/threads/${publicId}`, data),

    delete: (publicId: string) =>
      apiClient.delete<{ message: string }>(`/threads/${publicId}`),

    getReplies: (publicId: string, page?: number) =>
      apiClient.get<any>(`/threads/${publicId}/replies${page ? `?page=${page}` : ''}`),

    createReply: (publicId: string, body: string, parentReplyId?: number) =>
      apiClient.post<{ public_id: string; message: string }>(`/threads/${publicId}/replies`, { body, parent_reply_id: parentReplyId }),

    deleteReply: (replyId: string) =>
      apiClient.delete<{ message: string }>(`/threads/replies/${replyId}`),

    react: (targetType: 'thread' | 'reply', targetId: number, reaction: string) =>
      apiClient.post<{ action: string; reaction: string }>(`/threads/react/${targetType}/${targetId}`, { reaction }),

    pin: (publicId: string, is_pinned: boolean) =>
      apiClient.put<{ message: string }>(`/threads/${publicId}/pin`, { is_pinned }),

    lock: (publicId: string, is_locked: boolean) =>
      apiClient.put<{ message: string }>(`/threads/${publicId}/lock`, { is_locked }),
  },

  // Premium
  premium: {
    getStatus: () =>
      apiClient.get<any>('/premium/status'),

    getThemes: () =>
      apiClient.get<any[]>('/premium/themes'),

    updateProfile: (data: {
      banner_url?: string;
      profile_theme?: string;
      is_animated_avatar?: boolean;
      custom_status?: string;
      custom_status_emoji?: string;
      bio?: string;
      display_name?: string;
      avatar_url?: string;
    }) =>
      apiClient.put<{ message: string }>('/premium/profile', data),

    getStreak: () =>
      apiClient.get<any>('/premium/streak'),

    getXP: (userId?: string) =>
      userId ? apiClient.get<any>(`/premium/xp/${userId}`) : apiClient.get<any>('/premium/xp'),

    getGroups: () =>
      apiClient.get<any[]>('/premium/groups'),

    createGroup: (data: { name: string; color?: string }) =>
      apiClient.post<any>('/premium/groups', data),

    addToGroup: (groupId: number, friendId: string) =>
      apiClient.post<{ message: string }>(`/premium/groups/${groupId}/members`, { friendId }),

    removeFromGroup: (groupId: number, friendId: string) =>
      apiClient.delete<{ message: string }>(`/premium/groups/${groupId}/members/${friendId}`),

    deleteGroup: (groupId: number) =>
      apiClient.delete<{ message: string }>(`/premium/groups/${groupId}`),

    getEmojis: () =>
      apiClient.get<any[]>('/premium/emojis'),

    addEmoji: (data: { name: string; url: string }) =>
      apiClient.post<{ message: string }>('/premium/emojis', data),

    deleteEmoji: (emojiId: number) =>
      apiClient.delete<{ message: string }>(`/premium/emojis/${emojiId}`),

    exportVoteHistory: () =>
      apiClient.get<any>('/premium/vote-history/export'),

    getVoteHistory: () =>
      apiClient.get<{ votes: any[]; total: number }>('/premium/vote-history'),
  },

  // Batch API - Get multiple resources in one request
  batch: (requests: Array<{ endpoint: string; method: string }>) =>
    apiClient.post<{ results: Array<{ endpoint: string; status: number; data?: any; error?: string }> }>('/batch', { requests }),

  // Public API v1
  v1: {
    getMyServerId: () =>
      apiClient.get<{ data: any }>('/v1/my-server-id'),
    getServers: () =>
      apiClient.get<{ data: any[] }>('/v1/servers'),
  },
};

// Export types
export * from './apiClient';
