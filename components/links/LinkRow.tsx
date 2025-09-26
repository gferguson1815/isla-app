'use client';

import { useState } from 'react';
import { Copy, MoreVertical, ExternalLink, BarChart3, Edit2, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function LinkRow({ link, onEdit, onDelete }: LinkRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleCopyLink = () => {
    const shortUrl = link.shortUrl || `${window.location.origin}/r/${link.slug}`;
    navigator.clipboard.writeText(shortUrl);
    toast.success('Link copied to clipboard!');
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
        return `${diffInSeconds}s`;
      } else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}m`;
      } else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)}h`;
      } else if (diffInSeconds < 2592000) {
        return `${Math.floor(diffInSeconds / 86400)}d`;
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Status indicator */}
        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />

        {/* Link details */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <a
              href={link.shortUrl || `/r/${link.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {link.shortUrl ? new URL(link.shortUrl).hostname : window.location.hostname}/{link.slug}
            </a>
            {isHovered && (
              <button
                onClick={handleCopyLink}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Copy link"
              >
                <Copy className="h-3 w-3 text-gray-500" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {link.favicon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={link.favicon}
                alt=""
                className="w-4 h-4 rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <span className="truncate max-w-md">{formatUrl(link.url)}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Right side metrics */}
      <div className="flex items-center gap-4">
        {/* User avatar */}
        <Avatar className="h-6 w-6">
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${link.created_by || 'user'}`} />
          <AvatarFallback className="text-xs">U</AvatarFallback>
        </Avatar>

        {/* Timestamp */}
        <span className="text-sm text-gray-500 min-w-[40px] text-right">
          {getTimeAgo()}
        </span>

        {/* Click count */}
        <div className="flex items-center gap-1 min-w-[60px] justify-end">
          <span className="text-sm text-gray-700 font-medium">
            {link.clicks || 0}
          </span>
          <span className="text-sm text-gray-500">
            click{(link.clicks || 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BarChart3 className="mr-2 h-4 w-4" />
              View analytics
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(link.id)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit link
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(link.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}