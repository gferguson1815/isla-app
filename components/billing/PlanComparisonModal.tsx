'use client'

import { useState, useEffect } from 'react'
import { Check, X, Sparkles, ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'

interface Plan {
  name: string
  id: string
  price: {
    monthly: number
    yearly: number
  }
  description: string
  features: {
    links: number | 'Unlimited'
    clicks: number | 'Unlimited'
    users: number | 'Unlimited'
    customDomains: boolean
    analytics: string
    support: string
    api: boolean
    sso: boolean
    whiteLabel: boolean
  }
  highlighted?: boolean
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    id: 'free',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for personal use',
    features: {
      links: 50,
      clicks: 5000,
      users: 1,
      customDomains: false,
      analytics: 'Basic',
      support: 'Community',
      api: false,
      sso: false,
      whiteLabel: false
    }
  },
  {
    name: 'Starter',
    id: 'starter',
    price: { monthly: 19, yearly: 190 },
    description: 'For small teams',
    features: {
      links: 500,
      clicks: 50000,
      users: 3,
      customDomains: false,
      analytics: 'Advanced',
      support: 'Email',
      api: true,
      sso: false,
      whiteLabel: false
    }
  },
  {
    name: 'Pro',
    id: 'pro',
    price: { monthly: 49, yearly: 490 },
    description: 'For growing businesses',
    features: {
      links: 5000,
      clicks: 500000,
      users: 10,
      customDomains: true,
      analytics: 'Advanced',
      support: 'Priority',
      api: true,
      sso: false,
      whiteLabel: false
    },
    highlighted: true
  },
  {
    name: 'Business',
    id: 'business',
    price: { monthly: 149, yearly: 1490 },
    description: 'For large organizations',
    features: {
      links: 'Unlimited',
      clicks: 'Unlimited',
      users: 'Unlimited',
      customDomains: true,
      analytics: 'Enterprise',
      support: 'Dedicated',
      api: true,
      sso: true,
      whiteLabel: true
    }
  }
]

interface PlanComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan?: string
  suggestedPlan?: string
  workspaceSlug: string
  reason?: string
}

export function PlanComparisonModal({
  isOpen,
  onClose,
  currentPlan = 'free',
  suggestedPlan = 'pro',
  workspaceSlug,
  reason
}: PlanComparisonModalProps) {
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState(suggestedPlan)
  const [isUpgrading, setIsUpgrading] = useState(false)
  
  useEffect(() => {
    if (suggestedPlan) {
      setSelectedPlan(suggestedPlan)
    }
  }, [suggestedPlan])
  
  const handleUpgrade = async (planId: string) => {
    setIsUpgrading(true)
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
    
    // Navigate to billing page with plan selection
    setTimeout(() => {
      router.push(
        `/${workspaceSlug}/settings/billing?upgrade=true&plan=${planId}&period=${billingPeriod}&reason=${reason || 'comparison'}`
      )
      onClose()
    }, 500)
  }
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price)
  }
  
  const formatLimit = (value: number | string) => {
    if (value === 'Unlimited') return 'Unlimited'
    if (typeof value === 'number') {
      return value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString()
    }
    return value
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose the perfect plan for your team</DialogTitle>
          <DialogDescription>
            Compare features and pricing to find the best fit
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6">
          {/* Billing period toggle */}
          <div className="flex justify-center mb-8">
            <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as 'monthly' | 'yearly')}>
              <TabsList className="grid w-[300px] grid-cols-2">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">
                  Yearly
                  <Badge variant="secondary" className="ml-2 text-xs">Save 20%</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Plans grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan, index) => {
              const isCurrentPlan = plan.id === currentPlan.toLowerCase()
              const isSuggested = plan.id === suggestedPlan.toLowerCase()
              const price = billingPeriod === 'monthly' ? plan.price.monthly : plan.price.yearly / 12
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'relative rounded-lg border p-6',
                    plan.highlighted && 'border-purple-500 shadow-lg',
                    isCurrentPlan && 'bg-muted/50'
                  )}
                >
                  {plan.highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600">
                      Most Popular
                    </Badge>
                  )}
                  
                  {isSuggested && !isCurrentPlan && (
                    <Badge className="absolute -top-3 right-4 bg-green-600">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Recommended
                    </Badge>
                  )}
                  
                  {isCurrentPlan && (
                    <Badge variant="outline" className="absolute -top-3 left-4">
                      Current Plan
                    </Badge>
                  )}
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">{formatPrice(price)}</span>
                      <span className="text-muted-foreground ml-1">/month</span>
                    </div>
                    {billingPeriod === 'yearly' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Billed {formatPrice(plan.price.yearly)} yearly
                      </p>
                    )}
                  </div>
                  
                  <Button
                    className={cn(
                      'w-full',
                      plan.highlighted && !isCurrentPlan && 'bg-purple-600 hover:bg-purple-700'
                    )}
                    variant={isCurrentPlan ? 'outline' : 'default'}
                    disabled={isCurrentPlan || isUpgrading}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Upgrade'}
                    {!isCurrentPlan && <ArrowRight className="ml-1 h-4 w-4" />}
                  </Button>
                  
                  <div className="mt-6 space-y-3">
                    <div className="text-sm">
                      <div className="flex justify-between py-1">
                        <span>Links</span>
                        <span className="font-medium">{formatLimit(plan.features.links)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Clicks/month</span>
                        <span className="font-medium">{formatLimit(plan.features.clicks)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Team members</span>
                        <span className="font-medium">{formatLimit(plan.features.users)}</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3 space-y-2">
                      <FeatureRow
                        label="Custom domains"
                        included={plan.features.customDomains}
                      />
                      <FeatureRow
                        label="Analytics"
                        value={plan.features.analytics}
                      />
                      <FeatureRow
                        label="API access"
                        included={plan.features.api}
                      />
                      <FeatureRow
                        label="SSO"
                        included={plan.features.sso}
                      />
                      <FeatureRow
                        label="White label"
                        included={plan.features.whiteLabel}
                      />
                      <FeatureRow
                        label="Support"
                        value={plan.features.support}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>All plans include SSL certificates, 99.9% uptime SLA, and GDPR compliance.</p>
            <p className="mt-2">
              Questions? <a href="#" className="text-primary hover:underline">Contact sales</a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FeatureRow({ 
  label, 
  included, 
  value 
}: { 
  label: string
  included?: boolean
  value?: string 
}) {
  if (value) {
    return (
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
    )
  }
  
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {included ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <X className="h-4 w-4 text-gray-400" />
      )}
    </div>
  )
}