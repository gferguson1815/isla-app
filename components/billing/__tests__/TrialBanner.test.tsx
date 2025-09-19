import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrialBanner from '../TrialBanner';

// Mock the UpgradeModal component
vi.mock('../UpgradeModal', () => ({
  default: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="upgrade-modal">Upgrade Modal</div> : null,
}));

describe('TrialBanner', () => {
  const defaultProps = {
    daysRemaining: 7,
    workspaceId: 'test-workspace-id',
  };

  it('renders trial banner with days remaining', () => {
    render(<TrialBanner {...defaultProps} />);
    
    expect(screen.getByText('7 days left in your 14-day trial')).toBeInTheDocument();
  });

  it('shows critical message when trial expires today', () => {
    render(<TrialBanner {...defaultProps} daysRemaining={0} />);
    
    expect(screen.getByText('Your trial expires today!')).toBeInTheDocument();
  });

  it('shows warning message when 1 day remaining', () => {
    render(<TrialBanner {...defaultProps} daysRemaining={1} />);
    
    expect(screen.getByText('Only 1 day left in your trial!')).toBeInTheDocument();
  });

  it('shows warning message when 3 days remaining', () => {
    render(<TrialBanner {...defaultProps} daysRemaining={3} />);
    
    expect(screen.getByText('3 days left in your trial')).toBeInTheDocument();
  });

  it('displays Free Trial badge', () => {
    render(<TrialBanner {...defaultProps} />);
    
    expect(screen.getByText('Free Trial')).toBeInTheDocument();
  });

  it('shows Upgrade now button', () => {
    render(<TrialBanner {...defaultProps} />);
    
    const upgradeButton = screen.getByRole('button', { name: /upgrade now/i });
    expect(upgradeButton).toBeInTheDocument();
  });

  it('opens upgrade modal when button is clicked', () => {
    render(<TrialBanner {...defaultProps} />);
    
    const upgradeButton = screen.getByRole('button', { name: /upgrade now/i });
    fireEvent.click(upgradeButton);
    
    expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument();
  });

  it('applies critical styling when trial is about to expire', () => {
    const { container } = render(<TrialBanner {...defaultProps} daysRemaining={0} />);
    
    const destructiveElements = container.querySelectorAll('.bg-destructive\\/10');
    expect(destructiveElements.length).toBeGreaterThan(0);
  });

  it('applies warning styling when 3 days or less remaining', () => {
    const { container } = render(<TrialBanner {...defaultProps} daysRemaining={3} />);
    
    const warningElements = container.querySelectorAll('.bg-yellow-50, .dark\\:bg-yellow-950\\/20');
    expect(warningElements.length).toBeGreaterThan(0);
  });

  it('applies notice styling when 4-7 days remaining', () => {
    const { container } = render(<TrialBanner {...defaultProps} daysRemaining={5} />);
    
    const noticeElements = container.querySelectorAll('.bg-blue-50, .dark\\:bg-blue-950\\/20');
    expect(noticeElements.length).toBeGreaterThan(0);
  });

  it('applies info styling when more than 7 days remaining', () => {
    const { container } = render(<TrialBanner {...defaultProps} daysRemaining={10} />);
    
    const infoElements = container.querySelectorAll('.bg-primary\\/5');
    expect(infoElements.length).toBeGreaterThan(0);
  });

  it('adds pulse animation to button when critical', () => {
    render(<TrialBanner {...defaultProps} daysRemaining={0} />);
    
    const upgradeButton = screen.getByRole('button', { name: /upgrade now/i });
    expect(upgradeButton).toHaveClass('animate-pulse');
  });

  it('renders progress bar', () => {
    const { container } = render(<TrialBanner {...defaultProps} daysRemaining={7} />);
    
    const progressBar = container.querySelector('.absolute.bottom-0.left-0.right-0.h-1');
    expect(progressBar).toBeInTheDocument();
  });

  it('calculates progress bar width correctly', () => {
    const { container } = render(<TrialBanner {...defaultProps} daysRemaining={7} />);
    
    // 7 days remaining out of 14 = 50%
    const progressBarFill = container.querySelector('.h-full');
    expect(progressBarFill).toBeInTheDocument();
  });

  it('uses correct icon based on urgency level', () => {
    // Render with different urgency levels and check icons
    const { rerender } = render(<TrialBanner {...defaultProps} daysRemaining={14} />);
    
    // Info level (>7 days) - Sparkles icon
    let sparklesIcon = document.querySelector('.lucide-sparkles');
    expect(sparklesIcon).toBeInTheDocument();
    
    // Critical level (<=1 day) - AlertCircle icon
    rerender(<TrialBanner {...defaultProps} daysRemaining={1} />);
    let alertIcon = document.querySelector('.lucide-alert-circle');
    expect(alertIcon).toBeInTheDocument();
    
    // Notice level (4-7 days) - Clock icon
    rerender(<TrialBanner {...defaultProps} daysRemaining={5} />);
    let clockIcon = document.querySelector('.lucide-clock');
    expect(clockIcon).toBeInTheDocument();
  });
});