import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsErrorBoundary, withAnalyticsErrorBoundary, useErrorHandler } from '../ErrorBoundary';
import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';

// Mock console.error to prevent test output pollution
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Component that throws async error
const ThrowAsyncError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  React.useEffect(() => {
    if (shouldThrow) {
      throw new Error('Async test error');
    }
  }, [shouldThrow]);
  return <div>Loading...</div>;
};

describe('AnalyticsErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <AnalyticsErrorBoundary>
        <div>Test content</div>
      </AnalyticsErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('catches and displays error when child component throws', () => {
    render(
      <AnalyticsErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AnalyticsErrorBoundary>
    );

    expect(screen.getByText('Analytics Error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('resets error state when Try Again is clicked', () => {
    const { rerender } = render(
      <AnalyticsErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AnalyticsErrorBoundary>
    );

    expect(screen.getByText('Analytics Error')).toBeInTheDocument();

    // First fix the component so it won't throw again
    rerender(
      <AnalyticsErrorBoundary>
        <ThrowError shouldThrow={false} />
      </AnalyticsErrorBoundary>
    );

    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByText('Analytics Error')).not.toBeInTheDocument();
  });

  it('calls onError callback when error is caught', () => {
    const onError = vi.fn();

    render(
      <AnalyticsErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </AnalyticsErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('renders custom fallback when provided', () => {
    const CustomFallback = <div>Custom error message</div>;

    render(
      <AnalyticsErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </AnalyticsErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Analytics Error')).not.toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <AnalyticsErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AnalyticsErrorBoundary>
    );

    expect(screen.getByText('View error details')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <AnalyticsErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AnalyticsErrorBoundary>
    );

    expect(screen.queryByText('View error details')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('handles multiple sequential errors', () => {
    const { rerender } = render(
      <AnalyticsErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AnalyticsErrorBoundary>
    );

    expect(screen.getByText('Test error')).toBeInTheDocument();

    // Reset the error
    rerender(
      <AnalyticsErrorBoundary>
        <ThrowError shouldThrow={false} />
      </AnalyticsErrorBoundary>
    );
    fireEvent.click(screen.getByText('Try Again'));

    // Trigger a different error
    rerender(
      <AnalyticsErrorBoundary>
        <div>{(() => { throw new Error('Another error'); })()}</div>
      </AnalyticsErrorBoundary>
    );

    expect(screen.getByText('Another error')).toBeInTheDocument();
  });
});

describe('withAnalyticsErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    const TestComponent: React.FC = () => <div>Test component</div>;
    const WrappedComponent = withAnalyticsErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Test component')).toBeInTheDocument();
  });

  it('catches errors in wrapped component', () => {
    const ErrorComponent: React.FC<{ shouldError: boolean }> = ({ shouldError }) => {
      if (shouldError) throw new Error('HOC error');
      return <div>No error</div>;
    };

    const WrappedComponent = withAnalyticsErrorBoundary(ErrorComponent);

    render(<WrappedComponent shouldError={true} />);

    expect(screen.getByText('Analytics Error')).toBeInTheDocument();
    expect(screen.getByText('HOC error')).toBeInTheDocument();
  });

  it('uses custom fallback when provided', () => {
    const TestComponent: React.FC = () => {
      throw new Error('Test');
    };

    const WrappedComponent = withAnalyticsErrorBoundary(
      TestComponent,
      <div>Custom HOC fallback</div>
    );

    render(<WrappedComponent />);

    expect(screen.getByText('Custom HOC fallback')).toBeInTheDocument();
  });
});

describe('useErrorHandler hook', () => {
  it('captures and throws errors', () => {
    const ErrorComponent: React.FC = () => {
      const { captureError } = useErrorHandler();

      React.useEffect(() => {
        captureError(new Error('Hook error'));
      }, [captureError]);

      return <div>Should not render</div>;
    };

    expect(() => {
      render(
        <AnalyticsErrorBoundary>
          <ErrorComponent />
        </AnalyticsErrorBoundary>
      );
    }).not.toThrow();

    expect(screen.getByText('Hook error')).toBeInTheDocument();
  });

  it('resets error state', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.captureError(new Error('Test'));
    });

    expect(() => {
      result.current.resetError();
    }).not.toThrow();
  });
});

describe('Error Boundary Integration', () => {
  it('handles errors in chart components', () => {
    // Simulate a chart component error
    const ChartWithError: React.FC = () => {
      const data: any = null;
      return <div>{data.map((item: any) => item.value)}</div>; // Will throw
    };

    render(
      <AnalyticsErrorBoundary>
        <ChartWithError />
      </AnalyticsErrorBoundary>
    );

    expect(screen.getByText('Analytics Error')).toBeInTheDocument();
  });

  it('handles network errors gracefully', async () => {
    const NetworkComponent: React.FC = () => {
      const [data, setData] = React.useState(null);
      const [error, setError] = React.useState<Error | null>(null);

      React.useEffect(() => {
        fetch('/api/analytics/invalid')
          .then(res => {
            if (!res.ok) throw new Error('Network error');
            return res.json();
          })
          .then(setData)
          .catch(setError);
      }, []);

      if (error) throw error;
      if (!data) return <div>Loading...</div>;
      return <div>Data loaded</div>;
    };

    render(
      <AnalyticsErrorBoundary>
        <NetworkComponent />
      </AnalyticsErrorBoundary>
    );

    // Initially shows loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles permission errors', () => {
    const PermissionError: React.FC = () => {
      throw new Error('You do not have permission to view analytics for this link');
    };

    render(
      <AnalyticsErrorBoundary>
        <PermissionError />
      </AnalyticsErrorBoundary>
    );

    expect(screen.getByText('You do not have permission to view analytics for this link')).toBeInTheDocument();
  });

  it('handles rate limit errors', () => {
    const RateLimitError: React.FC = () => {
      throw new Error('Rate limit exceeded. Please try again in 30 seconds.');
    };

    render(
      <AnalyticsErrorBoundary>
        <RateLimitError />
      </AnalyticsErrorBoundary>
    );

    expect(screen.getByText('Rate limit exceeded. Please try again in 30 seconds.')).toBeInTheDocument();
  });
});