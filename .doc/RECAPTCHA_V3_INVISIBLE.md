# ℹ️ reCAPTCHA v3 is Invisible!

## Important: reCAPTCHA v3 Does NOT Show a Checkbox

Unlike reCAPTCHA v2, **reCAPTCHA v3 is completely invisible**. There's no checkbox or widget to see.

### How It Works

1. **Silent Operation**: reCAPTCHA v3 runs in the background
2. **Automatic Scoring**: It analyzes user behavior and gives a score (0.0 to 1.0)
3. **No User Interaction**: Users never see it or interact with it
4. **Badge Only**: You'll see a small reCAPTCHA badge in the bottom-right corner of the page

### What You Should See

✅ **Small badge in bottom-right corner** saying "protected by reCAPTCHA"  
✅ **No checkbox or challenge**  
✅ **Forms work normally**

### How to Verify It's Working

1. **Check browser console** - Look for any reCAPTCHA errors
2. **Try to login/register** - It should work normally
3. **Check network tab** - You'll see a request to `google.com/recaptcha/api.js`
4. **Look for the badge** - Bottom-right corner of the page

### Testing the Protection

The backend will reject requests if:
- No reCAPTCHA token is sent
- Token is invalid
- Score is below 0.5 (likely a bot)

### If You Want to See It Working

Check your browser's **Network tab** when you submit a form:
1. Open DevTools (F12)
2. Go to Network tab
3. Submit login/register form
4. Look for the request to `/api/auth/login` or `/api/auth/register`
5. Check the request payload - you should see `recaptchaToken` field

---

**Summary**: reCAPTCHA v3 is invisible by design. If you see the small badge and forms work, it's working correctly!
