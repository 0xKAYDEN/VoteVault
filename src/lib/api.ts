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
    register: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    getMe: () => request('/auth/me'),
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
  admin: {
    getStats: () => request('/admin/stats'),
    getServers: () => request('/admin/servers'),
    updateServerStatus: (id: number, status: string) => request(`/admin/servers/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    getUsers: () => request('/admin/users'),
    updateUserRoles: (userId: string, roles: string[]) => request(`/admin/users/${userId}/roles`, { method: 'PUT', body: JSON.stringify({ roles }) }),
  },
};
