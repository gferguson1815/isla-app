/**
 * Sanitization utilities for preventing XSS attacks
 */

/**
 * Escapes HTML entities to prevent XSS attacks
 * @param text - Input text to sanitize
 * @returns Sanitized text with HTML entities escaped
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'\/]/g, (char) => map[char] || char);
}

/**
 * Sanitizes CSV cell content to prevent injection attacks
 * @param value - CSV cell value
 * @returns Sanitized value safe for display
 */
export function sanitizeCsvCell(value: string | null | undefined): string {
  if (!value) return '';
  
  // Remove any formula injection attempts (=, +, -, @, tab)
  if (/^[=+\-@\t]/.test(value)) {
    value = "'" + value; // Prefix with single quote to neutralize
  }
  
  // Escape HTML entities
  return escapeHtml(value);
}

/**
 * Sanitizes URL to ensure it's safe
 * @param url - URL to sanitize
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    
    // Only allow http(s) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    // Prevent javascript: and data: URLs
    if (url.toLowerCase().includes('javascript:') || url.toLowerCase().includes('data:')) {
      return null;
    }
    
    return url;
  } catch {
    return null;
  }
}

/**
 * Sanitizes tags array to prevent XSS
 * @param tags - Array of tag strings
 * @returns Sanitized tags array
 */
export function sanitizeTags(tags: string[]): string[] {
  return tags.map(tag => escapeHtml(tag.trim()).substring(0, 50)); // Limit tag length
}

/**
 * Sanitizes file name to prevent path traversal
 * @param fileName - Original file name
 * @returns Sanitized file name
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path separators and null bytes
  return fileName
    .replace(/[\/\\]/g, '_')
    .replace(/\0/g, '')
    .replace(/\.{2,}/g, '.') // Prevent directory traversal
    .substring(0, 255); // Limit length
}