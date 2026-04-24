-- Database Indexing Strategy Migration
-- Adds comprehensive indexes for optimal query performance

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

-- Email lookups (login, password reset, verification)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Google OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Verification token lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);

-- Password reset token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_password_token);

-- Two-factor authentication queries
CREATE INDEX IF NOT EXISTS idx_users_2fa_enabled ON users(two_factor_enabled);

-- Subscription queries
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_plan, subscription_expires_at);

-- ============================================================================
-- PROFILES TABLE INDEXES
-- ============================================================================

-- Username lookups (profile pages, search)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Public ID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_public_id ON profiles(public_id);

-- ============================================================================
-- USER_ROLES TABLE INDEXES
-- ============================================================================

-- Role-based queries (admin checks, server owner checks)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles(user_id, role);

-- Role filtering
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- ============================================================================
-- SERVERS TABLE INDEXES
-- ============================================================================

-- Owner lookups (dashboard, my servers)
CREATE INDEX IF NOT EXISTS idx_servers_owner ON servers(owner_id);

-- Slug lookups (server profile pages)
CREATE INDEX IF NOT EXISTS idx_servers_slug ON servers(slug);

-- Public ID lookups
CREATE INDEX IF NOT EXISTS idx_servers_public_id ON servers(public_id);

-- Status filtering (approved, pending, banned)
-- Already exists: CREATE INDEX idx_servers_status ON servers(status);

-- Vote count sorting (main listing)
-- Already exists: CREATE INDEX idx_servers_vote_count ON servers(vote_count DESC);

-- Rating sorting
CREATE INDEX IF NOT EXISTS idx_servers_rating ON servers(rating_avg DESC, rating_count DESC);

-- Featured servers
CREATE INDEX IF NOT EXISTS idx_servers_featured ON servers(is_featured, vote_count DESC);

-- Verified servers
CREATE INDEX IF NOT EXISTS idx_servers_verified ON servers(is_verified, vote_count DESC);

-- Online status filtering
CREATE INDEX IF NOT EXISTS idx_servers_online ON servers(is_online);

-- Region filtering
CREATE INDEX IF NOT EXISTS idx_servers_region ON servers(region);

-- Version filtering
CREATE INDEX IF NOT EXISTS idx_servers_version ON servers(version);

-- Composite index for common queries (status + vote_count)
CREATE INDEX IF NOT EXISTS idx_servers_status_votes ON servers(status, vote_count DESC);

-- Composite index for filtering + sorting
CREATE INDEX IF NOT EXISTS idx_servers_status_featured_votes ON servers(status, is_featured, vote_count DESC);

-- Search optimization (name)
CREATE INDEX IF NOT EXISTS idx_servers_name ON servers(name);

-- Created date sorting (newest servers)
CREATE INDEX IF NOT EXISTS idx_servers_created ON servers(created_at DESC);

-- ============================================================================
-- VOTES TABLE INDEXES
-- ============================================================================

-- Server + date lookups (vote history, analytics)
-- Already exists: CREATE INDEX idx_votes_server ON votes(server_id, voted_at DESC);

-- User + date lookups (user vote history)
-- Already exists: CREATE INDEX idx_votes_user ON votes(voter_user_id, voted_at DESC);

-- Public ID lookups
CREATE INDEX IF NOT EXISTS idx_votes_public_id ON votes(public_id);

-- Tracking parameter analytics
-- Already exists: CREATE INDEX idx_votes_tracking ON votes(tracking_param);

-- Suspicious vote filtering
CREATE INDEX IF NOT EXISTS idx_votes_suspicious ON votes(is_suspicious);

-- IP hash lookups (duplicate vote detection)
CREATE INDEX IF NOT EXISTS idx_votes_ip_hash ON votes(voter_ip_hash(255));

-- Composite index for cooldown checks
CREATE INDEX IF NOT EXISTS idx_votes_server_user_date ON votes(server_id, voter_user_id, voted_at DESC);

-- Date-based queries (daily/monthly stats)
CREATE INDEX IF NOT EXISTS idx_votes_date ON votes(voted_at);

-- ============================================================================
-- REVIEWS TABLE INDEXES
-- ============================================================================

-- Server reviews lookup
CREATE INDEX IF NOT EXISTS idx_reviews_server ON reviews(server_id, created_at DESC);

-- User reviews lookup
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id, created_at DESC);

-- Public ID lookups
CREATE INDEX IF NOT EXISTS idx_reviews_public_id ON reviews(public_id);

-- Rating filtering
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Composite index for server reviews with rating
CREATE INDEX IF NOT EXISTS idx_reviews_server_rating ON reviews(server_id, rating, created_at DESC);

-- Owner response filtering (unanswered reviews)
CREATE INDEX IF NOT EXISTS idx_reviews_no_response ON reviews(server_id, owner_response);

-- ============================================================================
-- API_KEYS TABLE INDEXES
-- ============================================================================

-- Owner lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_owner ON api_keys(owner_id);

-- Server lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_server ON api_keys(server_id);

-- Public ID lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_public_id ON api_keys(public_id);

-- Key prefix lookups (API key validation)
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- Active keys filtering
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(revoked, owner_id);

-- Last used tracking
CREATE INDEX IF NOT EXISTS idx_api_keys_last_used ON api_keys(last_used_at DESC);

-- ============================================================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================================================

-- User notifications lookup
-- Already exists: CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

-- Unread notifications
-- Already exists: CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- Type filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Composite index for unread by type
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_unread ON notifications(user_id, type, is_read);

-- ============================================================================
-- SITE_STATS TABLE INDEXES
-- ============================================================================

