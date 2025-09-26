import { PrismaClient } from '@prisma/client';
import { getFaviconUrl } from '../lib/utils/favicon';

const prisma = new PrismaClient();

async function updateFaviconsForLinks() {
  try {
    console.log('Starting favicon update for all links...');

    // Get all links that don't have a favicon or have an avatar URL
    const links = await prisma.links.findMany({
      where: {
        OR: [
          { favicon: null },
          { favicon: { startsWith: 'https://api.dicebear.com' } }
        ]
      },
      select: {
        id: true,
        url: true,
        favicon: true
      }
    });

    console.log(`Found ${links.length} links to update`);

    let updated = 0;
    let failed = 0;

    for (const link of links) {
      try {
        const faviconUrl = await getFaviconUrl(link.url);

        if (faviconUrl) {
          await prisma.links.update({
            where: { id: link.id },
            data: { favicon: faviconUrl }
          });
          updated++;
          console.log(`✓ Updated link ${link.id} with favicon`);
        } else {
          console.log(`⚠ No favicon found for ${link.url}`);
        }
      } catch (error) {
        console.error(`✗ Failed to update link ${link.id}:`, error);
        failed++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\nUpdate complete:`);
    console.log(`- Successfully updated: ${updated}`);
    console.log(`- Failed: ${failed}`);
    console.log(`- Skipped: ${links.length - updated - failed}`);

  } catch (error) {
    console.error('Error updating favicons:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateFaviconsForLinks();