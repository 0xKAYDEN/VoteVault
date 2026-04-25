# Database Connection Configuration Guide

## Environment Variables

Add these to your `.env` file for optimal database connection management:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=votevault

# Connection Pool Settings (Optional - defaults provided)
DB_CONNECTION_LIMIT=10        # Maximum number of connections in pool
DB_MAX_IDLE=10                # Maximum idle connections
DB_IDLE_TIMEOUT=60000         # Idle timeout in milliseconds (60 seconds)

# MySQL Server Settings
# Add these to your MySQL configuration file (my.ini or my.cnf)
# Then restart MySQL server

[mysqld]
wait_timeout = 28800          # 8 hours
interactive_timeout = 28800   # 8 hours
connect_timeout = 60          # 60 seconds
net_read_timeout = 60         # 60 seconds
net_write_timeout = 60        # 60 seconds
max_connections = 200         # Maximum concurrent connections
```

## Connection Pool Configuration

The connection pool is configured with the following settings:

- **Connection Limit**: 10 connections (configurable via `DB_CONNECTION_LIMIT`)
- **Max Idle**: 10 idle connections (configurable via `DB_MAX_IDLE`)
- **Idle Timeout**: 60 seconds (configurable via `DB_IDLE_TIMEOUT`)
- **Queue Limit**: Unlimited (0)
- **Keep-Alive**: Enabled with 10-second initial delay
- **Connect Timeout**: 60 seconds
- **Acquire Timeout**: 60 seconds
- **Query Timeout**: 60 seconds

## Features

### 1. Automatic Reconnection
- Pool automatically reconnects on connection loss
- Retry logic with exponential backoff
- Maximum 5 retry attempts with 5-second delays

### 2. Health Checks
- Periodic health checks every 30 seconds
- Automatic connection validation
- Connection restoration detection

### 3. Error Handling
- Graceful handling of connection errors
- Detailed error logging with error codes
- Automatic retry for transient failures

### 4. Graceful Shutdown
- Clean pool shutdown on SIGINT/SIGTERM
- Releases all connections properly
- Stops health check intervals

### 5. Connection Monitoring
- Logs connection acquisition and release
- Tracks connection queue status
- Pool statistics available via API

## Health Check Endpoints

### GET /api/health
Basic health check endpoint
```json
{
  "status": "healthy",
  "responseTime": "5ms",
  "pool": {
    "totalConnections": 10,
    "freeConnections": 8,
    "queuedRequests": 0
  },
  "mysql": {
    "threadsConnected": 5
  },
  "timestamp": "2026-04-25T21:09:00.000Z"
}
```

### GET /api/health/db
Detailed database health check
```json
{
  "status": "healthy",
  "responseTime": "5ms",
  "pool": {
    "totalConnections": 10,
    "freeConnections": 8,
    "queuedRequests": 0
  },
  "mysql": {
    "threadsConnected": 5
  },
  "timestamp": "2026-04-25T21:09:00.000Z"
}
```

### GET /api/health/ready
Kubernetes/Docker readiness probe
```json
{
  "ready": true
}
```

### GET /api/health/live
Kubernetes/Docker liveness probe
```json
{
  "alive": true
}
```

## Middleware Functions

### checkDatabaseConnection
Middleware to ensure database connection before processing requests
```javascript
import { checkDatabaseConnection } from './middleware/database.js';

app.use('/api/critical-endpoint', checkDatabaseConnection, yourHandler);
```

### queryWithRetry
Wrapper for queries with automatic retry logic
```javascript
import { queryWithRetry } from './middleware/database.js';

const result = await queryWithRetry(async () => {
  return await pool.query('SELECT * FROM servers');
}, 3, 1000); // 3 retries, 1 second delay
```

### executeTransaction
Safe transaction execution with automatic rollback
```javascript
import { executeTransaction } from './middleware/database.js';

const result = await executeTransaction(async (connection) => {
  await connection.query('INSERT INTO users ...');
  await connection.query('INSERT INTO profiles ...');
  return { success: true };
});
```

## Monitoring

### Pool Status
```javascript
import { getPoolStatus } from './middleware/database.js';

const status = getPoolStatus();
console.log(status);
// {
//   totalConnections: 10,
//   freeConnections: 8,
//   queuedRequests: 0
// }
```

### Database Health
```javascript
import { getDatabaseHealth } from './middleware/database.js';

