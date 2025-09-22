import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { syncUsageToDatabase } from '@/packages/api/src/services/usage-tracking'
import { prisma } from '@/lib/prisma'

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
    console.log('[Cron] Starting usage sync to database...')

    const workspaces = await prisma.workspaces.findMany({
      select: { id: true }
    })

    let successCount = 0
    let errorCount = 0

    for (const workspace of workspaces) {
      try {
        await syncUsageToDatabase(workspace.id)
        successCount++
      } catch (error) {
        console.error(`[Cron] Failed to sync workspace ${workspace.id}:`, error)
        errorCount++
      }
    }

    console.log(`[Cron] Usage sync completed - Success: ${successCount}, Errors: ${errorCount}`)

    return NextResponse.json({
      success: true,
      workspacesProcessed: successCount,
      errors: errorCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Cron] Sync usage error:', error)
    return NextResponse.json(
      { error: 'Failed to sync usage to database' },
      { status: 500 }
    )
  }
}