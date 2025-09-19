import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UpgradeModal from '../UpgradeModal';
import DowngradeModal from '../DowngradeModal';
import PricingCards from '../PricingCards';

// Mock Stripe Elements
vi.mock('@stripe/react-stripe-js', () => ({
  CardElement: ({ onChange }: any) => {
    return <div data-testid="card-element" onChange={onChange} />;
  },
  Elements: ({ children }: any) => <div>{children}</div>,
  useStripe: () => ({
    confirmCardPayment: vi.fn().mockResolvedValue({ 
      paymentIntent: { status: 'succeeded' } 
    }),
  }),
  useElements: () => ({
    getElement: vi.fn().mockReturnValue({}),
  }),
}));

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock trpc
const mockUpgradeMutation = vi.fn();
const mockDowngradeMutation = vi.fn();
const mockGetProration = vi.fn();

vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    billing: {
      upgradeSubscription: {
        useMutation: () => ({
          mutate: mockUpgradeMutation,
          isLoading: false,
        }),
      },
      downgradeSubscription: {
        useMutation: () => ({
          mutate: mockDowngradeMutation,
          isLoading: false,
        }),
      },
      getProrationPreview: {
        useQuery: () => ({
          data: { amount: 1500 }, // $15.00 proration
          isLoading: false,
        }),
      },
      getCurrentPlan: {
        useQuery: () => ({
          data: {
            plan: 'starter',
            name: 'Starter',
            price: 19,
            limits: {
              maxLinks: 1000,
              maxClicks: 10000,
              maxUsers: 10,
            },
          },
          isLoading: false,
        }),
      },
    },
  },
}));

