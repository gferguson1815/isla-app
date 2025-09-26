/**
 * Generate a unique avatar URL for a link based on its ID or slug
 * Using DiceBear avatars API for deterministic, unique avatars
 */

// Avatar styles that look good for links
const AVATAR_STYLES = [
  'shapes',
  'rings',
  'beam',
  'bauhaus',
  'marble',
] as const;

// Color palettes for avatars
const COLOR_PALETTES = [
  ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
  ['#F7DC6F', '#76D7C4', '#85C1E2', '#F8C471', '#E8DAEF'],
  ['#FF6F61', '#6B5B95', '#88D8B0', '#FFCC5C', '#FF6F61'],
  ['#A8E6CF', '#DCEDC1', '#FFD3B6', '#FFAAA5', '#FF8B94'],
  ['#C9B1FF', '#FFB1E6', '#B1FFEA', '#B1D4FF', '#FFE4B1'],
];

/**
 * Generate a unique avatar URL for a link
 * @param seed - Unique identifier (link ID or slug)
 * @returns URL for the avatar image
 */
export function generateLinkAvatar(seed: string): string {
  // Use a hash to deterministically select style and colors
  const hash = simpleHash(seed);

  // Select avatar style based on hash
  const styleIndex = Math.abs(hash) % AVATAR_STYLES.length;
  const style = AVATAR_STYLES[styleIndex];

  // Select color palette
  const paletteIndex = Math.abs(hash >> 8) % COLOR_PALETTES.length;
  const palette = COLOR_PALETTES[paletteIndex];

  // Generate background color from palette
  const bgColorIndex = Math.abs(hash >> 16) % palette.length;
  const backgroundColor = palette[bgColorIndex].replace('#', '');

  // Build the avatar URL using DiceBear API
  const params = new URLSearchParams({
    seed,
    backgroundColor,
    size: '128',
  });

  return `https://api.dicebear.com/7.x/${style}/svg?${params.toString()}`;
}

/**
 * Simple hash function for deterministic randomization
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Get avatar style from existing URL (for consistency)
 */
export function getAvatarStyle(avatarUrl: string): string | null {
  const match = avatarUrl.match(/dicebear\.com\/7\.x\/(\w+)\//);
  return match ? match[1] : null;
}