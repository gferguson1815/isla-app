#!/usr/bin/env npx tsx
/**
 * Script to update existing links with generated avatars
 * Run with: npx tsx scripts/update-link-avatars.ts
 */

import { PrismaClient } from '@prisma/client';
import { generateLinkAvatar } from '../lib/utils/avatar';

const prisma = new PrismaClient();

async function updateLinkAvatars() {
  try {
    console.log('🔄 Starting to update link avatars...');

    // Get all links that don't have a favicon
    const linksWithoutAvatar = await prisma.links.findMany({
      where: {
        favicon: null,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    console.log(`📊 Found ${linksWithoutAvatar.length} links without avatars`);

    if (linksWithoutAvatar.length === 0) {
      console.log('✅ All links already have avatars!');
      return;
    }

    // Update each link with a generated avatar
    let updatedCount = 0;
    for (const link of linksWithoutAvatar) {
      const avatarUrl = generateLinkAvatar(link.id);

      await prisma.links.update({
        where: { id: link.id },
        data: { favicon: avatarUrl },
      });

      updatedCount++;

      // Log progress every 10 links
      if (updatedCount % 10 === 0) {
        console.log(`  Updated ${updatedCount}/${linksWithoutAvatar.length} links...`);
      }
    }

    console.log(`✅ Successfully updated ${updatedCount} links with avatars!`);
  } catch (error) {
    console.error('❌ Error updating link avatars:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateLinkAvatars();