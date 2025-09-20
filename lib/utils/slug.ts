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

/**
 * Generates a workspace slug from name
 * @param name - Workspace name
 * @returns Formatted slug
 */
export function generateSlugFromName(name: string): string {
  return name
    // First, add hyphens before capital letters (for camelCase/PascalCase)
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    // Handle consecutive capitals (e.g., "ABCCorp" -> "ABC-Corp")
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    // Convert to lowercase
    .toLowerCase()
    // Remove special characters except spaces and hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '')
    // Limit to 30 characters
    .slice(0, 30);
}

/**
 * Reserved slugs that cannot be used for workspaces
 */
export const RESERVED_SLUGS = [
  'admin',
  'api',
  'app',
  'www',
  'support',
  'help',
  'docs',
  'blog',
  'status',
];

/**
 * Checks if a slug is reserved
 * @param slug - Slug to check
 * @returns True if reserved
 */
export function isSlugReserved(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}

/**
 * Validates workspace slug
 * @param slug - Slug to validate
 * @returns Validation result with error message
 */
export function validateWorkspaceSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug) {
    return { valid: false, error: 'Slug is required' };
  }

  if (slug.length < 3) {
    return { valid: false, error: 'Slug must be at least 3 characters' };
  }

  if (slug.length > 30) {
    return { valid: false, error: 'Slug must be 30 characters or less' };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
  }

  if (isSlugReserved(slug)) {
    return { valid: false, error: 'This slug is reserved' };
  }

  return { valid: true };
}