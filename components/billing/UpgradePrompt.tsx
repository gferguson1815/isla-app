'use client'

import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface UpgradePromptProps {
  title?: string
  description?: string
  metric?: 'links' | 'clicks' | 'users'
  currentPlan?: string
  suggestedPlan?: string
  features?: string[]
  inline?: boolean
  workspaceSlug: string
  className?: string
  onUpgrade?: () => void
}

export function UpgradePrompt({
  title,
  description,
  metric,
  currentPlan = 'Free',
  suggestedPlan = 'Pro',
  features = [],
  inline = false,
  workspaceSlug,
  className,
  onUpgrade
}: UpgradePromptProps) {
  const router = useRouter()
  
  const handleUpgrade = () => {
    onUpgrade?.()
    const reason = metric ? `${metric}_limit` : 'upgrade_prompt'
    router.push(`/${workspaceSlug}/settings/billing?upgrade=true&reason=${reason}&suggested=${suggestedPlan.toLowerCase()}`)
  }
  
  const defaultTitle = metric 
    ? `Upgrade to add more ${metric}`
    : 'Unlock more with Pro'
    
  const defaultDescription = metric
    ? `You've reached the ${metric} limit on your ${currentPlan} plan. Upgrade to ${suggestedPlan} to continue.`
    : `Upgrade from ${currentPlan} to ${suggestedPlan} to unlock advanced features and higher limits.`
  
  const defaultFeatures = {
    links: [
      'Unlimited links',
      'Custom domains',
      'Advanced analytics',
      'Priority support'
    ],
    clicks: [
      'Unlimited click tracking',
      'Detailed analytics',
      'Export reports',
      'Real-time data'
    ],
    users: [
      'Unlimited team members',
      'Role-based access',
      'Team analytics',
      'Collaboration tools'
    ]
  }
  
  const displayFeatures = features.length > 0 
    ? features 
    : (metric ? defaultFeatures[metric] : defaultFeatures.links)
  
  if (inline) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <div>
            <p className="font-medium text-sm">{title || defaultTitle}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {description || defaultDescription}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleUpgrade}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          Upgrade
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('p-6', className)}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              {title || defaultTitle}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {description || defaultDescription}
            </p>
          </div>
        </div>
        
        {displayFeatures.length > 0 && (
          <div className="space-y-2 mb-6">
            {displayFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2 text-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        )}
        
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            onClick={handleUpgrade}
          >
            Upgrade to {suggestedPlan}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-xs text-center text-muted-foreground mt-4">
          No credit card required • Cancel anytime
        </p>
      </Card>
    </motion.div>
  )
}