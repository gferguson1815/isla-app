"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { KeyboardShortcutButton } from "@/components/ui/keyboard-shortcut-button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Input } from "@/components/ui/input";
import { api } from "@/utils/api";
import { CreateTagModal } from "@/components/tags/CreateTagModal";
import { DeleteTagDialog } from "@/components/tags/DeleteTagDialog";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronsUpDown,
  Search,
  Filter,
  LayoutGrid,
  Plus,
  MoreVertical,
  Tag,
  Hash,
  HelpCircle,
  Globe,
  Edit2,
  Copy,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TagsPage() {
  const params = useParams();
  const workspaceSlug = params.workspace as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<{ id: string; name: string; color: string | null } | null>(null);
  const [deletingTag, setDeletingTag] = useState<{ id: string; name: string; usage_count?: number } | null>(null);

  // Fetch workspace by slug to get the actual UUID
  const { data: workspace } = api.workspace.getBySlug.useQuery(
    { slug: workspaceSlug },
    { enabled: !!workspaceSlug }
  );

  // Fetch tags for the workspace
  const { data: tags, isLoading, refetch } = api.tag.list.useQuery(
    { workspaceId: workspace?.id || "" },
    { enabled: !!workspace?.id }
  );

  // Filter tags based on search query
  const filteredTags = tags?.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Debug logging
  console.log("Workspace ID:", workspace?.id);
  console.log("Tags fetched:", tags);
  console.log("Filtered tags:", filteredTags);

  // Handle keyboard shortcut for creating tag (Cmd/Ctrl + T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="flex h-14 items-center justify-between" style={{ marginLeft: '85.5px', marginRight: '85.5px', paddingLeft: '24px', paddingRight: '24px' }}>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-lg">Tags</h1>
            <InfoTooltip
              content={
                <div>
                  Learn how to use tags to organize your links and retrieve analytics for them.{" "}
                  <a
                    href="https://isla.so/help/article/how-to-use-tags"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium text-gray-900 hover:text-gray-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Learn more
                  </a>
                </div>
              }
              side="right"
              align="center"
            />
          </div>
          <KeyboardShortcutButton
            className="h-9 px-4 bg-black text-white hover:bg-gray-800 text-sm font-medium"
            shortcut="t"
            onShortcut={() => setIsCreateModalOpen(true)}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create tag
          </KeyboardShortcutButton>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white flex flex-col">
        {/* Search bar */}
        <div className="pt-4 pb-4" style={{ marginLeft: '85.5px', marginRight: '85.5px', paddingLeft: '24px', paddingRight: '24px' }}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="h-9 w-full pl-10 pr-3 text-sm text-gray-600 placeholder-gray-400 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content wrapper with flex-1 to push footer to bottom */}
        <div className="flex-1 flex flex-col">
          {/* Content Area */}
          <div style={{ marginLeft: '109.5px', marginRight: '109.5px' }}>
            {isLoading ? (
              // Loading state
              <div className="border border-gray-200 rounded-lg bg-white flex items-center justify-center" style={{ minHeight: '400px' }}>
                <div className="text-gray-500">Loading tags...</div>
              </div>
            ) : filteredTags.length > 0 ? (
              // Tags Table with pagination
              <>
                <div className="border border-gray-200 rounded-lg bg-white">
                  <table className="w-full">
                    <tbody>
                      {filteredTags.map((tag, index) => (
                        <tr
                          key={tag.id}
                          className={`${index !== filteredTags.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-gray-50`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-6 h-6 rounded-md flex items-center justify-center border"
                                style={{
                                  backgroundColor: tag.color ? `${tag.color}15` : '#F59E0B15',
                                  borderColor: tag.color ? `${tag.color}40` : '#F59E0B40'
                                }}
                              >
                                <Tag className="h-3.5 w-3.5" style={{ color: tag.color || '#F59E0B' }} />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded-md" title="Number of links using this tag">
                                <Globe className="h-3.5 w-3.5 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  Used by {tag.usage_count || 0} {(tag.usage_count || 0) === 1 ? 'link' : 'links'}
                                </span>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                    <MoreVertical className="h-4 w-4 text-gray-400" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingTag({
                                        id: tag.id,
                                        name: tag.name,
                                        color: tag.color
                                      });
                                      setIsCreateModalOpen(true);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'e' || e.key === 'E') {
                                        e.preventDefault();
                                        setEditingTag({
                                          id: tag.id,
                                          name: tag.name,
                                          color: tag.color
                                        });
                                        setIsCreateModalOpen(true);
                                      }
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                    <span>Edit</span>
                                    <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200">E</kbd>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      navigator.clipboard.writeText(tag.id);
                                      toast.success("Tag ID copied to clipboard");
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'i' || e.key === 'I') {
                                        e.preventDefault();
                                        navigator.clipboard.writeText(tag.id);
                                        toast.success("Tag ID copied to clipboard");
                                      }
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy Tag ID</span>
                                    <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200">I</kbd>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setDeletingTag({
                                        id: tag.id,
                                        name: tag.name,
                                        usage_count: tag.usage_count
                                      });
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'x' || e.key === 'X') {
                                        e.preventDefault();
                                        setDeletingTag({
                                          id: tag.id,
                                          name: tag.name,
                                          usage_count: tag.usage_count
                                        });
                                      }
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Delete</span>
                                    <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded border border-red-200">X</kbd>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination footer - completely outside bordered container */}
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Viewing 1-{filteredTags.length} of {filteredTags.length} tags
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 text-sm text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                      disabled
                    >
                      Previous
                    </button>
                    <button
                      className="px-3 py-1 text-sm text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                      disabled
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Empty State
              <div className="border border-gray-200 rounded-lg bg-white">
                <div className="flex flex-col items-center justify-center" style={{ minHeight: '400px' }}>
              {/* Animated Placeholder Tags Container */}
              <div className="mb-6 h-28 relative overflow-hidden" style={{ width: '280px' }}>
                {/* Scrolling animation container - doubled for seamless loop */}
                <div className="flex flex-col gap-3 animate-scroll-vertical">
                  {/* First set */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <div className="h-2 w-32 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <div className="h-2 w-24 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <div className="h-2 w-36 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <div className="h-2 w-20 bg-gray-200 rounded"></div>
                  </div>
                  {/* Duplicate set for seamless loop */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <div className="h-2 w-32 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <div className="h-2 w-24 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <div className="h-2 w-36 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <div className="h-2 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Empty State Text and Buttons */}
              <div className="text-center max-w-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No tags yet</h2>
                <p className="text-gray-500 mb-7 text-sm leading-relaxed">
                  Create tags to organize your links
                </p>
                <div className="flex items-center justify-center gap-3">
                  <KeyboardShortcutButton
                    className="h-10 px-5 bg-black text-white hover:bg-gray-800 text-sm font-medium rounded-md"
                    shortcut="t"
                    onShortcut={() => setIsCreateModalOpen(true)}
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    Create tag
                  </KeyboardShortcutButton>
                  <Button
                    variant="outline"
                    className="h-10 px-5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md"
                    onClick={() => window.open('https://isla.so/help/article/how-to-use-tags', '_blank')}
                  >
                    Learn more
                  </Button>
                </div>
              </div>
            </div>
              </div>
            )}
          </div>

          {/* Spacer to push footer down */}
          <div className="flex-1"></div>
        </div>

        {/* Footer with Getting Started button */}
        <div className="pb-6 relative" style={{ marginLeft: '109.5px', marginRight: '109.5px' }}>
          <div className="flex items-center justify-center">
            {/* Getting Started button - right aligned, absolute positioning */}
            <div className="absolute right-0 bg-gray-900 text-white rounded-full shadow-md">
              <button className="px-5 py-2.5 hover:bg-gray-800 rounded-full transition-colors">
                <div className="text-center">
                  <div className="text-[13px] font-semibold">Getting Started</div>
                  <div className="text-xs text-gray-300 mt-0.5 font-semibold">
                    25% complete
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Additional bottom padding */}
        <div className="pb-6"></div>
      </div>

      {/* Create/Edit Tag Modal */}
      {workspace && (
        <CreateTagModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingTag(null);
            refetch(); // Refetch tags after create/edit
          }}
          workspaceId={workspace.id}
          workspaceSlug={workspaceSlug}
          editingTag={editingTag}
        />
      )}

      {/* Delete Tag Dialog */}
      {workspace && deletingTag && (
        <DeleteTagDialog
          tag={deletingTag}
          workspaceId={workspace.id}
          open={!!deletingTag}
          onOpenChange={(open) => {
            if (!open) setDeletingTag(null);
          }}
          onSuccess={() => {
            setDeletingTag(null);
            refetch(); // Refetch tags after delete
          }}
        />
      )}
    </>
  );
}