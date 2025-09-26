'use client';

import { useState } from 'react';
import { QRCodeEditor } from '@/components/ui/qr-code';
import { ArchiveLinkDialog } from '@/components/links/ArchiveLinkDialog';
import { api } from '@/utils/api';
import {
  Copy,
  MoreVertical,
  Edit2,
  Trash2,
  MousePointerClick,
  CornerDownRight,
  User,
  QrCode,
  Files,
  FolderInput,
  Archive,
  Share
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface LinkRowProps {
  link: {
    id: string;
    slug: string;
    url: string;
    title?: string | null;
    description?: string | null;
    clicks?: number;
    created_at?: Date | string;
    createdAt?: Date | string;
    shortUrl?: string;
    created_by?: string | null;
    favicon?: string | null;
    qr_code_settings?: Record<string, unknown>;
    workspace_id?: string;
    tags?: string[];
    folder_id?: string | null;
    archived?: boolean;
  };
  domain?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
  workspaceId?: string;
}

export function LinkRow({ link, domain, onEdit, onDelete, onRefresh, workspaceId }: LinkRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeSettings, setQrCodeSettings] = useState(link.qr_code_settings);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const updateLinkMutation = api.link.update.useMutation();
  const createLinkMutation = api.link.create.useMutation({
    onSuccess: () => {
      toast.success('Link duplicated successfully!');
      onRefresh?.();
    },
    onError: (error) => {
      toast.error('Failed to duplicate link');
      console.error('Duplicate error:', error);
    }
  });

  const handleCopyLink = () => {
    const displayDomain = domain || 'isla.sh';
    const shortUrl = `https://${displayDomain}/${link.slug}`;
    navigator.clipboard.writeText(shortUrl);
    toast.success('Link copied to clipboard!');
  };

  const handleDuplicate = () => {
    if (!workspaceId && !link.workspace_id) {
      toast.error('Workspace ID is required');
      return;
    }

    // Generate a new slug by appending a timestamp or random string
    const timestamp = Date.now().toString(36);
    const newSlug = `${link.slug}-${timestamp}`;

    createLinkMutation.mutate({
      workspaceId: workspaceId || link.workspace_id!,
      url: link.url,
      slug: newSlug,
      title: link.title ? `${link.title} (Copy)` : undefined,
      description: link.description || undefined,
      tags: link.tags || undefined,
      folder_id: link.folder_id || undefined,
      qrCodeSettings: link.qr_code_settings || undefined,
    });
  };

  const handleArchive = async () => {
    if (!workspaceId && !link.workspace_id) {
      toast.error('Workspace ID is required');
      return;
    }

    const isArchiving = !link.archived;

    try {
      await updateLinkMutation.mutateAsync({
        id: link.id,
        workspaceId: workspaceId || link.workspace_id!,
        archived: isArchiving,
      });
      toast.success(isArchiving ? 'Link archived successfully!' : 'Link restored successfully!');
      onRefresh?.();
    } catch (error) {
      toast.error(isArchiving ? 'Failed to archive link' : 'Failed to unarchive link');
      console.error('Archive error:', error);
    }
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const getTimeAgo = () => {
    try {
      const dateString = link.created_at || link.createdAt;
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return 'Just now';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h`;
      } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d`;
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  return (
    <>
    <div
      className={`flex items-center justify-between px-4 py-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        link.archived ? 'border-gray-300 opacity-60' : 'border-gray-200'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit?.(link.id)}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Link avatar with circular border */}
        <div className="w-7 h-7 rounded-full border-2 border-gray-200 flex-shrink-0 overflow-hidden">
          {link.favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={link.favicon}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to colored circle if avatar fails to load
                e.currentTarget.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'w-full h-full bg-gradient-to-br from-purple-500 to-pink-500';
                e.currentTarget.parentElement?.appendChild(fallback);
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
          )}
        </div>

        {/* Link details */}
        <div className="flex flex-col min-w-0 gap-1">
          <div className="flex items-center gap-2">
            <a
              href={`https://${domain || 'isla.sh'}/${link.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {domain || 'isla.sh'}/{link.slug}
            </a>
            {link.archived && (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                Archived
              </span>
            )}
            {isHovered && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyLink();
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Copy link"
              >
                <Copy className="h-3 w-3 text-gray-500" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CornerDownRight className="h-3 w-3 flex-shrink-0 text-gray-400" />
            <span className="truncate max-w-md">{formatUrl(link.url)}</span>

            {/* User avatar and time */}
            <div className="flex items-center gap-2 ml-3">
              <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="h-3 w-3 text-orange-600" />
              </div>
              <span className="text-gray-400">{getTimeAgo()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side metrics */}
      <div className="flex items-center gap-4">
        {/* Click count with border and icon */}
        <div className="flex items-center gap-2 px-2.5 py-1 border border-gray-200 rounded-md">
          <MousePointerClick className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {link.clicks || 0} click{(link.clicks || 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {link.archived && (
              <>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArchive(); // This will unarchive/restore
                  }}
                  className="flex items-center gap-3 py-2.5 px-3 text-green-600 hover:bg-green-50"
                >
                  <Archive className="h-4 w-4" />
                  <span className="flex-1">Restore Link</span>
                  <kbd className="text-xs bg-green-100 px-1.5 py-0.5 rounded text-green-600">R</kbd>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
              </>
            )}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(link.id);
              }}
              className="flex items-center gap-3 py-2.5 px-3"
            >
              <Edit2 className="h-4 w-4 text-gray-600" />
              <span className="flex-1">Edit</span>
              <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">E</kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setShowQRCode(true);
              }}
              className="flex items-center gap-3 py-2.5 px-3"
            >
              <QrCode className="h-4 w-4 text-gray-600" />
              <span className="flex-1">QR Code</span>
              <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">Q</kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(link.id);
                toast.success('Link ID copied to clipboard!');
              }}
              className="flex items-center gap-3 py-2.5 px-3"
            >
              <Copy className="h-4 w-4 text-gray-600" />
              <span className="flex-1">Copy Link ID</span>
              <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">I</kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicate();
              }}
              className="flex items-center gap-3 py-2.5 px-3"
            >
              <Files className="h-4 w-4 text-gray-600" />
              <span className="flex-1">Duplicate</span>
              <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">D</kbd>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Move link
                toast.info('Move feature coming soon!');
              }}
              className="flex items-center gap-3 py-2.5 px-3"
            >
              <FolderInput className="h-4 w-4 text-gray-600" />
              <span className="flex-1">Move</span>
              <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">M</kbd>
            </DropdownMenuItem>
            {!link.archived && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setShowArchiveDialog(true);
                }}
                className="flex items-center gap-3 py-2.5 px-3"
              >
                <Archive className="h-4 w-4 text-gray-600" />
                <span className="flex-1">Archive</span>
                <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">A</kbd>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Transfer link
                toast.info('Transfer feature coming soon!');
              }}
              className="flex items-center gap-3 py-2.5 px-3"
            >
              <Share className="h-4 w-4 text-gray-600" />
              <span className="flex-1">Transfer</span>
              <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">T</kbd>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(link.id);
              }}
              className="flex items-center gap-3 py-2.5 px-3 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              <span className="flex-1">Delete</span>
              <kbd className="text-xs bg-red-100 px-1.5 py-0.5 rounded text-red-600">X</kbd>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    {/* QR Code Modal */}
    {showQRCode && (
      <QRCodeEditor
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        url={`https://${domain || 'isla.sh'}/${link.slug}`}
        onSave={async (options) => {
          if (workspaceId || link.workspace_id) {
            await updateLinkMutation.mutateAsync({
              id: link.id,
              workspaceId: workspaceId || link.workspace_id!,
              qrCodeSettings: options
            });
            setQrCodeSettings(options); // Update local state
            toast.success('QR code settings saved!');
            setShowQRCode(false);
          }
        }}
        currentOptions={qrCodeSettings || {
          backgroundColor: '#FFFFFF',
          foregroundColor: '#000000',
          logo: undefined
        }}
      />
    )}

    {/* Archive Confirmation Dialog */}
    <ArchiveLinkDialog
      isOpen={showArchiveDialog}
      onClose={() => setShowArchiveDialog(false)}
      onConfirm={() => {
        handleArchive();
        setShowArchiveDialog(false);
      }}
      linkSlug={`${domain || 'isla.sh'}/${link.slug}`}
    />

    </>
  );
}