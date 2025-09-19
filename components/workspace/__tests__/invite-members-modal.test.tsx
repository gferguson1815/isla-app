import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InviteMembersModal } from '../invite-members-modal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the tRPC client
vi.mock('@/lib/trpc/client', () => ({
  api: {
    useUtils: () => ({
      workspace: {
        getPendingInvitations: { invalidate: vi.fn() },
        getMembers: { invalidate: vi.fn() },
      },
    }),
    workspace: {
      sendInvitations: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn().mockResolvedValue({ invitations: 1, skipped: 0 }),
          isPending: false,
        })),
      },
    },
  },
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('InviteMembersModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    workspaceId: 'workspace-123',
    currentMemberCount: 3,
    maxUsers: 10,
  };

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal with correct initial state', () => {
    render(<InviteMembersModal {...defaultProps} />, { wrapper });

    expect(screen.getByText('Invite Team Members')).toBeInTheDocument();
    expect(screen.getByText(/You can invite up to 7 more members/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/john@example.com/)).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('shows member limit warning when at capacity', () => {
    const props = {
      ...defaultProps,
      currentMemberCount: 10,
      maxUsers: 10,
    };

    render(<InviteMembersModal {...props} />, { wrapper });

    expect(screen.getByText('Your workspace has reached its member limit.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send.*invitation/i })).toBeDisabled();
  });

  it('validates and displays email badges', async () => {
    const user = userEvent.setup();
    render(<InviteMembersModal {...defaultProps} />, { wrapper });

    const textarea = screen.getByPlaceholderText(/john@example.com/);

    await user.type(textarea, 'valid@email.com, invalid-email, another@valid.com');

    // Wait for debounce
    await waitFor(() => {
      const badges = screen.getAllByRole('img', { hidden: true });
      expect(badges).toHaveLength(2); // Only 2 valid emails
    });

    expect(screen.getByText('valid@email.com')).toBeInTheDocument();
    expect(screen.getByText('another@valid.com')).toBeInTheDocument();
    expect(screen.queryByText('invalid-email')).not.toBeInTheDocument();
  });

  it('handles comma and newline separated emails', async () => {
    const user = userEvent.setup();
    render(<InviteMembersModal {...defaultProps} />, { wrapper });

    const textarea = screen.getByPlaceholderText(/john@example.com/);

    await user.type(textarea, 'email1@test.com\nemail2@test.com, email3@test.com');

    await waitFor(() => {
      expect(screen.getByText('email1@test.com')).toBeInTheDocument();
      expect(screen.getByText('email2@test.com')).toBeInTheDocument();
      expect(screen.getByText('email3@test.com')).toBeInTheDocument();
    });
  });

  it('removes duplicate emails', async () => {
    const user = userEvent.setup();
    render(<InviteMembersModal {...defaultProps} />, { wrapper });

    const textarea = screen.getByPlaceholderText(/john@example.com/);

    await user.type(textarea, 'duplicate@test.com, duplicate@test.com, duplicate@test.com');

    await waitFor(() => {
      const badges = screen.getAllByText('duplicate@test.com');
      expect(badges).toHaveLength(1); // Only one badge for duplicate
    });
  });

  it('disables send button when no valid emails', () => {
    render(<InviteMembersModal {...defaultProps} />, { wrapper });

    const sendButton = screen.getByRole('button', { name: /send.*invitation/i });
    expect(sendButton).toBeDisabled();
  });

  it('enables send button with valid emails', async () => {
    const user = userEvent.setup();
    render(<InviteMembersModal {...defaultProps} />, { wrapper });

    const textarea = screen.getByPlaceholderText(/john@example.com/);
    await user.type(textarea, 'valid@email.com');

    await waitFor(() => {
      const sendButton = screen.getByRole('button', { name: /send.*invitation/i });
      expect(sendButton).toBeEnabled();
    });
  });

  it('allows role selection', async () => {
    const user = userEvent.setup();
    render(<InviteMembersModal {...defaultProps} />, { wrapper });

    const roleSelect = screen.getByRole('combobox');
    await user.click(roleSelect);

    const adminOption = await screen.findByText('Admin');
    await user.click(adminOption);

    // Verify description updates
    expect(screen.getByText(/Admins can manage workspace settings/)).toBeInTheDocument();
  });

  it('shows correct invitation count in button', async () => {
    const user = userEvent.setup();
    render(<InviteMembersModal {...defaultProps} />, { wrapper });

    const textarea = screen.getByPlaceholderText(/john@example.com/);
    await user.type(textarea, 'user1@test.com, user2@test.com, user3@test.com');

    await waitFor(() => {
      const sendButton = screen.getByRole('button', { name: /send 3 invitations/i });
      expect(sendButton).toBeInTheDocument();
    });
  });

  it('prevents inviting more than member limit', async () => {
    const user = userEvent.setup();
    const props = {
      ...defaultProps,
      currentMemberCount: 8,
      maxUsers: 10,
    };

    render(<InviteMembersModal {...props} />, { wrapper });

    const textarea = screen.getByPlaceholderText(/john@example.com/);

    // Try to invite 3 people (would exceed limit of 10)
    await user.type(textarea, 'user1@test.com, user2@test.com, user3@test.com');

    const sendButton = screen.getByRole('button', { name: /send.*invitation/i });
    await user.click(sendButton);

    // Should show error toast about member limit
    await waitFor(() => {
      expect(screen.getByText(/Member limit exceeded/)).toBeInTheDocument();
    });
  });

  it('calls onOpenChange when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <InviteMembersModal {...defaultProps} onOpenChange={onOpenChange} />,
      { wrapper }
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows loading state while sending invitations', async () => {
    const mutateAsync = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));

    vi.mocked(api.workspace.sendInvitations.useMutation).mockReturnValue({
      mutateAsync,
      isPending: true,
    } as any);

    const user = userEvent.setup();
    render(<InviteMembersModal {...defaultProps} />, { wrapper });

    const textarea = screen.getByPlaceholderText(/john@example.com/);
    await user.type(textarea, 'test@email.com');

    const sendButton = screen.getByRole('button', { name: /send.*invitation/i });
    await user.click(sendButton);

    expect(screen.getByText(/Sending.../)).toBeInTheDocument();
    expect(sendButton).toBeDisabled();
  });

  it('displays email count badge correctly', async () => {
    const user = userEvent.setup();
    render(<InviteMembersModal {...defaultProps} />, { wrapper });

    const textarea = screen.getByPlaceholderText(/john@example.com/);

    await user.type(textarea, 'email1@test.com, email2@test.com');

    await waitFor(() => {
      const badges = screen.getAllByTestId(/email-badge/);
      expect(badges).toHaveLength(2);
    });
  });

  it('handles successful invitation sending', async () => {
    const onOpenChange = vi.fn();
    const toast = vi.fn();

    vi.mocked(useToast).mockReturnValue({ toast });

    const mutateAsync = vi.fn().mockResolvedValue({
      invitations: 2,
      skipped: 1,
    });

    vi.mocked(api.workspace.sendInvitations.useMutation).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    const user = userEvent.setup();
    render(
      <InviteMembersModal {...defaultProps} onOpenChange={onOpenChange} />,
      { wrapper }
    );

    const textarea = screen.getByPlaceholderText(/john@example.com/);
    await user.type(textarea, 'test1@email.com, test2@email.com');

    const sendButton = screen.getByRole('button', { name: /send.*invitation/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'Invitations sent',
        description: expect.stringContaining('2 invitation(s) sent successfully'),
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('handles invitation sending errors', async () => {
    const toast = vi.fn();
    vi.mocked(useToast).mockReturnValue({ toast });

    const mutateAsync = vi.fn().mockRejectedValue(new Error('Network error'));

    vi.mocked(api.workspace.sendInvitations.useMutation).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    const user = userEvent.setup();
    render(<InviteMembersModal {...defaultProps} />, { wrapper });

    const textarea = screen.getByPlaceholderText(/john@example.com/);
    await user.type(textarea, 'test@email.com');

    const sendButton = screen.getByRole('button', { name: /send.*invitation/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'Failed to send invitations',
        description: 'Network error',
        variant: 'destructive',
      });
    });
  });
});