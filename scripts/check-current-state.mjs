import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCurrentState() {
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { slug: 'alpha-wave' }
    });

    console.log('Current workspace data:', {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      logo_url: workspace.logo_url
    });

    // Test if the URL is accessible
    if (workspace.logo_url) {
      const response = await fetch(workspace.logo_url, { method: 'HEAD' });
      console.log('\nURL accessibility check:');
      console.log('Status:', response.status);
      console.log('OK:', response.ok);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentState();