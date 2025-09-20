import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's first workspace
  const workspace = await prisma.workspaces.findFirst({
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

  if (workspace) {
    redirect(`/${workspace.slug}/links`);
  } else {
    // No workspace found, redirect to workspace creation or onboarding
    redirect('/onboarding');
  }
}