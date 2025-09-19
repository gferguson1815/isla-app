import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

/**
 * Generate a secure random token and its hash
 * Returns both the plain token (to send to user) and hash (to store in DB)
 */
export async function generateSecureToken(): Promise<{
  plainToken: string;
  hashedToken: string;
}> {
  // Generate a secure random token
  const plainToken = randomBytes(32).toString('hex');

  // Hash it for storage
  const hashedToken = await bcrypt.hash(plainToken, 10);

  return {
    plainToken,
    hashedToken,
  };
}

/**
 * Verify a plain token against its hash
 */
export async function verifyToken(plainToken: string, hashedToken: string): Promise<boolean> {
  return bcrypt.compare(plainToken, hashedToken);
}

/**
 * Generate a URL-safe token for invitation links
 */
export function generateInvitationToken(): string {
  // Use URL-safe base64 encoding
  return randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}