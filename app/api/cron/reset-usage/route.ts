import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { resetWorkspaceCounters } from '@/packages/api/src/services/usage-tracking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds timeout

export async function GET(request: Request) {
  // Verify the request is coming from Vercel Cron
  const authHeader = headers().get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('[Cron] Starting workspace usage reset check...')
    await resetWorkspaceCounters()
    console.log('[Cron] Workspace usage reset check completed')

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Cron] Reset usage error:', error)
    return NextResponse.json(
      { error: 'Failed to reset usage counters' },
      { status: 500 }
    )
  }
}