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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import type { Folder } from '@/packages/shared/src/types/folder';

interface DeleteFolderDialogProps {
  folder: Folder & { _count?: { links: number; other_folders: number } };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteFolderDialog({
  folder,
  open,
  onOpenChange,
  onSuccess
}: DeleteFolderDialogProps) {
  const [cascade, setCascade] = useState(false);
  const utils = trpc.useContext();

  const deleteFolder = trpc.folder.delete.useMutation({
    onSuccess: (result) => {
      toast.success(
        `Folder deleted successfully. ${
          result.affectedLinks > 0
            ? `${result.affectedLinks} link(s) ${
                cascade ? 'deleted' : 'moved to parent folder'
              }.`
            : ''
        }`
      );
      utils.folder.list.invalidate({ workspace_id: folder.workspace_id });
      utils.link.list.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete folder');
    },
  });

  const handleDelete = () => {
    deleteFolder.mutate({
      id: folder.id,
      cascade,
    });
  };

  const linkCount = folder._count?.links || 0;
  const subfolderCount = folder._count?.other_folders || 0;
  const hasContent = linkCount > 0 || subfolderCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Folder</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{folder.name}"?
          </DialogDescription>
        </DialogHeader>

        {hasContent && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This folder contains:
              <ul className="mt-2 ml-4 list-disc">
                {linkCount > 0 && (
                  <li>{linkCount} link{linkCount > 1 ? 's' : ''}</li>
                )}
                {subfolderCount > 0 && (
                  <li>{subfolderCount} subfolder{subfolderCount > 1 ? 's' : ''}</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {hasContent && (
          <div className="flex items-start space-x-2">
            <Checkbox
              id="cascade"
              checked={cascade}
              onCheckedChange={(checked) => setCascade(checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="cascade" className="cursor-pointer">
                Delete all contents
              </Label>
              <p className="text-sm text-muted-foreground">
                {cascade
                  ? 'All links and subfolders will be permanently deleted.'
                  : 'Links and subfolders will be moved to the parent folder.'}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteFolder.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteFolder.isPending}
          >
            {deleteFolder.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}