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

interface DeleteUTMTemplateDialogProps {
  template: {
    id: string;
    name: string;
  };
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteUTMTemplateDialog({
  template,
  workspaceId,
  open,
  onOpenChange,
  onSuccess
}: DeleteUTMTemplateDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const utils = api.useContext();

  const deleteTemplate = api.utmTemplate.delete.useMutation({
    onSuccess: () => {
      toast.success(`UTM template "${template.name}" deleted successfully`);
      utils.utmTemplate.list.invalidate({ workspaceId });
      onOpenChange(false);
      router.refresh();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete UTM template');
      setIsDeleting(false);
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTemplate.mutateAsync({
        id: template.id,
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
            Delete UTM template
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the UTM template <strong>"{template.name}"</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-3">
          This template will be permanently deleted and cannot be recovered.
        </div>

        <div className="text-sm text-gray-500">
          This action cannot be undone. The UTM template will be permanently deleted.
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
                Delete template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}