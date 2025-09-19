import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import type { UsageAlert } from './usage-tracking'

const resend = new Resend(process.env.RESEND_API_KEY)

interface UsageLimitEmailData {
  workspaceName: string
  workspaceSlug: string
  adminEmail: string
  adminName: string
  metric: 'links' | 'clicks' | 'users'
  percentage: number
  currentUsage: number
  limit: number
  planName: string
}

/**
 * Send usage warning email to workspace admin
 */
export async function sendUsageWarningEmail(data: UsageLimitEmailData): Promise<void> {
  const { 
    workspaceName,
    workspaceSlug,
    adminEmail, 
    adminName,
    metric,
    percentage,
    currentUsage,
    limit,
    planName
  } = data
  
  const metricLabel = {
    links: 'links',
    clicks: 'clicks this month',
    users: 'team members'
  }[metric]
  
  const subject = percentage >= 100
    ? `[Action Required] ${workspaceName} has reached its ${metric} limit`
    : `[Warning] ${workspaceName} is at ${Math.round(percentage)}% of its ${metric} limit`
  
  const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${workspaceSlug}/settings/billing?upgrade=true&reason=${metric}_limit`
  
  try {
    await resend.emails.send({
      from: 'Isla <notifications@isla.sh>',
      to: adminEmail,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: white; padding: 30px; border: 1px solid #e5e5e5; border-radius: 0 0 10px 10px; }
            .metric-box { background: #f7f9fc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .progress-bar { background: #e5e5e5; height: 20px; border-radius: 10px; overflow: hidden; margin: 15px 0; }
            .progress-fill { height: 100%; transition: width 0.3s; }
            .progress-fill.warning { background: #f59e0b; }
            .progress-fill.critical { background: #ef4444; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Usage Limit ${percentage >= 100 ? 'Reached' : 'Warning'}</h1>
            </div>
            <div class="content">
              <p>Hi ${adminName},</p>
              
              ${percentage >= 100 ? `
                <p><strong>${workspaceName}</strong> has reached its ${metricLabel} limit on the ${planName} plan.</p>
                <p>To continue adding ${metricLabel}, please upgrade your plan.</p>
              ` : `
                <p><strong>${workspaceName}</strong> is approaching its ${metricLabel} limit on the ${planName} plan.</p>
                <p>Consider upgrading soon to avoid any interruptions.</p>
              `}
              
              <div class="metric-box">
                <h3 style="margin-top: 0;">Current Usage</h3>
                <p style="font-size: 24px; margin: 10px 0;">
                  <strong>${currentUsage.toLocaleString()}</strong> / ${limit.toLocaleString()} ${metricLabel}
                </p>
                <div class="progress-bar">
                  <div class="progress-fill ${percentage >= 90 ? 'critical' : 'warning'}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <p style="color: #666; margin: 0;">${Math.round(percentage)}% used</p>
              </div>
              
              ${percentage >= 100 ? `
                <p><strong>What happens now?</strong></p>
                <ul style="color: #666;">
                  <li>You cannot add new ${metricLabel} until you upgrade</li>
                  <li>Existing ${metric === 'links' ? 'links will continue to work' : metric === 'clicks' ? 'clicks are still being tracked' : 'team members retain access'}</li>
                  <li>Your data is safe and will not be deleted</li>
                </ul>
              ` : `
                <p><strong>Recommended action:</strong></p>
                <p style="color: #666;">Upgrade your plan before reaching 100% to ensure uninterrupted service.</p>
              `}
              
              <div style="text-align: center;">
                <a href="${upgradeUrl}" class="button">Upgrade Plan</a>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated notification from Isla.<br>
              Please do not reply to this email.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/${workspaceSlug}/settings/notifications" style="color: #999;">Manage notification preferences</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hi ${adminName},
        
        ${percentage >= 100 
          ? `${workspaceName} has reached its ${metricLabel} limit on the ${planName} plan.`
          : `${workspaceName} is at ${Math.round(percentage)}% of its ${metricLabel} limit on the ${planName} plan.`
        }
        
        Current usage: ${currentUsage.toLocaleString()} / ${limit.toLocaleString()} ${metricLabel}
        
        ${percentage >= 100
          ? 'Please upgrade your plan to continue adding ' + metricLabel + '.'
          : 'Consider upgrading soon to avoid any interruptions.'
        }
        
        Upgrade your plan: ${upgradeUrl}
        
        This is an automated notification from Isla.
      `
    })
    
    console.log(`Usage warning email sent to ${adminEmail} for workspace ${workspaceName}`)
  } catch (error) {
    console.error('Failed to send usage warning email:', error)
    throw error
  }
}

/**
 * Check and send usage alerts for a workspace
 */
export async function checkAndSendUsageAlerts(
  workspaceId: string,
  alerts: UsageAlert[]
): Promise<void> {
  if (alerts.length === 0) return
  
  // Get workspace and admin details
  const workspace = await prisma.workspaces.findUnique({
    where: { id: workspaceId },
    include: {
      workspace_memberships: {
        where: { role: 'owner' },
        include: {
          users: true
        }
      }
    }
  })
  
  if (!workspace || workspace.workspace_memberships.length === 0) {
    console.error('No workspace owner found for usage alerts')
    return
  }
  
  const owner = workspace.workspace_memberships[0].users
  
  // Check if we've already sent an alert today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const recentAlert = await prisma.audit_logs.findFirst({
    where: {
      workspace_id: workspaceId,
      action: 'usage_alert_sent',
      created_at: { gte: today }
    }
  })
  
  if (recentAlert) {
    console.log('Usage alert already sent today for workspace', workspaceId)
    return
  }
  
  // Send email for the most critical alert
  const criticalAlert = alerts.find(a => a.type === 'limit_reached') || alerts[0]
  
  if (criticalAlert) {
    // Get actual usage data
    const usage = await prisma.usage_metrics.findFirst({
      where: {
        workspace_id: workspaceId,
        metric_type: criticalAlert.metric,
        period: criticalAlert.metric === 'clicks' ? 'monthly' : 'lifetime'
      },
      orderBy: { updated_at: 'desc' }
    })
    
    const limit = {
      links: workspace.max_links,
      clicks: workspace.max_clicks,
      users: workspace.max_users
    }[criticalAlert.metric]
    
    await sendUsageWarningEmail({
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      adminEmail: owner.email,
      adminName: owner.name || 'Admin',
      metric: criticalAlert.metric,
      percentage: criticalAlert.percentage,
      currentUsage: usage?.value || 0,
      limit: limit || 0,
      planName: workspace.plan
    })
    
    // Log that we sent the alert
    await prisma.audit_logs.create({
      data: {
        workspace_id: workspaceId,
        user_id: owner.id,
        action: 'usage_alert_sent',
        entity_type: 'usage',
        entity_id: criticalAlert.metric,
        metadata: {
          alert_type: criticalAlert.type,
          metric: criticalAlert.metric,
          percentage: criticalAlert.percentage
        }
      }
    })
  }
}