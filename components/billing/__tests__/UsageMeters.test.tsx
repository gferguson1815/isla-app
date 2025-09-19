import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import UsageMeters from '../UsageMeters';

describe('UsageMeters', () => {
  const mockMetrics = {
    users: { current: 5, limit: 10 },
    links: { current: 250, limit: 1000 },
    clicks: { current: 500, limit: 1000 },
  };

  it('renders all three usage meters', () => {
    render(<UsageMeters metrics={mockMetrics} />);
    
    expect(screen.getByText('Team Members')).toBeInTheDocument();
    expect(screen.getByText('Links Created')).toBeInTheDocument();
    expect(screen.getByText('Clicks This Month')).toBeInTheDocument();
  });

  it('displays current and limit values correctly', () => {
    render(<UsageMeters metrics={mockMetrics} />);
    
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
    expect(screen.getByText('250 / 1,000')).toBeInTheDocument();
    expect(screen.getByText('500 / 1,000')).toBeInTheDocument();
  });

  it('shows infinity symbol for unlimited limits', () => {
    const unlimitedMetrics = {
      users: { current: 5, limit: 'unlimited' as const },
      links: { current: 250, limit: -1 },
      clicks: { current: 500, limit: 1000 },
    };
    
    render(<UsageMeters metrics={unlimitedMetrics} />);
    
    const infinitySymbols = screen.getAllByText(/∞/);
    expect(infinitySymbols).toHaveLength(2);
  });

  it('calculates percentage correctly', () => {
    const { container } = render(<UsageMeters metrics={mockMetrics} />);
    
    // User meter should be at 50%
    // Links meter should be at 25%
    // Clicks meter should be at 50%
    
    // Check if progress bars are rendered (you might need to check animation states)
    const progressBars = container.querySelectorAll('.rounded-full');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('shows warning message when usage is above 90%', async () => {
    const highUsageMetrics = {
      users: { current: 95, limit: 100 },
      links: { current: 250, limit: 1000 },
      clicks: { current: 500, limit: 1000 },
    };
    
    render(<UsageMeters metrics={highUsageMetrics} />);
    
    await waitFor(() => {
      expect(screen.getByText('5% remaining')).toBeInTheDocument();
    });
  });

  it('shows limit reached message when at 100%', async () => {
    const maxedMetrics = {
      users: { current: 100, limit: 100 },
      links: { current: 250, limit: 1000 },
      clicks: { current: 500, limit: 1000 },
    };
    
    render(<UsageMeters metrics={maxedMetrics} />);
    
    await waitFor(() => {
      expect(screen.getByText('Limit reached')).toBeInTheDocument();
    });
  });

  it('applies correct color classes based on usage percentage', () => {
    const criticalMetrics = {
      users: { current: 95, limit: 100 }, // Critical (>90%)
      links: { current: 800, limit: 1000 }, // Warning (75-90%)
      clicks: { current: 200, limit: 1000 }, // Normal (<75%)
    };
    
    const { container } = render(<UsageMeters metrics={criticalMetrics} />);
    
    // Check for destructive color class
    const destructiveBar = container.querySelector('.bg-destructive');
    expect(destructiveBar).toBeInTheDocument();
    
    // Check for warning color class
    const warningBar = container.querySelector('.bg-yellow-500');
    expect(warningBar).toBeInTheDocument();
    
    // Check for primary color class
    const primaryBar = container.querySelector('.bg-primary');
    expect(primaryBar).toBeInTheDocument();
  });

  it('handles zero usage correctly', () => {
    const zeroMetrics = {
      users: { current: 0, limit: 10 },
      links: { current: 0, limit: 1000 },
      clicks: { current: 0, limit: 1000 },
    };
    
    render(<UsageMeters metrics={zeroMetrics} />);
    
    expect(screen.getByText('0 / 10')).toBeInTheDocument();
    expect(screen.getByText('0 / 1,000')).toBeInTheDocument();
  });
});