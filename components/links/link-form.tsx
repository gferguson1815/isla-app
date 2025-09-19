'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Loader2, Link as LinkIcon, Shuffle, Copy, CheckCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { generateRandomSlug } from '@/lib/utils/slug';
import { appConfig } from '@/lib/config/app';
import { extractUtmFromPastedUrl, buildUrlWithUtm } from '@/lib/utils/utm-parser';
import { UtmBuilderFormData, UTM_VALIDATION_RULES } from '@/packages/shared/src/types/utm';
import UTMBuilder from '@/components/utm/UTMBuilder';
import UTMTemplateSelector from '@/components/utm/UTMTemplateSelector';
import { trpc } from '@/lib/trpc/client';

const linkFormSchema = z.object({
  url: z.string()
    .url('Please enter a valid URL')
    .refine((url) => {
      try {
        const u = new URL(url);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'URL must start with http:// or https://'),
  slug: z.string()
    .min(appConfig.links.customSlugMinLength, `Slug must be at least ${appConfig.links.customSlugMinLength} characters`)
    .max(appConfig.links.customSlugMaxLength, `Slug must be at most ${appConfig.links.customSlugMaxLength} characters`)
    .regex(/^[a-zA-Z0-9-]+$/, 'Slug can only contain letters, numbers, and hyphens')
    .optional()
    .or(z.literal('')),
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

type LinkFormData = z.infer<typeof linkFormSchema>;

interface LinkFormProps {
  onSubmit: (data: LinkFormData & { finalSlug: string }) => Promise<void>;
  isLoading?: boolean;
}

export function LinkForm({ onSubmit, isLoading = false }: LinkFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdLink, setCreatedLink] = useState('');
  const [isUtmOpen, setIsUtmOpen] = useState(false);
  const [utmData, setUtmData] = useState<UtmBuilderFormData>({});
  const [finalUrl, setFinalUrl] = useState('');

  const { data: templates, isLoading: templatesLoading } = trpc.utmTemplate.list.useQuery();
  const createTemplate = trpc.utmTemplate.create.useMutation({
    onSuccess: () => {
      toast.success('UTM template saved!');
    },
  });
  const deleteTemplate = trpc.utmTemplate.delete.useMutation();
  const updateTemplate = trpc.utmTemplate.update.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<LinkFormData>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      url: '',
      slug: '',
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      utmTerm: '',
      utmContent: '',
    }
  });

  const slugValue = watch('slug');
  const urlValue = watch('url');

  // Auto-extract UTM parameters when URL changes
  useEffect(() => {
    if (urlValue) {
      const extracted = extractUtmFromPastedUrl(urlValue);
      if (Object.values(extracted).some(v => v)) {
        setValue('utmSource', extracted.utmSource || '');
        setValue('utmMedium', extracted.utmMedium || '');
        setValue('utmCampaign', extracted.utmCampaign || '');
        setValue('utmTerm', extracted.utmTerm || '');
        setValue('utmContent', extracted.utmContent || '');
        setUtmData(extracted);
        setIsUtmOpen(true);
      }
    }
  }, [urlValue, setValue]);

  // Update final URL preview with UTM parameters
  useEffect(() => {
    if (urlValue && utmData) {
      const url = buildUrlWithUtm(urlValue, {
        utm_source: utmData.utmSource,
        utm_medium: utmData.utmMedium,
        utm_campaign: utmData.utmCampaign,
        utm_term: utmData.utmTerm,
        utm_content: utmData.utmContent,
      });
      setFinalUrl(url);
    } else {
      setFinalUrl(urlValue);
    }
  }, [urlValue, utmData]);

  const generateSlug = () => {
    const slug = generateRandomSlug();
    setValue('slug', slug);
  };

  const handleUtmChange = (data: UtmBuilderFormData) => {
    setUtmData(data);
    setValue('utmSource', data.utmSource || '');
    setValue('utmMedium', data.utmMedium || '');
    setValue('utmCampaign', data.utmCampaign || '');
    setValue('utmTerm', data.utmTerm || '');
    setValue('utmContent', data.utmContent || '');
  };

  const handleFormSubmit = async (data: LinkFormData) => {
    const finalSlug = data.slug || generateRandomSlug();
    try {
      await onSubmit({ ...data, finalSlug });
      const shortLink = `${window.location.origin}/${finalSlug}`;
      setCreatedLink(shortLink);
      setShowSuccess(true);
      reset();
    } catch {
      toast.error('Failed to create link');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdLink);
    toast.success('Link copied to clipboard!');
  };

  if (showSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <CardTitle>Link Created Successfully!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 font-mono text-sm">{createdLink}</span>
            <Button size="sm" variant="ghost" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowSuccess(false)}>Create Another</Button>
            <Button variant="outline" onClick={() => window.location.href = '/links'}>
              View All Links
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Shortened Link</CardTitle>
        <CardDescription>
          Enter a long URL and optionally customize the short slug
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Destination URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/very/long/url"
              {...register('url')}
              disabled={isLoading}
              className={errors.url ? 'border-red-500' : ''}
            />
            {errors.url && (
              <p className="text-sm text-red-500">{errors.url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Custom Slug (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                type="text"
                placeholder="my-custom-link"
                {...register('slug')}
                disabled={isLoading}
                className={errors.slug ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generateSlug}
                disabled={isLoading}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Leave blank to auto-generate a random slug
            </p>
          </div>

          <Collapsible open={isUtmOpen} onOpenChange={setIsUtmOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between">
                <span>Campaign Tracking (UTM Parameters)</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isUtmOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <UTMBuilder
                onChange={handleUtmChange}
                defaultValues={utmData}
                onApplyTemplate={() => {}}
              />

              <UTMTemplateSelector
                templates={templates}
                isLoading={templatesLoading}
                onSelectTemplate={(template) => {
                  const templateData = {
                    utmSource: template.utm_source || '',
                    utmMedium: template.utm_medium || '',
                    utmCampaign: template.utm_campaign || '',
                    utmTerm: template.utm_term || '',
                    utmContent: template.utm_content || '',
                  };
                  handleUtmChange(templateData);
                }}
                onSaveTemplate={async ({ name, description, utmData }) => {
                  await createTemplate.mutateAsync({
                    name,
                    description,
                    utmSource: utmData.utmSource,
                    utmMedium: utmData.utmMedium,
                    utmCampaign: utmData.utmCampaign,
                    utmTerm: utmData.utmTerm,
                    utmContent: utmData.utmContent,
                  });
                }}
                onDeleteTemplate={async (id) => {
                  await deleteTemplate.mutateAsync({ id });
                }}
                onUpdateTemplate={async (id, data) => {
                  await updateTemplate.mutateAsync({
                    id,
                    name: data.name || '',
                    description: data.description,
                    utmSource: data.utmSource,
                    utmMedium: data.utmMedium,
                    utmCampaign: data.utmCampaign,
                    utmTerm: data.utmTerm,
                    utmContent: data.utmContent,
                  });
                }}
                currentUtmData={utmData}
              />
            </CollapsibleContent>
          </Collapsible>

          {finalUrl && finalUrl !== urlValue && (
            <Alert>
              <LinkIcon className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Final URL with UTM:</div>
                  <div className="text-xs break-all font-mono">{finalUrl}</div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {slugValue && (
            <Alert>
              <LinkIcon className="h-4 w-4" />
              <AlertDescription>
                Your short link will be: <strong>{window.location.origin}/{slugValue}</strong>
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Link...
              </>
            ) : (
              'Create Link'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}