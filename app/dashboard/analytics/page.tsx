'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useRealtimeClicks } from '@/hooks/useRealtimeClicks';
import { useWorkspace } from '@/contexts/workspace-context';
import { WorkspaceSelector } from '@/components/workspace-selector';
import { ClicksTimeSeriesChart } from '../components/ClicksTimeSeriesChart';
import { AnalyticsSkeleton } from '../components/AnalyticsSkeleton';
import { Activity, MousePointerClick, TrendingUp, Users } from 'lucide-react';

export default function AnalyticsDashboard() {
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const { metrics, timeSeries, isLoading, error, refetch } = useAnalytics({
    workspaceId,
    timeRange: 7,
    enabled: !!workspaceId,
  });

  const { isConnected } = useRealtimeClicks({
    workspaceId,
    enabled: !!workspaceId,
  });

  useEffect(() => {
    // Auto-refresh every 30 seconds if not connected to realtime
    if (!isConnected) {
      const interval = setInterval(refetch, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, refetch]);

  if (workspaceLoading || isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (!currentWorkspace) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Please select a workspace to view analytics</p>
            <WorkspaceSelector />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Error loading analytics: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Real-time insights for {currentWorkspace.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <WorkspaceSelector />
          <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Live' : 'Refreshing'}
          </span>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.totalClicks.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">All time clicks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.uniqueClicks.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Based on IP hash</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.totalClicks && metrics?.uniqueClicks
                ? ((metrics.uniqueClicks / metrics.totalClicks) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Unique/Total ratio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isConnected ? 'Live' : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Real-time status</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Click Activity</CardTitle>
          <CardDescription>Clicks over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ClicksTimeSeriesChart data={timeSeries || []} />
        </CardContent>
      </Card>

      {/* Device & Browser Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>Click distribution by device type</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.deviceBreakdown && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Desktop</span>
                  <span className="text-sm text-muted-foreground">
                    {metrics.deviceBreakdown.desktop}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Mobile</span>
                  <span className="text-sm text-muted-foreground">
                    {metrics.deviceBreakdown.mobile}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Tablet</span>
                  <span className="text-sm text-muted-foreground">
                    {metrics.deviceBreakdown.tablet}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Where your traffic comes from</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.topReferrers && metrics.topReferrers.length > 0 ? (
              <div className="space-y-4">
                {metrics.topReferrers.map((referrer, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {referrer.referrer}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {referrer.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No referrer data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}