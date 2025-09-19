"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { LinksTable } from "@/components/links/links-table";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { trpc } from "@/app/providers/trpc-provider";

export default function LinksPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50;

  const { data, isLoading, refetch } = trpc.link.list.useQuery({
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  const deleteLinkMutation = trpc.link.delete.useMutation({
    onSuccess: () => {
      toast.success("Link deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete link");
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/signin");
      }
    };
    checkAuth();
  }, [router, supabase]);

  const handleDelete = async (id: string) => {
    await deleteLinkMutation.mutateAsync({ id });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Links", current: true }]} className="mb-4" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Links</h1>
        <Button onClick={() => router.push("/links/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Link
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
          <CardDescription>Manage your shortened links</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <LinksTable
                links={data?.links || []}
                onDelete={handleDelete}
                isDeleting={deleteLinkMutation.isPending}
              />
              {data && data.total > pageSize && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage + 1} of {Math.ceil(data.total / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={(currentPage + 1) * pageSize >= data.total}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
