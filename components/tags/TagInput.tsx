'use client'

import { useState, useRef, useCallback, KeyboardEvent, useEffect } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TagPill } from './TagPill'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { Check, Plus } from 'lucide-react'

interface TagInputProps {
  workspaceId: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  className?: string
  disabled?: boolean
}

export function TagInput({
  workspaceId,
  value = [],
  onChange,
  placeholder = 'Add tags...',
  maxTags = 10,
  className,
  disabled = false,
}: TagInputProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: suggestions = [] } = trpc.tag.suggest.useQuery(
    {
      workspaceId,
      query: inputValue,
      limit: 10,
    },
    {
      enabled: open && inputValue.length > 0,
    }
  )

  const handleAddTag = useCallback(
    (tag: string) => {
      const normalizedTag = tag.toLowerCase().trim()

      if (
        normalizedTag &&
        !value.includes(normalizedTag) &&
        value.length < maxTags
      ) {
        onChange([...value, normalizedTag])
        setInputValue('')
        setOpen(false)
      }
    },
    [value, onChange, maxTags]
  )

  const handleRemoveTag = useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag))
    },
    [value, onChange]
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault()
      handleAddTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      e.preventDefault()
      handleRemoveTag(value[value.length - 1])
    }
  }

  const filteredSuggestions = suggestions.filter(
    (suggestion) => !value.includes(suggestion.name)
  )

  const showCreateOption = inputValue &&
    !filteredSuggestions.some((s) => s.name === inputValue.toLowerCase()) &&
    !value.includes(inputValue.toLowerCase())

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <TagPill
            key={tag}
            tag={tag}
            onRemove={!disabled ? handleRemoveTag : undefined}
            size="sm"
          />
        ))}
      </div>

      {!disabled && value.length < maxTags && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  setOpen(true)
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                disabled={disabled}
              />
            </div>
          </PopoverTrigger>

          {(filteredSuggestions.length > 0 || showCreateOption) && (
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandList>
                  {filteredSuggestions.length > 0 && (
                    <CommandGroup heading="Suggestions">
                      {filteredSuggestions.map((suggestion) => (
                        <CommandItem
                          key={suggestion.id}
                          value={suggestion.name}
                          onSelect={() => handleAddTag(suggestion.name)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              value.includes(suggestion.name)
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          <span>{suggestion.name}</span>
                          {suggestion.usage_count > 0 && (
                            <span className="ml-auto text-xs text-gray-500">
                              {suggestion.usage_count}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {showCreateOption && (
                    <CommandGroup>
                      <CommandItem
                        value={inputValue}
                        onSelect={() => handleAddTag(inputValue)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Create &quot;{inputValue}&quot;</span>
                      </CommandItem>
                    </CommandGroup>
                  )}

                  {!filteredSuggestions.length && !showCreateOption && (
                    <CommandEmpty>No tags found.</CommandEmpty>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          )}
        </Popover>
      )}

      {value.length >= maxTags && (
        <p className="text-xs text-gray-500">Maximum {maxTags} tags allowed</p>
      )}
    </div>
  )
}