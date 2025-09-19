import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BillingHistory from '../BillingHistory';

// Mock trpc
vi.mock('@/lib/trpc', () => ({
  trpc: {
    billing: {
      getInvoices: {
        useInfiniteQuery: vi.fn(() => ({
          data: {
            pages: [{
              invoices: [
                {
                  id: '1',
                  stripe_invoice_id: 'inv_123',
                  amount_paid: 1900,
                  status: 'paid',
                  created_at: '2024-01-15T00:00:00Z',
                },
                {
                  id: '2',
                  stripe_invoice_id: 'inv_124',
                  amount_paid: 4900,
                  status: 'paid',
                  created_at: '2024-02-15T00:00:00Z',
                },
              ],
              hasMore: true,
            }],
          },
          isLoading: false,
          fetchNextPage: vi.fn(),
          hasNextPage: true,
        })),
      },
    },
  },
}));

// Mock fetch
global.fetch = vi.fn();

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('BillingHistory', () => {
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
    workspaceId: 'test-workspace-id',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders billing history table', () => {
    render(<BillingHistory {...defaultProps} />, { wrapper });
    
    expect(screen.getByText('Billing History')).toBeInTheDocument();
    expect(screen.getByText('View and download your past invoices')).toBeInTheDocument();
  });

  it('displays invoice data correctly', () => {
    render(<BillingHistory {...defaultProps} />, { wrapper });
    
    // Check for invoice amounts
    expect(screen.getByText('$19.00')).toBeInTheDocument();
    expect(screen.getByText('$49.00')).toBeInTheDocument();
    
    // Check for dates (formatted)
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    expect(screen.getByText('Feb 15, 2024')).toBeInTheDocument();
  });

  it('shows table headers', () => {
    render(<BillingHistory {...defaultProps} />, { wrapper });
    
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('displays status badges correctly', () => {
    render(<BillingHistory {...defaultProps} />, { wrapper });
    
    const paidBadges = screen.getAllByText('Paid');
    expect(paidBadges.length).toBe(2);
  });

  it('shows download buttons for each invoice', () => {
    render(<BillingHistory {...defaultProps} />, { wrapper });
    
    const downloadButtons = screen.getAllByText('Download');
    expect(downloadButtons.length).toBe(2);
  });

  it('handles invoice download', async () => {
    const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    // Mock URL methods
    const mockCreateObjectURL = vi.fn(() => 'blob:url');
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock document methods
    const mockClick = vi.fn();
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();
    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;
    
    // Override createElement for anchor element
    const originalCreateElement = document.createElement;
    document.createElement = vi.fn((tagName) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement.call(document, tagName);
        anchor.click = mockClick;
        return anchor;
      }
      return originalCreateElement.call(document, tagName);
    });

    render(<BillingHistory {...defaultProps} />, { wrapper });
    
    const downloadButtons = screen.getAllByText('Download');
    fireEvent.click(downloadButtons[0]);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/invoices/inv_123/download');
    });

    // Cleanup
    document.createElement = originalCreateElement;
  });

  it('shows error toast on download failure', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Download failed'));

    const { toast } = await import('sonner');
    
    render(<BillingHistory {...defaultProps} />, { wrapper });
    
    const downloadButtons = screen.getAllByText('Download');
    fireEvent.click(downloadButtons[0]);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to download invoice');
    });
  });

  it('shows loading state while downloading', async () => {
    (global.fetch as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<BillingHistory {...defaultProps} />, { wrapper });
    
    const downloadButtons = screen.getAllByText('Download');
    fireEvent.click(downloadButtons[0]);
    
    expect(screen.getByText('Downloading...')).toBeInTheDocument();
  });

  it('shows load more button when there are more invoices', () => {
    render(<BillingHistory {...defaultProps} />, { wrapper });
    
    expect(screen.getByText('Load more invoices')).toBeInTheDocument();
  });

  it('displays empty state when no invoices', () => {
    // Override mock to return empty invoices
    vi.mocked(vi.importMock('@/lib/trpc')).trpc.billing.getInvoices.useInfiniteQuery.mockReturnValueOnce({
      data: {
        pages: [{ invoices: [], hasMore: false }],
      },
      isLoading: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
    });

    render(<BillingHistory {...defaultProps} />, { wrapper });
    
    expect(screen.getByText('No billing history yet')).toBeInTheDocument();
    expect(screen.getByText('Your invoices will appear here after your first payment')).toBeInTheDocument();
  });

  it('shows loading skeletons while fetching data', () => {
    vi.mocked(vi.importMock('@/lib/trpc')).trpc.billing.getInvoices.useInfiniteQuery.mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
    });

    const { container } = render(<BillingHistory {...defaultProps} />, { wrapper });
    
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});