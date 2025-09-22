import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateWorkspaceLogo() {
  try {
    // Find the alpha-wave workspace
    const workspace = await prisma.workspaces.findFirst({
      where: { slug: 'alpha-wave' }
    });

    if (!workspace) {
      console.log('Workspace alpha-wave not found');
      return;
    }

    console.log('Current workspace:', {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      logo_url: workspace.logo_url
    });

    // The Supabase storage URL for the workspace logo
    // The logo was uploaded with a different workspace ID originally
    const logoUrl = `https://bnhhnhrorrjpavwwxglu.supabase.co/storage/v1/object/public/workspace-logos/9d8c0a5c-54b4-4394-b6fa-1f7f30d3dded/logo.jpg`;

    // Update the workspace with the logo URL
    const updated = await prisma.workspaces.update({
      where: { id: workspace.id },
      data: {
        logo_url: logoUrl,
        updated_at: new Date()
      }
    });

    console.log('\nWorkspace updated successfully!');
    console.log('New logo_url:', updated.logo_url);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateWorkspaceLogo();