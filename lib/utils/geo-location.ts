import { NextRequest } from 'next/server';

export interface GeoLocation {
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Extract geo-location data from Vercel Edge Function headers
 * Vercel provides these headers automatically in Edge Functions
 */
export function extractGeoLocation(request: NextRequest): GeoLocation {
  const headers = request.headers;

  // Vercel geo headers
  const country = headers.get('x-vercel-ip-country') || null;
  const region = headers.get('x-vercel-ip-country-region') || null;
  const city = headers.get('x-vercel-ip-city') || null;
  const latitude = headers.get('x-vercel-ip-latitude');
  const longitude = headers.get('x-vercel-ip-longitude');

  return {
    country: country === 'XX' ? null : country, // XX means unknown
    region: region === 'XX' ? null : region,
    city: city && city !== 'XX' ? decodeURIComponent(city) : null,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
  };
}

/**
 * Fallback IP geolocation using a free API service
 * Only used if Vercel headers are not available
 */
export async function getGeoLocationFromIP(ip: string): Promise<GeoLocation> {
  // Don't try to geolocate local/private IPs
  if (isPrivateIP(ip)) {
    return {
      country: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
    };
  }

  try {
    // Using ip-api.com free tier (100 requests per minute)
    // Note: In production, consider using a paid service for reliability
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon`,
      {
        signal: AbortSignal.timeout(2000), // 2 second timeout
      }
    );

    if (!response.ok) {
      return getEmptyGeoLocation();
    }

    const data = await response.json();

    if (data.status === 'success') {
      return {
        country: data.country || null,
        region: data.regionName || null,
        city: data.city || null,
        latitude: data.lat || null,
        longitude: data.lon || null,
      };
    }

    return getEmptyGeoLocation();
  } catch (error) {
    console.error('IP geolocation fallback failed:', error);
    return getEmptyGeoLocation();
  }
}

/**
 * Get country name from ISO country code
 */
export function getCountryName(countryCode: string | null): string | null {
  if (!countryCode) return null;

  // Common country codes to names mapping
  const countries: Record<string, string> = {
    US: 'United States',
    GB: 'United Kingdom',
    CA: 'Canada',
    AU: 'Australia',
    DE: 'Germany',
    FR: 'France',
    ES: 'Spain',
    IT: 'Italy',
    NL: 'Netherlands',
    BE: 'Belgium',
    CH: 'Switzerland',
    AT: 'Austria',
    SE: 'Sweden',
    NO: 'Norway',
    DK: 'Denmark',
    FI: 'Finland',
    PL: 'Poland',
    RU: 'Russia',
    UA: 'Ukraine',
    TR: 'Turkey',
    BR: 'Brazil',
    MX: 'Mexico',
    AR: 'Argentina',
    CL: 'Chile',
    CO: 'Colombia',
    IN: 'India',
    CN: 'China',
    JP: 'Japan',
    KR: 'South Korea',
    TW: 'Taiwan',
    HK: 'Hong Kong',
    SG: 'Singapore',
    MY: 'Malaysia',
    TH: 'Thailand',
    ID: 'Indonesia',
    PH: 'Philippines',
    VN: 'Vietnam',
    NZ: 'New Zealand',
    ZA: 'South Africa',
    EG: 'Egypt',
    NG: 'Nigeria',
    KE: 'Kenya',
    IL: 'Israel',
    AE: 'United Arab Emirates',
    SA: 'Saudi Arabia',
    QA: 'Qatar',
    KW: 'Kuwait',
    IR: 'Iran',
    IQ: 'Iraq',
    PK: 'Pakistan',
    BD: 'Bangladesh',
    LK: 'Sri Lanka',
    // Add more as needed
  };

  return countries[countryCode.toUpperCase()] || countryCode;
}

/**
 * Check if the IP is private/local
 */
export function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    /^127\./,              // Loopback
    /^10\./,               // Private network
    /^172\.(1[6-9]|2\d|3[01])\./,  // Private network
    /^192\.168\./,         // Private network
    /^169\.254\./,         // Link-local
    /^::1$/,               // IPv6 loopback
    /^fc00:/,              // IPv6 unique local
    /^fe80:/,              // IPv6 link-local
  ];

  return privateRanges.some(range => range.test(ip));
}

/**
 * Check if geo-location tracking should be blocked (privacy/compliance)
 */
export function shouldBlockGeoTracking(
  country: string | null,
  doNotTrack: boolean
): boolean {
  // Respect Do Not Track header
  if (doNotTrack) {
    return true;
  }

  // GDPR compliance - could be enhanced with consent management
  const gdprCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    // EEA countries
    'IS', 'LI', 'NO',
    // UK (has similar laws)
    'GB',
  ];

  // For now, we'll track but ensure data is anonymized
  // In production, implement proper consent management
  return false;
}

/**
 * Get timezone from geo-location
 */
export function getTimezoneFromGeo(country: string | null, region: string | null): string | null {
  if (!country) return null;

  // Basic timezone mapping - can be expanded
  const timezones: Record<string, string> = {
    'US-CA': 'America/Los_Angeles',
    'US-NY': 'America/New_York',
    'US-TX': 'America/Chicago',
    'US-FL': 'America/New_York',
    'GB': 'Europe/London',
    'FR': 'Europe/Paris',
    'DE': 'Europe/Berlin',
    'ES': 'Europe/Madrid',
    'IT': 'Europe/Rome',
    'JP': 'Asia/Tokyo',
    'CN': 'Asia/Shanghai',
    'IN': 'Asia/Kolkata',
    'AU': 'Australia/Sydney',
    'BR': 'America/Sao_Paulo',
    'CA': 'America/Toronto',
    // Add more as needed
  };

  const key = region ? `${country}-${region}` : country;
  return timezones[key] || timezones[country] || null;
}

function getEmptyGeoLocation(): GeoLocation {
  return {
    country: null,
    region: null,
    city: null,
    latitude: null,
    longitude: null,
  };
}