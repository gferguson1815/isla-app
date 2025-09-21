import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlanCards } from '../components/PlanCards';

// Mock PlanCard component
vi.mock('../components/PlanCard', () => ({
  PlanCard: ({ plan, billingPeriod, isRecommended, onSelect }: { plan: { id: string, name: string, monthlyPrice: number, yearlyPrice: number }, billingPeriod: string, isRecommended: boolean, onSelect: () => void }) => (
    <div data-testid={`plan-${plan.id}`}>
      <div>{plan.name}</div>
      <div>Price: ${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}</div>
      {isRecommended && <div>Recommended</div>}
      <button onClick={onSelect}>Select {plan.name}</button>
    </div>
  ),
}));

describe('PlanCards', () => {
  const mockOnBillingPeriodChange = vi.fn();
  const mockOnPlanSelect = vi.fn();

  const defaultProps = {
    billingPeriod: 'monthly' as const,
    onBillingPeriodChange: mockOnBillingPeriodChange,
    recommendedPlan: 'pro',
    onPlanSelect: mockOnPlanSelect,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all plan cards', () => {
    render(<PlanCards {...defaultProps} />);

    expect(screen.getByTestId('plan-pro')).toBeInTheDocument();
    expect(screen.getByTestId('plan-business')).toBeInTheDocument();
    expect(screen.getByTestId('plan-advanced')).toBeInTheDocument();
  });

  it('shows recommended badge on correct plan', () => {
    render(<PlanCards {...defaultProps} />);

    const proPlan = screen.getByTestId('plan-pro');
    expect(proPlan).toHaveTextContent('Recommended');

    const businessPlan = screen.getByTestId('plan-business');
    expect(businessPlan).not.toHaveTextContent('Recommended');
  });

  it('displays monthly prices when monthly is selected', () => {
    render(<PlanCards {...defaultProps} />);

    expect(screen.getByTestId('plan-pro')).toHaveTextContent('Price: $30');
    expect(screen.getByTestId('plan-business')).toHaveTextContent('Price: $90');
    expect(screen.getByTestId('plan-advanced')).toHaveTextContent('Price: $300');
  });

  it('displays yearly prices when yearly is selected', () => {
    render(<PlanCards {...defaultProps} billingPeriod="yearly" />);

    expect(screen.getByTestId('plan-pro')).toHaveTextContent('Price: $25');
    expect(screen.getByTestId('plan-business')).toHaveTextContent('Price: $75');
    expect(screen.getByTestId('plan-advanced')).toHaveTextContent('Price: $250');
  });

  it('handles billing period toggle', () => {
    render(<PlanCards {...defaultProps} />);

    const yearlyButton = screen.getByRole('button', { name: /yearly/i });
    fireEvent.click(yearlyButton);

    expect(mockOnBillingPeriodChange).toHaveBeenCalledWith('yearly');

    const monthlyButton = screen.getByRole('button', { name: /monthly/i });
    fireEvent.click(monthlyButton);

    expect(mockOnBillingPeriodChange).toHaveBeenCalledWith('monthly');
  });

  it('shows "Save 2 months" badge when yearly is selected', () => {
    render(<PlanCards {...defaultProps} billingPeriod="yearly" />);

    expect(screen.getByText('Save 2 months')).toBeInTheDocument();
  });

  it('handles plan selection', async () => {
    render(<PlanCards {...defaultProps} />);

    const selectProButton = screen.getByRole('button', { name: /select pro/i });
    fireEvent.click(selectProButton);

    expect(mockOnPlanSelect).toHaveBeenCalledWith('pro');
  });

  it('applies correct styling to billing toggle based on selection', () => {
    const { rerender } = render(<PlanCards {...defaultProps} billingPeriod="monthly" />);

    const monthlyButton = screen.getByRole('button', { name: /monthly/i });
    const yearlyButton = screen.getByRole('button', { name: /yearly/i });

    expect(monthlyButton).toHaveClass('bg-white');
    expect(yearlyButton).not.toHaveClass('bg-white');

    rerender(<PlanCards {...defaultProps} billingPeriod="yearly" />);

    expect(monthlyButton).not.toHaveClass('bg-white');
    expect(yearlyButton).toHaveClass('bg-white');
  });

  it('updates recommended plan when prop changes', () => {
    const { rerender } = render(<PlanCards {...defaultProps} recommendedPlan="pro" />);

    expect(screen.getByTestId('plan-pro')).toHaveTextContent('Recommended');
    expect(screen.getByTestId('plan-business')).not.toHaveTextContent('Recommended');

    rerender(<PlanCards {...defaultProps} recommendedPlan="business" />);

    expect(screen.getByTestId('plan-pro')).not.toHaveTextContent('Recommended');
    expect(screen.getByTestId('plan-business')).toHaveTextContent('Recommended');
  });
});