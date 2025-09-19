interface ParsedUserAgent {
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  browserVersion: string | null;
  os: string;
  osVersion: string | null;
  engine: string | null;
}

export function parseUserAgentEnhanced(userAgent: string): ParsedUserAgent {
  const ua = userAgent.toLowerCase();
  const originalUA = userAgent;

  // Device detection
  let device: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  if (/ipad|playbook|silk|tablet/i.test(ua) ||
      (/android/i.test(ua) && !/mobile/i.test(ua))) {
    device = 'tablet';
  } else if (/mobile|android|iphone|ipod|blackberry|opera mini|opera mobi|skyfire|maemo|windows phone|palm|iemobile|symbian|symbianos|fennec/i.test(ua)) {
    device = 'mobile';
  }

  // Browser detection with version
  let browser = 'Unknown';
  let browserVersion: string | null = null;

  if (/edg\//i.test(ua)) {
    browser = 'Edge';
    const match = /edg\/(\d+(?:\.\d+)?)/i.exec(originalUA);
    browserVersion = match?.[1] || null;
  } else if (/opr\/|opera/i.test(ua)) {
    browser = 'Opera';
    const match = /(?:opr|opera)[\/\s](\d+(?:\.\d+)?)/i.exec(originalUA);
    browserVersion = match?.[1] || null;
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Chrome';
    const match = /(?:chrome|crios)[\/\s](\d+(?:\.\d+)?)/i.exec(originalUA);
    browserVersion = match?.[1] || null;
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
    const match = /(?:firefox|fxios)[\/\s](\d+(?:\.\d+)?)/i.exec(originalUA);
    browserVersion = match?.[1] || null;
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
    const match = /version\/(\d+(?:\.\d+)?)/i.exec(originalUA);
    browserVersion = match?.[1] || null;
  } else if (/msie|trident/i.test(ua)) {
    browser = 'Internet Explorer';
    const match = /(?:msie\s|rv:)(\d+(?:\.\d+)?)/i.exec(originalUA);
    browserVersion = match?.[1] || null;
  }

  // OS detection with version
  let os = 'Unknown';
  let osVersion: string | null = null;

  if (/windows/i.test(ua)) {
    os = 'Windows';
    if (/windows nt 10/i.test(ua)) {
      osVersion = '10';
    } else if (/windows nt 6\.3/i.test(ua)) {
      osVersion = '8.1';
    } else if (/windows nt 6\.2/i.test(ua)) {
      osVersion = '8';
    } else if (/windows nt 6\.1/i.test(ua)) {
      osVersion = '7';
    } else if (/windows nt 6\.0/i.test(ua)) {
      osVersion = 'Vista';
    } else if (/windows nt 5\.1/i.test(ua)) {
      osVersion = 'XP';
    } else {
      const match = /windows nt (\d+(?:\.\d+)?)/i.exec(originalUA);
      osVersion = match?.[1] || null;
    }
  } else if (/android/i.test(ua)) {
    os = 'Android';
    const match = /android\s(\d+(?:\.\d+)?)/i.exec(originalUA);
    osVersion = match?.[1] || null;
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
    const match = /os\s(\d+(?:[_\.]\d+)?)/i.exec(originalUA);
    osVersion = match?.[1]?.replace(/_/g, '.') || null;
  } else if (/mac os x/i.test(ua)) {
    os = 'macOS';
    const match = /mac os x\s(\d+(?:[_\.]\d+)?)/i.exec(originalUA);
    osVersion = match?.[1]?.replace(/_/g, '.') || null;
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
    if (/ubuntu/i.test(ua)) {
      os = 'Ubuntu';
      const match = /ubuntu\/(\d+(?:\.\d+)?)/i.exec(originalUA);
      osVersion = match?.[1] || null;
    } else if (/fedora/i.test(ua)) {
      os = 'Fedora';
      const match = /fedora\/(\d+)/i.exec(originalUA);
      osVersion = match?.[1] || null;
    } else if (/debian/i.test(ua)) {
      os = 'Debian';
      const match = /debian\/(\d+(?:\.\d+)?)/i.exec(originalUA);
      osVersion = match?.[1] || null;
    }
  } else if (/chromeos/i.test(ua)) {
    os = 'Chrome OS';
    const match = /chromeos\s(\d+(?:\.\d+)?)/i.exec(originalUA);
    osVersion = match?.[1] || null;
  }

  // Rendering engine detection
  let engine: string | null = null;
  if (/webkit/i.test(ua)) {
    engine = 'WebKit';
  } else if (/gecko/i.test(ua)) {
    engine = 'Gecko';
  } else if (/trident/i.test(ua)) {
    engine = 'Trident';
  } else if (/presto/i.test(ua)) {
    engine = 'Presto';
  } else if (/edgehtml/i.test(ua)) {
    engine = 'EdgeHTML';
  }

  return {
    device,
    browser,
    browserVersion,
    os,
    osVersion,
    engine
  };
}

// Bot detection
export function isBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /facebook/i, /whatsapp/i, /telegram/i, /twitter/i,
    /linkedinbot/i, /slackbot/i, /discord/i,
    /googlebot/i, /bingbot/i, /yandex/i, /baidu/i,
    /duckduckbot/i, /semrush/i, /ahrefsbot/i,
    /facebookexternalhit/i, /pinterestbot/i,
    /applebot/i, /amazonbot/i, /curl/i, /wget/i,
    /postman/i, /insomnia/i, /python/i, /java/i,
    /ruby/i, /php/i, /node/i
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
}

// Common user agent strings for testing
export const TEST_USER_AGENTS = {
  // Desktop browsers
  chrome_windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  firefox_windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  edge_windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  safari_mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  chrome_mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  firefox_linux: 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
  chrome_linux: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  opera_windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0',

  // Mobile browsers
  chrome_android: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  firefox_android: 'Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0',
  safari_iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  chrome_iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1',
  samsung_browser: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',

  // Tablet browsers
  safari_ipad: 'Mozilla/5.0 (iPad; CPU OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  chrome_ipad: 'Mozilla/5.0 (iPad; CPU OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1',
  chrome_android_tablet: 'Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  // Bots
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  facebookbot: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  twitterbot: 'Twitterbot/1.0',
  slackbot: 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  linkedinbot: 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',

  // Legacy browsers
  ie11: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
  ie10: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)',
};