'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Folder, Home, FolderPlus, FileStack } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FolderTree } from './FolderTree';
import { CreateFolderDialog } from './CreateFolderDialog';
import { trpc } from '@/lib/trpc/client';
import type { FolderWithChildren } from '@/packages/shared/src/types/folder';

interface FolderSidebarProps {
  workspaceId: string;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onDropLink?: (linkId: string, folderId: string) => void;
  className?: string;
}

export function FolderSidebar({
  workspaceId,
  selectedFolderId,
  onSelectFolder,
  onDropLink,
  className
}: FolderSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('folder-sidebar-collapsed') === 'true';
    }
    return false;
  });

  const { data } = trpc.folder.list.useQuery({ workspace_id: workspaceId });
  const folders = data?.tree || [];

  // Count links per view
  const { data: linksData } = trpc.link.list.useQuery();
  const totalLinks = linksData?.length || 0;
  const uncategorizedLinks = linksData?.filter(link => !link.folder_id).length || 0;

  useEffect(() => {
    localStorage.setItem('folder-sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSelectView = (view: 'all' | 'uncategorized' | null) => {
    if (view === 'all') {
      onSelectFolder('__all__');
    } else if (view === 'uncategorized') {
      onSelectFolder('__uncategorized__');
    } else {
      onSelectFolder(null);
    }
  };

  if (isCollapsed) {
    return (
      <div className={cn('w-12 border-r bg-background', className)}>
        <div className="p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-64 border-r bg-background flex flex-col', className)}>
      <div className="p-4 flex items-center justify-between">
        <h3 className="font-semibold">Folders</h3>
        <div className="flex items-center gap-1">
          <CreateFolderDialog
            workspaceId={workspaceId}
            folders={folders}
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <FolderPlus className="h-4 w-4" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* All Links View */}
          <button
            onClick={() => handleSelectView('all')}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm hover:bg-accent transition-colors',
              selectedFolderId === '__all__' && 'bg-accent'
            )}
          >
            <Home className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-left">All Links</span>
            <span className="text-xs text-muted-foreground">{totalLinks}</span>
          </button>

          {/* Uncategorized Links View */}
          <button
            onClick={() => handleSelectView('uncategorized')}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm hover:bg-accent transition-colors',
              selectedFolderId === '__uncategorized__' && 'bg-accent'
            )}
          >
            <FileStack className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-left">Uncategorized</span>
            <span className="text-xs text-muted-foreground">{uncategorizedLinks}</span>
          </button>

          {folders.length > 0 && (
            <>
              <Separator className="my-2" />
              <FolderTree
                folders={folders}
                selectedFolderId={selectedFolderId}
                onSelectFolder={onSelectFolder}
                onDropLink={onDropLink}
              />
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}