'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Copy,
  ExternalLink,
  Calendar,
  MousePointerClick,
  Link as LinkIcon,
  Tag,
  Globe,
  Megaphone,
  DollarSign,
  FileText,
  Hash,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

interface LinkDetails {
  id: string;
  url: string;
  slug: string;
  title?: string | null;
  description?: string | null;
  clickCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastClickedAt?: Date | string | null;
  expiresAt?: Date | string | null;
  isActive: boolean;
  clickLimit?: number | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  iosUrl?: string | null;
  androidUrl?: string | null;
  enableGeolocation?: boolean;
  enableDeviceTargeting?: boolean;
}

interface LinkDetailsCardProps {
  link: LinkDetails;
  showFullUrl?: boolean;
}

export function LinkDetailsCard({ link, showFullUrl = true }: LinkDetailsCardProps) {
  const shortUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${link.slug}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const hasUtmParameters = !!(
    link.utmSource ||
    link.utmMedium ||
    link.utmCampaign ||
    link.utmTerm ||
    link.utmContent
  );

  const hasTargeting = !!(link.iosUrl || link.androidUrl || link.enableGeolocation || link.enableDeviceTargeting);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {link.title || `Link: ${link.slug}`}
            </CardTitle>
            {link.description && (
              <CardDescription className="mt-1">{link.description}</CardDescription>
            )}
          </div>
          <Badge variant={link.isActive ? 'default' : 'secondary'}>
            {link.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Short URL Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LinkIcon className="h-4 w-4" />
            <span className="font-medium">Short URL</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-muted rounded-md text-sm font-mono">
              {shortUrl}
            </code>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(shortUrl, 'Short URL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy short URL</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => window.open(shortUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open in new tab</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Destination URL Section */}
        {showFullUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span className="font-medium">Destination URL</span>
            </div>
            <div className="p-2 bg-muted rounded-md">
              <p className="text-sm break-all">{link.url}</p>
            </div>
          </div>
        )}

        <Separator />

        {/* UTM Parameters Section */}
        {hasUtmParameters && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Megaphone className="h-4 w-4" />
                <span className="font-medium">UTM Campaign Parameters</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {link.utmSource && (
                  <div className="flex items-start gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Source</p>
                      <div className="flex items-center gap-1">
                        <code className="text-sm font-mono">{link.utmSource}</code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(link.utmSource!, 'UTM Source')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {link.utmMedium && (
                  <div className="flex items-start gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Medium</p>
                      <div className="flex items-center gap-1">
                        <code className="text-sm font-mono">{link.utmMedium}</code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(link.utmMedium!, 'UTM Medium')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {link.utmCampaign && (
                  <div className="flex items-start gap-2">
                    <Megaphone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Campaign</p>
                      <div className="flex items-center gap-1">
                        <code className="text-sm font-mono">{link.utmCampaign}</code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(link.utmCampaign!, 'UTM Campaign')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {link.utmTerm && (
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Term</p>
                      <div className="flex items-center gap-1">
                        <code className="text-sm font-mono">{link.utmTerm}</code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(link.utmTerm!, 'UTM Term')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {link.utmContent && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Content</p>
                      <div className="flex items-center gap-1">
                        <code className="text-sm font-mono">{link.utmContent}</code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(link.utmContent!, 'UTM Content')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Analytics Summary */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MousePointerClick className="h-4 w-4" />
            <span className="font-medium">Performance</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold">{link.clickCount}</p>
              <p className="text-xs text-muted-foreground">Total Clicks</p>
            </div>
            {link.clickLimit && (
              <div>
                <p className="text-2xl font-bold">{link.clickLimit}</p>
                <p className="text-xs text-muted-foreground">Click Limit</p>
              </div>
            )}
            {link.lastClickedAt && (
              <div>
                <p className="text-sm font-medium">
                  {formatDistanceToNow(new Date(link.lastClickedAt), { addSuffix: true })}
                </p>
                <p className="text-xs text-muted-foreground">Last Clicked</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">
                {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
              </p>
              <p className="text-xs text-muted-foreground">Created</p>
            </div>
          </div>
        </div>

        {/* Expiration and Limits */}
        {(link.expiresAt || link.clickLimit) && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Restrictions</span>
              </div>
              <div className="space-y-1">
                {link.expiresAt && (
                  <p className="text-sm">
                    Expires: {format(new Date(link.expiresAt), 'PPP')}
                  </p>
                )}
                {link.clickLimit && (
                  <p className="text-sm">
                    Click limit: {link.clickCount}/{link.clickLimit}
                    {link.clickCount >= link.clickLimit && (
                      <Badge variant="destructive" className="ml-2">Limit Reached</Badge>
                    )}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Device Targeting */}
        {hasTargeting && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Device Targeting</p>
              <div className="flex flex-wrap gap-2">
                {link.enableGeolocation && (
                  <Badge variant="secondary">Geolocation Enabled</Badge>
                )}
                {link.enableDeviceTargeting && (
                  <Badge variant="secondary">Device Targeting</Badge>
                )}
                {link.iosUrl && (
                  <Badge variant="secondary">iOS Redirect</Badge>
                )}
                {link.androidUrl && (
                  <Badge variant="secondary">Android Redirect</Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}