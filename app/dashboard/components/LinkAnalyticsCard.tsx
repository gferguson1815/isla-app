import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useRealtimeClicks } from '@/hooks/useRealtimeClicks';
import { ExternalLink, MousePointerClick, TrendingUp, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface LinkAnalyticsCardProps {
  linkId: string;
  slug: string;
  title?: string;
  url: string;
  baseUrl?: string;
}

export const LinkAnalyticsCard = React.memo(function LinkAnalyticsCard({
  linkId,
  slug,
  title,
  url,
  baseUrl = window.location.origin,
}: LinkAnalyticsCardProps) {
  const { metrics, clickRate, isLoading } = useAnalytics({
    linkId,
    timeRange: 7,
  });

  useRealtimeClicks({
    linkId,
    enabled: true,
  });

  const shortUrl = `${baseUrl}/${slug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    toast.success('Link copied to clipboard');
  };

  if (isLoading) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {title || slug}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="truncate max-w-[300px]">{url}</span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </div>
          <Badge variant="secondary">{slug}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-2 bg-muted rounded-md">
          <span className="text-sm font-mono truncate">{shortUrl}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="ml-2"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{metrics?.totalClicks || 0}</p>
            <p className="text-xs text-muted-foreground">Total Clicks</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{metrics?.uniqueClicks || 0}</p>
            <p className="text-xs text-muted-foreground">Unique</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">
              {clickRate ? `${clickRate.rate.toFixed(1)}` : '0'}
            </p>
            <p className="text-xs text-muted-foreground">
              {clickRate?.period || 'per day'}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Top Device</span>
            <span className="font-medium">
              {metrics?.deviceBreakdown &&
                Object.entries(metrics.deviceBreakdown)
                  .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-muted-foreground">Top Browser</span>
            <span className="font-medium">
              {metrics?.browserBreakdown &&
                Object.entries(metrics.browserBreakdown)
                  .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});