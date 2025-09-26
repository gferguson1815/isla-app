"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { KeyboardShortcutButton } from "@/components/ui/keyboard-shortcut-button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Input } from "@/components/ui/input";
import { api } from "@/utils/api";
import { toast } from "sonner";
import { CreateUTMTemplateModal } from "@/components/utm/CreateUTMTemplateModal";
import { DeleteUTMTemplateDialog } from "@/components/utm/DeleteUTMTemplateDialog";
import {
  ChevronDown,
  ChevronsUpDown,
  Search,
  Filter,
  LayoutGrid,
  Plus,
  MoreVertical,
  Link2,
  Milestone,
  FlagTriangleRight,
  Hash,
  HelpCircle,
  Globe,
  Edit2,
  Copy,
  Trash2,
  DollarSign,
  Megaphone,
  FileText,
  Gift,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UTMTemplatesPage() {
  const params = useParams();
  const workspaceSlug = params.workspace as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<{ id: string; name: string } | null>(null);

  // Fetch workspace by slug to get the actual UUID
  const { data: workspace } = api.workspace.getBySlug.useQuery(
    { slug: workspaceSlug },
    { enabled: !!workspaceSlug }
  );

  // Fetch templates from the backend
  const { data: templates, isLoading, refetch } = api.utmTemplate.list.useQuery(
    { workspaceId: workspace?.id || "" },
    { enabled: !!workspace?.id }
  );


  // Filter templates based on search query
  const filteredTemplates = (templates || [])?.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Handle keyboard shortcut for creating template (Cmd/Ctrl + U)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
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
        <div className="flex h-14 items-center justify-between" style={{ marginLeft: '24px', marginRight: '24px' }}>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-lg">UTM Templates</h1>
            <InfoTooltip
              content={
                <div>
                  Learn how to use UTM templates to quickly add consistent tracking parameters to your links.{" "}
                  <a
                    href="https://isla.so/help/article/how-to-create-utm-templates"
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
            shortcut="u"
            onShortcut={() => setIsCreateModalOpen(true)}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create template
          </KeyboardShortcutButton>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white flex flex-col">
        {/* Search bar */}
        <div className="pt-4 pb-4" style={{ marginLeft: '24px', marginRight: '24px' }}>
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
          <div style={{ marginLeft: '24px', marginRight: '24px' }}>
            {isLoading ? (
              // Loading state
              <div className="border border-gray-200 rounded-lg bg-white flex items-center justify-center" style={{ minHeight: '400px' }}>
                <div className="text-gray-500">Loading templates...</div>
              </div>
            ) : filteredTemplates.length > 0 ? (
              // Templates Table with pagination
              <>
                <div className="border border-gray-200 rounded-lg bg-white">
                  <table className="w-full">
                    <tbody>
                      {filteredTemplates.map((template, index) => (
                        <tr
                          key={template.id}
                          className={`${index !== filteredTemplates.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-gray-50`}
                        >
                          <td className="px-6 py-4 w-full">
                            <div className="flex items-center gap-3">
                              {/* Milestone icon */}
                              <div className="w-6 h-6 rounded flex items-center justify-center border border-gray-200 bg-gray-50">
                                <Milestone className="h-3.5 w-3.5 text-gray-500" />
                              </div>
                              {/* User Avatar with tooltip */}
                              <div className="relative group">
                                <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600">
                                  {template.creator?.email ? (
                                    <span className="text-xs font-medium">
                                      {template.creator.email.substring(0, 2).toUpperCase()}
                                    </span>
                                  ) : (
                                    <User className="h-4 w-4" />
                                  )}
                                </div>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                  {template.creator?.email || 'Unknown user'}
                                </div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {template.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 w-auto">
                            <div className="flex items-center justify-end">
                              {/* Individual UTM parameter icons */}
                              <div className="relative group">
                                <div className="inline-flex items-center gap-1">
                                  {template.utm_source && (
                                    <div className="w-6 h-6 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                                      <Globe className="h-3.5 w-3.5 text-gray-500" />
                                    </div>
                                  )}
                                  {template.utm_medium && (
                                    <div className="w-6 h-6 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                                      <DollarSign className="h-3.5 w-3.5 text-gray-500" />
                                    </div>
                                  )}
                                  {template.utm_campaign && (
                                    <div className="w-6 h-6 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                                      <Megaphone className="h-3.5 w-3.5 text-gray-500" />
                                    </div>
                                  )}
                                  {template.utm_term && (
                                    <div className="w-6 h-6 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                                      <Search className="h-3.5 w-3.5 text-gray-500" />
                                    </div>
                                  )}
                                  {template.utm_content && (
                                    <div className="w-6 h-6 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                                      <FileText className="h-3.5 w-3.5 text-gray-500" />
                                    </div>
                                  )}
                                  {template.referral && (
                                    <div className="w-6 h-6 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                                      <Gift className="h-3.5 w-3.5 text-gray-500" />
                                    </div>
                                  )}
                                </div>
                                {/* Unified Tooltip showing all parameters */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 min-w-[200px]">
                                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                                    <div className="inline-flex items-center gap-1">
                                      <Globe className="h-3 w-3 text-gray-400" />
                                      <DollarSign className="h-3 w-3 text-gray-400" />
                                      <FlagTriangleRight className="h-3 w-3 text-gray-400" />
                                      <FileText className="h-3 w-3 text-gray-400" />
                                      <Copy className="h-3 w-3 text-gray-400" />
                                      <Gift className="h-3 w-3 text-gray-400" />
                                    </div>
                                  </div>
                                  <div className="space-y-1.5 text-sm">
                                    {template.utm_source && (
                                      <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">Source</span>
                                        <span className="text-gray-900 font-medium text-right">{template.utm_source}</span>
                                      </div>
                                    )}
                                    {template.utm_medium && (
                                      <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">Medium</span>
                                        <span className="text-gray-900 font-medium text-right">{template.utm_medium}</span>
                                      </div>
                                    )}
                                    {template.utm_campaign && (
                                      <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">Campaign</span>
                                        <span className="text-gray-900 font-medium text-right">{template.utm_campaign}</span>
                                      </div>
                                    )}
                                    {template.utm_term && (
                                      <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">Term</span>
                                        <span className="text-gray-900 font-medium text-right">{template.utm_term}</span>
                                      </div>
                                    )}
                                    {template.utm_content && (
                                      <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">Content</span>
                                        <span className="text-gray-900 font-medium text-right">{template.utm_content}</span>
                                      </div>
                                    )}
                                    {template.referral && (
                                      <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">Referral</span>
                                        <span className="text-gray-900 font-medium text-right">{template.referral}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-sm text-gray-500">
                                {new Date(template.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                    <MoreVertical className="h-4 w-4 text-gray-400" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingTemplate({
                                        id: template.id,
                                        name: template.name,
                                        source: template.utm_source,
                                        medium: template.utm_medium,
                                        campaign: template.utm_campaign,
                                        term: template.utm_term,
                                        content: template.utm_content,
                                        referral: template.referral,
                                      });
                                      setIsCreateModalOpen(true);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'e' || e.key === 'E') {
                                        e.preventDefault();
                                        setEditingTemplate({
                                          id: template.id,
                                          name: template.name,
                                          source: template.utm_source,
                                          medium: template.utm_medium,
                                          campaign: template.utm_campaign,
                                          term: template.utm_term,
                                          content: template.utm_content,
                                          referral: template.referral,
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
                                      setDeletingTemplate({
                                        id: template.id,
                                        name: template.name,
                                      });
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'x' || e.key === 'X') {
                                        e.preventDefault();
                                        setDeletingTemplate({
                                          id: template.id,
                                          name: template.name,
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
                    Viewing 1-{filteredTemplates.length} of {filteredTemplates.length} templates
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
              {/* Animated Placeholder Templates Container */}
              <div className="mb-6 relative overflow-hidden" style={{ width: '280px', height: '120px' }}>
                {/* Scrolling animation container - doubled for seamless loop */}
                <div className="flex flex-col gap-3 animate-scroll-vertical">
                  {/* First set */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Milestone className="h-4 w-4 text-gray-300" />
                    <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-300" />
                      <FlagTriangleRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Milestone className="h-4 w-4 text-gray-300" />
                    <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-300" />
                      <FlagTriangleRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                  {/* Duplicate set for seamless loop */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Milestone className="h-4 w-4 text-gray-300" />
                    <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-300" />
                      <FlagTriangleRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Milestone className="h-4 w-4 text-gray-300" />
                    <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-300" />
                      <FlagTriangleRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Empty State Text and Buttons */}
              <div className="text-center max-w-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No UTM templates yet</h2>
                <p className="text-gray-500 mb-7 text-sm leading-relaxed">
                  Create UTM templates to quickly add consistent tracking parameters to your links
                </p>
                <div className="flex items-center justify-center gap-3">
                  <KeyboardShortcutButton
                    className="h-10 px-5 bg-black text-white hover:bg-gray-800 text-sm font-medium rounded-md"
                    shortcut="u"
                    onShortcut={() => setIsCreateModalOpen(true)}
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    Create template
                  </KeyboardShortcutButton>
                  <Button
                    variant="outline"
                    className="h-10 px-5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md"
                    onClick={() => window.open('https://isla.so/help/article/how-to-create-utm-templates', '_blank')}
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
        <div className="pb-6 relative" style={{ marginLeft: '24px', marginRight: '24px' }}>
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

      {/* Create/Edit UTM Template Modal */}
      {workspace && (
        <CreateUTMTemplateModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingTemplate(null);
          }}
          workspaceId={workspace.id}
          workspaceSlug={workspaceSlug}
          initialValues={editingTemplate || undefined}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            setEditingTemplate(null);
            refetch();
          }}
        />
      )}

      {/* Delete UTM Template Dialog */}
      {deletingTemplate && workspace && (
        <DeleteUTMTemplateDialog
          template={deletingTemplate}
          workspaceId={workspace.id}
          open={!!deletingTemplate}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingTemplate(null);
            }
          }}
          onSuccess={() => {
            setDeletingTemplate(null);
            refetch();
          }}
        />
      )}
    </>
  );
}