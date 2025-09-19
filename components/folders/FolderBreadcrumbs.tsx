'use client';

import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc/client';

interface FolderBreadcrumbsProps {
  folderId: string | null;
  onNavigate: (folderId: string | null) => void;
  className?: string;
}

export function FolderBreadcrumbs({
  folderId,
  onNavigate,
  className
}: FolderBreadcrumbsProps) {
  const { data: path } = trpc.folder.getPath.useQuery(
    { folder_id: folderId! },
    { enabled: !!folderId }
  );

  return (
    <div className={cn('flex items-center space-x-1 text-sm', className)}>
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center hover:text-foreground text-muted-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </button>

      {path && path.length > 0 && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {path.map((folder, index) => (
            <div key={folder.id} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
              )}
              <button
                onClick={() => onNavigate(folder.id)}
                className={cn(
                  'hover:text-foreground transition-colors',
                  index === path.length - 1
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                )}
              >
                {folder.name}
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}