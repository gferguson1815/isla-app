"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { KeyboardShortcutButton } from "@/components/ui/keyboard-shortcut-button";
import { Input } from "@/components/ui/input";
import { api } from "@/utils/api";
import {
  ChevronDown,
  ChevronsUpDown,
  Search,
  Filter,
  LayoutGrid,
  Plus,
  MoreVertical,
  Folder,
  Link,
  MousePointerClick
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OnboardingCompleteModal } from "./components/OnboardingCompleteModal";
import { LinksFooter } from "@/components/links/LinksFooter";
import { CreateLinkModal } from "@/components/links/CreateLinkModal";

export default function LinksPage() {
  const params = useParams();
  const workspaceSlug = params.workspace as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch workspace by slug to get the actual UUID
  const { data: workspace } = api.workspace.getBySlug.useQuery(
    { slug: workspaceSlug },
    { enabled: !!workspaceSlug }
  );

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
              <button className="inline-flex items-center gap-2 h-9 px-3 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filter</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </button>

              <button className="inline-flex items-center gap-2 h-9 px-3 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <LayoutGrid className="h-4 w-4" />
                <span>Display</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </button>
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
          {/* Content Area with Border */}
          <div className="border border-gray-200 rounded-lg bg-white" style={{ height: '400px', marginLeft: '109.5px', marginRight: '109.5px' }}>
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
          </div>

          {/* Spacer to push footer down */}
          <div className="flex-1"></div>
        </div>

        {/* Footer - now sticks to bottom */}
        <LinksFooter
          totalLinks={0}
          currentPage={1}
          hasNextPage={false}
          hasPreviousPage={false}
        />
      </div>

      {/* Onboarding complete modal - shows when onboarded=true */}
      <OnboardingCompleteModal />

      {/* Create Link Modal */}
      {workspace && (
        <CreateLinkModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          workspaceId={workspace.id}
          workspaceSlug={workspaceSlug}
        />
      )}
    </>
  );
}