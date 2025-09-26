import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function temporarilyUpgradeToPro() {
  try {
    // Find the first workspace (you can modify this to target a specific one)
    const workspace = await prisma.workspaces.findFirst({
      where: {
        // You can add more specific conditions here
        // For example: slug: 'your-workspace-slug'
      }
    });

    if (!workspace) {
      console.log('No workspace found');
      return;
    }

    console.log(`Current workspace: ${workspace.name} (${workspace.slug})`);
    console.log(`Current plan: ${workspace.plan}`);

    // Update to Pro plan
    const updated = await prisma.workspaces.update({
      where: { id: workspace.id },
      data: { plan: 'pro' }
    });

    console.log(`✅ Workspace upgraded to Pro plan temporarily`);
    console.log(`Remember to change it back to '${workspace.plan}' after testing!`);

    return updated;
  } catch (error) {
    console.error('Error updating workspace plan:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the upgrade
temporarilyUpgradeToPro();