'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Plus, Trash2, Star, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentMethodsProps {
  workspaceId: string;
  customerId: string;
}

interface PaymentMethodCardProps {
  method: {
    id: string;
    type: string;
    brand?: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
  };
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
}

function PaymentMethodCard({ method, onSetDefault, onRemove }: PaymentMethodCardProps) {
  const cardBrandIcons: Record<string, string> = {
    visa: '💳',
    mastercard: '💳',
    amex: '💳',
    discover: '💳',
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="text-2xl">
          {cardBrandIcons[method.brand?.toLowerCase() || ''] || '💳'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium capitalize">{method.brand || method.type}</span>
            <span className="text-muted-foreground">•••• {method.last4}</span>
            {method.isDefault && (
              <Badge variant="secondary" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                Default
              </Badge>
            )}
          </div>
          {method.expiryMonth && method.expiryYear && (
            <p className="text-sm text-muted-foreground">
              Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!method.isDefault && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetDefault(method.id)}
          >
            Set as default
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(method.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function AddPaymentMethodForm({ 
  workspaceId, 
  onSuccess 
}: { 
  workspaceId: string; 
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        setError(stripeError.message || 'Failed to add payment method');
        setIsProcessing(false);
        return;
      }

      // TODO: Call tRPC mutation to save payment method
      toast.success('Payment method added successfully');
      onSuccess();
    } catch (err) {
      setError('Failed to add payment method');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="p-4 border rounded-lg">
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

      <DialogFooter>
        <Button type="submit" disabled={!stripe || isProcessing}>
          {isProcessing ? 'Processing...' : 'Add Payment Method'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function PaymentMethods({ workspaceId, customerId }: PaymentMethodsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: paymentMethods, isLoading, refetch } = trpc.billing.getPaymentMethods.useQuery(
    { workspaceId },
    { enabled: !!workspaceId }
  );

  const setDefaultMutation = trpc.billing.setDefaultPaymentMethod.useMutation({
    onSuccess: () => {
      toast.success('Default payment method updated');
      refetch();
    },
    onError: () => {
      toast.error('Failed to update default payment method');
    },
  });

  const removeMutation = trpc.billing.removePaymentMethod.useMutation({
    onSuccess: () => {
      toast.success('Payment method removed');
      refetch();
    },
    onError: () => {
      toast.error('Failed to remove payment method');
    },
  });

  const handleSetDefault = (paymentMethodId: string) => {
    setDefaultMutation.mutate({ workspaceId, paymentMethodId });
  };

  const handleRemove = (paymentMethodId: string) => {
    if (confirm('Are you sure you want to remove this payment method?')) {
      removeMutation.mutate({ workspaceId, paymentMethodId });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Manage your payment methods for this workspace
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Payment Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : paymentMethods && paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  method={method}
                  onSetDefault={handleSetDefault}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No payment methods added yet</p>
              <Button 
                onClick={() => setShowAddDialog(true)} 
                variant="outline"
                className="mt-4"
              >
                Add your first payment method
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new credit or debit card to your workspace
            </DialogDescription>
          </DialogHeader>
          <Elements stripe={stripePromise}>
            <AddPaymentMethodForm 
              workspaceId={workspaceId}
              onSuccess={() => {
                setShowAddDialog(false);
                refetch();
              }}
            />
          </Elements>
        </DialogContent>
      </Dialog>
    </>
  );
}