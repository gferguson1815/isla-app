/**
 * Application configuration
 * Centralized configuration management for environment variables
 */

export const appConfig = {
  url: {
    // Use the environment variable or fallback to localhost
    base: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  api: {
    // API response time thresholds
    performanceThreshold: 100, // milliseconds
  },
  links: {
    // Slug generation configuration
    minLength: 6,
    maxLength: 8,
    customSlugMinLength: 3,
    customSlugMaxLength: 30,
    maxGenerationAttempts: 5,
  },
  pagination: {
    defaultLimit: 50,
    maxLimit: 100,
  },
} as const;

// Helper function to get short URL
export function getShortUrl(slug: string): string {
  return `${appConfig.url.base}/${slug}`;
}