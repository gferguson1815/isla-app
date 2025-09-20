'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LinkForm } from '@/components/links/link-form';
import { trpc } from '@/app/providers/trpc-provider';
import { toast } from 'sonner';

export default function NewLinkPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const createLinkMutation = trpc.link.create.useMutation({
    onSuccess: () => {
      toast.success('Link created successfully!');
      setTimeout(() => {
        router.push('/links');
      }, 1500);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create link');
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router, supabase]);

  const handleSubmit = async (data: { url: string; slug?: string; finalSlug: string }) => {
    await createLinkMutation.mutateAsync({
      url: data.url,
      slug: data.finalSlug,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <LinkForm
        onSubmit={handleSubmit}
        isLoading={createLinkMutation.isPending}
      />
    </div>
  );
}