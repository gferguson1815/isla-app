import { NextRequest } from 'next/server';

export interface PrivacySettings {
  respectDoNotTrack: boolean;
  anonymizeIP: boolean;
  dataRetentionDays: number;
  requireConsent: boolean;
  skipDetailedTracking: boolean;
}

/**
 * Check if Do Not Track header is set
 */
export function checkDoNotTrack(request: NextRequest): boolean {
  const dnt = request.headers.get('dnt') || request.headers.get('donottrack');
  return dnt === '1';
}

/**
 * Check if user is from EU/GDPR region
 */
export function isGDPRRegion(country: string | null): boolean {
  if (!country) return false;

  const gdprCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    // EEA countries
    'IS', 'LI', 'NO',
    // UK (has similar laws)
    'GB',
  ];

  return gdprCountries.includes(country.toUpperCase());
}

/**
 * Check if user is from California (CCPA compliance)
 */
export function isCCPARegion(country: string | null, region: string | null): boolean {
  return country === 'US' && region === 'CA';
}

/**
 * Get privacy settings based on user location and preferences
 */
export function getPrivacySettings(
  request: NextRequest,
  country: string | null,
  region: string | null
): PrivacySettings {
  const doNotTrack = checkDoNotTrack(request);
  const isGDPR = isGDPRRegion(country);
  const isCCPA = isCCPARegion(country, region);

  // Check for consent cookie
  const consentCookie = request.cookies.get('analytics-consent');
  const hasConsent = consentCookie?.value === 'accepted';

  return {
    respectDoNotTrack: doNotTrack,
    anonymizeIP: true, // Always anonymize IP addresses
    dataRetentionDays: isGDPR ? 90 : 365, // GDPR requires shorter retention
    requireConsent: isGDPR || isCCPA,
    skipDetailedTracking: doNotTrack || (isGDPR && !hasConsent),
  };
}

/**
 * Sanitize and anonymize data for privacy compliance
 */
export function sanitizeClickEvent(
  clickEvent: Record<string, unknown>,
  privacySettings: PrivacySettings
): Record<string, unknown> {
  const sanitized = { ...clickEvent };

  // Always hash IP addresses
  if (sanitized.ipAddress && typeof sanitized.ipAddress === 'string') {
    // IP should already be hashed, but ensure it doesn't contain raw IP
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(sanitized.ipAddress)) {
      delete sanitized.ipAddress; // Remove if it looks like a raw IP
    }
  }

  // Remove detailed tracking if DNT is enabled
  if (privacySettings.skipDetailedTracking) {
    // Keep only essential data
    const essentialFields = [
      'linkId',
      'timestamp',
      'country',
      'device',
    ];

    for (const key in sanitized) {
      if (!essentialFields.includes(key)) {
        delete sanitized[key];
      }
    }
  }

  // Remove any potential PII fields
  const piiFields = [
    'email',
    'name',
    'phone',
    'address',
    'ssn',
    'creditCard',
    'userId',
    'username',
  ];

  for (const field of piiFields) {
    delete sanitized[field];
  }

  return sanitized;
}

/**
 * Generate privacy-compliant user identifier
 */
export async function generatePrivacyCompliantId(
  ip: string,
  userAgent: string,
  salt: string = 'default-salt'
): Promise<string> {
  // Create a fingerprint that changes daily for privacy
  const today = new Date().toISOString().split('T')[0];
  const input = `${ip}-${userAgent}-${salt}-${today}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex.substring(0, 32);
}

/**
 * Check if tracking should be completely blocked
 */
export function shouldBlockTracking(
  privacySettings: PrivacySettings,
  hasUserConsent: boolean = false
): boolean {
  // Always respect DNT
  if (privacySettings.respectDoNotTrack) {
    return true;
  }

  // Block if consent is required but not given
  if (privacySettings.requireConsent && !hasUserConsent) {
    return true;
  }

  return false;
}

/**
 * Get data retention policy message
 */
export function getDataRetentionPolicy(days: number): string {
  return `Analytics data is automatically deleted after ${days} days in compliance with privacy regulations.`;
}

/**
 * Create a privacy-safe error log entry
 */
export function createPrivacySafeLog(
  message: string,
  context: Record<string, unknown>
): Record<string, unknown> {
  // Remove any sensitive data from logs
  const safeContext = { ...context };

  // Remove sensitive headers
  if (safeContext.headers && typeof safeContext.headers === 'object') {
    const headers = safeContext.headers as Record<string, unknown>;
    delete headers.cookie;
    delete headers.authorization;
    delete headers['x-api-key'];
  }

  // Remove IP addresses
  delete safeContext.ip;
  delete safeContext.ipAddress;
  delete safeContext['x-forwarded-for'];
  delete safeContext['x-real-ip'];

  // Remove user agents (can be identifying)
  delete safeContext.userAgent;
  delete safeContext['user-agent'];

  return {
    message,
    context: safeContext,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Headers to send for privacy transparency
 */
export function getPrivacyHeaders(privacySettings: PrivacySettings): Headers {
  const headers = new Headers();

  headers.set('X-DNT-Respected', privacySettings.respectDoNotTrack ? 'true' : 'false');
  headers.set('X-Data-Retention-Days', privacySettings.dataRetentionDays.toString());
  headers.set('X-IP-Anonymized', 'true');

  if (privacySettings.requireConsent) {
    headers.set('X-Consent-Required', 'true');
  }

  return headers;
}