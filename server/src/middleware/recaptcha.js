import fetch from 'node-fetch';

export const verifyRecaptcha = async (req, res, next) => {
  const { recaptchaToken } = req.body;

  // Skip reCAPTCHA if not configured (development mode)
  const secretKey = process.env.RECAPTCHA_V2_SECRET_KEY;
  if (!secretKey) {
    console.warn('⚠️ RECAPTCHA_V2_SECRET_KEY not configured - skipping verification');
    return next();
  }

  // Skip if no token provided (optional reCAPTCHA)
  if (!recaptchaToken) {
    console.warn('⚠️ No reCAPTCHA token provided - skipping verification');
    return next();
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${recaptchaToken}`
    });

    const data = await response.json();

    if (!data.success) {
      console.error('reCAPTCHA v2 verification failed:', data['error-codes']);
      return res.status(400).json({
        error: 'reCAPTCHA verification failed',
        details: data['error-codes']
      });
    }

    console.log('✅ reCAPTCHA verified successfully');
    next();
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    // Don't block the request on reCAPTCHA errors, just log and continue
    console.warn('⚠️ reCAPTCHA verification failed - allowing request anyway');
    next();
  }
};
