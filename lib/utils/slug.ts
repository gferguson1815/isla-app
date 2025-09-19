/**
 * Generates a random alphanumeric slug
 * @param length - Length of the slug (default: random between 6-8)
 * @returns Random alphanumeric string
 */
export function generateRandomSlug(length?: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const slugLength = length || Math.floor(Math.random() * 3) + 6; // 6-8 characters by default

  let slug = '';
  for (let i = 0; i < slugLength; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return slug;
}

/**
 * Validates a slug against allowed characters and length
 * @param slug - The slug to validate
 * @returns True if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length < 3 || slug.length > 30) {
    return false;
  }

  // Only alphanumeric and hyphens allowed
  const validPattern = /^[a-zA-Z0-9-]+$/;
  return validPattern.test(slug);
}

/**
 * Generates a unique slug with retry logic
 * @param checkUniqueness - Function to check if slug is unique
 * @param maxAttempts - Maximum number of attempts (default: 5)
 * @returns Unique slug or throws error after max attempts
 */
export async function generateUniqueSlug(
  checkUniqueness: (slug: string) => Promise<boolean>,
  maxAttempts: number = 5
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const slug = generateRandomSlug();
    const isUnique = await checkUniqueness(slug);

    if (isUnique) {
      return slug;
    }
  }

  throw new Error('Failed to generate unique slug after maximum attempts');
}

/**
 * Sanitizes a custom slug to ensure it's valid
 * @param input - User input for custom slug
 * @returns Sanitized slug or null if invalid
 */
export function sanitizeSlug(input: string): string | null {
  if (!input) return null;

  // Convert to lowercase and replace spaces with hyphens
  const slug = input.toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '') // Remove invalid characters
    .replace(/--+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  // Check final validity
  if (!isValidSlug(slug)) {
    return null;
  }

  return slug;
}

/**
 * Checks if a URL needs a slug (not already a short link)
 * @param url - URL to check
 * @param shortDomain - Short domain to check against
 * @returns True if URL needs shortening
 */
export function needsSlug(url: string, shortDomain: string): boolean {
  try {
    const urlObj = new URL(url);
    return !urlObj.hostname.includes(shortDomain);
  } catch {
    return true;
  }
}