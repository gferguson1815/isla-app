import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlanSelectionPage from '../page';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

// Mock trpc
const mockUseQuery = vi.fn();
const mockCompleteOnboarding = vi.fn();
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    workspace: {
      getBySlug: {
        useQuery: () => mockUseQuery(),
      },
    },
    onboarding: {
      completeOnboarding: {
        useMutation: () => mockCompleteOnboarding(),
      },
    },
  },
}));

// Mock components
vi.mock('@/components/help/HelpWidget', () => ({
  HelpWidget: () => <div>Help Widget</div>,
}));

vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../components/PlanCards', () => ({
  PlanCards: ({ onPlanSelect, recommendedPlan, billingPeriod }: { onPlanSelect: (plan: string) => void, recommendedPlan: string, billingPeriod: string }) => (
    <div data-testid="plan-cards">
      <div>Recommended: {recommendedPlan}</div>
      <div>Billing: {billingPeriod}</div>
      <button onClick={() => onPlanSelect('pro')}>Select Pro</button>
      <button onClick={() => onPlanSelect('business')}>Select Business</button>
      <button onClick={() => onPlanSelect('free')}>Select Free</button>
    </div>
  ),
}));

describe('PlanSelectionPage', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter);
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(mockSearchParams);
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { email: 'test@example.com' },
      signOut: vi.fn(),
    });
    // Default mock for trpc query
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    // Default mock for trpc mutation
    mockCompleteOnboarding.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isLoading: false,
      error: null,
    });
  });

  it('redirects to workspace page if no workspace param', () => {
    render(<PlanSelectionPage />);
    expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/workspace');
  });

  it('renders loading state while checking workspace', () => {
    mockSearchParams.set('workspace', 'test-workspace');
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<PlanSelectionPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('redirects to dashboard if workspace is invalid', async () => {
    mockSearchParams.set('workspace', 'invalid-workspace');
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Not found'),
    });

    render(<PlanSelectionPage />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  it('displays plan selection page with correct workspace', () => {
    mockSearchParams.set('workspace', 'test-workspace');
    mockSearchParams.set('plan', 'business');
    mockUseQuery.mockReturnValue({
      data: { id: '1', name: 'Test Workspace', slug: 'test-workspace' },
      isLoading: false,
      error: null,
    });

    render(<PlanSelectionPage />);

    expect(screen.getByText('Choose your plan')).toBeInTheDocument();
    expect(screen.getByText('Recommended: business')).toBeInTheDocument();
    expect(screen.getByText('Billing: yearly')).toBeInTheDocument(); // Default is yearly
  });

  it('defaults to pro plan if plan param is missing', () => {
    const searchParams = new URLSearchParams('workspace=test-workspace');
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(searchParams);
    mockUseQuery.mockReturnValue({
      data: { id: '1', name: 'Test Workspace', slug: 'test-workspace' },
      isLoading: false,
      error: null,
    });

    render(<PlanSelectionPage />);

    expect(screen.getByText('Recommended: pro')).toBeInTheDocument();
  });

  it('handles free plan selection', async () => {
    mockSearchParams.set('workspace', 'test-workspace');
    mockUseQuery.mockReturnValue({
      data: { id: '1', name: 'Test Workspace', slug: 'test-workspace' },
      isLoading: false,
      error: null,
    });

    render(<PlanSelectionPage />);

    const freeButton = screen.getByText('Select Free');
    fireEvent.click(freeButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/test-workspace/links?onboarded=true');
    });
  });

  it('handles paid plan selection and creates checkout session', async () => {
    mockSearchParams.set('workspace', 'test-workspace');
    mockSearchParams.set('plan', 'pro');
    mockUseQuery.mockReturnValue({
      data: { id: '1', name: 'Test Workspace', slug: 'test-workspace' },
      isLoading: false,
      error: null,
    });

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/session' }),
    });

    render(<PlanSelectionPage />);

    const proButton = screen.getByText('Select Pro');
    fireEvent.click(proButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stripe/create-checkout',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('pro'),
        })
      );
    });
  });

  it('displays user info and sign out button', () => {
    mockSearchParams.set('workspace', 'test-workspace');
    mockUseQuery.mockReturnValue({
      data: { id: '1', name: 'Test Workspace', slug: 'test-workspace' },
      isLoading: false,
      error: null,
    });

    render(<PlanSelectionPage />);

    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    expect(screen.getByText('Sign in as a different user')).toBeInTheDocument();
  });

  it('displays navigation links', () => {
    mockSearchParams.set('workspace', 'test-workspace');
    mockUseQuery.mockReturnValue({
      data: { id: '1', name: 'Test Workspace', slug: 'test-workspace' },
      isLoading: false,
      error: null,
    });

    render(<PlanSelectionPage />);

    expect(screen.getByText('Looking for enterprise?')).toBeInTheDocument();
    expect(screen.getByText('Start for free, pick a plan later')).toBeInTheDocument();
    expect(screen.getByText('Compare all plans')).toBeInTheDocument();
  });
});