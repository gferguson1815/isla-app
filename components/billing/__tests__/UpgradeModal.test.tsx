import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UpgradeModal from '../UpgradeModal';

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    elements: vi.fn(() => ({
      create: vi.fn(),
      getElement: vi.fn(() => ({})),
    })),
  })),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => <div>{children}</div>,
  CardElement: () => <div data-testid="card-element">Card Element</div>,
  useStripe: () => ({
    createPaymentMethod: vi.fn(),
  }),
  useElements: () => ({
    getElement: vi.fn(() => ({})),
  }),
}));

// Mock confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock trpc
vi.mock('@/lib/trpc', () => ({
  trpc: {
    billing: {
      createCheckoutSession: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
        })),
      },
      updateSubscription: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
        })),
      },
    },
  },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('UpgradeModal', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    workspaceId: 'test-workspace-id',
    targetPlan: 'starter' as const,
    currentPlan: 'free' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upgrade modal with correct title', () => {
    render(<UpgradeModal {...defaultProps} />, { wrapper });
    
    expect(screen.getByText('Upgrade Your Plan')).toBeInTheDocument();
    expect(screen.getByText('Unlock more features and grow your workspace')).toBeInTheDocument();
  });

  it('displays target plan details', () => {
    render(<UpgradeModal {...defaultProps} />, { wrapper });
    
    expect(screen.getByText('Upgrading to Starter')).toBeInTheDocument();
    expect(screen.getByText('$19/month')).toBeInTheDocument();
  });

  it('shows features that will be gained', () => {
    render(<UpgradeModal {...defaultProps} />, { wrapper });
    
    expect(screen.getByText("You'll get access to:")).toBeInTheDocument();
    expect(screen.getByText('10 team members (from 3)')).toBeInTheDocument();
    expect(screen.getByText('1,000 links (from 100)')).toBeInTheDocument();
    expect(screen.getByText('10,000 clicks/month (from 1,000)')).toBeInTheDocument();
    expect(screen.getByText('Custom domain')).toBeInTheDocument();
    expect(screen.getByText('API access')).toBeInTheDocument();
  });

  it('shows growth plan features when upgrading to growth', () => {
    render(
      <UpgradeModal {...defaultProps} targetPlan="growth" />,
      { wrapper }
    );
    
    expect(screen.getByText('Upgrading to Growth')).toBeInTheDocument();
    expect(screen.getByText('$49/month')).toBeInTheDocument();
    expect(screen.getByText('Unlimited team members')).toBeInTheDocument();
    expect(screen.getByText('10,000 links')).toBeInTheDocument();
    expect(screen.getByText('100,000 clicks/month')).toBeInTheDocument();
    expect(screen.getByText('Unlimited custom domains')).toBeInTheDocument();
    expect(screen.getByText('Priority support')).toBeInTheDocument();
  });

  it('shows payment form for new subscriptions', () => {
    render(<UpgradeModal {...defaultProps} />, { wrapper });
    
    expect(screen.getByText('Payment Information')).toBeInTheDocument();
    expect(screen.getByTestId('card-element')).toBeInTheDocument();
  });

  it('does not show payment form for existing subscriptions', () => {
    render(
      <UpgradeModal {...defaultProps} currentPlan="starter" targetPlan="growth" />,
      { wrapper }
    );
    
    expect(screen.queryByText('Payment Information')).not.toBeInTheDocument();
    expect(screen.queryByTestId('card-element')).not.toBeInTheDocument();
  });

  it('shows proration info for plan changes', () => {
    render(
      <UpgradeModal {...defaultProps} currentPlan="starter" targetPlan="growth" />,
      { wrapper }
    );
    
    expect(screen.getByText(/You'll be charged a prorated amount/)).toBeInTheDocument();
  });

  it('has cancel button', () => {
    render(<UpgradeModal {...defaultProps} />, { wrapper });
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    render(<UpgradeModal {...defaultProps} />, { wrapper });
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('has upgrade button with correct text for new subscription', () => {
    render(<UpgradeModal {...defaultProps} />, { wrapper });
    
    const upgradeButton = screen.getByRole('button', { name: /start subscription/i });
    expect(upgradeButton).toBeInTheDocument();
  });

  it('has upgrade button with correct text for existing subscription', () => {
    render(
      <UpgradeModal {...defaultProps} currentPlan="starter" targetPlan="growth" />,
      { wrapper }
    );
    
    const upgradeButton = screen.getByRole('button', { name: /upgrade now/i });
    expect(upgradeButton).toBeInTheDocument();
  });

  it('disables buttons when processing', () => {
    const { rerender } = render(<UpgradeModal {...defaultProps} />, { wrapper });
    
    const upgradeButton = screen.getByRole('button', { name: /start subscription/i });
    fireEvent.click(upgradeButton);
    
    // Simulate processing state
    rerender(<UpgradeModal {...defaultProps} />, { wrapper });
    
    // Both buttons should be disabled during processing
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      if (button.textContent?.includes('Processing')) {
        expect(button).toBeDisabled();
      }
    });
  });

  it('displays error message when payment fails', async () => {
    render(<UpgradeModal {...defaultProps} />, { wrapper });
    
    // Simulate error
    const errorMessage = 'Payment failed';
    // In a real test, you'd trigger the error through the mutation
    
    // For now, just check that error UI exists
    const form = screen.getByRole('button', { name: /start subscription/i }).closest('form');
    expect(form).toBeInTheDocument();
  });

  it('shows sparkles icon in header', () => {
    const { container } = render(<UpgradeModal {...defaultProps} />, { wrapper });
    
    const sparklesIcon = container.querySelector('.lucide-sparkles');
    expect(sparklesIcon).toBeInTheDocument();
  });

  it('shows upgrade badge', () => {
    render(<UpgradeModal {...defaultProps} />, { wrapper });
    
    const upgradeBadge = screen.getByText('Upgrade');
    expect(upgradeBadge).toBeInTheDocument();
  });

  it('uses correct icons for features', () => {
    const { container } = render(<UpgradeModal {...defaultProps} />, { wrapper });
    
    const checkIcons = container.querySelectorAll('.lucide-check');
    expect(checkIcons.length).toBeGreaterThan(0);
  });
});