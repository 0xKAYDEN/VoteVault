# 🚀 QUICK START CHECKLIST

## ⚠️ CRITICAL - DO THESE FIRST (30 minutes)

### 1. Configure Email Service
```bash
# Add to server/.env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@conquer-toplist.com
```

### 2. Set USDT Wallet Address
**File:** `src/pages/Payment.tsx` line 18
```typescript
// Change this:
const USDT_ADDRESS = "TRC20_WALLET_ADDRESS_HERE";

// To your actual wallet:
const USDT_ADDRESS = "YOUR_ACTUAL_TRC20_WALLET_ADDRESS";
```

### 3. Run Database Migrations
```bash
cd server/db/migrations

# Run each migration in order
psql -U your_user -d conquer_toplist -f 001_add_categories.sql
psql -U your_user -d conquer_toplist -f 002_add_friends_chat_system.sql
psql -U your_user -d conquer_toplist -f 003_add_2fa.sql
psql -U your_user -d conquer_toplist -f 004_add_email_notifications.sql
psql -U your_user -d conquer_toplist -f 005_add_user_experience_features.sql
psql -U your_user -d conquer_toplist -f 006_add_admin_features.sql
psql -U your_user -d conquer_toplist -f 007_add_server_enhancements.sql
psql -U your_user -d conquer_toplist -f 008_add_server_owner_features.sql
psql -U your_user -d conquer_toplist -f 009_add_nice_to_have_features.sql
psql -U your_user -d conquer_toplist -f 010_add_vote_tracking.sql
psql -U your_user -d conquer_toplist -f 011_add_active_players_and_social.sql
psql -U your_user -d conquer_toplist -f 012_seed_achievements.sql
psql -U your_user -d conquer_toplist -f 013_create_achievements_table.sql
psql -U your_user -d conquer_toplist -f 014_add_payments_system.sql
```

---

## 🔥 HIGH PRIORITY - DO NEXT (2-4 hours)

### 4. Create Admin Payment Management Page
**Location:** `src/pages/admin/AdminPayments.tsx`

**Features Needed:**
- [ ] List pending payments
- [ ] Show transaction hash with blockchain explorer link
- [ ] Activate payment button
- [ ] Reject payment button with reason
- [ ] Payment history

**API Endpoints Ready:**
- `GET /api/payments/pending`
- `POST /api/payments/:id/activate`
- `POST /api/payments/:id/reject`

### 5. Add Server Favorites Feature
**Files to Create/Modify:**
- [ ] Add favorite button to `src/components/ServerCard.tsx`
- [ ] Create `src/pages/Favorites.tsx`
- [ ] Add API integration to `src/lib/api.ts`

**API Endpoints Ready:**
- `POST /api/server-enhancements/favorites`
- `GET /api/server-enhancements/favorites`

### 6. Add Server Tags Feature
**Files to Create/Modify:**
- [ ] Add tags display to `src/components/ServerCard.tsx`
- [ ] Add tag management to server edit page
- [ ] Create browse by tag page

**API Endpoints Ready:**
- `POST /api/server-enhancements/:serverId/tags`
- `GET /api/server-enhancements/tags/all`

### 7. Display Active Players Count
**Files to Modify:**
- [ ] Add to `src/components/ServerCard.tsx`
- [ ] Add to `src/pages/ServerProfile.tsx`

**Backend Ready:** ✅

### 8. Display Premium Badges
**Files to Modify:**
- [ ] Add badge to `src/components/ServerCard.tsx`
- [ ] Add badge to user profiles
- [ ] Show subscription status in dashboard

**Backend Ready:** ✅

---

## 📋 MEDIUM PRIORITY - DO THIS WEEK (8-12 hours)

### 9. Integrate Achievements System
- [ ] Add achievements to user profile page
- [ ] Create achievements page
- [ ] Add achievement notifications
- [ ] Integrate `src/components/AchievementDisplay.tsx`

### 10. Add 2FA Frontend
- [ ] Create 2FA setup page in settings
- [ ] Add QR code display
- [ ] Add 2FA verification during login
- [ ] Add backup codes display

