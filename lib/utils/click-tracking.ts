export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + (process.env.IP_SALT || 'default-salt'));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

export function parseUserAgent(userAgent: string): {
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
} {
  const ua = userAgent.toLowerCase();

  let device: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  if (/ipad|tablet/i.test(ua)) {
    device = 'tablet';
  } else if (/mobile|android|iphone/i.test(ua)) {
    device = 'mobile';
  }

  let browser = 'Unknown';
  if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('chrome')) {
    browser = 'Chrome';
  } else if (ua.includes('safari')) {
    browser = 'Safari';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
  }

  let os = 'Unknown';
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad') || /cpu os|ios/.test(ua)) {
    os = 'iOS';
  } else if (ua.includes('mac')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }

  return { device, browser, os };
}

export interface ClickEventData {
  linkId: string;
  timestamp: string;
  ip: string;
  country?: string | null;
  city?: string | null;
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  referrer?: string | null;
  userAgent: string;
}