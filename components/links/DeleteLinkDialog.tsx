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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [confirmText, setConfirmText] = useState('');

  const confirmationPhrase = `delete ${link.slug}`;
  const isConfirmed = confirmText.toLowerCase() === confirmationPhrase.toLowerCase();

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsProcessing(true);
    try {
      await onDelete(link.id);
      toast.success(`Link "/${link.slug}" deleted successfully`);
      onOpenChange(false);
      setConfirmText(''); // Reset for next time
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete link');
      setIsProcessing(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setConfirmText(''); // Reset when closing
    }
    onOpenChange(open);
  };

  const isDeleting_ = isDeleting || isProcessing;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Delete link
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the link <strong>&ldquo;/{link.slug}&rdquo;</strong>?
          </DialogDescription>
        </DialogHeader>

        {link.clickCount && link.clickCount > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              This link has been clicked <strong>{link.clickCount} {link.clickCount === 1 ? 'time' : 'times'}</strong>.
              All analytics data will be permanently deleted.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
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

          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-sm text-red-800">
              <strong>This action cannot be undone.</strong> The link and all associated data will be permanently deleted.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirm-delete" className="text-sm font-medium">
              Type <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">{confirmationPhrase}</span> to confirm
            </Label>
            <Input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type here to confirm"
              className="font-mono"
              disabled={isDeleting_}
            />
          </div>
        </div>


        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isDeleting_}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting_ || !isConfirmed}
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