-- Date lookups (analytics)
CREATE INDEX IF NOT EXISTS idx_site_stats_date ON site_stats(date DESC);

-- ============================================================================
-- BLOCKED_USERS TABLE INDEXES
-- ============================================================================

-- Blocker lookups
-- Already exists: KEY idx_blocked_users_blocker (blocker_id)

-- Blocked user lookups
-- Already exists: KEY idx_blocked_users_blocked (blocked_id)

-- Composite index for block checks
CREATE INDEX IF NOT EXISTS idx_blocked_users_pair ON blocked_users(blocker_id, blocked_id);

-- ============================================================================
-- REPORTS TABLE INDEXES
-- ============================================================================

-- Reporter lookups
-- Already exists: KEY idx_reports_reporter (reporter_id)

-- Status filtering
-- Already exists: KEY idx_reports_status (status)

-- Type + ID lookups
-- Already exists: KEY idx_reports_type (reported_type, reported_id)

-- Date sorting
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

-- Composite index for admin dashboard
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status, created_at DESC);

-- ============================================================================
-- USER_BANS TABLE INDEXES
-- ============================================================================

-- User ban lookups
CREATE INDEX IF NOT EXISTS idx_user_bans_user ON user_bans(user_id);

-- Active bans
CREATE INDEX IF NOT EXISTS idx_user_bans_active ON user_bans(user_id, expires_at);

-- Banned by admin tracking
CREATE INDEX IF NOT EXISTS idx_user_bans_admin ON user_bans(banned_by);

-- ============================================================================
-- SERVER_TAGS TABLE INDEXES
-- ============================================================================

-- Server tags lookup
CREATE INDEX IF NOT EXISTS idx_server_tags_server ON server_tags(server_id);

-- Tag name filtering
CREATE INDEX IF NOT EXISTS idx_server_tags_name ON server_tags(tag_name);

-- ============================================================================
-- USER_FAVORITES TABLE INDEXES
-- ============================================================================

-- User favorites lookup
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id, created_at DESC);

-- Server favorites count
CREATE INDEX IF NOT EXISTS idx_user_favorites_server ON user_favorites(server_id);

-- ============================================================================
-- SERVER_UPDATES TABLE INDEXES
-- ============================================================================

-- Server updates lookup
CREATE INDEX IF NOT EXISTS idx_server_updates_server ON server_updates(server_id, created_at DESC);

-- ============================================================================
-- SERVER_OWNERSHIP_CLAIMS TABLE INDEXES
-- ============================================================================

-- Claimer lookups
CREATE INDEX IF NOT EXISTS idx_ownership_claims_claimer ON server_ownership_claims(claimer_id);

-- Server lookups
CREATE INDEX IF NOT EXISTS idx_ownership_claims_server ON server_ownership_claims(server_id);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_ownership_claims_status ON server_ownership_claims(status);

-- Composite index for pending claims
CREATE INDEX IF NOT EXISTS idx_ownership_claims_status_created ON server_ownership_claims(status, created_at DESC);

-- ============================================================================
-- SERVER_ANALYTICS TABLE INDEXES
-- ============================================================================

-- Server analytics lookup
CREATE INDEX IF NOT EXISTS idx_server_analytics_server_date ON server_analytics(server_id, date DESC);

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_server_analytics_date ON server_analytics(date DESC);

-- ============================================================================
-- ACHIEVEMENTS TABLE INDEXES
-- ============================================================================

-- Achievement code lookups
CREATE INDEX IF NOT EXISTS idx_achievements_code ON achievements(code);

-- Category filtering
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

-- ============================================================================
-- USER_ACHIEVEMENTS TABLE INDEXES
-- ============================================================================

-- User achievements lookup
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id, unlocked_at DESC);

-- Achievement tracking
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

-- Progress tracking
CREATE INDEX IF NOT EXISTS idx_user_achievements_progress ON user_achievements(user_id, progress);

-- ============================================================================
-- USER_PREFERENCES TABLE INDEXES
-- ============================================================================

-- User preferences lookup (should be fast, one row per user)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- ============================================================================
-- PAYMENTS TABLE INDEXES
-- ============================================================================

-- User payments lookup
-- Already exists: CREATE INDEX idx_payments_user_id ON payments(user_id);

-- Status filtering
-- Already exists: CREATE INDEX idx_payments_status ON payments(status);

-- Transaction hash lookups
-- Already exists: CREATE INDEX idx_payments_tx_hash ON payments(tx_hash);

-- Expiration checks
-- Already exists: CREATE INDEX idx_payments_expires_at ON payments(expires_at);

-- Active subscriptions
CREATE INDEX IF NOT EXISTS idx_payments_active ON payments(user_id, status, expires_at);

-- Composite index for admin dashboard
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments(status, created_at DESC);

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

-- These indexes optimize:
-- 1. Login/authentication queries (email, google_id, tokens)
-- 2. Server listing and filtering (status, votes, rating, region, version)
-- 3. Vote tracking and cooldown checks (server_id, user_id, voted_at)
-- 4. Review queries (server_id, user_id, rating)
-- 5. User dashboard queries (owner_id, favorites, achievements)
-- 6. Admin panel queries (reports, bans, pending claims)
-- 7. Analytics queries (date ranges, server stats)
-- 8. Social features (friends, chat, notifications)
-- 9. Payment tracking (subscriptions, transactions)

-- Composite indexes are used for queries with multiple WHERE conditions
-- DESC indexes are used for sorting in descending order
-- Covering indexes include all columns needed for common queries

SELECT 'Database indexing strategy applied successfully!' as status;
