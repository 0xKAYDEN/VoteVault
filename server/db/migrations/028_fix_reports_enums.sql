-- Migration 028: Fix reports table ENUMs to include all valid values
-- Run: mysql -u root -p conquer_toplist < server/db/migrations/028_fix_reports_enums.sql

ALTER TABLE reports
  MODIFY COLUMN reported_type ENUM('user', 'server', 'review', 'thread') NOT NULL,
  MODIFY COLUMN reason ENUM('spam', 'harassment', 'inappropriate', 'cheating', 'fake', 'vote_manipulation', 'other') NOT NULL;

SELECT 'Reports table ENUMs updated successfully!' AS status;
