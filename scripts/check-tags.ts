#!/usr/bin/env npx tsx
/**
 * Script to check tags in the database
 * Run with: npx tsx scripts/check-tags.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTags() {
  try {
    console.log('🔍 Checking tags in database...\n');

    // Get all workspaces
    const workspaces = await prisma.workspaces.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      }
    });

    console.log(`Found ${workspaces.length} workspaces:\n`);

    for (const workspace of workspaces) {
      console.log(`📁 Workspace: ${workspace.name} (${workspace.slug})`);
      console.log(`   ID: ${workspace.id}`);

      // Get tags for this workspace
      const tags = await prisma.tags.findMany({
        where: {
          workspace_id: workspace.id,
        }
      });

      if (tags.length > 0) {
        console.log(`   Tags (${tags.length}):`);
        tags.forEach(tag => {
          console.log(`     - ${tag.name} (${tag.color}) - usage_count: ${tag.usage_count}`);
        });
      } else {
        console.log('   No tags found');
      }

      // Check if there are any links with tags
      const linksWithTags = await prisma.links.findMany({
        where: {
          workspace_id: workspace.id,
          tags: {
            isEmpty: false
          }
        },
        select: {
          id: true,
          slug: true,
          tags: true
        }
      });

      if (linksWithTags.length > 0) {
        console.log(`   Links with tags (${linksWithTags.length}):`);
        linksWithTags.forEach(link => {
          console.log(`     - ${link.slug}: ${JSON.stringify(link.tags)}`);
        });
      }

      console.log('');
    }

    // Check total tags in the database
    const totalTags = await prisma.tags.count();
    console.log(`\n📊 Total tags in database: ${totalTags}`);

  } catch (error) {
    console.error('❌ Error checking tags:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkTags();