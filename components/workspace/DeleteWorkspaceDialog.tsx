'use client';

import { useState } from 'react';
import { Loader2, Trash2, AlertTriangle, Shield } from 'lucide-react';
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

interface DeleteWorkspaceDialogProps {
  workspace: {
    id: string;
    name: string;
    _count?: {
      links?: number;
      members?: number;
      folders?: number;
    };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void | Promise<void>;
  isDeleting?: boolean;
}

export function DeleteWorkspaceDialog({
  workspace,
  open,
  onOpenChange,
  onDelete,
  isDeleting = false
}: DeleteWorkspaceDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const linkCount = workspace._count?.links || 0;
  const memberCount = workspace._count?.members || 0;
  const folderCount = workspace._count?.folders || 0;
  const hasContent = linkCount > 0 || memberCount > 1 || folderCount > 0;

  const isConfirmed = confirmText === workspace.name;
  const isDeleting_ = isDeleting || isProcessing;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsProcessing(true);
    try {
      await onDelete();
    } catch (error) {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting_) {
      setConfirmText('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Delete workspace permanently
          </DialogTitle>
          <DialogDescription>
            This is an extremely destructive action that cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {hasContent && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-800">
              <strong>Warning:</strong> This workspace contains:
              <ul className="mt-2 ml-4 list-disc">
                {linkCount > 0 && (
                  <li><strong>{linkCount.toLocaleString()}</strong> {linkCount === 1 ? 'link' : 'links'} with all analytics data</li>
                )}
                {folderCount > 0 && (
                  <li><strong>{folderCount.toLocaleString()}</strong> {folderCount === 1 ? 'folder' : 'folders'}</li>
                )}
                {memberCount > 1 && (
                  <li><strong>{memberCount.toLocaleString()}</strong> team {memberCount === 2 ? 'member' : 'members'} (including you)</li>
                )}
              </ul>
              <div className="mt-3 font-medium">
                All data will be permanently deleted and cannot be recovered.
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">This action will:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Permanently delete all links and their analytics</li>
              <li>Remove all team members from this workspace</li>
              <li>Delete all folders and organization structure</li>
              <li>Cancel any active subscriptions</li>
              <li>Remove all custom domains and settings</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-sm font-medium">
              Type <strong className="font-mono bg-gray-100 px-1 py-0.5 rounded">{workspace.name}</strong> to confirm
            </Label>
            <Input
              id="confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Enter workspace name"
              className="font-mono"
              disabled={isDeleting_}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting_}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting_}
            className="gap-2"
          >
            {isDeleting_ ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting workspace...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete workspace permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}