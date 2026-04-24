const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    googleLogin: (idToken: string) => request('/auth/google-login', { method: 'POST', body: JSON.stringify({ idToken }) }),
    register: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    getMe: () => request('/auth/me'),
    updateProfile: (data: any) => request('/auth/update-profile', { method: 'PUT', body: JSON.stringify(data) }),
    updateEmail: (data: any) => request('/auth/update-email', { method: 'PUT', body: JSON.stringify(data) }),
    updatePassword: (data: any) => request('/auth/update-password', { method: 'PUT', body: JSON.stringify(data) }),
    verifyEmail: (token: string) => request(`/auth/verify-email?token=${token}`),
    forgotPassword: (email: string) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token: string, password: string) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  },
  servers: {
    getAll: (status?: string) => request(`/servers${status ? `?status=${status}` : ''}`),
    getBySlug: (slug: string) => request(`/servers/${slug}`),
    getById: (id: number) => request(`/servers/id/${id}`),
    create: (data: any) => request('/servers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/servers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/servers/${id}`, { method: 'DELETE' }),
    incrementVisits: (id: number) => request(`/servers/${id}/visit`, { method: 'POST' }),
    getDashboardStats: () => request('/servers/dashboard/stats'),
    getMyServers: () => request('/servers/dashboard/my'),
  },
  reviews: {
    getByServerId: (serverId: number, page: number = 1) => request(`/reviews/${serverId}?page=${page}`),
    submit: (data: any) => request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
    update: (reviewId: number, data: any) => request(`/reviews/${reviewId}`, { method: 'PUT', body: JSON.stringify(data) }),
    reply: (reviewId: number, reply: string) => request(`/reviews/${reviewId}/reply`, { method: 'POST', body: JSON.stringify({ reply }) }),
  },
  votes: {
    checkCooldown: (serverId: number) => request(`/votes/cooldown/${serverId}`),
    submit: (data: any) => request('/votes', { method: 'POST', body: JSON.stringify(data) }),
    getAnalytics: (params: any) => {
      const query = new URLSearchParams(params).toString();
      return request(`/votes/analytics?${query}`);
    },
  },
  apiKeys: {
    getAll: () => request('/api-keys'),
    create: (data: any) => request('/api-keys', { method: 'POST', body: JSON.stringify(data) }),
    revoke: (id: number) => request(`/api-keys/${id}/revoke`, { method: 'POST' }),
  },
  upload: {
    image: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      return fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload failed');
        return data;
      });
    }
  },
  admin: {
    getStats: () => request('/admin/stats'),
    getServers: () => request('/admin/servers'),
    updateServerStatus: (id: number, status: string) => request(`/admin/servers/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    verifyServer: (id: number, is_verified: boolean) => request(`/admin/servers/${id}/verify`, { method: 'PUT', body: JSON.stringify({ is_verified }) }),
    getUsers: () => request('/admin/users'),
    updateUserRoles: (userId: string, roles: string[]) => request(`/admin/users/${userId}/roles`, { method: 'PUT', body: JSON.stringify({ roles }) }),
  },
  categories: {
    getAll: () => request('/categories'),
    getBySlug: (slug: string) => request(`/categories/${slug}`),
    getServersByCategory: (slug: string) => request(`/categories/${slug}/servers`),
    getServerCategories: (serverId: number) => request(`/categories/server/${serverId}`),
    addToServer: (serverId: number, categoryId: number) => request(`/categories/server/${serverId}`, { method: 'POST', body: JSON.stringify({ categoryId }) }),
    removeFromServer: (serverId: number, categoryId: number) => request(`/categories/server/${serverId}/${categoryId}`, { method: 'DELETE' }),
  },
  friends: {
    sendRequest: (receiverId: string) => request('/friends/request', { method: 'POST', body: JSON.stringify({ receiverId }) }),
    getRequests: () => request('/friends/requests'),
    acceptRequest: (requestId: number) => request(`/friends/requests/${requestId}/accept`, { method: 'POST' }),
    rejectRequest: (requestId: number) => request(`/friends/requests/${requestId}/reject`, { method: 'POST' }),
    getList: () => request('/friends/list'),
    remove: (friendId: string) => request(`/friends/${friendId}`, { method: 'DELETE' }),
    checkStatus: (targetUserId: string) => request(`/friends/status/${targetUserId}`),
  },
  chat: {
    send: (receiverId: string, message: string) => request('/chat/send', { method: 'POST', body: JSON.stringify({ receiverId, message }) }),
    getConversation: (friendId: string, limit?: number, offset?: number) => request(`/chat/conversation/${friendId}?limit=${limit || 50}&offset=${offset || 0}`),
    markAsRead: (friendId: string) => request(`/chat/read/${friendId}`, { method: 'POST' }),
    getUnreadCount: () => request('/chat/unread-count'),
    getRecent: () => request('/chat/recent'),
  },
  payments: {
    verify: (data: any) => request('/payments/verify', { method: 'POST', body: JSON.stringify(data) }),
    getMyPayments: () => request('/payments/my-payments'),
    getSubscription: () => request('/payments/subscription'),
    getPending: () => request('/payments/pending'),
    activate: (paymentId: number) => request(`/payments/${paymentId}/activate`, { method: 'POST' }),
    reject: (paymentId: number, reason: string) => request(`/payments/${paymentId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  },
  favorites: {
    toggle: (serverId: number) => request('/server-enhancements/favorites', { method: 'POST', body: JSON.stringify({ serverId }) }),
    getAll: () => request('/server-enhancements/favorites'),
    check: (serverId: number) => request(`/server-enhancements/favorites/check/${serverId}`),
  },
  tags: {
    getAll: () => request('/server-enhancements/tags/all'),
    getServerTags: (serverId: number) => request(`/server-enhancements/${serverId}/tags`),
    getServersByTag: (tag: string) => request(`/server-enhancements/by-tag/${tag}`),
    addToServer: (serverId: number, tags: string[]) => request(`/server-enhancements/${serverId}/tags`, { method: 'POST', body: JSON.stringify({ tags }) }),
    removeFromServer: (serverId: number, tag: string) => request(`/server-enhancements/${serverId}/tags/${tag}`, { method: 'DELETE' }),
  },
  twoFactor: {
    getStatus: () => request('/2fa/status'),
    generateSecret: () => request('/2fa/generate', { method: 'POST' }),
    enable: (token: string) => request('/2fa/enable', { method: 'POST', body: JSON.stringify({ token }) }),
    disable: (password: string) => request('/2fa/disable', { method: 'POST', body: JSON.stringify({ password }) }),
    verify: (userId: string, token: string) => request('/2fa/verify', { method: 'POST', body: JSON.stringify({ userId, token }) }),
  },
};
