# API Client Documentation

## Overview

VoteVault now has a comprehensive, type-safe API client with advanced features including:
- ✅ Centralized configuration
- ✅ Request/response interceptors
- ✅ Automatic retry logic
- ✅ Timeout handling
- ✅ Error handling
- ✅ TypeScript support
- ✅ Token management
- ✅ File upload/download
- ✅ React Query integration

---

## Quick Start

### Basic Usage

```typescript
import { api } from '@/lib/api';

// Get all servers
const servers = await api.servers.getAll();

// Get server by ID
const server = await api.servers.getById(1);

// Create a server
const newServer = await api.servers.create({
  name: 'My Server',
  slug: 'my-server',
  short_description: 'A great server',
  recaptchaToken: 'token'
});

// Update a server
await api.servers.update(1, {
  name: 'Updated Name'
});

// Delete a server
await api.servers.delete(1);
```

### With React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, queryKeys } from '@/lib';

// Fetch servers
const { data: servers, isLoading, error } = useQuery({
  queryKey: queryKeys.servers(),
  queryFn: () => api.servers.getAll()
});

// Create server mutation
const createServerMutation = useMutation({
  mutationFn: (data) => api.servers.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.servers() });
  }
});
```

---

## API Client Features

### 1. Automatic Authentication

The API client automatically adds the JWT token to all requests:

```typescript
// Token is automatically added to headers
const user = await api.auth.getMe();
// Authorization: Bearer <token>
```

### 2. Error Handling

```typescript
import { api, ApiError, handleApiError } from '@/lib';

try {
  await api.servers.create(data);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
  }
  
  // Or use helper
  const message = handleApiError(error);
  toast.error(message);
}
```

### 3. Request Timeout

```typescript
import { apiClient } from '@/lib/apiClient';

// Custom timeout (default: 30 seconds)
const data = await apiClient.get('/slow-endpoint', {
  timeout: 60000 // 60 seconds
});
```

### 4. Retry Logic

```typescript
// Automatic retry on network errors and 5xx errors
// Default: 3 attempts with exponential backoff

// Disable retry for specific request
const data = await apiClient.get('/endpoint', {
  retry: false
});

// Custom retry attempts
const data = await apiClient.get('/endpoint', {
  retryAttempts: 5
});
```

### 5. Request Interceptors

```typescript
import { apiClient } from '@/lib/apiClient';

// Add custom header to all requests
apiClient.addRequestInterceptor((config) => {
  config.headers = {
    ...config.headers,
    'X-Custom-Header': 'value'
  };
  return config;
});

// Log all requests
apiClient.addRequestInterceptor((config) => {
  console.log('Request:', config.method, config.url);
  return config;
});
```

### 6. Response Interceptors

```typescript
import { apiClient } from '@/lib/apiClient';

// Transform all responses
apiClient.addResponseInterceptor((response) => {
  console.log('Response:', response.status);
  return response;
});
```

### 7. Error Interceptors

```typescript
import { apiClient } from '@/lib/apiClient';

// Handle specific errors globally
apiClient.addErrorInterceptor(async (error) => {
  if (error.status === 403) {
    toast.error('Access denied');
  }
  throw error;
});
```

### 8. File Upload

```typescript
import { api } from '@/lib';

// Upload image
const file = event.target.files[0];
const result = await api.upload.image(file);
console.log('Image URL:', result.url);

// Or use apiClient directly
import { apiClient } from '@/lib/apiClient';

const result = await apiClient.upload('/upload', file, 'image');
```

### 9. File Download

```typescript
import { apiClient } from '@/lib/apiClient';

// Download file
await apiClient.download('/reports/monthly.pdf', 'monthly-report.pdf');
```

---

## API Endpoints

### Authentication

```typescript
// Login
const { token, user } = await api.auth.login({
  email: 'user@example.com',
  password: 'password',
  recaptchaToken: 'token'
});

// Google login
const { token, user } = await api.auth.googleLogin(idToken);

// Register
const { token, user } = await api.auth.register({
  email: 'user@example.com',
  password: 'password',
  username: 'username',
  recaptchaToken: 'token'
});

// Get current user
const user = await api.auth.getMe();

// Update profile
await api.auth.updateProfile({
  display_name: 'New Name',
  bio: 'My bio'
});

