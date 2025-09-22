"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronsUpDown,
  Search,
  Filter,
  LayoutGrid,
  Plus,
  MoreVertical,
  Folder,
  Link2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LinksPage() {
  const [searchQuery, setSearchQuery] = useState("");

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
          <Button className="h-9 px-4 bg-black text-white hover:bg-gray-800 text-sm font-medium">
            Create link
            <kbd className="ml-2 inline-flex h-5 items-center px-1.5 rounded bg-gray-800 text-[10px] font-medium text-gray-300">
              C
            </kbd>
          </Button>
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
              {/* Animated Placeholder Links */}
              <div className="mb-10 space-y-3">
                {/* First placeholder link */}
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <Link2 className="h-4 w-4 text-gray-400" />
                    <div className="h-2 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-gray-300 text-sm">%</div>
                </div>

                {/* Second placeholder link */}
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <Link2 className="h-4 w-4 text-gray-400" />
                    <div className="h-2 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-gray-300 text-sm">%</div>
                </div>
              </div>

              {/* Empty State Text and Buttons */}
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No links yet</h2>
                <p className="text-gray-500 mb-6 text-sm">
                  Start creating short links for your marketing campaigns,<br />
                  referral programs, and more.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button className="h-9 px-4 bg-black text-white hover:bg-gray-800 text-sm font-medium">
                    Create link
                    <kbd className="ml-2 inline-flex h-4 items-center px-1 rounded bg-gray-700 text-[10px] font-medium text-gray-300">
                      C
                    </kbd>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 px-4 text-sm text-gray-600 bg-white hover:bg-gray-50 border-gray-300"
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
        <div className="pb-6" style={{ marginLeft: '109.5px', marginRight: '109.5px' }}>
          <div className="px-8 py-4 border border-gray-200 rounded-lg bg-white shadow-sm mx-auto w-fit">
            <div className="flex items-center gap-12">
              <span className="text-sm text-gray-600">Viewing 0 links</span>
              <div className="flex items-center gap-6">
                <button
                  disabled
                  className="text-sm text-gray-400 hover:text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled
                  className="text-sm text-gray-400 hover:text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}