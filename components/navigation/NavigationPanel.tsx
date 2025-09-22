"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  ChevronRight,
  Plus,
  Link as LinkIcon,
  Globe,
  BarChart3,
  MousePointerClick,
  Users,
  FolderOpen,
  Tag,
  FileText,
  User,
  CreditCard,
  MessageCircle,
  UserPlus,
  Users2,
  TrendingUp,
  DollarSign,
  Trophy,
  Gift,
  Percent,
  Settings,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationPanelProps {
  activeSection: string;
}

export function NavigationPanel({ activeSection }: NavigationPanelProps) {
  const pathname = usePathname();
  const params = useParams();
  const workspace = params?.workspace as string;

  // Helper to build workspace-scoped URLs
  const getWorkspaceUrl = (path: string) => {
    return workspace ? `/${workspace}${path}` : path;
  };

  // Define navigation items based on active section
  const getSectionContent = () => {
    switch (activeSection) {
      case "links":
        return {
          title: "Short Links",
          sections: [
            {
              items: [
                { label: "Links", href: getWorkspaceUrl("/links"), icon: LinkIcon },
                { label: "Domains", href: getWorkspaceUrl("/links/domains"), icon: Globe },
              ],
            },
            {
              title: "Insights",
              items: [
                { label: "Analytics", href: getWorkspaceUrl("/analytics"), icon: BarChart3 },
                { label: "Events", href: getWorkspaceUrl("/events"), icon: MousePointerClick },
                { label: "Customers", href: getWorkspaceUrl("/customers"), icon: Users },
              ],
            },
            {
              title: "Library",
              items: [
                { label: "Folders", href: getWorkspaceUrl("/links/folders"), icon: FolderOpen },
                { label: "Tags", href: getWorkspaceUrl("/links/tags"), icon: Tag },
                { label: "UTM Templates", href: getWorkspaceUrl("/links/utm"), icon: FileText },
              ],
            },
          ],
        };
      case "partners":
        return {
          title: "Partner Program",
          sections: [
            {
              items: [
                { label: "Overview", href: "/program", icon: BarChart3 },
                { label: "Payouts", href: "/program/payouts", icon: CreditCard },
                { label: "Messages", href: "/program/messages", icon: MessageCircle, badge: "New" },
              ],
            },
            {
              title: "Partners",
              items: [
                { label: "All Partners", href: "/program/partners", icon: Users2 },
                { label: "Applications", href: "/program/partners/applications", icon: UserPlus },
                { label: "Groups", href: "/program/groups", icon: Users },
              ],
            },
            {
              title: "Insights",
              items: [
                { label: "Analytics", href: "/program/analytics", icon: TrendingUp },
                { label: "Commissions", href: "/program/commissions", icon: DollarSign },
              ],
            },
            {
              title: "Engagement",
              items: [
                { label: "Bounties", href: "/program/bounties", icon: Trophy, badge: "New" },
                { label: "Resources", href: "/program/resources", icon: FileText },
              ],
            },
            {
              title: "Configuration",
              items: [
                { label: "Rewards", href: "/program/groups/default/rewards", icon: Gift, expandable: true },
                { label: "Discounts", href: "/program/groups/default/discounts", icon: Percent, expandable: true },
                { label: "Link Settings", href: "/program/groups/default/links", icon: Settings, expandable: true },
                { label: "Branding", href: "/program/branding", icon: Palette },
              ],
            },
          ],
        };
      default:
        return {
          title: "Short Links",
          sections: [
            {
              items: [
                { label: "Links", href: getWorkspaceUrl("/links"), icon: LinkIcon },
                { label: "Domains", href: getWorkspaceUrl("/links/domains"), icon: Globe },
              ],
            },
          ],
        };
    }
  };

  const sectionContent = getSectionContent();

  if (!sectionContent) {
    return null;
  }

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex flex-col w-56 h-[calc(100vh-16px)] my-2 rounded-lg shadow-sm" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Section Header */}
      <div className="h-14 flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold text-gray-900">{sectionContent.title}</h2>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto">
        <div className="">
          {sectionContent.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-5">
              {section.title && (
                <div className="mb-2 px-4 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  {section.title}
                </div>
              )}
              <div className="px-2">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors ${
                      isActive(item.href)
                        ? "bg-gray-200 text-gray-900 font-medium"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon && <item.icon className="h-3.5 w-3.5" />}
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-700">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.expandable && (
                      <ChevronRight className="h-3 w-3 text-gray-400" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Stats (only for Short Links section) */}
      {activeSection === "links" && (
        <div className="border-t border-gray-200 px-4 py-4 rounded-b-lg">
          <div className="mb-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Usage</h3>
          </div>
          <div className="space-y-3 text-[13px]">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 text-gray-700">
                  <MousePointerClick className="h-3.5 w-3.5" />
                  Events
                </span>
                <span className="text-gray-900">0 of 1K</span>
              </div>
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400 rounded-full transition-all duration-300"
                  style={{ width: `${(0 / 1000) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 text-gray-700">
                  <LinkIcon className="h-3.5 w-3.5" />
                  Links
                </span>
                <span className="text-gray-900">0 of 25</span>
              </div>
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400 rounded-full transition-all duration-300"
                  style={{ width: `${(0 / 25) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Usage will reset Oct 17, 2025
          </div>

          {/* Upgrade Button */}
          <Button
            className="mt-4 w-full bg-black text-[13px] font-medium text-white hover:bg-gray-900"
            size="sm"
          >
            Get Dub Pro
          </Button>
        </div>
      )}
    </div>
  );
}