'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Calendar, 
  Users, 
  Link, 
  MousePointerClick,
  AlertCircle,
  ChevronRight,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';
import PricingCards from '@/components/billing/PricingCards';
import PaymentMethods from '@/components/billing/PaymentMethods';
import BillingHistory from '@/components/billing/BillingHistory';
import UpgradeModal from '@/components/billing/UpgradeModal';
import DowngradeModal from '@/components/billing/DowngradeModal';
import TrialBanner from '@/components/billing/TrialBanner';

type UsageMetric = {
  icon: React.ElementType;
  label: string;
  current: number;
  limit: number | 'unlimited';
  color: string;
};

export default function BillingPage() {
  const params = useParams();
  const workspaceSlug = params?.slug as string;
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'growth' | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [targetPlan, setTargetPlan] = useState<'free' | 'starter' | 'growth' | null>(null);

  // Fetch workspace data
  const { data: workspace } = trpc.workspace.getBySlug.useQuery(
    { slug: workspaceSlug },
    { enabled: !!workspaceSlug }
  );

  // Fetch current plan
  const { data: currentPlan, isLoading: planLoading } = trpc.billing.getCurrentPlan.useQuery(
    { workspaceId: workspace?.id || '' },
    { enabled: !!workspace?.id }
  );

  // Fetch usage metrics
  const { data: usageMetrics, isLoading: metricsLoading } = trpc.billing.getUsageMetrics.useQuery(
    { workspaceId: workspace?.id || '', period: 'monthly' },
    { enabled: !!workspace?.id }
  );

  // Calculate trial status
  const trialDaysRemaining = currentPlan?.plan === 'free' && workspace?.billingCycleStart
    ? Math.max(0, 14 - Math.floor((Date.now() - new Date(workspace.billingCycleStart).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isOnTrial = trialDaysRemaining > 0;

  // Format usage metrics
  const usageData: UsageMetric[] = [
    {
      icon: Users,
      label: 'Team Members',
      current: usageMetrics?.users.current || 0,
      limit: currentPlan?.limits.maxUsers === -1 ? 'unlimited' : currentPlan?.limits.maxUsers || 0,
      color: 'blue',
    },
    {
      icon: Link,
      label: 'Links Created',
      current: usageMetrics?.links.current || 0,
      limit: currentPlan?.limits.maxLinks || 0,
      color: 'green',
    },
    {
      icon: MousePointerClick,
      label: 'Clicks This Month',
      current: usageMetrics?.clicks.current || 0,
      limit: currentPlan?.limits.maxClicks || 0,
      color: 'purple',
    },
  ];

  const handleUpgrade = (plan: 'starter' | 'growth') => {
    setTargetPlan(plan);
    setShowUpgradeModal(true);
  };

  const handleDowngrade = (plan: 'free' | 'starter') => {
    setTargetPlan(plan);
    setShowDowngradeModal(true);
  };

  const getUsagePercentage = (current: number, limit: number | 'unlimited') => {
    if (limit === 'unlimited' || limit === -1) return 0;
    return Math.min(100, Math.round((current / limit) * 100));
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'warning';
    return 'default';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Trial Banner */}
      {isOnTrial && (
        <TrialBanner 
          daysRemaining={trialDaysRemaining}
          workspaceId={workspace?.id || ''}
        />
      )}

      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-1">
            Manage your workspace subscription and billing settings
          </p>
        </div>
        {currentPlan && !planLoading && (
          <Badge 
            variant={currentPlan.isActive ? 'default' : 'secondary'}
            className="text-sm px-3 py-1"
          >
            {currentPlan.name} Plan
          </Badge>
        )}
      </div>

      {/* Current Plan & Usage */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Current Plan
            </CardTitle>
            <CardDescription>
              Your workspace is on the {currentPlan?.name || 'Free'} plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {planLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold">
                      ${currentPlan?.price || 0}
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </p>
                    {currentPlan?.currentPeriodEnd && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {currentPlan.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on{' '}
                        {format(new Date(currentPlan.currentPeriodEnd), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                  {currentPlan?.plan !== 'growth' && (
                    <Button 
                      onClick={() => handleUpgrade(currentPlan?.plan === 'free' ? 'starter' : 'growth')}
                      className="gap-1"
                    >
                      Upgrade <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {currentPlan?.cancelAtPeriodEnd && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Subscription Ending</AlertTitle>
                    <AlertDescription>
                      Your subscription will end on {format(new Date(currentPlan.currentPeriodEnd), 'MMM dd, yyyy')}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Usage Meters */}
        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
            <CardDescription>
              Track your resource usage against plan limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {metricsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              usageData.map((metric) => {
                const Icon = metric.icon;
                const percentage = getUsagePercentage(metric.current, metric.limit);
                const color = getUsageColor(percentage);
                
                return (
                  <div key={metric.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {metric.label}
                      </span>
                      <span className="font-medium">
                        {metric.current.toLocaleString()} / {' '}
                        {metric.limit === 'unlimited' ? '∞' : metric.limit.toLocaleString()}
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={cn(
                        "h-2",
                        color === 'destructive' && "[&>div]:bg-destructive",
                        color === 'warning' && "[&>div]:bg-yellow-500"
                      )}
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="history">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <PricingCards 
            currentPlan={currentPlan?.plan || 'free'}
            onUpgrade={handleUpgrade}
            onDowngrade={handleDowngrade}
            isLoading={planLoading}
          />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentMethods 
            workspaceId={workspace?.id || ''}
            customerId={workspace?.stripeCustomerId || ''}
          />
        </TabsContent>

        <TabsContent value="history">
          <BillingHistory 
            workspaceId={workspace?.id || ''}
          />
        </TabsContent>
      </Tabs>

      {/* Upgrade Modal */}
      {showUpgradeModal && targetPlan && targetPlan !== 'free' && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false);
            setTargetPlan(null);
          }}
          workspaceId={workspace?.id || ''}
          targetPlan={targetPlan}
          currentPlan={currentPlan?.plan || 'free'}
        />
      )}

      {/* Downgrade Modal */}
      {showDowngradeModal && targetPlan && (
        <DowngradeModal
          isOpen={showDowngradeModal}
          onClose={() => {
            setShowDowngradeModal(false);
            setTargetPlan(null);
          }}
          workspaceId={workspace?.id || ''}
          targetPlan={targetPlan}
          currentPlan={currentPlan?.plan || 'free'}
        />
      )}
    </div>
  );
}