'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { HelpCircle, X, FileText, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  UTM_SOURCES,
  UTM_MEDIUMS,
  UTM_VALIDATION_RULES,
  UtmBuilderFormData
} from '@/packages/shared/src/types/utm';

const utmSchema = z.object({
  utmSource: z
    .string()
    .max(UTM_VALIDATION_RULES.maxLength)
    .regex(UTM_VALIDATION_RULES.pattern, 'Only letters, numbers, underscores, and hyphens allowed')
    .optional()
    .or(z.literal('')),
  utmMedium: z
    .string()
    .max(UTM_VALIDATION_RULES.maxLength)
    .regex(UTM_VALIDATION_RULES.pattern, 'Only letters, numbers, underscores, and hyphens allowed')
    .optional()
    .or(z.literal('')),
  utmCampaign: z
    .string()
    .max(UTM_VALIDATION_RULES.maxLength)
    .regex(UTM_VALIDATION_RULES.pattern, 'Only letters, numbers, underscores, and hyphens allowed')
    .optional()
    .or(z.literal('')),
  utmTerm: z
    .string()
    .max(UTM_VALIDATION_RULES.maxLength)
    .regex(UTM_VALIDATION_RULES.pattern, 'Only letters, numbers, underscores, and hyphens allowed')
    .optional()
    .or(z.literal('')),
  utmContent: z
    .string()
    .max(UTM_VALIDATION_RULES.maxLength)
    .regex(UTM_VALIDATION_RULES.pattern, 'Only letters, numbers, underscores, and hyphens allowed')
    .optional()
    .or(z.literal('')),
});

interface UTMBuilderProps {
  onChange?: (data: UtmBuilderFormData) => void;
  defaultValues?: UtmBuilderFormData;
  onApplyTemplate?: () => void;
}

export default function UTMBuilder({
  onChange,
  defaultValues,
  onApplyTemplate
}: UTMBuilderProps) {
  const form = useForm<UtmBuilderFormData>({
    resolver: zodResolver(utmSchema),
    defaultValues: defaultValues || {
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      utmTerm: '',
      utmContent: '',
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    onChange?.(watchedValues);
  }, [watchedValues, onChange]);

  const clearAll = () => {
    form.reset({
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      utmTerm: '',
      utmContent: '',
    });
  };

  const renderFieldWithSuggestions = (
    name: keyof UtmBuilderFormData,
    label: string,
    tooltip: string,
    suggestions?: readonly string[]
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex-1">
          <div className="flex items-center gap-2">
            <FormLabel>{label}</FormLabel>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <FormControl>
            {suggestions ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      'w-full justify-between font-normal',
                      !field.value && 'text-muted-foreground'
                    )}
                  >
                    {field.value || `Select ${label.toLowerCase()}...`}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder={`Search ${label.toLowerCase()}...`}
                      className="h-9"
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                      value={field.value}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="py-2 text-center text-sm">
                          Type to create custom value
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {suggestions.map((suggestion) => (
                          <CommandItem
                            key={suggestion}
                            value={suggestion}
                            onSelect={(value) => {
                              field.onChange(value);
                            }}
                          >
                            {suggestion}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <Input
                placeholder={`Enter ${label.toLowerCase()}`}
                {...field}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">UTM Parameters</h3>
        <div className="flex gap-2">
          {onApplyTemplate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onApplyTemplate}
            >
              <FileText className="mr-2 h-4 w-4" />
              Apply Template
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
          >
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>

      <Form {...form}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {renderFieldWithSuggestions(
              'utmSource',
              'Source',
              'The referrer: where the traffic is coming from (e.g., google, facebook, newsletter)',
              UTM_SOURCES
            )}
            {renderFieldWithSuggestions(
              'utmMedium',
              'Medium',
              'The marketing medium: how the traffic is coming (e.g., cpc, email, social)',
              UTM_MEDIUMS
            )}
          </div>

          {renderFieldWithSuggestions(
            'utmCampaign',
            'Campaign',
            'The specific campaign name (e.g., spring_sale, product_launch)',
            undefined
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {renderFieldWithSuggestions(
              'utmTerm',
              'Term (Optional)',
              'Paid search keywords (e.g., running_shoes, best_laptops)',
              undefined
            )}
            {renderFieldWithSuggestions(
              'utmContent',
              'Content (Optional)',
              'Differentiate similar content/links (e.g., banner_top, text_link)',
              undefined
            )}
          </div>
        </div>
      </Form>
    </div>
  );
}