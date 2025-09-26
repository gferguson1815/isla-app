/**
 * Utility functions for fetching and handling favicons
 */

/**
 * Get the favicon URL for a given website URL
 */
export async function getFaviconUrl(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Try multiple favicon services in order of preference
    const faviconServices = [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      `https://favicon.ico/${domain}`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    ];

    // Return the Google favicon service URL (most reliable)
    return faviconServices[0];
  } catch (error) {
    console.error('Error getting favicon URL:', error);
    return null;
  }
}

/**
 * Extract domain from URL for favicon fetching
 */
export function getDomainFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}