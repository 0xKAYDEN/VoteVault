# ⚠️ Important: Need reCAPTCHA v2 Keys

## Current Setup
You're currently using reCAPTCHA v3 keys. To use reCAPTCHA v2 (with checkbox), you need to create a NEW reCAPTCHA v2 site.

## Steps to Get reCAPTCHA v2 Keys

1. Go to https://www.google.com/recaptcha/admin
2. Click **"+"** to create a new site
3. Fill in:
   - **Label**: Conquer Toplist v2
   - **reCAPTCHA type**: Select **"reCAPTCHA v2"** → **"I'm not a robot" Checkbox**
   - **Domains**: Add `localhost` and your production domain
4. Submit and copy BOTH keys:
   - **Site Key** (public)
   - **Secret Key** (private)

## Then Update .env

Once you have the v2 keys, update your `.env` file:
```env
# reCAPTCHA v2 keys (replace with your new v2 keys)
VITE_RECAPTCHA_V2_SITE_KEY=your_v2_site_key_here
RECAPTCHA_V2_SECRET_KEY=your_v2_secret_key_here
```

---

**I'm installing the v2 package now. Once installed, provide your v2 keys and I'll update the configuration.**
