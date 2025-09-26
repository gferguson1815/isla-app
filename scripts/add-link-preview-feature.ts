#!/usr/bin/env npx tsx
/**
 * Script to add the link_preview_customization feature to the database
 * Run with: npx tsx scripts/add-link-preview-feature.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addLinkPreviewFeature() {
  try {
    console.log('🔄 Adding link_preview_customization feature...');

    // First, create the feature if it doesn't exist
    const feature = await prisma.features.upsert({
      where: { key: 'link_preview_customization' },
      update: {},
      create: {
        key: 'link_preview_customization',
        name: 'Link Preview Customization',
        description: 'Customize link preview images and text',
        category: 'branding'
      }
    });

    console.log('✅ Feature created/found:', feature.id);

    // Configure for Free plan (disabled)
    await prisma.plan_features.upsert({
      where: {
        plan_feature_id: {
          plan: 'free',
          feature_id: feature.id
        }
      },
      update: {
        enabled: false,
        limit_value: 0,
        custom_message: 'Custom link previews require a Pro plan'
      },
      create: {
        plan: 'free',
        feature_id: feature.id,
        enabled: false,
        limit_value: 0,
        custom_message: 'Custom link previews require a Pro plan'
      }
    });

    console.log('✅ Configured for Free plan (disabled)');

    // Configure for Pro plan (enabled)
    await prisma.plan_features.upsert({
      where: {
        plan_feature_id: {
          plan: 'pro',
          feature_id: feature.id
        }
      },
      update: {
        enabled: true,
        limit_value: null,
        custom_message: null
      },
      create: {
        plan: 'pro',
        feature_id: feature.id,
        enabled: true,
        limit_value: null,
        custom_message: null
      }
    });

    console.log('✅ Configured for Pro plan (enabled)');

    // Configure for Enterprise plan (enabled)
    await prisma.plan_features.upsert({
      where: {
        plan_feature_id: {
          plan: 'enterprise',
          feature_id: feature.id
        }
      },
      update: {
        enabled: true,
        limit_value: null,
        custom_message: null
      },
      create: {
        plan: 'enterprise',
        feature_id: feature.id,
        enabled: true,
        limit_value: null,
        custom_message: null
      }
    });

    console.log('✅ Configured for Enterprise plan (enabled)');

    // Verify the configuration
    const planFeatures = await prisma.plan_features.findMany({
      where: { feature_id: feature.id },
      select: {
        plan: true,
        enabled: true,
        custom_message: true
      }
    });

    console.log('\n📊 Feature configuration:');
    planFeatures.forEach(pf => {
      console.log(`  ${pf.plan}: ${pf.enabled ? 'Enabled' : 'Disabled'}${pf.custom_message ? ` - ${pf.custom_message}` : ''}`);
    });

    console.log('\n✅ Successfully added link_preview_customization feature!');
  } catch (error) {
    console.error('❌ Error adding feature:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addLinkPreviewFeature();