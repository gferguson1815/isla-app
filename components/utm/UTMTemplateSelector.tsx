'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Eye, Trash2, Edit2 } from 'lucide-react';
import { UtmTemplate, UtmBuilderFormData } from '@/packages/shared/src/types/utm';
import { cn } from '@/lib/utils';

const saveTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100),
  description: z.string().max(500).optional(),
});

interface UTMTemplateSelectorProps {
  templates?: UtmTemplate[];
  isLoading?: boolean;
  onSelectTemplate: (template: UtmTemplate) => void;
  onSaveTemplate?: (data: {
    name: string;
    description?: string;
    utmData: UtmBuilderFormData;
  }) => Promise<void>;
  onUpdateTemplate?: (id: string, data: Partial<UtmTemplate>) => Promise<void>;
  onDeleteTemplate?: (id: string) => Promise<void>;
  currentUtmData?: UtmBuilderFormData;
}

export default function UTMTemplateSelector({
  templates = [],
  isLoading,
  onSelectTemplate,
  onSaveTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  currentUtmData,
}: UTMTemplateSelectorProps) {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<UtmTemplate | null>(null);
  const [, setEditingTemplate] = useState<UtmTemplate | null>(null);

  const form = useForm({
    resolver: zodResolver(saveTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const handleSaveTemplate = async (data: { name: string; description?: string }) => {
    if (!currentUtmData || !onSaveTemplate) return;

    try {
      await onSaveTemplate({
        name: data.name,
        description: data.description,
        utmData: currentUtmData,
      });
      form.reset();
      setIsSaveDialogOpen(false);
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handlePreview = (template: UtmTemplate) => {
    setPreviewTemplate(template);
  };

  const handleApply = (template: UtmTemplate) => {
    onSelectTemplate(template);
    setSelectedTemplateId(template.id);
    setPreviewTemplate(null);
  };

  const renderTemplatePreview = (template: UtmTemplate) => (
    <div className="space-y-2 text-sm">
      {template.utmSource && (
        <div>
          <span className="font-medium">Source:</span> {template.utmSource}
        </div>
      )}
      {template.utmMedium && (
        <div>
          <span className="font-medium">Medium:</span> {template.utmMedium}
        </div>
      )}
      {template.utmCampaign && (
        <div>
          <span className="font-medium">Campaign:</span> {template.utmCampaign}
        </div>
      )}
      {template.utmTerm && (
        <div>
          <span className="font-medium">Term:</span> {template.utmTerm}
        </div>
      )}
      {template.utmContent && (
        <div>
          <span className="font-medium">Content:</span> {template.utmContent}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select
          value={selectedTemplateId || undefined}
          onValueChange={(value) => {
            const template = templates.find((t) => t.id === value);
            if (template) {
              handleApply(template);
            }
          }}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <div className="p-2">
                <Skeleton className="h-4 w-full" />
              </div>
            ) : templates.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">
                No templates available
              </div>
            ) : (
              templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {onSaveTemplate && currentUtmData && (
          <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="mr-2 h-4 w-4" />
                Save as Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Save UTM Template</DialogTitle>
                <DialogDescription>
                  Save your current UTM parameters as a template for future use.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSaveTemplate)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Facebook Campaign" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe when to use this template..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="rounded-lg border p-3 space-y-1 text-sm">
                    <div className="font-medium mb-2">Current Parameters:</div>
                    {currentUtmData.utmSource && (
                      <div>Source: {currentUtmData.utmSource}</div>
                    )}
                    {currentUtmData.utmMedium && (
                      <div>Medium: {currentUtmData.utmMedium}</div>
                    )}
                    {currentUtmData.utmCampaign && (
                      <div>Campaign: {currentUtmData.utmCampaign}</div>
                    )}
                    {currentUtmData.utmTerm && <div>Term: {currentUtmData.utmTerm}</div>}
                    {currentUtmData.utmContent && (
                      <div>Content: {currentUtmData.utmContent}</div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save Template</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved Templates</CardTitle>
            <CardDescription>Click to preview, double-click to apply</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={cn(
                      'rounded-lg border p-3 cursor-pointer transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      selectedTemplateId === template.id && 'border-primary'
                    )}
                    onClick={() => handlePreview(template)}
                    onDoubleClick={() => handleApply(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(template);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {onUpdateTemplate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTemplate(template);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {onDeleteTemplate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this template?')) {
                                await onDeleteTemplate(template.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            {previewTemplate?.description && (
              <DialogDescription>{previewTemplate.description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="py-4">
            {previewTemplate && renderTemplatePreview(previewTemplate)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (previewTemplate) {
                  handleApply(previewTemplate);
                }
              }}
            >
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}