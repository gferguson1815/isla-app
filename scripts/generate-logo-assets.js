const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const LOGO_SIZES = {
  // Favicon sizes
  favicon: [16, 32, 48, 64, 96, 128, 256],
  // Apple touch icons
  apple: [57, 60, 72, 76, 114, 120, 144, 152, 167, 180, 1024],
  // Android icons
  android: [36, 48, 72, 96, 144, 192, 512],
  // PWA manifest icons
  pwa: [72, 96, 128, 144, 152, 192, 384, 512],
  // Social media / OG image
  social: [1200, 630], // 1200x630 for OG, 1200x1200 for square
  // General web use
  web: [32, 64, 128, 256, 512, 1024, 2048]
};

const SOURCE_DIR = path.join(__dirname, '../public/images/logos');
const OUTPUT_DIR = path.join(__dirname, '../public/images/logos');

async function ensureDirectory(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    console.error(`Error creating directory ${dir}:`, err);
  }
}

async function generatePNGs() {
  // Ensure output directories exist
  await ensureDirectory(path.join(OUTPUT_DIR, 'favicon'));
  await ensureDirectory(path.join(OUTPUT_DIR, 'apple'));
  await ensureDirectory(path.join(OUTPUT_DIR, 'android'));
  await ensureDirectory(path.join(OUTPUT_DIR, 'pwa'));
  await ensureDirectory(path.join(OUTPUT_DIR, 'web'));

  // Generate favicon sizes (using icon black)
  console.log('Generating favicon sizes...');
  for (const size of LOGO_SIZES.favicon) {
    await sharp(path.join(SOURCE_DIR, 'isla-icon-black.svg'))
      .resize(size, size)
      .png()
      .toFile(path.join(OUTPUT_DIR, 'favicon', `favicon-${size}x${size}.png`));
    console.log(`  ✓ favicon-${size}x${size}.png`);
  }

  // Generate Apple touch icons (using icon black)
  console.log('Generating Apple touch icons...');
  for (const size of LOGO_SIZES.apple) {
    await sharp(path.join(SOURCE_DIR, 'isla-icon-black.svg'))
      .resize(size, size)
      .png()
      .toFile(path.join(OUTPUT_DIR, 'apple', `apple-touch-icon-${size}x${size}.png`));
    console.log(`  ✓ apple-touch-icon-${size}x${size}.png`);
  }

  // Generate Android icons (using icon black)
  console.log('Generating Android icons...');
  for (const size of LOGO_SIZES.android) {
    await sharp(path.join(SOURCE_DIR, 'isla-icon-black.svg'))
      .resize(size, size)
      .png()
      .toFile(path.join(OUTPUT_DIR, 'android', `android-chrome-${size}x${size}.png`));
    console.log(`  ✓ android-chrome-${size}x${size}.png`);
  }

  // Generate PWA manifest icons (using icon black)
  console.log('Generating PWA manifest icons...');
  for (const size of LOGO_SIZES.pwa) {
    await sharp(path.join(SOURCE_DIR, 'isla-icon-black.svg'))
      .resize(size, size)
      .png()
      .toFile(path.join(OUTPUT_DIR, 'pwa', `icon-${size}x${size}.png`));
    console.log(`  ✓ icon-${size}x${size}.png`);
  }

  // Generate web use sizes for all variants
  console.log('Generating web assets...');
  const variants = [
    'isla-icon-black',
    'isla-icon-white',
    'isla-wordmark-black',
    'isla-wordmark-white'
  ];

  for (const variant of variants) {
    for (const size of LOGO_SIZES.web) {
      await sharp(path.join(SOURCE_DIR, `${variant}.svg`))
        .resize(size, size)
        .png()
        .toFile(path.join(OUTPUT_DIR, 'web', `${variant}-${size}x${size}.png`));
      console.log(`  ✓ ${variant}-${size}x${size}.png`);
    }
  }

  console.log('All PNG assets generated successfully!');
}

// Generate ICO file for Windows favicon
async function generateICO() {
  console.log('Generating favicon.ico...');

  // Create multiple sizes for ICO file
  const icoSizes = [16, 32, 48];
  const buffers = [];

  for (const size of icoSizes) {
    const buffer = await sharp(path.join(SOURCE_DIR, 'isla-icon-black.svg'))
      .resize(size, size)
      .png()
      .toBuffer();
    buffers.push(buffer);
  }

  // For now, we'll use the 32x32 as favicon.ico
  // (A proper ICO file would need a specialized library)
  await sharp(path.join(SOURCE_DIR, 'isla-icon-black.svg'))
    .resize(32, 32)
    .png()
    .toFile(path.join(OUTPUT_DIR, 'favicon.ico'));

  console.log('  ✓ favicon.ico');
}

// Main execution
async function main() {
  try {
    console.log('Starting logo asset generation...\n');
    await generatePNGs();
    await generateICO();
    console.log('\n✨ All logo assets generated successfully!');
  } catch (error) {
    console.error('Error generating logo assets:', error);
    process.exit(1);
  }
}

main();