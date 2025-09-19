import { NextRequest, NextResponse } from 'next/server';
import { runHourlyAggregation, cleanupOldClickEvents } from '@/lib/analytics/aggregations';
import { headers } from 'next/headers';

// Vercel Cron Job configuration
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max

/**
 * Analytics aggregation cron job endpoint
 * Schedule: Every hour at minute 0 (0 * * * *)
 *
 * This endpoint:
 * 1. Aggregates click events into hourly and daily metrics
 * 2. Cleans up old raw click events based on retention policy
 *
 * Security: Protected by Vercel Cron secret
 */
export async function GET(_request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = (await headers()).get('authorization');

    // In production, Vercel sets a CRON_SECRET for security
    if (process.env.CRON_SECRET) {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Log start of aggregation
    console.log('Starting analytics aggregation at:', new Date().toISOString());

    // Run hourly aggregation
    const aggregationResult = await runHourlyAggregation();

    // Clean up old click events (90 days retention by default)
    const cleanupResult = await cleanupOldClickEvents(90);

    // Log results
    console.log('Aggregation result:', aggregationResult);
    console.log('Cleanup result:', cleanupResult);

    // Return success response
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      aggregation: aggregationResult,
      cleanup: cleanupResult,
    });

  } catch (error) {
    console.error('Cron job error:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering (development/testing)
export async function POST(request: NextRequest) {
  // Only allow manual triggering in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Manual triggering not allowed in production' },
      { status: 403 }
    );
  }

  return GET(request);
}