// Update email
await api.auth.updateEmail({ email: 'new@example.com' });

// Update password
await api.auth.updatePassword({
  currentPassword: 'old',
  newPassword: 'new'
});

// Forgot password
await api.auth.forgotPassword('user@example.com');

// Reset password
await api.auth.resetPassword('token', 'newPassword');
```

### Servers

```typescript
// Get all servers
const servers = await api.servers.getAll();

// Get with filters
const servers = await api.servers.getAll({
  status: 'approved',
  search: 'minecraft',
  region: 'us',
  version: '1.19'
});

// Get by slug
const server = await api.servers.getBySlug('my-server');

// Get by ID
const server = await api.servers.getById(1);

// Create server
const result = await api.servers.create({
  name: 'My Server',
  slug: 'my-server',
  short_description: 'Description',
  recaptchaToken: 'token'
});

// Update server
await api.servers.update(1, {
  name: 'Updated Name'
});

// Delete server
await api.servers.delete(1);

// Increment visits
await api.servers.incrementVisits(1);

// Get dashboard stats
const stats = await api.servers.getDashboardStats();

// Get my servers
const myServers = await api.servers.getMyServers();
```

### Votes

```typescript
// Check cooldown
const { cooldownLeft } = await api.votes.checkCooldown(serverId);

// Submit vote
await api.votes.submit({
  server_id: 1,
  challenge_type_passed: 'math',
  recaptchaToken: 'token'
});

// Get analytics
const votes = await api.votes.getAnalytics({
  server_id: '1',
  from: '2026-01-01',
  to: '2026-12-31'
});

// Get vote link with tracking
const { voteUrl } = await api.votes.getVoteLink(1, 'discord');

// Get votes by tracking parameter
const { votes, summary } = await api.votes.getVotesByTracking(1, {
  tracking_param: 'discord'
});
```

### Reviews

```typescript
// Get reviews for server
const reviews = await api.reviews.getByServerId(1, 1); // page 1

// Submit review
await api.reviews.submit({
  server_id: 1,
  rating: 5,
  comment: 'Great server!'
});

// Update review
await api.reviews.update(reviewId, {
  rating: 4,
  comment: 'Updated review'
});

// Reply to review (server owner)
await api.reviews.reply(reviewId, 'Thank you!');
```

### Notifications

```typescript
// Get all notifications
const notifications = await api.notifications.getAll();

// Get unread count
const { count } = await api.notifications.getUnreadCount();

// Mark as read
await api.notifications.markAsRead(notificationId);

// Mark all as read
await api.notifications.markAllAsRead();

// Delete notification
await api.notifications.delete(notificationId);
```

### Payments

```typescript
// Submit payment
await api.payments.verify({
  plan: 'pro',
  txHash: '0x123...',
  amount: 29.99
});

// Get my payments
const { payments } = await api.payments.getMyPayments();

// Get active subscription
const { subscription } = await api.payments.getSubscription();

// Admin: Get pending payments
const pending = await api.payments.getPending();

// Admin: Activate payment
await api.payments.activate(paymentId);

// Admin: Reject payment
await api.payments.reject(paymentId, 'Invalid transaction');
```

### Friends & Chat

```typescript
// Send friend request
await api.friends.sendRequest(userId);

// Get friend requests
const requests = await api.friends.getRequests();

// Accept request
await api.friends.acceptRequest(requestId);

// Reject request
await api.friends.rejectRequest(requestId);

// Get friends list
const friends = await api.friends.getList();

// Remove friend
await api.friends.remove(friendId);

// Check friendship status
const { status } = await api.friends.checkStatus(userId);

// Send chat message
await api.chat.send(friendId, 'Hello!');

// Get conversation
const messages = await api.chat.getConversation(friendId, 50, 0);

// Mark messages as read
await api.chat.markAsRead(friendId);

// Get unread count
const { count } = await api.chat.getUnreadCount();

// Get recent chats
const recent = await api.chat.getRecent();
```

---

## React Query Integration

### Query Keys

```typescript
import { queryKeys } from '@/lib';

// Use predefined query keys for consistency
const { data } = useQuery({
  queryKey: queryKeys.servers(),
  queryFn: () => api.servers.getAll()
});

