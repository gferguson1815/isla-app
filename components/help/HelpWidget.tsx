"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HelpCircle,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  X,
} from "lucide-react";

interface HelpArticle {
  id: string;
  title: string;
  description: string;
}

const helpArticles: HelpArticle[] = [
  {
    id: "what-is-isla",
    title: "What is Isla?",
    description: "How Isla works, what it can do for your business and what makes it different",
  },
  {
    id: "how-to-create-links",
    title: "How to create a short link on Isla?",
    description: "Learn how to create your first short link on Isla and start tracking your clicks",
  },
  {
    id: "custom-domain",
    title: "How to add a custom domain to Isla",
    description: "Learn how to add a custom domain your Isla workspace for free - no credit card required",
  },
  {
    id: "invite-teammates",
    title: "How to invite teammates on Isla",
    description: "Learn how to invite teammates to your Isla workspace and start collaborating",
  },
  {
    id: "analytics-overview",
    title: "Isla Analytics Overview",
    description: "Learn about how you can use Isla Analytics to better understand your audience",
  },
  {
    id: "conversions-overview",
    title: "Isla Conversions Overview",
    description: "Learn how you can use Isla's Conversion Analytics feature to understand your conversion funnel",
  },
];

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const popupRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const filteredArticles = useMemo(
    () => helpArticles.filter(
      (article) =>
        article.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    ),
    [debouncedSearchQuery]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && (e.metaKey || e.ctrlKey || e.shiftKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={popupRef}>
      {/* Help Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 rounded-full shadow-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700 transition-colors"
          aria-label="Open help"
        >
          <span className="text-2xl font-medium text-gray-600 dark:text-gray-300">?</span>
        </button>
      )}

      {/* Help Popup */}
      {isOpen && (
        <div className="absolute bottom-0 right-0 w-[400px] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-5 duration-200">
          <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-2xl">👋</span>
                <span>How can we help?</span>
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Input
              placeholder="Search articles, guides, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-gray-200 focus:border-gray-300"
              autoFocus
            />
          </div>

          <ScrollArea className="h-[400px]">
            <div className="p-6 pt-2">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <button
                    key={article.id}
                    className="w-full text-left py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group flex items-center justify-between -mx-6 px-6"
                    onClick={() => {
                      // Navigate to help article
                      window.open(`/help/${article.id}`, '_blank');
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex-1 pr-4">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                        {article.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {article.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No articles found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <button
              onClick={() => {
                window.open('/support/contact', '_blank');
                setIsOpen(false);
              }}
              className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact us</span>
            </button>

            <a
              href="/help"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <span>Help center</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}