const health = await getDatabaseHealth();
console.log(health);
```

## Troubleshooting

### Connection Timeout
**Problem**: Queries timeout after 60 seconds

**Solution**:
1. Check MySQL server status
2. Verify network connectivity
3. Increase timeout values in `.env`
4. Check slow query log

### Too Many Connections
**Problem**: `ER_CON_COUNT_ERROR` - too many connections

**Solution**:
1. Increase `max_connections` in MySQL config
2. Reduce `DB_CONNECTION_LIMIT` in `.env`
3. Check for connection leaks (unreleased connections)
4. Monitor pool status

### Connection Lost
**Problem**: `PROTOCOL_CONNECTION_LOST` errors

**Solution**:
1. Check MySQL `wait_timeout` setting
2. Enable keep-alive (already enabled)
3. Increase `wait_timeout` to 28800 (8 hours)
4. Check network stability

### Connection Refused
**Problem**: `ECONNREFUSED` - cannot connect to MySQL

**Solution**:
1. Verify MySQL is running
2. Check `DB_HOST` and `DB_PORT` in `.env`
3. Verify firewall settings
4. Check MySQL bind-address setting

### Deadlocks
**Problem**: `ER_LOCK_DEADLOCK` errors

**Solution**:
1. Queries automatically retry (up to 3 times)
2. Review transaction logic
3. Reduce transaction duration
4. Use proper locking order

## Best Practices

### 1. Always Release Connections
```javascript
// Good
const connection = await pool.getConnection();
try {
  await connection.query('...');
} finally {
  connection.release(); // Always release
}

// Better - use pool.query() directly
await pool.query('...');
```

### 2. Use Transactions for Multiple Queries
```javascript
// Good
await executeTransaction(async (connection) => {
  await connection.query('INSERT ...');
  await connection.query('UPDATE ...');
});
```

### 3. Handle Errors Gracefully
```javascript
try {
  await pool.query('...');
} catch (err) {
  if (err.code === 'ER_DUP_ENTRY') {
    // Handle duplicate entry
  } else {
    // Handle other errors
  }
}
```

### 4. Use Prepared Statements
```javascript
// Good - prevents SQL injection
await pool.query('SELECT * FROM users WHERE id = ?', [userId]);

// Bad - vulnerable to SQL injection
await pool.query(`SELECT * FROM users WHERE id = ${userId}`);
```

### 5. Monitor Connection Pool
```javascript
// Log pool status periodically
setInterval(() => {
  const status = getPoolStatus();
  console.log('Pool status:', status);
}, 60000); // Every minute
```

## Performance Tips

### 1. Connection Pooling
- Use connection pool (already configured)
- Don't create new connections for each query
- Reuse connections from pool

### 2. Query Optimization
- Use indexes (see DATABASE_INDEXING_DOCS.md)
- Avoid SELECT * (select only needed columns)
- Use LIMIT for large result sets
- Use prepared statements

### 3. Transaction Management
- Keep transactions short
- Don't hold connections during I/O operations
- Release connections as soon as possible

### 4. Error Handling
- Use retry logic for transient failures
- Handle specific error codes
- Log errors for debugging

## Security

### 1. Credentials
- Store credentials in `.env` file
- Never commit `.env` to version control
- Use strong passwords
- Rotate credentials regularly

### 2. SQL Injection Prevention
- Always use prepared statements
- Never concatenate user input into queries
- Validate and sanitize input

### 3. Connection Security
- Use SSL/TLS for production
- Restrict MySQL bind-address
- Use firewall rules
- Limit connection privileges

## Production Checklist

- [ ] Configure MySQL timeout settings
- [ ] Set appropriate connection pool size
- [ ] Enable health check endpoints
- [ ] Set up monitoring and alerts
- [ ] Configure SSL/TLS connections
- [ ] Review and optimize slow queries
- [ ] Set up connection pool monitoring
- [ ] Configure automatic restarts
- [ ] Set up database backups
- [ ] Test failover scenarios

## Monitoring Metrics

Track these metrics in production:

1. **Connection Pool**
   - Total connections
   - Free connections
   - Queued requests
   - Connection acquisition time

2. **Query Performance**
   - Query execution time
   - Slow queries (> 100ms)
   - Failed queries
   - Retry attempts

3. **Database Health**
   - Response time
   - Threads connected
   - Connection errors
   - Uptime

4. **Error Rates**
   - Connection timeouts
   - Connection refused
   - Deadlocks
   - Other errors

## Support

For issues or questions:
1. Check logs in `server/logs/`
2. Review error messages and codes
3. Check MySQL error log
4. Verify configuration settings
5. Test connection manually

---

*Last Updated: April 25, 2026*
