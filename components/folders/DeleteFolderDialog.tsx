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
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Delete folder
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the folder <strong>"{folder.name}"</strong>?
          </DialogDescription>
        </DialogHeader>

        {hasContent ? (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              This folder contains:
              <ul className="mt-2 ml-4 list-disc">
                {linkCount > 0 && (
                  <li><strong>{linkCount}</strong> {linkCount === 1 ? 'link' : 'links'}</li>
                )}
                {subfolderCount > 0 && (
                  <li><strong>{subfolderCount}</strong> {subfolderCount === 1 ? 'subfolder' : 'subfolders'}</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-3">
            This folder is empty.
          </div>
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

        <div className="text-sm text-gray-500">
          This action cannot be undone. {cascade ? 'All contents will be permanently deleted.' : 'Contents will be moved to the parent folder.'}
        </div>

        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteFolder.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteFolder.isPending}
            className="gap-2"
          >
            {deleteFolder.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete folder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}