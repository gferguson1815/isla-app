'use client';

import { useState } from 'react';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DeleteTagDialogProps {
  tag: {
    id: string;
    name: string;
    usage_count?: number;
  };
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteTagDialog({
  tag,
  workspaceId,
  open,
  onOpenChange,
  onSuccess
}: DeleteTagDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const deleteTag = api.tag.delete.useMutation({
    onSuccess: () => {
      toast.success(`Tag "${tag.name}" deleted successfully`);
      onOpenChange(false);
      router.refresh();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete tag');
      setIsDeleting(false);
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTag.mutateAsync({
        workspaceId,
        tagId: tag.id,
      });
    } catch (error) {
      // Error handling is done in the mutation's onError callback
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Delete tag
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the tag <strong>"{tag.name}"</strong>?
          </DialogDescription>
        </DialogHeader>

        {tag.usage_count && tag.usage_count > 0 ? (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              This tag is currently used by <strong>{tag.usage_count} {tag.usage_count === 1 ? 'link' : 'links'}</strong>.
              Deleting will remove this tag from {tag.usage_count === 1 ? 'that link' : 'all those links'}.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-3">
            This tag is not currently used by any links.
          </div>
        )}

        <div className="text-sm text-gray-500">
          This action cannot be undone. The tag will be permanently deleted.
        </div>

        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete tag
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}