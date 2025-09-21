import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's workspaces with onboarding status
  const workspaces = await prisma.workspaces.findMany({
    where: {
      workspace_memberships: {
        some: {
          user_id: user.id,
        },
      },
      deleted_at: null,
    },
    orderBy: {
      created_at: 'asc',
    },
  });

  if (workspaces.length > 0) {
    // User has existing workspace(s) - always go directly to their workspace
    // They should never see onboarding again after initial workspace creation
    const firstWorkspace = workspaces[0];
    redirect(`/${firstWorkspace.slug}/links`);
  } else {
    // No workspace found, start onboarding from beginning
    redirect('/onboarding/welcome');
  }
}
