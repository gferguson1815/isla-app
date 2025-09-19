import { UtmParameters } from '@/packages/shared/src/types/utm';

export function parseUtmParameters(url: string): {
  utmParams: UtmParameters;
  cleanUrl: string;
  otherParams: Record<string, string>;
} {
  try {
    const urlObj = new URL(url);
    const searchParams = new URLSearchParams(urlObj.search);
    const utmParams: UtmParameters = {};
    const otherParams: Record<string, string> = {};

    // Extract all parameters
    searchParams.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.startsWith('utm_')) {
        // Map to camelCase for our interface
        switch (lowerKey) {
          case 'utm_source':
            utmParams.utm_source = value;
            break;
          case 'utm_medium':
            utmParams.utm_medium = value;
            break;
          case 'utm_campaign':
            utmParams.utm_campaign = value;
            break;
          case 'utm_term':
            utmParams.utm_term = value;
            break;
          case 'utm_content':
            utmParams.utm_content = value;
            break;
        }
      } else {
        otherParams[key] = value;
      }
    });

    // Create clean URL without UTM parameters
    const cleanUrlObj = new URL(url);
    const cleanSearchParams = new URLSearchParams();

    // Keep only non-UTM parameters
    Object.entries(otherParams).forEach(([key, value]) => {
      cleanSearchParams.set(key, value);
    });

    cleanUrlObj.search = cleanSearchParams.toString();
    const cleanUrl = cleanUrlObj.toString();

    return {
      utmParams,
      cleanUrl,
      otherParams,
    };
  } catch {
    // If URL is malformed, return empty results
    return {
      utmParams: {},
      cleanUrl: url,
      otherParams: {},
    };
  }
}

export function buildUrlWithUtm(
  baseUrl: string,
  utmParams: UtmParameters,
  preserveExisting = true
): string {
  try {
    const urlObj = new URL(baseUrl);
    const searchParams = new URLSearchParams(urlObj.search);

    // Add or update UTM parameters
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value) {
        // Only set if not preserving or doesn't exist
        if (!preserveExisting || !searchParams.has(key)) {
          searchParams.set(key, value);
        }
      }
    });

    urlObj.search = searchParams.toString();
    return urlObj.toString();
  } catch {
    // If URL is malformed, return original
    return baseUrl;
  }
}

export function extractUtmFromPastedUrl(pastedUrl: string): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
} {
  const { utmParams } = parseUtmParameters(pastedUrl);

  return {
    utmSource: utmParams.utm_source,
    utmMedium: utmParams.utm_medium,
    utmCampaign: utmParams.utm_campaign,
    utmTerm: utmParams.utm_term,
    utmContent: utmParams.utm_content,
  };
}

export function validateUtmParameter(value: string): boolean {
  if (!value) return true; // Empty is valid

  // Check for spaces
  if (/\s/.test(value)) return false;

  // Check for valid characters (letters, numbers, underscore, hyphen)
  if (!/^[a-zA-Z0-9_\-]+$/.test(value)) return false;

  // Check max length
  if (value.length > 255) return false;

  return true;
}

export function sanitizeUtmParameter(value: string): string {
  if (!value) return '';

  // Replace spaces with underscores
  let sanitized = value.replace(/\s+/g, '_');

  // Remove invalid characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9_\-]/g, '');

  // Truncate if too long
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  // Convert to lowercase for consistency
  return sanitized.toLowerCase();
}