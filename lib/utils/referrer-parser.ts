export type ReferrerType = 'search' | 'social' | 'direct' | 'external';

interface ParsedReferrer {
  type: ReferrerType;
  source: string | null;
  searchKeywords?: string | null;
  utmParams?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
  };
}

// Search engine patterns and their query parameter names
const SEARCH_ENGINES: Record<string, string[]> = {
  google: ['google.com', 'google.co', 'google.ca', 'google.fr', 'google.de', 'google.es', 'google.it', 'google.nl', 'google.pl', 'google.ru', 'google.com.au', 'google.com.br', 'google.co.uk', 'google.co.jp', 'google.co.kr', 'google.co.in'],
  bing: ['bing.com'],
  yahoo: ['yahoo.com', 'yahoo.co', 'search.yahoo.com'],
  duckduckgo: ['duckduckgo.com'],
  baidu: ['baidu.com'],
  yandex: ['yandex.ru', 'yandex.com'],
  ecosia: ['ecosia.org'],
  qwant: ['qwant.com'],
  startpage: ['startpage.com'],
  brave: ['search.brave.com'],
  searx: ['searx.me', 'searx.org'],
  swisscows: ['swisscows.com', 'swisscows.ch'],
};

// Search query parameters used by different search engines
const SEARCH_QUERY_PARAMS: Record<string, string[]> = {
  google: ['q', 'query'],
  bing: ['q'],
  yahoo: ['p', 'q'],
  duckduckgo: ['q'],
  baidu: ['wd', 'word'],
  yandex: ['text', 'query'],
  ecosia: ['q'],
  qwant: ['q'],
  startpage: ['q', 'query'],
  brave: ['q'],
  searx: ['q'],
  swisscows: ['query'],
};

// Social media domains
const SOCIAL_DOMAINS = [
  'facebook.com', 'fb.com', 'm.facebook.com', 'l.facebook.com',
  'twitter.com', 't.co', 'x.com',
  'instagram.com', 'l.instagram.com',
  'linkedin.com', 'lnkd.in',
  'youtube.com', 'youtu.be', 'm.youtube.com',
  'pinterest.com', 'pin.it',
  'reddit.com', 'redd.it', 'old.reddit.com',
  'tiktok.com', 'vm.tiktok.com',
  'snapchat.com',
  'whatsapp.com', 'wa.me', 'chat.whatsapp.com',
  'telegram.org', 't.me',
  'discord.com', 'discord.gg',
  'tumblr.com', 't.umblr.com',
  'medium.com',
  'quora.com',
  'vk.com', 'vk.ru',
  'weibo.com',
  'wechat.com',
  'mastodon.social', 'mastodon.online',
  'threads.net',
  'bsky.app', 'bsky.social',
];

