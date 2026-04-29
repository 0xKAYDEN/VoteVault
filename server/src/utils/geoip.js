import { cache } from './cache.js';
import logger from './logger.js';

/**
 * Resolve geolocation from an IP address using ip-api.com (free, no key required).
 * Results are cached in Redis for 24 hours to avoid hammering the API.
 */
export const resolveGeo = async (ip) => {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: 'Local', country_code: 'LO', region: null, city: null, isp: null, lat: null, lon: null };
  }

  // Strip IPv6-mapped IPv4 prefix
  const cleanIp = ip.replace(/^::ffff:/, '');

  const cacheKey = `geoip:${cleanIp}`;
  try {
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch { /* cache miss */ }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${cleanIp}?fields=status,country,countryCode,regionName,city,isp,lat,lon`,
      { signal: AbortSignal.timeout(3000) }
    );

    if (!res.ok) throw new Error(`ip-api HTTP ${res.status}`);

    const data = await res.json();

    if (data.status !== 'success') {
      return { country: null, country_code: null, region: null, city: null, isp: null, lat: null, lon: null };
    }

    const geo = {
      country:      data.country      || null,
      country_code: data.countryCode  || null,
      region:       data.regionName   || null,
      city:         data.city         || null,
      isp:          data.isp          || null,
      lat:          data.lat          || null,
      lon:          data.lon          || null,
    };

    // Cache for 24 hours
    await cache.set(cacheKey, JSON.stringify(geo), 86400);
    return geo;
  } catch (err) {
    logger.warn(`GeoIP lookup failed for ${cleanIp}: ${err.message}`);
    return { country: null, country_code: null, region: null, city: null, isp: null, lat: null, lon: null };
  }
};

/**
 * Extract the real client IP from the request, respecting common proxy headers.
 */
export const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || req.ip || null;
};
