"use client";

import { Fragment } from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  const allItems = [
    { label: "Home", href: "/dashboard", icon: <Home className="h-4 w-4" /> },
    ...items,
  ];

  return (
    <nav aria-label="Breadcrumb" className={cn("flex", className)}>
      <ol className="flex items-center space-x-1 text-sm">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isFirst = index === 0;

          return (
            <Fragment key={index}>
              {!isFirst && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              <li>
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors",
                      item.current && "text-foreground"
                    )}
                  >
                    {"icon" in item && item.icon}
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "flex items-center gap-1 font-medium",
                      isLast ? "text-foreground" : "text-muted-foreground"
                    )}
                    aria-current={item.current ? "page" : undefined}
                  >
                    {"icon" in item && item.icon}
                    {item.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
