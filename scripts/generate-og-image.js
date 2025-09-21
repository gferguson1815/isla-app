const sharp = require('sharp');
const path = require('path');

async function generateOGImage() {
  const width = 1200;
  const height = 630;

  // Create OG image with gradient background and logo
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Gradient background -->
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>

      <!-- White overlay for better text contrast -->
      <rect width="${width}" height="${height}" fill="white" opacity="0.1"/>

      <!-- Logo container -->
      <rect x="${width/2 - 100}" y="${height/2 - 140}" width="200" height="200" rx="40" fill="black"/>

      <!-- Logo text -->
      <text x="${width/2}" y="${height/2 - 30}"
            text-anchor="middle"
            fill="white"
            font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            font-size="120"
            font-weight="900"
            letter-spacing="-0.04em">isla</text>

      <!-- Tagline -->
      <text x="${width/2}" y="${height/2 + 120}"
            text-anchor="middle"
            fill="white"
            font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            font-size="36"
            font-weight="600"
            opacity="0.95">Short Links Made Powerful</text>
    </svg>
  `;

  // Generate OG image
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(__dirname, '../public/images/logos/og-image.png'));

  console.log('✅ OG image generated: public/images/logos/og-image.png');

  // Also create a Twitter card version (slightly different dimensions)
  const twitterSvg = `
    <svg width="1200" height="600" viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg">
      <!-- Gradient background -->
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="600" fill="url(#bgGradient)"/>

      <!-- White overlay -->
      <rect width="1200" height="600" fill="white" opacity="0.1"/>

      <!-- Logo container -->
      <rect x="500" y="200" width="200" height="200" rx="40" fill="black"/>

      <!-- Logo text -->
      <text x="600" y="310"
            text-anchor="middle"
            fill="white"
            font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            font-size="120"
            font-weight="900"
            letter-spacing="-0.04em">isla</text>
    </svg>
  `;

  await sharp(Buffer.from(twitterSvg))
    .png()
    .toFile(path.join(__dirname, '../public/images/logos/twitter-card.png'));

  console.log('✅ Twitter card generated: public/images/logos/twitter-card.png');
}

generateOGImage().catch(console.error);