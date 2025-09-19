'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertTriangle, 
  X,
  ChevronDown,
  Calendar,
  Database,
  ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { trpc } from '@/lib/trpc/client';
import { BILLING_PLANS } from '@/lib/stripe-config';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface DowngradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  targetPlan: 'free' | 'starter';
  currentPlan: 'free' | 'starter' | 'growth';
}

export default function DowngradeModal({
  isOpen,
  onClose,
  workspaceId,
  targetPlan,
  currentPlan,
}: DowngradeModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: currentPlanData } = trpc.billing.getCurrentPlan.useQuery(
    { workspaceId },
    { enabled: !!workspaceId }
  );

  const downgradeSubscription = trpc.billing.updateSubscription.useMutation({
    onSuccess: () => {
      toast.success('Your plan will be downgraded at the end of the billing period');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to downgrade subscription');
      setIsProcessing(false);
    },
  });

  const cancelSubscription = trpc.billing.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success('Your subscription will be canceled at the end of the billing period');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel subscription');
      setIsProcessing(false);
    },
  });

  const handleDowngrade = async () => {
    if (!confirmed) {
      toast.error('Please confirm that you understand the implications');
      return;
    }

    setIsProcessing(true);

    if (targetPlan === 'free') {
      // Cancel subscription (downgrade to free)
      cancelSubscription.mutate({
        workspaceId,
        immediately: false, // Cancel at period end
      });
    } else {
      // Downgrade to a lower paid tier
      downgradeSubscription.mutate({
        workspaceId,
        planId: targetPlan,
      });
    }
  };

  const currentPlanDetails = BILLING_PLANS[currentPlan.toUpperCase() as keyof typeof BILLING_PLANS];
  const targetPlanDetails = BILLING_PLANS[targetPlan.toUpperCase() as keyof typeof BILLING_PLANS];

  // Calculate what features will be lost
  const featureLosses = [];
  
  if (currentPlan === 'growth') {
    if (targetPlan === 'starter') {
      featureLosses.push('Unlimited team members → 10 members');
      featureLosses.push('10,000 links → 1,000 links');
      featureLosses.push('100,000 clicks → 10,000 clicks');
      featureLosses.push('Unlimited custom domains → 1 domain');
      featureLosses.push('Priority support → Email support');
    } else if (targetPlan === 'free') {
      featureLosses.push('Unlimited team members → 3 members');
      featureLosses.push('10,000 links → 100 links');
      featureLosses.push('100,000 clicks → 1,000 clicks');
      featureLosses.push('Custom domains');
      featureLosses.push('API access');
      featureLosses.push('Priority support');
    }
  } else if (currentPlan === 'starter' && targetPlan === 'free') {
    featureLosses.push('10 team members → 3 members');
    featureLosses.push('1,000 links → 100 links');
    featureLosses.push('10,000 clicks → 1,000 clicks');
    featureLosses.push('Custom domain');
    featureLosses.push('API access');
    featureLosses.push('Email support');
  }

  const effectiveDate = currentPlanData?.currentPeriodEnd 
    ? new Date(currentPlanData.currentPeriodEnd)
    : new Date();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Downgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Please review the changes before confirming your downgrade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan Change Summary */}
          <Card className="border-destructive/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{currentPlanDetails.name}</Badge>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="destructive">{targetPlanDetails.name}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    From ${currentPlanDetails.price}/mo to ${targetPlanDetails.price}/mo
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Features Being Lost */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-destructive">
                  You will lose access to:
                </p>
                {featureLosses.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <X className="w-4 h-4 text-destructive shrink-0" />
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Important Notices */}
          <div className="space-y-3">
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertTitle>Effective Date</AlertTitle>
              <AlertDescription>
                Your downgrade will take effect on{' '}
                <strong>{format(effectiveDate, 'MMMM dd, yyyy')}</strong>.
                You'll continue to have access to your current plan until then.
              </AlertDescription>
            </Alert>

            <Alert>
              <Database className="h-4 w-4" />
              <AlertTitle>Data Retention</AlertTitle>
              <AlertDescription>
                All your data will be preserved. However, you may not be able to create
                new content if you exceed the limits of your new plan.
              </AlertDescription>
            </Alert>

            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>No Refunds</AlertTitle>
              <AlertDescription>
                You'll continue to have access to your current plan features until
                the end of your billing period. No partial refunds will be issued.
              </AlertDescription>
            </Alert>
          </div>

          {/* Confirmation Checkbox */}
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="confirm"
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                />
                <label
                  htmlFor="confirm"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  I understand that I will lose access to the features listed above
                  and that this change will take effect at the end of my current
                  billing period.
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDowngrade}
            disabled={!confirmed || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Confirm Downgrade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}