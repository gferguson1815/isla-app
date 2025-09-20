"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ChevronsUpDown, Globe } from "lucide-react";

export default function DomainsPage() {
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
                className="h-auto p-0 font-semibold text-xl hover:bg-transparent focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
              >
                Domains
                <ChevronsUpDown className="ml-1 h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[320px] p-2">
              <div className="p-2">
                <Input
                  placeholder="Search domains..."
                  className="h-9 mb-2"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  All domains
                  <span className="ml-auto">✓</span>
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="h-8 bg-black text-white hover:bg-gray-900" size="sm">
            Add domain
            <Plus className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center" style={{ marginLeft: '109.5px', marginRight: '109.5px' }}>
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold mb-2">No domains yet</h2>
            <p className="text-gray-600 mb-6">
              Connect your custom domain to start using branded short links.
            </p>
            <Button className="bg-black text-white hover:bg-gray-900">
              Add domain
              <Plus className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}