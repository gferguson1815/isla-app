'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FolderWithChildren } from '@/packages/shared/src/types/folder';

interface FolderTreeProps {
  folders: FolderWithChildren[];
  selectedFolderId?: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onDropLink?: (linkId: string, folderId: string) => void;
  className?: string;
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onDropLink,
  className
}: FolderTreeProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {folders.map((folder) => (
        <FolderTreeItem
          key={folder.id}
          folder={folder}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          onDropLink={onDropLink}
          level={0}
        />
      ))}
    </div>
  );
}

interface FolderTreeItemProps {
  folder: FolderWithChildren;
  selectedFolderId?: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onDropLink?: (linkId: string, folderId: string) => void;
  level: number;
}

export function FolderTreeItem({
  folder,
  selectedFolderId,
  onSelectFolder,
  onDropLink,
  level
}: FolderTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    onSelectFolder(folder.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const linkId = e.dataTransfer.getData('link-id');
    if (linkId && onDropLink) {
      onDropLink(linkId, folder.id);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent',
          isSelected && 'bg-accent',
          'transition-colors'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <button
          onClick={handleToggle}
          className={cn(
            'p-0.5 hover:bg-accent-foreground/10 rounded',
            !hasChildren && 'invisible'
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>

        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground" />
        )}

        <span className="text-sm flex-1 truncate">{folder.name}</span>

        {folder._count?.links ? (
          <span className="text-xs text-muted-foreground">
            {folder._count.links}
          </span>
        ) : null}
      </div>

      {isExpanded && hasChildren && (
        <div className="ml-2">
          {folder.children!.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onDropLink={onDropLink}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}