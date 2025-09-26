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
import { toast } from 'sonner';

interface DeleteLinkDialogProps {
  link: {
    id: string;
    slug: string;
    url: string;
    title?: string | null;
    clickCount?: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteLinkDialog({
  link,
  open,
  onOpenChange,
  onDelete,
  isDeleting = false
}: DeleteLinkDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await onDelete(link.id);
      toast.success(`Link "/${link.slug}" deleted successfully`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete link');
      setIsProcessing(false);
    }
  };

  const isDeleting_ = isDeleting || isProcessing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Delete link
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the link <strong>"/{link.slug}"</strong>?
          </DialogDescription>
        </DialogHeader>

        {link.clickCount && link.clickCount > 0 ? (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              This link has been clicked <strong>{link.clickCount} {link.clickCount === 1 ? 'time' : 'times'}</strong>.
              All analytics data will be permanently deleted.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-3">
            This link has not been clicked yet.
          </div>
        )}

        <div className="space-y-2 text-sm">
          {link.title && (
            <div>
              <span className="text-gray-500">Title:</span>{' '}
              <span className="font-medium">{link.title}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Destination:</span>{' '}
            <span className="font-mono text-xs break-all">{link.url}</span>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          This action cannot be undone. The link and all associated data will be permanently deleted.
        </div>

        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting_}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting_}
            className="gap-2"
          >
            {isDeleting_ ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete link
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}