import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PricingCards from '../PricingCards';

describe('PricingCards', () => {
  const mockOnUpgrade = vi.fn();
  const mockOnDowngrade = vi.fn();

  const defaultProps = {
    currentPlan: 'free' as const,
    onUpgrade: mockOnUpgrade,
    onDowngrade: mockOnDowngrade,
    isLoading: false,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders all three pricing plans', () => {
    render(<PricingCards {...defaultProps} />);
    
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Growth')).toBeInTheDocument();
  });

  it('shows correct prices for each plan', () => {
    render(<PricingCards {...defaultProps} />);
    
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$19')).toBeInTheDocument();
    expect(screen.getByText('$49')).toBeInTheDocument();
  });

  it('highlights the current plan', () => {
    render(<PricingCards {...defaultProps} currentPlan="starter" />);
    
    const currentPlanBadge = screen.getByText('Current');
    expect(currentPlanBadge).toBeInTheDocument();
  });

  it('disables button for current plan', () => {
    render(<PricingCards {...defaultProps} currentPlan="starter" />);
    
    const buttons = screen.getAllByRole('button');
    const currentPlanButton = buttons.find(btn => btn.textContent === 'Current Plan');
    
    expect(currentPlanButton).toBeDisabled();
  });

  it('calls onUpgrade when upgrading to a higher tier', () => {
    render(<PricingCards {...defaultProps} currentPlan="free" />);
    
    const upgradeButtons = screen.getAllByText('Upgrade');
    fireEvent.click(upgradeButtons[0]); // Click Starter upgrade
    
    expect(mockOnUpgrade).toHaveBeenCalledWith('starter');
  });

  it('calls onDowngrade when downgrading to a lower tier', () => {
    render(<PricingCards {...defaultProps} currentPlan="growth" />);
    
    const downgradeButtons = screen.getAllByText('Downgrade');
    fireEvent.click(downgradeButtons[0]); // Click Free downgrade
    
    expect(mockOnDowngrade).toHaveBeenCalledWith('free');
  });

  it('shows loading skeletons when isLoading is true', () => {
    render(<PricingCards {...defaultProps} isLoading={true} />);
    
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays feature lists for each plan', () => {
    render(<PricingCards {...defaultProps} />);
    
    // Check for some specific features
    expect(screen.getByText('Up to 3 team members')).toBeInTheDocument();
    expect(screen.getByText('100 short links')).toBeInTheDocument();
    expect(screen.getByText('Unlimited team members')).toBeInTheDocument();
    expect(screen.getByText('Priority support')).toBeInTheDocument();
  });

  it('shows included and excluded features correctly', () => {
    render(<PricingCards {...defaultProps} />);
    
    // Check for check marks and X marks (using test ids or aria labels would be better)
    const checkMarks = document.querySelectorAll('.text-green-500');
    const xMarks = document.querySelectorAll('.text-muted-foreground\\/50');
    
    expect(checkMarks.length).toBeGreaterThan(0);
    expect(xMarks.length).toBeGreaterThan(0);
  });

  it('highlights the popular plan', () => {
    render(<PricingCards {...defaultProps} />);
    
    expect(screen.getByText('Popular')).toBeInTheDocument();
  });
});