import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function revertToFreePlan() {
  try {
    // Find the AlphaWave workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        slug: 'alpha-wave'
      }
    });

    if (!workspace) {
      console.log('AlphaWave workspace not found');
      return;
    }

    console.log(`Current workspace: ${workspace.name} (${workspace.slug})`);
    console.log(`Current plan: ${workspace.plan}`);

    // Revert to Free plan
    const updated = await prisma.workspaces.update({
      where: { id: workspace.id },
      data: { plan: 'free' }
    });

    console.log(`✅ Workspace reverted back to Free plan`);

    return updated;
  } catch (error) {
    console.error('Error reverting workspace plan:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the revert
revertToFreePlan();