export function parseReferrer(referrer: string | null | undefined, targetUrl?: string): ParsedReferrer {
  // Direct traffic (no referrer)
  if (!referrer || referrer === '') {
    return { type: 'direct', source: null };
  }

  try {
    const referrerUrl = new URL(referrer);
    const hostname = referrerUrl.hostname.toLowerCase().replace(/^www\./, '');

    // Parse UTM parameters if target URL is provided
    let utmParams: ParsedReferrer['utmParams'];
    if (targetUrl) {
      try {
        const target = new URL(targetUrl);
        const params = target.searchParams;

        const utmSource = params.get('utm_source');
        const utmMedium = params.get('utm_medium');
        const utmCampaign = params.get('utm_campaign');
        const utmTerm = params.get('utm_term');
        const utmContent = params.get('utm_content');

        if (utmSource || utmMedium || utmCampaign || utmTerm || utmContent) {
          utmParams = {
            source: utmSource,
            medium: utmMedium,
            campaign: utmCampaign,
            term: utmTerm,
            content: utmContent,
          };
        }
      } catch {
        // Invalid target URL, ignore UTM parsing
      }
    }

    // Check if it's a search engine
    for (const [engine, domains] of Object.entries(SEARCH_ENGINES)) {
      if (domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
        // Extract search keywords
        let searchKeywords: string | null = null;
        const queryParams = SEARCH_QUERY_PARAMS[engine] || ['q'];

        for (const param of queryParams) {
          const value = referrerUrl.searchParams.get(param);
          if (value) {
            searchKeywords = decodeURIComponent(value);
            break;
          }
        }

        return {
          type: 'search',
          source: engine,
          searchKeywords,
          utmParams,
        };
      }
    }

    // Check if it's social media
    if (SOCIAL_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
      // Identify specific social platform
      let source = hostname;

      if (hostname.includes('facebook.com') || hostname === 'fb.com') {
        source = 'facebook';
      } else if (hostname === 'twitter.com' || hostname === 't.co' || hostname === 'x.com') {
        source = 'twitter';
      } else if (hostname.includes('instagram.com')) {
        source = 'instagram';
      } else if (hostname.includes('linkedin.com') || hostname === 'lnkd.in') {
        source = 'linkedin';
      } else if (hostname.includes('youtube.com') || hostname === 'youtu.be') {
        source = 'youtube';
      } else if (hostname.includes('pinterest.com') || hostname === 'pin.it') {
        source = 'pinterest';
      } else if (hostname.includes('reddit.com') || hostname === 'redd.it') {
        source = 'reddit';
      } else if (hostname.includes('tiktok.com')) {
        source = 'tiktok';
      } else if (hostname === 'wa.me' || hostname.includes('whatsapp.com')) {
        source = 'whatsapp';
      } else if (hostname === 't.me' || hostname === 'telegram.org') {
        source = 'telegram';
      } else if (hostname.includes('discord')) {
        source = 'discord';
      } else if (hostname.includes('tumblr.com')) {
        source = 'tumblr';
      } else if (hostname === 'medium.com') {
        source = 'medium';
      } else if (hostname === 'quora.com') {
        source = 'quora';
      } else if (hostname === 'vk.com' || hostname === 'vk.ru') {
        source = 'vkontakte';
      } else if (hostname === 'weibo.com') {
        source = 'weibo';
      } else if (hostname === 'wechat.com') {
        source = 'wechat';
      } else if (hostname.includes('mastodon')) {
        source = 'mastodon';
      } else if (hostname === 'threads.net') {
        source = 'threads';
      } else if (hostname.includes('bsky')) {
        source = 'bluesky';
      }

      return {
        type: 'social',
        source,
        utmParams,
      };
    }

    // External (other websites)
    return {
      type: 'external',
      source: hostname,
      utmParams,
    };

  } catch (error) {
    // Invalid URL, treat as direct
    return { type: 'direct', source: null };
  }
}

// Extract domain from referrer for aggregation
export function extractReferrerDomain(referrer: string | null): string | null {
  if (!referrer) return null;

  try {
    const url = new URL(referrer);
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

// Categorize referrer for reporting
export function categorizeReferrer(parsedReferrer: ParsedReferrer): {
  category: string;
  subcategory?: string;
} {
  switch (parsedReferrer.type) {
    case 'search':
      return {
        category: 'Search Engines',
        subcategory: parsedReferrer.source || 'Other Search',
      };
    case 'social':
      return {
        category: 'Social Media',
        subcategory: parsedReferrer.source || 'Other Social',
      };
    case 'direct':
      return { category: 'Direct Traffic' };
    case 'external':
      return {
        category: 'Referral Sites',
        subcategory: parsedReferrer.source || 'Unknown',
      };
    default:
      return { category: 'Unknown' };
  }
}

// Check if referrer is from the same domain (internal navigation)
export function isInternalReferrer(referrer: string | null, targetDomain: string): boolean {
  if (!referrer) return false;

  try {
    const referrerUrl = new URL(referrer);
    const referrerDomain = referrerUrl.hostname.toLowerCase().replace(/^www\./, '');
    const cleanTargetDomain = targetDomain.toLowerCase().replace(/^www\./, '');

    return referrerDomain === cleanTargetDomain;
  } catch {
    return false;
  }
}