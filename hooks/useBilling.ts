import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';

interface UseBillingOptions {
  workspaceId: string;
  onUpgradeSuccess?: () => void;
  onDowngradeSuccess?: () => void;
}

export function useBilling({ 
  workspaceId, 
  onUpgradeSuccess,
  onDowngradeSuccess 
}: UseBillingOptions) {
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current plan
  const currentPlanQuery = trpc.billing.getCurrentPlan.useQuery(
    { workspaceId },
    { 
      enabled: !!workspaceId,
      refetchInterval: 60000, // Refetch every minute
    }
  );

  // Fetch usage metrics
  const usageMetricsQuery = trpc.billing.getUsageMetrics.useQuery(
    { workspaceId, period: 'monthly' },
    { 
      enabled: !!workspaceId,
      refetchInterval: 300000, // Refetch every 5 minutes
    }
  );

  // Fetch payment methods
  const paymentMethodsQuery = trpc.billing.getPaymentMethods.useQuery(
    { workspaceId },
    { enabled: !!workspaceId }
  );

  // Check plan limits
  const checkLimits = trpc.billing.checkPlanLimits.useMutation();

  // Create checkout session
  const createCheckoutSession = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create checkout session');
    },
  });

  // Update subscription
  const updateSubscription = trpc.billing.updateSubscription.useMutation({
    onSuccess: () => {
      toast.success('Subscription updated successfully');
      currentPlanQuery.refetch();
      onUpgradeSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update subscription');
    },
  });

  // Cancel subscription
  const cancelSubscription = trpc.billing.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success('Subscription will be canceled at the end of the billing period');
      currentPlanQuery.refetch();
      onDowngradeSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel subscription');
    },
  });

  // Create billing portal session
  const createBillingPortal = trpc.billing.createBillingPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to open billing portal');
    },
  });

  // Check if resource is at limit
  const isAtLimit = async (resource: 'links' | 'users' | 'clicks'): Promise<boolean> => {
    try {
      const result = await checkLimits.mutateAsync({ workspaceId, resource });
      if (result.isAtLimit) {
        toast.error(
          `You've reached your ${resource} limit. Please upgrade your plan to continue.`,
          {
            action: {
              label: 'Upgrade',
              onClick: () => handleUpgrade(),
            },
          }
        );
      }
      return result.isAtLimit;
    } catch (error) {
      console.error('Failed to check limits:', error);
      return false;
    }
  };

  // Handle upgrade
  const handleUpgrade = (targetPlan?: 'starter' | 'growth') => {
    const currentPlan = currentPlanQuery.data?.plan;
    if (!currentPlan || !targetPlan) return;

    setIsLoading(true);
    
    if (currentPlan === 'free') {
      // New subscription - redirect to checkout
      const successUrl = `${window.location.origin}/workspace/${workspaceId}/billing?upgraded=true`;
      const cancelUrl = `${window.location.origin}/workspace/${workspaceId}/billing`;
      
      createCheckoutSession.mutate({
        workspaceId,
        planId: targetPlan,
        successUrl,
        cancelUrl,
      });
    } else {
      // Existing subscription - update it
      updateSubscription.mutate({
        workspaceId,
        planId: targetPlan,
      });
    }
    
    setIsLoading(false);
  };

  // Handle downgrade
  const handleDowngrade = (targetPlan: 'free' | 'starter') => {
    setIsLoading(true);
    
    if (targetPlan === 'free') {
      cancelSubscription.mutate({
        workspaceId,
        immediately: false,
      });
    } else {
      updateSubscription.mutate({
        workspaceId,
        planId: targetPlan,
      });
    }
    
    setIsLoading(false);
  };

  // Open Stripe billing portal
  const openBillingPortal = () => {
    const returnUrl = `${window.location.origin}/workspace/${workspaceId}/billing`;
    createBillingPortal.mutate({
      workspaceId,
      returnUrl,
    });
  };

  // Check for upgrade success in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      toast.success('🎉 Successfully upgraded your plan!');
      // Remove the param from URL
      params.delete('upgraded');
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  return {
    // Data
    currentPlan: currentPlanQuery.data,
    usageMetrics: usageMetricsQuery.data,
    paymentMethods: paymentMethodsQuery.data,
    
    // Loading states
    isLoading: isLoading || currentPlanQuery.isLoading,
    isLoadingMetrics: usageMetricsQuery.isLoading,
    isLoadingPaymentMethods: paymentMethodsQuery.isLoading,
    
    // Actions
    handleUpgrade,
    handleDowngrade,
    openBillingPortal,
    isAtLimit,
    
    // Refetch functions
    refetchCurrentPlan: currentPlanQuery.refetch,
    refetchUsageMetrics: usageMetricsQuery.refetch,
    refetchPaymentMethods: paymentMethodsQuery.refetch,
  };
}