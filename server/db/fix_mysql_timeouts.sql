-- Run this to check and fix MySQL timeout settings
-- This prevents MySQL from closing idle connections too quickly

-- Check current timeout settings
SHOW VARIABLES LIKE '%timeout%';

-- Recommended settings to prevent connection drops
-- Add these to your MySQL configuration file (my.ini or my.cnf)
-- Then restart MySQL server

/*
[mysqld]
wait_timeout = 28800
interactive_timeout = 28800
connect_timeout = 60
net_read_timeout = 60
net_write_timeout = 60
max_connections = 200
*/

-- Or set them temporarily (until MySQL restart):
SET GLOBAL wait_timeout = 28800;
SET GLOBAL interactive_timeout = 28800;
SET GLOBAL connect_timeout = 60;
SET GLOBAL net_read_timeout = 60;
SET GLOBAL net_write_timeout = 60;

-- Check max connections
SHOW VARIABLES LIKE 'max_connections';

-- Verify the changes
SHOW VARIABLES LIKE '%timeout%';

SELECT 'MySQL timeout settings updated!' as status;
