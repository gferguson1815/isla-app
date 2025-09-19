'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableFolderProps {
  folderId: string;
  children: React.ReactNode;
  className?: string;
}

export function DroppableFolder({
  folderId,
  children,
  className
}: DroppableFolderProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${folderId}`,
    data: {
      type: 'folder',
      folderId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-colors',
        isOver && 'bg-accent/50 ring-2 ring-primary',
        className
      )}
    >
      {children}
    </div>
  );
}