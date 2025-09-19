'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type PlanFeature = {
  text: string;
  included: boolean;
};

type PricingPlan = {
  id: 'free' | 'starter' | 'growth';
  name: string;
  price: number;
  description: string;
  features: PlanFeature[];
  highlighted?: boolean;
};

interface PricingCardsProps {
  currentPlan: 'free' | 'starter' | 'growth';
  onUpgrade: (plan: 'starter' | 'growth') => void;
  onDowngrade: (plan: 'free' | 'starter') => void;
  isLoading?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for trying out Isla',
    features: [
      { text: 'Up to 3 team members', included: true },
      { text: '100 short links', included: true },
      { text: '1,000 clicks per month', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'QR codes', included: true },
      { text: 'Custom domains', included: false },
      { text: 'API access', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    description: 'Great for growing teams',
    highlighted: true,
    features: [
      { text: 'Up to 10 team members', included: true },
      { text: '1,000 short links', included: true },
      { text: '10,000 clicks per month', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'QR codes', included: true },
      { text: '1 custom domain', included: true },
      { text: 'API access', included: true },
      { text: 'Email support', included: true },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 49,
    description: 'For teams that need more',
    features: [
      { text: 'Unlimited team members', included: true },
      { text: '10,000 short links', included: true },
      { text: '100,000 clicks per month', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'QR codes', included: true },
      { text: 'Unlimited custom domains', included: true },
      { text: 'API access', included: true },
      { text: 'Priority support', included: true },
    ],
  },
];

export default function PricingCards({ 
  currentPlan, 
  onUpgrade, 
  onDowngrade,
  isLoading = false 
}: PricingCardsProps) {
  
  const getButtonProps = (plan: PricingPlan) => {
    if (plan.id === currentPlan) {
      return {
        variant: 'outline' as const,
        disabled: true,
        children: 'Current Plan',
      };
    }

    const isUpgrade = 
      (currentPlan === 'free' && (plan.id === 'starter' || plan.id === 'growth')) ||
      (currentPlan === 'starter' && plan.id === 'growth');

    if (isUpgrade) {
      return {
        variant: plan.highlighted ? 'default' as const : 'outline' as const,
        onClick: () => onUpgrade(plan.id as 'starter' | 'growth'),
        children: 'Upgrade',
      };
    }

    return {
      variant: 'outline' as const,
      onClick: () => onDowngrade(plan.id as 'free' | 'starter'),
      children: 'Downgrade',
    };
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="relative">
            <CardHeader>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {plans.map((plan) => (
        <Card 
          key={plan.id}
          className={cn(
            "relative overflow-hidden transition-all",
            plan.highlighted && "border-primary shadow-lg scale-105",
            plan.id === currentPlan && "border-blue-500"
          )}
        >
          {plan.highlighted && (
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 rotate-45 bg-primary px-12 py-1">
              <span className="text-xs text-primary-foreground font-medium">
                Popular
              </span>
            </div>
          )}

          {plan.id === currentPlan && (
            <Badge 
              className="absolute top-4 left-4" 
              variant="secondary"
            >
              Current
            </Badge>
          )}

          <CardHeader className={plan.id === currentPlan ? 'pt-12' : ''}>
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">${plan.price}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>

          <CardContent>
            <ul className="space-y-3">
              {plan.features.map((feature, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2"
                >
                  {feature.included ? (
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                  )}
                  <span className={cn(
                    "text-sm",
                    !feature.included && "text-muted-foreground/50"
                  )}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter>
            <Button 
              className="w-full" 
              {...getButtonProps(plan)}
            />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}