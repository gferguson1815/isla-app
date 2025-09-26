"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { KeyboardShortcutButton } from "@/components/ui/keyboard-shortcut-button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { api } from "@/utils/api";
import {
  ChevronDown,
  ChevronsUpDown,
  Search,
  LayoutGrid,
  MoreVertical,
  Folder,
  Link,
  MousePointerClick,
  Tag,
  Globe,
  User,
  Filter,
  X,
  ArrowUpDown,
  Calendar,
  Archive,
  Rows3,
  Square,
  ExternalLink,
  Copy,
  Check,
  Clock,
  DollarSign,
  Edit,
  QrCode,
  Files,
  FolderInput,
  Share,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { OnboardingCompleteModal } from "./components/OnboardingCompleteModal";
import { LinksFooter } from "@/components/links/LinksFooter";
import { CreateLinkModal } from "@/components/links/CreateLinkModal";
import { LinkRow } from "@/components/links/LinkRow";
import { DeleteLinkDialog } from "@/components/links/DeleteLinkDialog";
import { QRCodeEditor } from "@/components/ui/qr-code";
import { toast } from "sonner";

export default function LinksPage() {
  const params = useParams();
  const workspaceSlug = params.workspace as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<{ id: string; slug: string; url: string; title?: string | null; shortUrl?: string; clickCount?: number } | null>(null);
  const [editingLink, setEditingLink] = useState<{
    id: string;
    slug: string;
    url: string;
    title?: string | null;
    description?: string | null;
    tags?: string[];
    folder_id?: string | null;
    qr_code_settings?: Record<string, unknown>;
  } | null>(null);
  const [qrCodeLink, setQRCodeLink] = useState<{ id: string; slug: string; qr_code_settings?: Record<string, unknown> } | null>(null);

  // Filter states
  const [activeFilters, setActiveFilters] = useState<{
    tags?: string[];
    domain?: string;
    creator?: string;
  }>({});
  const [filterView, setFilterView] = useState<'main' | 'tags' | 'domain' | 'creator'>('main');
  const [filterSearch, setFilterSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Display settings
  const [viewMode, setViewMode] = useState<'cards' | 'rows'>('cards');
  const [sortBy, setSortBy] = useState<'date' | 'clicks' | 'lastClicked' | 'sales'>('date');
  const [showArchived, setShowArchived] = useState(false);
  const [displayProperties, setDisplayProperties] = useState({
    shortLink: true,
    destinationUrl: true,
    title: false,
    description: false,
    createdDate: false,
    creator: false,
    tags: false,
    analytics: false
  });

  // Fetch workspace by slug to get the actual UUID
  const { data: workspace } = api.workspace.getBySlug.useQuery(
    { slug: workspaceSlug },
    { enabled: !!workspaceSlug }
  );

  // Fetch links for the workspace
  const { data: linksData, isLoading: linksLoading, refetch: refetchLinks } = api.link.list.useQuery(
    {
      workspaceId: workspace?.id || '',
      limit: 50,
      offset: 0,
      search: searchQuery || undefined,
      tags: activeFilters.tags,
      domain: activeFilters.domain,
      createdBy: activeFilters.creator,
      sortBy,
      showArchived,
    },
    {
      enabled: !!workspace?.id,
      refetchInterval: 5000, // Poll every 5 seconds to update click counts
    }
  );

  // Fetch workspace members for creator filter
  const { data: membersData } = api.workspace.getMembers.useQuery(
    { workspaceId: workspace?.id || '' },
    { enabled: !!workspace?.id }
  );

  // Fetch tags for filtering
  const { data: tagsData } = api.tag.list.useQuery(
    {
      workspaceId: workspace?.id || '',
    },
    {
      enabled: !!workspace?.id,
    }
  );

  const deleteLinkMutation = api.link.delete.useMutation({
    onSuccess: () => {
      refetchLinks();
      setDeleteDialogOpen(false);
      setSelectedLink(null);
    },
  });

  const updateLinkMutation = api.link.update.useMutation({
    onSuccess: () => {
      refetchLinks();
    },
  });

  const handleDeleteLink = (linkId: string) => {
    const link = linksData?.links.find(l => l.id === linkId);
    if (link) {
      setSelectedLink({
        id: link.id,
        slug: link.slug,
        url: link.url,
        title: link.title,
        shortUrl: link.shortUrl,
        clickCount: link.clicks
      });
      setDeleteDialogOpen(true);
    }
  };

  const handleEditLink = (linkId: string) => {
    const link = linksData?.links.find(l => l.id === linkId);
    if (link) {
      setEditingLink(link);
    }
  };

  const handleConfirmDelete = async (linkId: string) => {
    if (workspace) {
      await deleteLinkMutation.mutateAsync({
        id: linkId,
        workspaceId: workspace.id,
      });
    }
  };

  // Handle keyboard shortcut for creating link (Cmd/Ctrl + C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-lg hover:bg-transparent focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
              >
                Links
                <ChevronsUpDown className="ml-1 h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[320px] p-2">
              <div className="p-2">
                <Input
                  placeholder="Search folders..."
                  className="h-9 mb-2"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm mb-1"
                >
                  <span className="mr-2">📁</span>
                  Links
                  <span className="ml-auto">✓</span>
                </Button>
                <hr className="my-2" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm text-gray-600"
                >
                  <Folder className="mr-2 h-4 w-4" />
                  Create new folder
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <KeyboardShortcutButton
            className="h-9 px-4 bg-black text-white hover:bg-gray-800 text-sm font-medium"
            shortcut="c"
            onShortcut={() => setIsCreateModalOpen(true)}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create link
          </KeyboardShortcutButton>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white flex flex-col">
        {/* Filter and Display buttons */}
        <div className="pt-4 pb-4" style={{ marginLeft: '85.5px', marginRight: '85.5px', paddingLeft: '24px', paddingRight: '24px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-2 h-9 px-3 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                    {Object.keys(activeFilters).length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-100 rounded-full">
                        {Object.values(activeFilters).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length}
                      </span>
                    )}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56"
                  onCloseAutoFocus={(e) => {
                    e.preventDefault();
                    setFilterView('main');
                    setFilterSearch('');
                  }}
                >
                  <div className="p-2">
                    {filterView === 'main' ? (
                      <>
                        <Input
                          placeholder="Filter..."
                          className="h-8 mb-2 text-sm"
                          value={filterSearch}
                          onChange={(e) => setFilterSearch(e.target.value)}
                        />

                        <DropdownMenuLabel className="text-xs text-gray-500 font-normal px-2 py-1">
                          FILTER BY
                        </DropdownMenuLabel>

                        <DropdownMenuItem
                          className="flex items-center gap-2 cursor-pointer"
                          onSelect={(e) => {
                            e.preventDefault();
                            setFilterView('tags');
                          }}
                        >
                          <Tag className="h-4 w-4" />
                          <span>Tag</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="flex items-center gap-2 cursor-pointer"
                          onSelect={(e) => {
                            e.preventDefault();
                            setFilterView('domain');
                          }}
                        >
                          <Globe className="h-4 w-4" />
                          <span>Domain</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="flex items-center gap-2 cursor-pointer"
                          onSelect={(e) => {
                            e.preventDefault();
                            setFilterView('creator');
                          }}
                        >
                          <User className="h-4 w-4" />
                          <span>Creator</span>
                        </DropdownMenuItem>

                        {Object.keys(activeFilters).length > 0 && (
                          <>
                            <DropdownMenuSeparator className="my-2" />
                            <button
                              onClick={() => {
                                setActiveFilters({});
                                setSelectedTags([]);
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            >
                              <X className="h-4 w-4" />
                              <span>Clear filters</span>
                            </button>
                          </>
                        )}
                      </>
                    ) : filterView === 'tags' ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => {
                              setFilterView('main');
                              setFilterSearch('');
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <ChevronDown className="h-4 w-4 rotate-90" />
                          </button>
                          <Input
                            placeholder="Tag..."
                            className="h-8 text-sm flex-1"
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            autoFocus
                          />
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                          {tagsData?.tags && tagsData.tags.length > 0 ? (
                            tagsData.tags
                              .filter(tag =>
                                !filterSearch ||
                                tag.name.toLowerCase().includes(filterSearch.toLowerCase())
                              )
                              .map((tag) => (
                                <div
                                  key={tag.id}
                                  className="flex items-center justify-between px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                                  onClick={() => {
                                    const newSelectedTags = selectedTags.includes(tag.id)
                                      ? selectedTags.filter(id => id !== tag.id)
                                      : [...selectedTags, tag.id];
                                    setSelectedTags(newSelectedTags);
                                    setActiveFilters({
                                      ...activeFilters,
                                      tags: newSelectedTags.length > 0 ? newSelectedTags : undefined
                                    });
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-6 h-6 rounded-md flex items-center justify-center border"
                                      style={{
                                        backgroundColor: tag.color ? `${tag.color}15` : '#F59E0B15',
                                        borderColor: tag.color ? `${tag.color}40` : '#F59E0B40'
                                      }}
                                    >
                                      <Tag className="h-3.5 w-3.5" style={{ color: tag.color || '#F59E0B' }} />
                                    </div>
                                    <span className="text-sm">{tag.name}</span>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {tag.linkCount || 0}
                                  </span>
                                </div>
                              ))
                          ) : (
                            <div className="px-2 py-4 text-sm text-gray-500 text-center">
                              No tags found
                            </div>
                          )}
                        </div>
                      </>
                    ) : filterView === 'domain' ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => {
                              setFilterView('main');
                              setFilterSearch('');
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <ChevronDown className="h-4 w-4 rotate-90" />
                          </button>
                          <Input
                            placeholder="Domain..."
                            className="h-8 text-sm flex-1"
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            autoFocus
                          />
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                          {(() => {
                            // Get unique domains from all links
                            const domainCounts: { [key: string]: { count: number; favicon?: string } } = {};

                            linksData?.links.forEach(link => {
                              try {
                                const url = new URL(link.url);
                                const domain = url.hostname.replace('www.', '');
                                if (!domainCounts[domain]) {
                                  // Use Google's favicon service for the domain
                                  domainCounts[domain] = {
                                    count: 0,
                                    favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
                                  };
                                }
                                domainCounts[domain].count++;
                              } catch (e) {
                                // Invalid URL, skip
                              }
                            });

                            const domains = Object.entries(domainCounts)
                              .filter(([domain]) =>
                                !filterSearch || domain.toLowerCase().includes(filterSearch.toLowerCase())
                              )
                              .sort(([, a], [, b]) => b.count - a.count);

                            if (domains.length === 0) {
                              return (
                                <div className="px-2 py-4 text-sm text-gray-500 text-center">
                                  {filterSearch ? 'No domains found' : 'No links with domains yet'}
                                </div>
                              );
                            }

                            return domains.map(([domain, { count, favicon }]) => (
                              <div
                                key={domain}
                                className="flex items-center justify-between px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                                onClick={() => {
                                  setActiveFilters({
                                    ...activeFilters,
                                    domain: activeFilters.domain === domain ? undefined : domain
                                  });
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                    {favicon ? (
                                      <img
                                        src={favicon}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // Hide the broken image and show Globe icon instead
                                          (e.target as HTMLImageElement).style.display = 'none';
                                          const parent = (e.target as HTMLImageElement).parentElement;
                                          if (parent) {
                                            const globeIcon = document.createElement('div');
                                            globeIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>';
                                            parent.appendChild(globeIcon);
                                          }
                                        }}
                                      />
                                    ) : (
                                      <Globe className="h-3.5 w-3.5 text-gray-600" />
                                    )}
                                  </div>
                                  <span className="text-sm">{domain}</span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {count}
                                </span>
                              </div>
                            ));
                          })()}
                        </div>
                      </>
                    ) : filterView === 'creator' ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => {
                              setFilterView('main');
                              setFilterSearch('');
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <ChevronDown className="h-4 w-4 rotate-90" />
                          </button>
                          <Input
                            placeholder="Creator..."
                            className="h-8 text-sm flex-1"
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            autoFocus
                          />
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                          {(() => {
                            // Get unique creators from all links with their email and count
                            const creatorCounts: { [key: string]: { email?: string; name?: string; count: number } } = {};

                            // Build a map of user IDs to user data
                            const userMap: { [key: string]: { email: string; name?: string } } = {};
                            membersData?.forEach(member => {
                              if (member.user) {
                                userMap[member.userId] = {
                                  email: member.user.email,
                                  name: member.user.name || undefined
                                };
                              }
                            });

                            // Count links per creator
                            linksData?.links.forEach(link => {
                              const creatorId = link.created_by;
                              if (creatorId) {
                                if (!creatorCounts[creatorId]) {
                                  const userData = userMap[creatorId];
                                  creatorCounts[creatorId] = {
                                    email: userData?.email,
                                    name: userData?.name,
                                    count: 0
                                  };
                                }
                                creatorCounts[creatorId].count++;
                              }
                            });

                            const creators = Object.entries(creatorCounts)
                              .filter(([_, creator]) =>
                                !filterSearch ||
                                creator.email?.toLowerCase().includes(filterSearch.toLowerCase()) ||
                                creator.name?.toLowerCase().includes(filterSearch.toLowerCase())
                              )
                              .sort(([, a], [, b]) => b.count - a.count);

                            if (creators.length === 0) {
                              return (
                                <div className="px-2 py-4 text-sm text-gray-500 text-center">
                                  {filterSearch ? 'No creators found' : 'No creators yet'}
                                </div>
                              );
                            }

                            return creators.map(([creatorId, { email, name, count }]) => (
                              <div
                                key={creatorId}
                                className="flex items-center justify-between px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                                onClick={() => {
                                  setActiveFilters({
                                    ...activeFilters,
                                    creator: activeFilters.creator === creatorId ? undefined : creatorId
                                  });
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                                    <User className="h-3 w-3 text-orange-600" />
                                  </div>
                                  <span className="text-sm">{email || 'Unknown'}</span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {count}
                                </span>
                              </div>
                            ));
                          })()}
                        </div>
                      </>
                    ) : null}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-2 h-9 px-3 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    <LayoutGrid className="h-4 w-4" />
                    <span>Display</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96 p-5">
                  {/* View Mode */}
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewMode('cards')}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-4 px-4 rounded-lg border transition-colors ${
                          viewMode === 'cards'
                            ? 'border-gray-400 bg-gray-100'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <Square className="h-5 w-5" />
                        <span className="text-sm font-medium">Cards</span>
                      </button>
                      <button
                        onClick={() => setViewMode('rows')}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-4 px-4 rounded-lg border transition-colors ${
                          viewMode === 'rows'
                            ? 'border-gray-400 bg-gray-100'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <Rows3 className="h-5 w-5" />
                        <span className="text-sm font-medium">Rows</span>
                      </button>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Ordering */}
                  <div className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Ordering</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-2 py-1 hover:bg-gray-50 rounded">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {sortBy === 'date' && 'Date created'}
                              {sortBy === 'clicks' && 'Total clicks'}
                              {sortBy === 'lastClicked' && 'Last clicked'}
                              {sortBy === 'sales' && 'Total sales'}
                            </span>
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => setSortBy('date')}
                            className="flex items-center gap-2"
                          >
                            <Calendar className="h-3.5 w-3.5 text-gray-500" />
                            <span>Date created</span>
                            {sortBy === 'date' && <Check className="h-3.5 w-3.5 ml-auto" />}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSortBy('clicks')}
                            className="flex items-center gap-2"
                          >
                            <MousePointerClick className="h-3.5 w-3.5 text-gray-500" />
                            <span>Total clicks</span>
                            {sortBy === 'clicks' && <Check className="h-3.5 w-3.5 ml-auto" />}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSortBy('lastClicked')}
                            className="flex items-center gap-2"
                          >
                            <Clock className="h-3.5 w-3.5 text-gray-500" />
                            <span>Last clicked</span>
                            {sortBy === 'lastClicked' && <Check className="h-3.5 w-3.5 ml-auto" />}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSortBy('sales')}
                            className="flex items-center gap-2"
                          >
                            <DollarSign className="h-3.5 w-3.5 text-gray-500" />
                            <span>Total sales</span>
                            {sortBy === 'sales' && <Check className="h-3.5 w-3.5 ml-auto" />}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Show archived links */}
                  <div className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Show archived links</span>
                      </div>
                      <Switch
                        checked={showArchived}
                        onCheckedChange={setShowArchived}
                      />
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Display Properties */}
                  <div className="py-3">
                    <p className="text-xs text-gray-500 uppercase mb-3 font-semibold tracking-wider">Display Properties</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={displayProperties.shortLink ? "default" : "outline"}
                        className="cursor-pointer text-xs px-3 py-1 font-medium"
                        onClick={() => setDisplayProperties(prev => ({ ...prev, shortLink: !prev.shortLink }))}
                      >
                        Short link
                      </Badge>
                      <Badge
                        variant={displayProperties.destinationUrl ? "default" : "outline"}
                        className="cursor-pointer text-xs px-3 py-1 font-medium"
                        onClick={() => setDisplayProperties(prev => ({ ...prev, destinationUrl: !prev.destinationUrl }))}
                      >
                        Destination URL
                      </Badge>
                      <Badge
                        variant={displayProperties.title ? "default" : "outline"}
                        className="cursor-pointer text-xs px-3 py-1 font-medium"
                        onClick={() => setDisplayProperties(prev => ({ ...prev, title: !prev.title }))}
                      >
                        Title
                      </Badge>
                      <Badge
                        variant={displayProperties.description ? "default" : "outline"}
                        className="cursor-pointer text-xs px-3 py-1 font-medium"
                        onClick={() => setDisplayProperties(prev => ({ ...prev, description: !prev.description }))}
                      >
                        Description
                      </Badge>
                      <Badge
                        variant={displayProperties.createdDate ? "default" : "outline"}
                        className="cursor-pointer text-xs px-3 py-1 font-medium"
                        onClick={() => setDisplayProperties(prev => ({ ...prev, createdDate: !prev.createdDate }))}
                      >
                        Created Date
                      </Badge>
                      <Badge
                        variant={displayProperties.creator ? "default" : "outline"}
                        className="cursor-pointer text-xs px-3 py-1 font-medium"
                        onClick={() => setDisplayProperties(prev => ({ ...prev, creator: !prev.creator }))}
                      >
                        Creator
                      </Badge>
                      <Badge
                        variant={displayProperties.tags ? "default" : "outline"}
                        className="cursor-pointer text-xs px-3 py-1 font-medium"
                        onClick={() => setDisplayProperties(prev => ({ ...prev, tags: !prev.tags }))}
                      >
                        Tags
                      </Badge>
                      <Badge
                        variant={displayProperties.analytics ? "default" : "outline"}
                        className="cursor-pointer text-xs px-3 py-1 font-medium"
                        onClick={() => setDisplayProperties(prev => ({ ...prev, analytics: !prev.analytics }))}
                      >
                        Analytics
                      </Badge>
                    </div>
                  </div>

                  {/* Footer buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <button className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                      Reset to default
                    </button>
                    <button className="flex-1 px-3 py-2 text-sm text-white bg-black hover:bg-gray-800 rounded-md transition-colors">
                      Set as default
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right aligned search and more options */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by short link or URL"
                  className="h-9 w-72 pl-10 pr-3 text-sm text-gray-600 placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button className="flex items-center justify-center h-9 w-9 text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content wrapper with flex-1 to push footer to bottom */}
        <div className="flex-1 flex flex-col">
          {/* Content Area */}
          <div className="flex-1" style={{ marginLeft: '109.5px', marginRight: '109.5px', minHeight: '400px' }}>
            {linksLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading links...</div>
              </div>
            ) : linksData?.links && linksData.links.length > 0 ? (
              <div className="flex flex-col h-full">
                {/* Links display - Cards or Rows */}
                {viewMode === 'cards' ? (
                  <div className="flex-1 overflow-auto py-4 space-y-2">
                    {linksData.links.map((link) => (
                      <LinkRow
                        key={link.id}
                        link={link}
                        domain={workspace?.domain || 'isla.sh'}
                        onEdit={handleEditLink}
                        onDelete={handleDeleteLink}
                        onRefresh={refetchLinks}
                        workspaceId={workspace?.id}
                      />
                    ))}
                  </div>
                ) : (
                  // Table view for rows mode (matching tags page format)
                  <div className="flex-1 overflow-auto py-4">
                    <div className="border border-gray-200 rounded-lg bg-white">
                      <table className="w-full">
                        <tbody>
                          {linksData.links.map((link, index) => {
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
                                  return `${minutes}h`;
                                } else if (diffInSeconds < 86400) {
                                  const hours = Math.floor(diffInSeconds / 3600);
                                  return `${hours}h`;
                                } else {
                                  const days = Math.floor(diffInSeconds / 86400);
                                  return `${days}d`;
                                }
                              } catch {
                                return '';
                              }
                            };

                            return (
                              <tr
                                key={link.id}
                                className={`group ${index !== linksData.links.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-gray-50 cursor-pointer`}
                                onClick={() => handleEditLink(link.id)}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full border border-gray-200 flex-shrink-0 overflow-hidden">
                                      {link.favicon ? (
                                        <img
                                          src={link.favicon}
                                          alt=""
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const fallback = document.createElement('div');
                                            fallback.className = 'w-full h-full bg-gradient-to-br from-green-400 to-green-600';
                                            e.currentTarget.parentElement?.appendChild(fallback);
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600" />
                                      )}
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {workspace?.domain || 'isla.sh'}/{link.slug}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const displayDomain = workspace?.domain || 'isla.sh';
                                        const shortUrl = `https://${displayDomain}/${link.slug}`;
                                        navigator.clipboard.writeText(shortUrl);
                                        toast.success('Link copied to clipboard!');
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-all"
                                      title="Copy link"
                                    >
                                      <Copy className="h-3 w-3 text-gray-500" />
                                    </button>
                                    <span className="text-xs text-gray-500">Visit {formatUrl(link.url)}</span>
                                    <span className="text-xs text-gray-400 mx-1">•</span>
                                    <User className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">{getTimeAgo()}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <div className="inline-flex items-center gap-1.5">
                                      <MousePointerClick className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm text-gray-600">{link.clicks || 0} clicks</span>
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                          }}
                                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        >
                                          <MoreVertical className="h-4 w-4 text-gray-400" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditLink(link.id);
                                          }}
                                          className="flex items-center gap-3 py-2.5 px-3"
                                        >
                                          <Edit className="h-4 w-4 text-gray-600" />
                                          <span className="flex-1">Edit</span>
                                          <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">E</kbd>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setQRCodeLink(link);
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
                                            // TODO: Duplicate link
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
                                          }}
                                          className="flex items-center gap-3 py-2.5 px-3"
                                        >
                                          <FolderInput className="h-4 w-4 text-gray-600" />
                                          <span className="flex-1">Move</span>
                                          <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">M</kbd>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // TODO: Archive link
                                          }}
                                          className="flex items-center gap-3 py-2.5 px-3"
                                        >
                                          <Archive className="h-4 w-4 text-gray-600" />
                                          <span className="flex-1">Archive</span>
                                          <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">A</kbd>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // TODO: Transfer link
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
                                            handleDeleteLink(link.id);
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
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                {/* Animated Placeholder Links Container */}
                <div className="mb-6 h-28 relative overflow-hidden" style={{ width: '280px' }}>
                  {/* Scrolling animation container - doubled for seamless loop */}
                  <div className="flex flex-col gap-3 animate-scroll-vertical">
                    {/* First set */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Link className="h-4 w-4 text-gray-400" />
                        <div className="h-2 w-24 bg-gray-200 rounded"></div>
                      </div>
                      <MousePointerClick className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Link className="h-4 w-4 text-gray-400" />
                        <div className="h-2 w-20 bg-gray-200 rounded"></div>
                      </div>
                      <MousePointerClick className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Link className="h-4 w-4 text-gray-400" />
                        <div className="h-2 w-28 bg-gray-200 rounded"></div>
                      </div>
                      <MousePointerClick className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Link className="h-4 w-4 text-gray-400" />
                        <div className="h-2 w-16 bg-gray-200 rounded"></div>
                      </div>
                      <MousePointerClick className="h-4 w-4 text-gray-400" />
                    </div>
                    {/* Duplicate set for seamless loop */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Link className="h-4 w-4 text-gray-400" />
                        <div className="h-2 w-24 bg-gray-200 rounded"></div>
                      </div>
                      <MousePointerClick className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Link className="h-4 w-4 text-gray-400" />
                        <div className="h-2 w-20 bg-gray-200 rounded"></div>
                      </div>
                      <MousePointerClick className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Link className="h-4 w-4 text-gray-400" />
                        <div className="h-2 w-28 bg-gray-200 rounded"></div>
                      </div>
                      <MousePointerClick className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Link className="h-4 w-4 text-gray-400" />
                        <div className="h-2 w-16 bg-gray-200 rounded"></div>
                      </div>
                      <MousePointerClick className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Empty State Text and Buttons */}
                <div className="text-center max-w-md">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">No links yet</h2>
                  <p className="text-gray-500 mb-7 text-sm leading-relaxed">
                    Start creating short links for your marketing campaigns,<br />
                    referral programs, and more.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <KeyboardShortcutButton
                      className="h-10 px-5 bg-black text-white hover:bg-gray-800 text-sm font-medium rounded-md"
                      shortcut="c"
                      onShortcut={() => setIsCreateModalOpen(true)}
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      Create link
                    </KeyboardShortcutButton>
                    <Button
                      variant="outline"
                      className="h-10 px-5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md"
                    >
                      Learn more
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Spacer to push footer down */}
          <div className="flex-1"></div>
        </div>

        {/* Footer - now sticks to bottom */}
        <LinksFooter
          totalLinks={linksData?.total || 0}
          currentPage={1}
          hasNextPage={false}
          hasPreviousPage={false}
        />
      </div>

      {/* Onboarding complete modal - shows when onboarded=true */}
      <OnboardingCompleteModal />

      {/* Create/Edit Link Modal */}
      {workspace && (
        <CreateLinkModal
          isOpen={isCreateModalOpen || !!editingLink}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingLink(null);
            refetchLinks();
          }}
          workspaceId={workspace.id}
          workspaceSlug={workspaceSlug}
          existingLink={editingLink}
        />
      )}

      {/* Delete Link Dialog */}
      {selectedLink && (
        <DeleteLinkDialog
          link={selectedLink}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onDelete={handleConfirmDelete}
          isDeleting={deleteLinkMutation.isLoading}
        />
      )}

      {/* QR Code Modal */}
      {qrCodeLink && workspace && (
        <QRCodeEditor
          isOpen={!!qrCodeLink}
          onClose={() => setQRCodeLink(null)}
          url={`https://${workspace.domain || 'isla.sh'}/${qrCodeLink.slug}`}
          onSave={async (options) => {
            await updateLinkMutation.mutateAsync({
              id: qrCodeLink.id,
              workspaceId: workspace.id,
              qrCodeSettings: options
            });
            toast.success('QR code settings saved!');
            // Update the link with new settings to show immediately
            setQRCodeLink({ ...qrCodeLink, qr_code_settings: options });
            // Refetch to ensure consistency
            refetchLinks();
            setQRCodeLink(null);
          }}
          currentOptions={qrCodeLink.qr_code_settings || {
            backgroundColor: '#FFFFFF',
            foregroundColor: '#000000',
            logo: undefined
          }}
        />
      )}
    </>
  );
}