import { PrismaClient } from '@prisma/client';
import { generateLinkAvatar } from '../lib/utils/avatar';

const prisma = new PrismaClient();

async function restoreAvatarsForLinks() {
  try {
    console.log('Starting avatar restoration for all links...');

    // Get all links
    const links = await prisma.links.findMany({
      select: {
        id: true,
        favicon: true
      }
    });

    console.log(`Found ${links.length} links to update`);

    let updated = 0;

    for (const link of links) {
      // Generate avatar based on link ID
      const avatarUrl = generateLinkAvatar(link.id);

      // Only update if the current favicon is different from the avatar
      if (link.favicon !== avatarUrl) {
        await prisma.links.update({
          where: { id: link.id },
          data: { favicon: avatarUrl }
        });
        updated++;
        console.log(`✓ Updated link ${link.id} with avatar`);
      }
    }

    console.log(`\nUpdate complete:`);
    console.log(`- Successfully updated: ${updated}`);
    console.log(`- Already had avatars: ${links.length - updated}`);

  } catch (error) {
    console.error('Error restoring avatars:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the restoration
restoreAvatarsForLinks();