const { data } = useQuery({
  queryKey: queryKeys.server(serverId),
  queryFn: () => api.servers.getById(serverId)
});
```

### Mutations with Cache Invalidation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys } from '@/lib';

const queryClient = useQueryClient();

const createServerMutation = useMutation({
  mutationFn: (data) => api.servers.create(data),
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: queryKeys.servers() });
    queryClient.invalidateQueries({ queryKey: queryKeys.myServers });
  },
  onError: (error) => {
    toast.error(handleApiError(error));
  }
});

// Usage
createServerMutation.mutate(serverData);
```

---

## Error Handling Utilities

```typescript
import { 
  handleApiError, 
  isApiError, 
  isUnauthorizedError,
  isNotFoundError,
  isValidationError 
} from '@/lib';

try {
  await api.servers.getById(999);
} catch (error) {
  // Get user-friendly message
  const message = handleApiError(error);
  
  // Check error type
  if (isUnauthorizedError(error)) {
    // Redirect to login
  } else if (isNotFoundError(error)) {
    // Show 404 page
  } else if (isValidationError(error)) {
    // Show validation errors
  }
}
```

---

## Configuration

### Environment Variables

```env
# .env
VITE_API_URL=http://localhost:5000/api
```

### Custom Configuration

```typescript
import { API_CONFIG } from '@/lib/apiClient';

// Default configuration
API_CONFIG.BASE_URL     // http://localhost:5000/api
API_CONFIG.TIMEOUT      // 30000ms (30 seconds)
API_CONFIG.RETRY_ATTEMPTS // 3
API_CONFIG.RETRY_DELAY  // 1000ms (1 second)
```

---

## TypeScript Support

All API methods are fully typed:

```typescript
import { Server, User, Review } from '@/lib';

// Type-safe responses
const server: Server = await api.servers.getById(1);
const user: User = await api.auth.getMe();
const reviews: Review[] = await api.reviews.getByServerId(1);

// Type-safe requests
await api.servers.create({
  name: 'Server',
  slug: 'server',
  short_description: 'Desc',
  recaptchaToken: 'token'
  // TypeScript will error if required fields are missing
});
```

---

## Migration Guide

### Old API (Before)

```typescript
// Old way - scattered fetch calls
const response = await fetch(`${API_URL}/servers`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
const servers = await response.json();
```

### New API (After)

```typescript
// New way - centralized API client
import { api } from '@/lib';

const servers = await api.servers.getAll();
```

### Benefits

✅ **Type Safety** - Full TypeScript support  
✅ **Error Handling** - Consistent error handling  
✅ **Authentication** - Automatic token management  
✅ **Retry Logic** - Automatic retry on failures  
✅ **Timeout** - Request timeout handling  
✅ **Interceptors** - Request/response modification  
✅ **Centralized** - Single source of truth  
✅ **Maintainable** - Easy to update and test  

---

## Best Practices

### 1. Use React Query

```typescript
// Good - with React Query
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.servers(),
  queryFn: () => api.servers.getAll()
});

// Avoid - direct API calls in components
const [servers, setServers] = useState([]);
useEffect(() => {
  api.servers.getAll().then(setServers);
}, []);
```

### 2. Handle Errors Properly

```typescript
// Good - proper error handling
try {
  await api.servers.create(data);
  toast.success('Server created!');
} catch (error) {
  toast.error(handleApiError(error));
}

// Avoid - ignoring errors
api.servers.create(data);
```

### 3. Use Query Keys

```typescript
// Good - use predefined query keys
queryKey: queryKeys.server(id)

// Avoid - hardcoded keys
queryKey: ['server', id]
```

### 4. Invalidate Cache on Mutations

```typescript
// Good - invalidate related queries
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.servers() });
}

// Avoid - manual refetch
onSuccess: () => {
  refetch();
}
```

---

## Testing

```typescript
import { apiClient } from '@/lib/apiClient';
import { vi } from 'vitest';

// Mock API client
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

// Test
it('fetches servers', async () => {
  const mockServers = [{ id: 1, name: 'Server 1' }];
  apiClient.get.mockResolvedValue(mockServers);
  
  const servers = await api.servers.getAll();
  
  expect(servers).toEqual(mockServers);
  expect(apiClient.get).toHaveBeenCalledWith('/servers');
});
```

---

*API Client Documentation - VoteVault*  
*Last Updated: 2026-04-24*
