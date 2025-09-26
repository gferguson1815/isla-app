'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Archive } from "lucide-react";

interface ArchiveLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  linkSlug?: string;
}

export function ArchiveLinkDialog({
  isOpen,
  onClose,
  onConfirm,
  linkSlug
}: ArchiveLinkDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <Archive className="h-5 w-5 text-orange-600" />
            </div>
            <AlertDialogTitle>Archive link?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-3">
            This link will be archived and will no longer be accessible to visitors.
            {linkSlug && (
              <>
                <br />
                <span className="font-medium text-gray-700 mt-2 inline-block">
                  {linkSlug}
                </span>
              </>
            )}
            <br />
            <span className="text-sm mt-2 inline-block">
              You can restore this link at any time from the archived links view.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Archive Link
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}