describe('Upgrade/Downgrade Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Upgrade Flow', () => {
    it('should complete full upgrade flow from starter to growth', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <UpgradeModal
            isOpen={true}
            onClose={onClose}
            workspaceId="ws_123"
            targetPlan="growth"
            currentPlan="starter"
          />
        </QueryClientProvider>
      );

      // Check that modal is open
      expect(screen.getByText(/Upgrade to Growth/i)).toBeInTheDocument();

      // Check proration is displayed
      await waitFor(() => {
        expect(screen.getByText(/\$15\.00/)).toBeInTheDocument();
      });

      // Check feature comparison
      expect(screen.getByText(/Unlimited users/i)).toBeInTheDocument();
      expect(screen.getByText(/10,000 links/i)).toBeInTheDocument();
      expect(screen.getByText(/100,000 clicks/i)).toBeInTheDocument();

      // Fill in card details (mocked)
      const cardElement = screen.getByTestId('card-element');
      expect(cardElement).toBeInTheDocument();

      // Click confirm upgrade
      const confirmButton = screen.getByRole('button', { name: /Confirm Upgrade/i });
      await user.click(confirmButton);

      // Verify mutation was called
      await waitFor(() => {
        expect(mockUpgradeMutation).toHaveBeenCalledWith(
          expect.objectContaining({
            workspaceId: 'ws_123',
            targetPlan: 'growth',
          })
        );
      });
    });

    it('should show error state when upgrade fails', async () => {
      const user = userEvent.setup();
      mockUpgradeMutation.mockRejectedValueOnce(new Error('Payment failed'));

      render(
        <QueryClientProvider client={queryClient}>
          <UpgradeModal
            isOpen={true}
            onClose={vi.fn()}
            workspaceId="ws_123"
            targetPlan="growth"
            currentPlan="starter"
          />
        </QueryClientProvider>
      );

      const confirmButton = screen.getByRole('button', { name: /Confirm Upgrade/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Payment failed/i)).toBeInTheDocument();
      });
    });

    it('should close modal on cancel', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <UpgradeModal
            isOpen={true}
            onClose={onClose}
            workspaceId="ws_123"
            targetPlan="growth"
            currentPlan="starter"
          />
        </QueryClientProvider>
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Downgrade Flow', () => {
    it('should complete full downgrade flow from growth to starter', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <DowngradeModal
            isOpen={true}
            onClose={onClose}
            workspaceId="ws_123"
            targetPlan="starter"
            currentPlan="growth"
          />
        </QueryClientProvider>
      );

      // Check warning message
      expect(screen.getByText(/Are you sure you want to downgrade/i)).toBeInTheDocument();

      // Check features that will be lost
      expect(screen.getByText(/You will lose access to/i)).toBeInTheDocument();

      // Check data retention notice
      expect(screen.getByText(/Your data will be retained/i)).toBeInTheDocument();

      // Type confirmation
      const confirmInput = screen.getByPlaceholderText(/Type DOWNGRADE to confirm/i);
      await user.type(confirmInput, 'DOWNGRADE');

      // Click confirm
      const confirmButton = screen.getByRole('button', { name: /Confirm Downgrade/i });
      await user.click(confirmButton);

      // Verify mutation was called
      await waitFor(() => {
        expect(mockDowngradeMutation).toHaveBeenCalledWith(
          expect.objectContaining({
            workspaceId: 'ws_123',
            targetPlan: 'starter',
          })
        );
      });
    });

    it('should disable confirm button without confirmation text', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <DowngradeModal
            isOpen={true}
            onClose={vi.fn()}
            workspaceId="ws_123"
            targetPlan="starter"
            currentPlan="growth"
          />
        </QueryClientProvider>
      );

      const confirmButton = screen.getByRole('button', { name: /Confirm Downgrade/i });
      expect(confirmButton).toBeDisabled();
    });

    it('should enable confirm button with correct confirmation text', async () => {
      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <DowngradeModal
            isOpen={true}
            onClose={vi.fn()}
            workspaceId="ws_123"
            targetPlan="free"
            currentPlan="starter"
          />
        </QueryClientProvider>
      );

      const confirmInput = screen.getByPlaceholderText(/Type DOWNGRADE to confirm/i);
      await user.type(confirmInput, 'DOWNGRADE');

      const confirmButton = screen.getByRole('button', { name: /Confirm Downgrade/i });
      expect(confirmButton).not.toBeDisabled();
    });
  });

  describe('Plan Selection Integration', () => {
    it('should trigger upgrade modal when upgrading from pricing cards', async () => {
      const user = userEvent.setup();
      const onUpgrade = vi.fn();
      const onDowngrade = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <PricingCards
            currentPlan="free"
            onUpgrade={onUpgrade}
            onDowngrade={onDowngrade}
            isLoading={false}
          />
        </QueryClientProvider>
      );

      // Find and click upgrade to starter button
      const upgradeButtons = screen.getAllByText(/Upgrade/i);
      await user.click(upgradeButtons[0]); // First upgrade button should be for starter

      expect(onUpgrade).toHaveBeenCalledWith('starter');
    });

    it('should trigger downgrade modal when downgrading from pricing cards', async () => {
      const user = userEvent.setup();
      const onUpgrade = vi.fn();
      const onDowngrade = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <PricingCards
            currentPlan="growth"
            onUpgrade={onUpgrade}
            onDowngrade={onDowngrade}
            isLoading={false}
          />
        </QueryClientProvider>
      );

      // Find and click downgrade button
      const downgradeButtons = screen.getAllByText(/Downgrade/i);
      await user.click(downgradeButtons[0]);

      expect(onDowngrade).toHaveBeenCalled();
    });

    it('should disable action for current plan', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <PricingCards
            currentPlan="starter"
            onUpgrade={vi.fn()}
            onDowngrade={vi.fn()}
            isLoading={false}
          />
        </QueryClientProvider>
      );

      // Find current plan button
      const currentPlanButton = screen.getByText(/Current Plan/i);
      expect(currentPlanButton.closest('button')).toBeDisabled();
    });
  });

  describe('End-to-End Subscription Change', () => {
    it('should handle complete upgrade with payment and confirmation', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      // Mock successful payment and subscription update
      mockUpgradeMutation.mockImplementationOnce((data, options) => {
        // Simulate success callback
        setTimeout(() => {
          options?.onSuccess?.({
            success: true,
            subscription: {
              id: 'sub_new',
              plan: 'growth',
            },
          });
        }, 100);
      });

      render(
        <QueryClientProvider client={queryClient}>
          <UpgradeModal
            isOpen={true}
            onClose={onClose}
            workspaceId="ws_123"
            targetPlan="growth"
            currentPlan="starter"
          />
        </QueryClientProvider>
      );

      // Confirm upgrade
      const confirmButton = screen.getByRole('button', { name: /Confirm Upgrade/i });
      await user.click(confirmButton);

      // Wait for success
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('should handle complete downgrade with confirmation', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      // Mock successful downgrade
      mockDowngradeMutation.mockImplementationOnce((data, options) => {
        setTimeout(() => {
          options?.onSuccess?.({
            success: true,
            subscription: {
              id: 'sub_downgraded',
              plan: 'starter',
              cancelAtPeriodEnd: true,
            },
          });
        }, 100);
      });

      render(
        <QueryClientProvider client={queryClient}>
          <DowngradeModal
            isOpen={true}
            onClose={onClose}
            workspaceId="ws_123"
            targetPlan="starter"
            currentPlan="growth"
          />
        </QueryClientProvider>
      );

      // Type confirmation
      const confirmInput = screen.getByPlaceholderText(/Type DOWNGRADE to confirm/i);
      await user.type(confirmInput, 'DOWNGRADE');

      // Confirm downgrade
      const confirmButton = screen.getByRole('button', { name: /Confirm Downgrade/i });
      await user.click(confirmButton);

      // Wait for success and modal close
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      mockUpgradeMutation.mockRejectedValueOnce(new Error('Network error'));

      render(
        <QueryClientProvider client={queryClient}>
          <UpgradeModal
            isOpen={true}
            onClose={vi.fn()}
            workspaceId="ws_123"
            targetPlan="growth"
            currentPlan="starter"
          />
        </QueryClientProvider>
      );

      const confirmButton = screen.getByRole('button', { name: /Confirm Upgrade/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should handle payment declined errors', async () => {
      const user = userEvent.setup();
      mockUpgradeMutation.mockRejectedValueOnce(new Error('Your card was declined'));

      render(
        <QueryClientProvider client={queryClient}>
          <UpgradeModal
            isOpen={true}
            onClose={vi.fn()}
            workspaceId="ws_123"
            targetPlan="growth"
            currentPlan="starter"
          />
        </QueryClientProvider>
      );

      const confirmButton = screen.getByRole('button', { name: /Confirm Upgrade/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Your card was declined/i)).toBeInTheDocument();
      });
    });
  });
});