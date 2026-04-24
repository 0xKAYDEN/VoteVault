import fetch from 'node-fetch';

export const verifyRecaptcha = async (req, res, next) => {
  const { recaptchaToken } = req.body;

  if (!recaptchaToken) {
    return res.status(400).json({ error: 'reCAPTCHA token is required' });
  }

  const secretKey = process.env.RECAPTCHA_V2_SECRET_KEY;

  if (!secretKey) {
    console.error('RECAPTCHA_V2_SECRET_KEY not configured');
    return res.status(500).json({ error: 'reCAPTCHA not configured on server' });
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
        error: 'reCAPTCHA verification failed'
      });
    }

    next();
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    res.status(500).json({ error: 'Failed to verify reCAPTCHA' });
  }
};
