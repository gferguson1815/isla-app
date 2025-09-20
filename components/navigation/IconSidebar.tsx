"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Link as LinkIcon,
  Users2,
  Gift,
  HelpCircle,
  User,
  LogOut,
  Settings,
  DollarSign,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface IconSidebarProps {
  workspaceLogo?: string;
  workspaceName?: string;
  userAvatar?: string;
  userName?: string;
  userEmail?: string;
}

export function IconSidebar({
  workspaceLogo,
  workspaceName = "Isla",
  userAvatar,
  userName,
  userEmail,
}: IconSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [helpSearchQuery, setHelpSearchQuery] = useState("");

  // Determine active section
  const isShortLinksActive = pathname.startsWith("/links") ||
                            pathname.startsWith("/domains") ||
                            pathname === "/dashboard" ||
                            pathname.startsWith("/analytics") ||
                            pathname.startsWith("/events") ||
                            pathname.startsWith("/customers") ||
                            pathname.startsWith("/folders") ||
                            pathname.startsWith("/tags") ||
                            pathname.startsWith("/utm-templates");
  const isPartnerProgramActive = pathname.startsWith("/partners");

  const getInitials = (name: string | undefined, email: string | undefined) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email && email.length > 0) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  const helpArticles = [
    { title: "What is Isla?", description: "How Isla works, what it can do for your business and what makes it..." },
    { title: "How to create a short link on Isla?", description: "Learn how to create your first short link on Isla and start tracking your..." },
    { title: "How to add a custom domain to Isla", description: "Learn how to add a custom domain your Isla workspace for free - no cre..." },
    { title: "How to invite teammates on Isla", description: "Learn how to invite teammates to your Isla workspace and start..." },
    { title: "Isla Analytics Overview", description: "Learn about how you can use the Isla Analytics to better understand your..." },
    { title: "Isla Conversions Overview", description: "Learn how you can use Isla's Conversion Analytics feature to understand..." },
  ];

  return (
    <div className="flex h-screen w-16 flex-col items-center border-r border-gray-200" style={{ backgroundColor: '#e5e5e5' }}>
      {/* Site Name - aligned with nav panel header */}
      <div className="h-[72px] flex items-center justify-center">
        <span className="text-xl font-semibold text-gray-900">isla</span>
      </div>

      {/* Workspace Icon */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mb-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all hover:bg-gray-100 hover:scale-110">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <span className="text-xs font-semibold">
                  {workspaceName[0].toUpperCase()}
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {workspaceName}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Short Links Icon */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/links"
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg transition-all hover:scale-110 ${
                isShortLinksActive
                  ? "bg-white shadow-sm"
                  : "hover:bg-gray-100"
              }`}
            >
              <LinkIcon className={`h-4 w-4 ${isShortLinksActive ? "text-gray-900" : "text-gray-600"}`} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <div className="w-48">
              <div className="mb-1 font-medium">Short Links</div>
              <div className="text-xs text-gray-500">
                Create, organize, and measure the performance of your short links.
              </div>
              <Link href="/learn-more" className="mt-2 inline-block text-xs font-medium underline">
                Learn more
              </Link>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Partner Program Icon */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/partners"
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg transition-all hover:scale-110 ${
                isPartnerProgramActive
                  ? "bg-white shadow-sm"
                  : "hover:bg-gray-100"
              }`}
            >
              <Users2 className={`h-4 w-4 ${isPartnerProgramActive ? "text-gray-900" : "text-gray-600"}`} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <div className="w-48">
              <div className="mb-1 font-medium">Partner Program</div>
              <div className="text-xs text-gray-500">
                Kickstart viral product-led growth with powerful, branded referral and affiliate programs.
              </div>
              <Link href="/learn-more" className="mt-2 inline-block text-xs font-medium underline">
                Learn more
              </Link>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Section */}
      <div className="flex flex-col items-center pb-4">
        {/* Referral/Gift Icon */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/referral"
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
              >
                <Gift className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Referrals
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Help Icon */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100">
              <HelpCircle className="h-5 w-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" align="end" className="w-[480px] p-0">
            <div className="p-4">
              <h3 className="mb-3 flex items-center gap-2 text-base font-medium">
                <span className="text-xl">👋</span> How can we help?
              </h3>
              <Input
                placeholder="Search articles, guides, and more..."
                value={helpSearchQuery}
                onChange={(e) => setHelpSearchQuery(e.target.value)}
                className="mb-4"
              />
              <div className="space-y-2">
                {helpArticles.map((article, index) => (
                  <Link
                    key={index}
                    href="#"
                    className="block rounded-lg p-3 hover:bg-gray-50"
                  >
                    <div className="text-sm font-medium text-blue-600">
                      {article.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {article.description}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
              <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
                <span>💬</span> Contact us
              </button>
              <Link
                href="/help"
                className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
              >
                Help center
                <span className="text-xs">↗</span>
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-gray-100">
              <Avatar className="h-7 w-7">
                <AvatarImage src={userAvatar} alt={userName || userEmail} />
                <AvatarFallback className="text-xs">
                  {getInitials(userName, userEmail)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <div className="px-2 py-1.5">
              <div className="text-sm font-medium">{userName || "User"}</div>
              <div className="text-xs text-gray-500">{userEmail}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings/account")}>
              <User className="mr-2 h-4 w-4" />
              Account settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/referral")}>
              <DollarSign className="mr-2 h-4 w-4" />
              Refer and earn
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/logout")}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}