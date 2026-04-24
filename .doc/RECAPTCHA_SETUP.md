# reCAPTCHA v3 Setup Guide

This project uses Google reCAPTCHA v3 to protect against bots on authentication and server creation endpoints.

## Quick Setup

### 1. Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Click "+" to create a new site
3. Fill in the form:
   - **Label**: Conquer Toplist (or your site name)
   - **reCAPTCHA type**: Select "reCAPTCHA v3"
   - **Domains**: Add your domains (e.g., `localhost`, `yourdomain.com`)
4. Accept terms and submit
5. Copy both the **Site Key** and **Secret Key**

### 2. Configure Backend

1. Copy `server/.env.example` to `server/.env`
2. Add your secret key:
   ```env
   RECAPTCHA_SECRET_KEY=your_secret_key_here
   ```

### 3. Configure Frontend

1. Copy `.env.example` to `.env`
2. Add your site key:
   ```env
   VITE_RECAPTCHA_SITE_KEY=your_site_key_here
   ```

### 4. Test Keys (Development Only)

For development/testing, you can use Google's test keys:
- **Site Key**: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- **Secret Key**: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

These keys always pass validation but should **never** be used in production.

## Protected Endpoints

reCAPTCHA verification is enabled on:
- ✅ User registration (`POST /api/auth/register`)
- ✅ User login (`POST /api/auth/login`)
- ✅ Server creation (`POST /api/servers`)

## How It Works

### Frontend
- Uses `react-google-recaptcha-v3` package
- Automatically generates tokens on form submission
- Tokens are sent with API requests in the `recaptchaToken` field

### Backend
- Middleware verifies tokens with Google's API
- Checks score threshold (minimum 0.5)
- Rejects requests with invalid or low-score tokens

## Troubleshooting

### "reCAPTCHA not loaded yet"
- Wait a moment after page load before submitting
- Check browser console for loading errors
- Verify site key is correct

### "reCAPTCHA verification failed"
- Check that secret key is set in `server/.env`
- Verify domain is registered in reCAPTCHA admin
- Check server logs for detailed error messages

### Low Score Rejections
- Score threshold is set to 0.5 (can be adjusted in `server/src/middleware/recaptcha.js`)
- Lower scores indicate bot-like behavior
- Consider adjusting threshold based on your needs

## Production Checklist

- [ ] Replace test keys with real keys
- [ ] Add production domain to reCAPTCHA admin
- [ ] Set `RECAPTCHA_SECRET_KEY` in production environment
- [ ] Set `VITE_RECAPTCHA_SITE_KEY` in production build
- [ ] Test registration and login flows
- [ ] Monitor reCAPTCHA admin dashboard for analytics
