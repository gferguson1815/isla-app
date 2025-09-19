import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/src/types/database';
import { aggregateClickMetrics, getTimeSeriesData, calculateClickRate } from './aggregations';

export class AnalyticsService {
  private supabase;

  constructor() {
    this.supabase = createClientComponentClient<Database>();
  }

  async getClicksByLink(linkId: string, timeRange = 7) {
    // Validate inputs
    if (!linkId || typeof linkId !== 'string') {
      throw new Error('Invalid linkId provided');
    }

    // Limit time range to prevent excessive data fetching
    const maxTimeRange = 90; // Maximum 90 days
    const validatedTimeRange = Math.min(Math.max(1, timeRange), maxTimeRange);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - validatedTimeRange);

    const { data, error } = await this.supabase
      .from('click_events')
      .select('*')
      .eq('link_id', linkId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(10000); // Limit results to prevent memory issues

    if (error) throw error;
    return data || [];
  }

  async getClicksByWorkspace(workspaceId: string, timeRange = 7) {
    // Validate inputs
    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Invalid workspaceId provided');
    }

    // Limit time range to prevent excessive data fetching
    const maxTimeRange = 90; // Maximum 90 days
    const validatedTimeRange = Math.min(Math.max(1, timeRange), maxTimeRange);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - validatedTimeRange);

    const { data, error } = await this.supabase
      .from('click_events')
      .select(`
        *,
        links!inner (
          workspace_id
        )
      `)
      .eq('links.workspace_id', workspaceId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(10000); // Limit results to prevent memory issues

    if (error) throw error;
    return data || [];
  }

  async getAggregatedMetrics(linkId: string, timeRange = 7) {
    const clicks = await this.getClicksByLink(linkId, timeRange);
    return aggregateClickMetrics(clicks);
  }

  async getWorkspaceMetrics(workspaceId: string, timeRange = 7) {
    const clicks = await this.getClicksByWorkspace(workspaceId, timeRange);
    return aggregateClickMetrics(clicks);
  }

  async getTimeSeriesData(linkId: string, days = 7) {
    const clicks = await this.getClicksByLink(linkId, days);
    return getTimeSeriesData(clicks, days);
  }

  async getWorkspaceTimeSeries(workspaceId: string, days = 7) {
    const clicks = await this.getClicksByWorkspace(workspaceId, days);
    return getTimeSeriesData(clicks, days);
  }

  async getLinkClickRate(linkId: string) {
    const { data: link, error: linkError } = await this.supabase
      .from('links')
      .select('created_at, click_count')
      .eq('id', linkId)
      .single();

    if (linkError || !link) throw linkError || new Error('Link not found');

    return calculateClickRate(
      link.click_count || 0,
      new Date(link.created_at),
      new Date()
    );
  }

  async getTopLinks(workspaceId: string, limit = 10) {
    const { data, error } = await this.supabase
      .from('links')
      .select('id, slug, title, url, click_count')
      .eq('workspace_id', workspaceId)
      .order('click_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getRecentClicks(workspaceId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('click_events')
      .select(`
        *,
        links!inner (
          workspace_id,
          slug,
          title
        )
      `)
      .eq('links.workspace_id', workspaceId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

export const analyticsService = new AnalyticsService();