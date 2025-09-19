'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Check, 
  CreditCard, 
  ArrowRight, 
  AlertCircle,
  Sparkles,
  Zap
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { trpc } from '@/lib/trpc/client';
import { BILLING_PLANS } from '@/lib/stripe-config';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  targetPlan: 'starter' | 'growth';
  currentPlan: 'free' | 'starter' | 'growth';
}

interface CheckoutFormProps {
  workspaceId: string;
  targetPlan: 'starter' | 'growth';
  currentPlan: 'free' | 'starter' | 'growth';
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ 
  workspaceId, 
  targetPlan, 
  currentPlan,
  onSuccess,
  onCancel
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prorationAmount, setProrationAmount] = useState<number | null>(null);

  const createCheckoutSession = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: async (data) => {
      if (!stripe || !data.url) return;
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error) => {
      setError(error.message);
      setIsProcessing(false);
    },
  });

  const updateSubscription = trpc.billing.updateSubscription.useMutation({
    onSuccess: () => {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      toast.success('Successfully upgraded your plan! 🎉');
      onSuccess();
    },
    onError: (error) => {
      setError(error.message);
      setIsProcessing(false);
    },
  });

  // Calculate proration
  useEffect(() => {
    if (currentPlan !== 'free') {
      const currentPrice = BILLING_PLANS[currentPlan.toUpperCase() as keyof typeof BILLING_PLANS].price;
      const targetPrice = BILLING_PLANS[targetPlan.toUpperCase() as keyof typeof BILLING_PLANS].price;
      const proration = targetPrice - currentPrice;
      setProrationAmount(proration);
    }
  }, [currentPlan, targetPlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    if (currentPlan === 'free') {
      // New subscription - use checkout session
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
  };

  const targetPlanDetails = BILLING_PLANS[targetPlan.toUpperCase() as keyof typeof BILLING_PLANS];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Upgrading to {targetPlanDetails.name}</p>
                <p className="text-sm text-muted-foreground">
                  ${targetPlanDetails.price}/month
                </p>
              </div>
            </div>
            <Badge variant="secondary">
              <Sparkles className="w-3 h-3 mr-1" />
              Upgrade
            </Badge>
          </div>

          <Separator className="my-4" />

          {/* Features Preview */}
          <div className="space-y-2">
            <p className="text-sm font-medium mb-3">You'll get access to:</p>
            {targetPlan === 'starter' ? (
              <>
                <FeatureItem text="10 team members (from 3)" />
                <FeatureItem text="1,000 links (from 100)" />
                <FeatureItem text="10,000 clicks/month (from 1,000)" />
                <FeatureItem text="Custom domain" />
                <FeatureItem text="API access" />
              </>
            ) : (
              <>
                <FeatureItem text="Unlimited team members" />
                <FeatureItem text="10,000 links" />
                <FeatureItem text="100,000 clicks/month" />
                <FeatureItem text="Unlimited custom domains" />
                <FeatureItem text="Priority support" />
              </>
            )}
          </div>

          {/* Proration Info */}
          {prorationAmount !== null && prorationAmount > 0 && (
            <>
              <Separator className="my-4" />
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You'll be charged a prorated amount of approximately ${prorationAmount.toFixed(2)} for the remainder of your current billing period.
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Method (for new subscriptions) */}
      {currentPlan === 'free' && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium mb-3">Payment Information</p>
            <div className="p-4 border rounded-lg bg-muted/50">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            'Processing...'
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              {currentPlan === 'free' ? 'Start subscription' : 'Upgrade now'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <motion.div 
      className="flex items-center gap-2 text-sm"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Check className="w-4 h-4 text-green-500 shrink-0" />
      <span>{text}</span>
    </motion.div>
  );
}

export default function UpgradeModal({
  isOpen,
  onClose,
  workspaceId,
  targetPlan,
  currentPlan,
}: UpgradeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Unlock more features and grow your workspace
          </DialogDescription>
        </DialogHeader>
        
        <AnimatePresence mode="wait">
          {currentPlan === 'free' ? (
            <Elements stripe={stripePromise}>
              <CheckoutForm
                workspaceId={workspaceId}
                targetPlan={targetPlan}
                currentPlan={currentPlan}
                onSuccess={onClose}
                onCancel={onClose}
              />
            </Elements>
          ) : (
            <CheckoutForm
              workspaceId={workspaceId}
              targetPlan={targetPlan}
              currentPlan={currentPlan}
              onSuccess={onClose}
              onCancel={onClose}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}