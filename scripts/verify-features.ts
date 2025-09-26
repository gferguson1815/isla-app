import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyFeatures() {
  console.log('Checking features in database...\n');

  // Get all features
  const features = await prisma.features.findMany({
    orderBy: { category: 'asc' }
  });

  console.log(`Found ${features.length} features:`);
  features.forEach(f => {
    console.log(`  - ${f.key}: ${f.name}`);
  });

  // Check plan configurations
  console.log('\nChecking plan configurations...\n');

  const plans = ['free', 'pro', 'enterprise'];

  for (const plan of plans) {
    const planFeatures = await prisma.plan_features.findMany({
      where: { plan },
      include: { feature: true },
      orderBy: { feature: { name: 'asc' } }
    });

    console.log(`${plan.toUpperCase()} plan (${planFeatures.length} features):`);

    const enabledFeatures = planFeatures.filter(pf => pf.enabled);
    console.log(`  Enabled: ${enabledFeatures.map(pf => pf.feature.key).join(', ') || 'None'}`);

    const disabledFeatures = planFeatures.filter(pf => !pf.enabled);
    if (disabledFeatures.length > 0) {
      console.log(`  Disabled: ${disabledFeatures.map(pf => pf.feature.key).join(', ')}`);
    }
    console.log();
  }

  await prisma.$disconnect();
}

verifyFeatures().catch((error) => {
  console.error('Error:', error);
  prisma.$disconnect();
  process.exit(1);
});