### 11. Integrate Social Links
- [ ] Add social links form to settings
- [ ] Display social links on user profile
- [ ] Use existing `src/components/SocialLinks.tsx`

### 12. Add Server Updates/Changelog
- [ ] Create changelog tab on server profile
- [ ] Add update form for server owners
- [ ] Display recent updates

### 13. Add Ownership Claims System
- [ ] Create claim ownership button
- [ ] Create claims status page
- [ ] Add admin panel to review claims

---

## 🔮 FUTURE ENHANCEMENTS (When Time Allows)

### 14. Server Comparison Feature
- [ ] Create comparison page
- [ ] Add server selection UI
- [ ] Build comparison table

### 15. Block & Report System
- [ ] Add block user button
- [ ] Create report forms
- [ ] Admin panel for reports

### 16. Discord OAuth
- [ ] Set up Discord app
- [ ] Implement OAuth flow
- [ ] Add Discord login button

### 17. Advanced Analytics
- [ ] Create detailed analytics dashboard
- [ ] Add charts and graphs
- [ ] Export functionality

---

## 🧪 TESTING CHECKLIST

### Before Launch:
- [ ] Test payment flow end-to-end
- [ ] Test email delivery (password reset, notifications)
- [ ] Test all user roles (player, owner, admin, mod, vip)
- [ ] Test API docs access control
- [ ] Test theme switching
- [ ] Test voting system
- [ ] Test friends/chat system
- [ ] Test file uploads
- [ ] Test mobile responsiveness

---

## 🔒 SECURITY CHECKLIST

### Before Production:
- [ ] Change all default secrets in .env
- [ ] Enable HTTPS
- [ ] Set up CORS properly
- [ ] Add rate limiting to sensitive endpoints
- [ ] Implement CSRF protection
- [ ] Add input validation to all forms
- [ ] Sanitize user inputs
- [ ] Set up database backups
- [ ] Enable SQL injection protection
- [ ] Add security headers (helmet.js)

---

## 📊 MONITORING SETUP

### Recommended Tools:
- [ ] Set up error tracking (Sentry)
- [ ] Set up uptime monitoring
- [ ] Set up database monitoring
- [ ] Set up log aggregation
- [ ] Set up performance monitoring

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Going Live:
- [ ] Set up production database
- [ ] Configure production environment variables
- [ ] Set up SSL certificate
- [ ] Configure CDN for static assets
- [ ] Set up automated backups
- [ ] Configure email service
- [ ] Test payment system with real transactions
- [ ] Set up domain and DNS
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerts

---

## 📈 POST-LAUNCH TASKS

### Week 1:
- [ ] Monitor payment transactions
- [ ] Review user feedback
- [ ] Fix critical bugs
- [ ] Monitor server performance
- [ ] Check email delivery rates

### Week 2-4:
- [ ] Implement missing features based on priority
- [ ] Optimize performance
- [ ] Add analytics tracking
- [ ] Improve SEO
- [ ] Create user documentation

---

## 💡 QUICK WINS (Easy Implementations)

These can be done in 15-30 minutes each:

1. **Show Active Players** - Just display `server.active_players` on cards
2. **Premium Badge** - Add conditional badge based on `server.is_premium`
3. **Social Links** - Import and use existing `SocialLinks` component
4. **Achievement Display** - Import and use existing `AchievementDisplay` component
5. **Favorite Count** - Display `server.favorites_count` on cards

---

## 📞 NEED HELP?

### Common Issues:

**Server won't start:**
- Check if port 5000 is in use
- Verify database connection
- Check .env file exists

**Database errors:**
- Run migrations in order
- Check database credentials
- Verify database exists

**Email not sending:**
- Check EMAIL_* environment variables
- Test SMTP credentials
- Check spam folder

**Payment not working:**
- Verify USDT wallet address is set
- Check payment migration ran
- Verify user is authenticated

---

**Last Updated:** 2026-04-24
