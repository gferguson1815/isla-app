'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Link as LinkIcon, Shuffle, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateRandomSlug } from '@/lib/utils/slug';
import { appConfig } from '@/lib/config/app';

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
    .or(z.literal(''))
});

type LinkFormData = z.infer<typeof linkFormSchema>;

interface LinkFormProps {
  onSubmit: (data: LinkFormData & { finalSlug: string }) => Promise<void>;
  isLoading?: boolean;
}

export function LinkForm({ onSubmit, isLoading = false }: LinkFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdLink, setCreatedLink] = useState('');

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
      slug: ''
    }
  });

  const slugValue = watch('slug');

  const generateSlug = () => {
    const slug = generateRandomSlug();
    setValue('slug', slug);
  };

  const handleFormSubmit = async (data: LinkFormData) => {
    const finalSlug = data.slug || generateRandomSlug();
    try {
      await onSubmit({ ...data, finalSlug });
      const shortLink = `${window.location.origin}/${finalSlug}`;
      setCreatedLink(shortLink);
      setShowSuccess(true);
      reset();
    } catch (error) {
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