import { apiClient, ApiError, TokenManager } from './apiClient';
import { api } from './api';

// React Query helpers
export const queryKeys = {
  // Auth
  me: ['auth', 'me'] as const,

  // Servers
  servers: (params?: any) => ['servers', params] as const,
  server: (id: number | string) => ['server', id] as const,
  myServers: ['servers', 'my'] as const,
  dashboardStats: ['servers', 'dashboard', 'stats'] as const,

  // Reviews
  reviews: (serverId: number, page?: number) => ['reviews', serverId, page] as const,

  // Votes
  voteCooldown: (serverId: number) => ['votes', 'cooldown', serverId] as const,
  voteAnalytics: (params?: any) => ['votes', 'analytics', params] as const,

  // API Keys
  apiKeys: ['apiKeys'] as const,

  // Categories
  categories: ['categories'] as const,
  category: (slug: string) => ['category', slug] as const,
  categoryServers: (slug: string) => ['category', slug, 'servers'] as const,
  serverCategories: (serverId: number) => ['server', serverId, 'categories'] as const,

  // Friends
  friends: ['friends'] as const,
  friendRequests: ['friends', 'requests'] as const,
  friendStatus: (userId: string) => ['friends', 'status', userId] as const,

  // Chat
  conversation: (friendId: string, limit?: number, offset?: number) =>
    ['chat', 'conversation', friendId, limit, offset] as const,
  unreadCount: ['chat', 'unread'] as const,
  recentChats: ['chat', 'recent'] as const,

  // Notifications
  notifications: ['notifications'] as const,
  notificationCount: ['notifications', 'count'] as const,

  // Payments
  myPayments: ['payments', 'my'] as const,
  subscription: ['payments', 'subscription'] as const,
  pendingPayments: ['payments', 'pending'] as const,

  // Favorites
  favorites: ['favorites'] as const,
  isFavorite: (serverId: number) => ['favorites', 'check', serverId] as const,

  // Tags
  tags: ['tags'] as const,
  serverTags: (serverId: number) => ['tags', 'server', serverId] as const,
  tagServers: (tag: string) => ['tags', tag, 'servers'] as const,

  // Two-Factor
  twoFactorStatus: ['2fa', 'status'] as const,

  // Achievements
  achievements: ['achievements'] as const,
  userAchievements: (userId: string) => ['achievements', 'user', userId] as const,
  achievementProgress: ['achievements', 'progress'] as const,

  // Stats
  siteStats: ['stats', 'site'] as const,
  serverStats: (serverId: number) => ['stats', 'server', serverId] as const,

  // Users
  userProfile: (userId: string) => ['user', userId] as const,
  userServers: (userId: string) => ['user', userId, 'servers'] as const,
  userReviews: (userId: string) => ['user', userId, 'reviews'] as const,

  // Admin
  adminStats: ['admin', 'stats'] as const,
  adminServers: ['admin', 'servers'] as const,
  adminUsers: ['admin', 'users'] as const,
};

// Error handling utilities
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

export const isUnauthorizedError = (error: unknown): boolean => {
  return isApiError(error) && error.status === 401;
};

export const isNotFoundError = (error: unknown): boolean => {
  return isApiError(error) && error.status === 404;
};

export const isValidationError = (error: unknown): boolean => {
  return isApiError(error) && error.status === 400;
};

// Custom hooks for common patterns
export const useApiErrorHandler = () => {
  return (error: unknown) => {
    const message = handleApiError(error);

    // You can integrate with your toast/notification system here
    console.error('API Error:', message);

    return message;
  };
};

// Utility to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return TokenManager.hasToken();
};

// Utility to logout
export const logout = (): void => {
  TokenManager.removeToken();
  window.location.href = '/auth';
};

// Export everything
export { apiClient, api, ApiError, TokenManager };
export type * from './api';
