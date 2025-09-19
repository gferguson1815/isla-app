'use client';

import { Suspense, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Activity, Users, Globe, MousePointerClick } from 'lucide-react';
import { TimeSeriesChart } from '@/components/analytics/TimeSeriesChart';
import { GeoMap } from '@/components/analytics/GeoMap';
import { ReferrersTable } from '@/components/analytics/ReferrersTable';
import { DeviceChart } from '@/components/analytics/DeviceChart';
import { BrowserChart } from '@/components/analytics/BrowserChart';
import { ClickTimeline } from '@/components/analytics/ClickTimeline';
import { ExportButton } from '@/components/analytics/ExportButton';
import { useAnalyticsData } from '@/hooks/use-analytics-data';
import { AnalyticsErrorBoundary } from '@/components/analytics/ErrorBoundary';

type DateRange = '24h' | '7d' | '30d' | 'custom';

function AnalyticsDashboardContent() {
  const params = useParams();
  const linkId = params.linkId as string;
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  const {
    timeSeriesData,
    geoData,
    referrerData,
    deviceData,
    browserData,
    clickEvents,
    aggregateMetrics,
    isLoading,
    error
  } = useAnalyticsData({ linkId, dateRange });

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Error loading analytics: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector and Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Link Analytics</h1>
          <p className="text-muted-foreground mt-1">Performance insights for your link</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <ExportButton linkId={linkId} dateRange={dateRange} />
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                aggregateMetrics?.totalClicks?.toLocaleString() || '0'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {dateRange === '24h' ? 'Today' : dateRange === '7d' ? 'This week' : 'This month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                aggregateMetrics?.uniqueVisitors?.toLocaleString() || '0'
              )}
            </div>
            <p className="text-xs text-muted-foreground">Based on IP hash</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitor Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                `${aggregateMetrics?.uniqueVisitorPercentage?.toFixed(1) || '0'}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">Unique visitors / total clicks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Country</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                aggregateMetrics?.topCountry || 'N/A'
              )}
            </div>
            <p className="text-xs text-muted-foreground">Most clicks from</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <AnalyticsErrorBoundary>
        <Card>
          <CardHeader>
            <CardTitle>Click Activity</CardTitle>
            <CardDescription>
              Click trends over time
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <TimeSeriesChart data={timeSeriesData || []} dateRange={dateRange} />
            )}
          </CardContent>
        </Card>
      </AnalyticsErrorBoundary>

      {/* Geographic Heat Map and Top Referrers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>Clicks by country</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <GeoMap data={geoData || []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Where your traffic comes from</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : (
              <ReferrersTable data={referrerData || []} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Device and Browser Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>Click distribution by device type</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <DeviceChart data={deviceData || { mobile: 0, desktop: 0, tablet: 0 }} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browser Breakdown</CardTitle>
            <CardDescription>Click distribution by browser</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <BrowserChart data={browserData || {}} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Click Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Click Events</CardTitle>
          <CardDescription>Individual click event details</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <ClickTimeline
              events={(clickEvents || []).filter((e: any) => e.device !== null).map((e: any) => ({
                ...e,
                device: e.device as 'mobile' | 'desktop' | 'tablet'
              }))}
              linkId={linkId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  return (
    <AnalyticsErrorBoundary>
      <div className="container mx-auto p-6">
        <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          </div>
        }
      >
        <AnalyticsDashboardContent />
      </Suspense>
      </div>
    </AnalyticsErrorBoundary>
  );
}