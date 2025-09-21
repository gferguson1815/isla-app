import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StripeErrorBoundary } from '../components/StripeErrorBoundary';

// Mock component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('StripeErrorBoundary', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress console.error for these tests
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('renders children when there is no error', () => {
    render(
      <StripeErrorBoundary>
        <div>Child component</div>
      </StripeErrorBoundary>
    );

    expect(screen.getByText('Child component')).toBeInTheDocument();
  });

  it('displays error UI when an error occurs', () => {
    render(
      <StripeErrorBoundary>
        <ThrowError shouldThrow={true} />
      </StripeErrorBoundary>
    );

    expect(screen.getByText('Payment Setup Error')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an issue setting up your payment/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
  });

  it('shows technical details when expanded', () => {
    render(
      <StripeErrorBoundary>
        <ThrowError shouldThrow={true} />
      </StripeErrorBoundary>
    );

    const detailsButton = screen.getByText('Technical Details');
    fireEvent.click(detailsButton);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('calls onRetry callback when Try Again is clicked', () => {
    const mockRetry = vi.fn();

    render(
      <StripeErrorBoundary onRetry={mockRetry}>
        <ThrowError shouldThrow={true} />
      </StripeErrorBoundary>
    );

    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('resets error state when onRetry is called', () => {
    const mockRetry = vi.fn();
    let key = 0;
    const { rerender } = render(
      <StripeErrorBoundary key={key} onRetry={mockRetry}>
        <ThrowError shouldThrow={true} />
      </StripeErrorBoundary>
    );

    // Error boundary should show error UI
    expect(screen.getByText('Payment Setup Error')).toBeInTheDocument();

    // Click retry
    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    // Force a new instance of the error boundary
    key++;
    rerender(
      <StripeErrorBoundary key={key} onRetry={mockRetry}>
        <ThrowError shouldThrow={false} />
      </StripeErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByText('Payment Setup Error')).not.toBeInTheDocument();
  });

  it('logs error to console when error occurs', () => {
    render(
      <StripeErrorBoundary>
        <ThrowError shouldThrow={true} />
      </StripeErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Stripe checkout error:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('does not break when analytics is not available', () => {
    // Ensure window.analytics is undefined
    const originalAnalytics = (window as unknown as { analytics?: unknown }).analytics;
    delete (window as unknown as { analytics?: unknown }).analytics;

    expect(() => {
      render(
        <StripeErrorBoundary>
          <ThrowError shouldThrow={true} />
        </StripeErrorBoundary>
      );
    }).not.toThrow();

    // Restore analytics if it existed
    if (originalAnalytics) {
      (window as unknown as { analytics: unknown }).analytics = originalAnalytics;
    }
  });
});