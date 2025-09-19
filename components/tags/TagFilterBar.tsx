'use client'

import { useState, useEffect } from 'react'
import { useTagFilterStore } from '@/lib/stores/tag-filter-store'
import { TagPill } from './TagPill'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { Filter, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'

interface TagFilterBarProps {
  workspaceId: string
  className?: string
  showPopularTags?: boolean
  maxPopularTags?: number
}

export function TagFilterBar({
  workspaceId,
  className,
  showPopularTags = true,
  maxPopularTags = 10,
}: TagFilterBarProps) {
  const {
    selectedTags,
    filterMode,
    isFilterActive,
    toggleTag,
    clearTags,
    setFilterMode,
  } = useTagFilterStore()

  const { data: popularTags = [] } = trpc.tag.list.useQuery(
    { workspaceId },
    {
      enabled: showPopularTags,
    }
  )

  const topTags = popularTags.slice(0, maxPopularTags)

  if (!showPopularTags && selectedTags.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Active Filters */}
      {selectedTags.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Active filters:
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {selectedTags.map((tag) => (
              <TagPill
                key={tag}
                tag={tag}
                onRemove={toggleTag}
                size="sm"
                variant="default"
              />
            ))}

            {selectedTags.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    {filterMode}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuCheckboxItem
                    checked={filterMode === 'AND'}
                    onCheckedChange={() => setFilterMode('AND')}
                  >
                    Match all tags (AND)
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterMode === 'OR'}
                    onCheckedChange={() => setFilterMode('OR')}
                  >
                    Match any tag (OR)
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={clearTags}
              className="h-7 px-2 text-red-600 hover:text-red-700"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Popular Tags */}
      {showPopularTags && topTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Popular tags:
          </span>
          {topTags.map((tag) => (
            <TagPill
              key={tag.id}
              tag={tag.name}
              color={tag.color}
              onClick={toggleTag}
              removable={false}
              size="sm"
              variant={selectedTags.includes(tag.name) ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer',
                selectedTags.includes(tag.name) &&
                  'ring-2 ring-blue-500 ring-offset-1'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}