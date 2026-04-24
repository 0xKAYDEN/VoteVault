# Redis Setup and Configuration Guide

## Installation

### Windows
1. Download Redis from: https://github.com/microsoftarchive/redis/releases
2. Or use WSL2 and install Redis on Ubuntu:
   ```bash
   sudo apt update
   sudo apt install redis-server
   sudo service redis-server start
   ```

### Linux
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### macOS
```bash
brew install redis
brew services start redis
```

### Docker (Recommended for Development)
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

## Configuration

Add to your `.env` file:
```
REDIS_URL=redis://localhost:6379
```

For production with password:
```
REDIS_URL=redis://:your_password@localhost:6379
```

## Testing Redis Connection

```bash
redis-cli ping
```
Should return: `PONG`

## Install Node.js Redis Client

```bash
cd server
npm install redis
```

## Cache Strategy

The application uses Redis for caching:

- **Categories**: Cached for 10 minutes (600s)
- **Servers List**: Cached for 5 minutes (300s)
- **Server Details**: Cached for 5 minutes (300s)
- **Category Servers**: Cached for 5 minutes (300s)

Cache is automatically invalidated when:
- A server is created, updated, or deleted
- Categories are added or removed from servers

## Monitoring Cache

Check cache keys:
```bash
redis-cli KEYS "cache:*"
```

Clear all cache:
```bash
redis-cli FLUSHDB
```

Check cache hit/miss in server logs - look for:
- `Cache HIT: cache:/api/...`
- `Cache MISS: cache:/api/...`

## Production Recommendations

1. Set a max memory limit in redis.conf:
   ```
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   ```

2. Enable persistence (optional):
   ```
   save 900 1
   save 300 10
   save 60 10000
   ```

3. Use Redis Sentinel or Redis Cluster for high availability

## Troubleshooting

If Redis is not available, the application will:
- Log errors but continue running
- Skip caching and fetch data directly from MySQL
- Automatically reconnect when Redis becomes available
