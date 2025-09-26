import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLinks() {
  const links = await prisma.links.findMany({
    select: {
      id: true,
      slug: true,
      favicon: true
    }
  });

  console.log('Current links in database:');
  links.forEach(link => {
    console.log(`\nLink ID: ${link.id}`);
    console.log(`Slug: ${link.slug}`);
    console.log(`Favicon URL: ${link.favicon}`);
  });

  await prisma.$disconnect();
}

checkLinks();