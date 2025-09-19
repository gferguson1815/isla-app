import { describe, it, expect } from 'vitest';
import { parseUserAgentEnhanced, isBot, TEST_USER_AGENTS } from '../user-agent-parser';

describe('parseUserAgentEnhanced', () => {
  describe('Desktop browsers', () => {
    it('should parse Chrome on Windows correctly', () => {
      const result = parseUserAgentEnhanced(TEST_USER_AGENTS.chrome_windows);
      expect(result).toEqual({
        device: 'desktop',
        browser: 'Chrome',
        browserVersion: '120.0',
        os: 'Windows',
        osVersion: '10',
        engine: 'WebKit'
      });
    });

    it('should parse Firefox on Windows correctly', () => {
      const result = parseUserAgentEnhanced(TEST_USER_AGENTS.firefox_windows);
      expect(result).toEqual({
        device: 'desktop',
        browser: 'Firefox',
        browserVersion: '121.0',
        os: 'Windows',
        osVersion: '10',
        engine: 'Gecko'
      });
    });

    it('should parse Edge on Windows correctly', () => {
      const result = parseUserAgentEnhanced(TEST_USER_AGENTS.edge_windows);
      expect(result).toEqual({
        device: 'desktop',
        browser: 'Edge',
        browserVersion: '120.0',
        os: 'Windows',
        osVersion: '10',
        engine: 'WebKit'
      });
    });

    it('should parse Safari on macOS correctly', () => {
      const result = parseUserAgentEnhanced(TEST_USER_AGENTS.safari_mac);
      expect(result.device).toBe('desktop');
      expect(result.browser).toBe('Safari');
      expect(result.browserVersion).toBe('17.2');
      expect(result.os).toBe('macOS');
      expect(result.osVersion).toBeTruthy(); // Version format may vary
      expect(result.engine).toBe('WebKit');
    });

    it('should parse Chrome on macOS correctly', () => {
      const result = parseUserAgentEnhanced(TEST_USER_AGENTS.chrome_mac);
      expect(result.device).toBe('desktop');
      expect(result.browser).toBe('Chrome');
      expect(result.browserVersion).toBe('120.0');
      expect(result.os).toBe('macOS');
      expect(result.osVersion).toBeTruthy();
      expect(result.engine).toBe('WebKit');
    });

    it('should parse Firefox on Linux correctly', () => {
      const result = parseUserAgentEnhanced(TEST_USER_AGENTS.firefox_linux);
      expect(result).toEqual({
        device: 'desktop',
        browser: 'Firefox',
        browserVersion: '121.0',
        os: 'Linux',
        osVersion: null,
        engine: 'Gecko'
      });
    });

    it('should parse Opera on Windows correctly', () => {
      const result = parseUserAgentEnhanced(TEST_USER_AGENTS.opera_windows);
      expect(result).toEqual({
        device: 'desktop',
        browser: 'Opera',
        browserVersion: '106.0',
        os: 'Windows',
        osVersion: '10',
        engine: 'WebKit'
      });
    });
  });

  describe('Mobile browsers', () => {
    it('should parse Chrome on Android correctly', () => {
      const result = parseUserAgentEnhanced(TEST_USER_AGENTS.chrome_android);
      expect(result).toEqual({
        device: 'mobile',
        browser: 'Chrome',
        browserVersion: '120.0',
        os: 'Android',
        osVersion: '14',
        engine: 'WebKit'
      });
    });

    it('should parse Safari on iPhone correctly', () => {
      const result = parseUserAgentEnhanced(TEST_USER_AGENTS.safari_iphone);
      expect(result.device).toBe('mobile');
      expect(result.browser).toBe('Safari');
      expect(result.browserVersion).toBe('17.2');
      expect(result.os).toBe('iOS');
      expect(result.osVersion).toBeTruthy();
      expect(result.engine).toBe('WebKit');
    });

    it('should parse Chrome on iPhone correctly', () => {
      const result = parseUserAgentEnhanced(TEST_USER_AGENTS.chrome_iphone);
      expect(result.device).toBe('mobile');
      expect(result.browser).toBe('Chrome');
      expect(result.browserVersion).toBe('120.0');
      expect(result.os).toBe('iOS');
      expect(result.osVersion).toBeTruthy();
      expect(result.engine).toBe('WebKit');
    });
  });

  describe('Tablet browsers', () => {
    it('should parse Safari on iPad correctly', () => {
      const result = parseUserAgentEnhanced(TEST_USER_AGENTS.safari_ipad);
      expect(result.device).toBe('tablet');
      expect(result.browser).toBe('Safari');
      expect(result.browserVersion).toBe('17.2');
      expect(result.os).toBe('iOS');
      expect(result.osVersion).toBeTruthy();
      expect(result.engine).toBe('WebKit');
    });

    it('should parse Chrome on Android tablet correctly', () => {
      const result = parseUserAgentEnhanced(TEST_USER_AGENTS.chrome_android_tablet);
      expect(result).toEqual({
        device: 'tablet',
        browser: 'Chrome',
        browserVersion: '120.0',
        os: 'Android',
        osVersion: '14',
        engine: 'WebKit'
      });
    });
  });

  describe('Legacy browsers', () => {
    it('should parse Internet Explorer 11 correctly', () => {
      const result = parseUserAgentEnhanced(TEST_USER_AGENTS.ie11);
      expect(result.device).toBe('desktop');
      expect(result.browser).toBe('Internet Explorer');
      expect(result.browserVersion).toBe('11.0');
      expect(result.os).toBe('Windows');
      expect(result.osVersion).toBeTruthy();
      expect(result.engine).toBe('Trident');
    });

    it('should parse Internet Explorer 10 correctly', () => {
      const result = parseUserAgentEnhanced(TEST_USER_AGENTS.ie10);
      expect(result).toEqual({
        device: 'desktop',
        browser: 'Internet Explorer',
        browserVersion: '10.0',
        os: 'Windows',
        osVersion: '7',
        engine: 'Trident'
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty user agent', () => {
      const result = parseUserAgentEnhanced('');
      expect(result).toEqual({
        device: 'desktop',
        browser: 'Unknown',
        browserVersion: null,
        os: 'Unknown',
        osVersion: null,
        engine: null
      });
    });

    it('should handle malformed user agent', () => {
      const result = parseUserAgentEnhanced('Random string 123');
      expect(result).toEqual({
        device: 'desktop',
        browser: 'Unknown',
        browserVersion: null,
        os: 'Unknown',
        osVersion: null,
        engine: null
      });
    });
  });
});

describe('isBot', () => {
  it('should detect Googlebot', () => {
    expect(isBot(TEST_USER_AGENTS.googlebot)).toBe(true);
  });

  it('should detect Bingbot', () => {
    expect(isBot(TEST_USER_AGENTS.bingbot)).toBe(true);
  });

  it('should detect Facebook bot', () => {
    expect(isBot(TEST_USER_AGENTS.facebookbot)).toBe(true);
  });

  it('should detect Twitter bot', () => {
    expect(isBot(TEST_USER_AGENTS.twitterbot)).toBe(true);
  });

  it('should detect Slack bot', () => {
    expect(isBot(TEST_USER_AGENTS.slackbot)).toBe(true);
  });

  it('should detect LinkedIn bot', () => {
    expect(isBot(TEST_USER_AGENTS.linkedinbot)).toBe(true);
  });

  it('should not detect regular browsers as bots', () => {
    expect(isBot(TEST_USER_AGENTS.chrome_windows)).toBe(false);
    expect(isBot(TEST_USER_AGENTS.safari_mac)).toBe(false);
    expect(isBot(TEST_USER_AGENTS.firefox_windows)).toBe(false);
  });

  it('should detect curl', () => {
    expect(isBot('curl/7.68.0')).toBe(true);
  });

  it('should detect wget', () => {
    expect(isBot('Wget/1.20.3 (linux-gnu)')).toBe(true);
  });

  it('should detect Postman', () => {
    expect(isBot('PostmanRuntime/7.26.8')).toBe(true);
  });

  it('should detect Python requests', () => {
    expect(isBot('python-requests/2.25.1')).toBe(true);
  });
});