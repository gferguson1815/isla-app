import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette } from '../CommandPalette';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { commandRegistry } from '@/lib/command-registry';
import { Permission } from '@/lib/permissions';

// Mock the Dialog component to render content directly
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog-mock">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="dialog-content">{children}</div>,
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: vi.fn(),
}));

vi.mock('@/lib/command-registry', () => ({
  commandRegistry: {
    clear: vi.fn(),
    registerBatch: vi.fn(),
    getAll: vi.fn(),
    getRecentCommands: vi.fn(),
    getByCategory: vi.fn(),
    execute: vi.fn(),
  },
}));

describe('CommandPalette', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  const mockPermissions = {
    hasPermission: vi.fn((permission: Permission) => true),
    isAdmin: vi.fn(() => true),
  };

  const mockCommands = [
    {
      id: 'home',
      name: 'Go to Dashboard',
      description: 'Navigate to the dashboard',
      category: 'navigation' as const,
      handler: vi.fn(),
      keywords: ['dashboard', 'home'],
    },
    {
      id: 'create-link',
      name: 'Create New Link',
      description: 'Create a new short link',
      category: 'actions' as const,
      handler: vi.fn(),
      keywords: ['create', 'new', 'link'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (usePermissions as any).mockReturnValue(mockPermissions);
    (commandRegistry.getAll as any).mockReturnValue(mockCommands);
    (commandRegistry.getRecentCommands as any).mockReturnValue([]);
    (commandRegistry.getByCategory as any).mockImplementation((category) => {
      return mockCommands.filter(cmd => cmd.category === category);
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('opens when openCommandPalette event is dispatched', async () => {
    render(<CommandPalette />);

    // Initially closed
    expect(screen.queryByTestId('dialog-mock')).not.toBeInTheDocument();

    // Dispatch event to open
    const event = new CustomEvent('openCommandPalette');
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByTestId('dialog-mock')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });
  });

  it('opens with Cmd+K keyboard shortcut', async () => {
    render(<CommandPalette />);

    // Simulate Cmd+K
    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    await waitFor(() => {
      expect(screen.getByTestId('dialog-mock')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });
  });

  it('opens with Ctrl+K keyboard shortcut', async () => {
    render(<CommandPalette />);

    // Simulate Ctrl+K
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByTestId('dialog-mock')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });
  });

  it('displays commands grouped by category', async () => {
    render(<CommandPalette />);

    // Open the palette
    const event = new CustomEvent('openCommandPalette');
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByTestId('dialog-mock')).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Create New Link')).toBeInTheDocument();
    });
  });

  it('filters commands based on search input', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    // Open the palette
    const event = new CustomEvent('openCommandPalette');
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByTestId('dialog-mock')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Type a command or search...');
    await user.type(searchInput, 'dashboard');

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });
  });

  it('executes command when selected', async () => {
    render(<CommandPalette />);

    // Open the palette
    const event = new CustomEvent('openCommandPalette');
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });

    // Click on a command
    fireEvent.click(screen.getByText('Go to Dashboard'));

    await waitFor(() => {
      expect(commandRegistry.execute).toHaveBeenCalledWith('home');
    });
  });

  it('displays recent commands when available', async () => {
    const recentCommands = [mockCommands[0]];
    (commandRegistry.getRecentCommands as any).mockReturnValue(recentCommands);

    render(<CommandPalette />);

    // Open the palette
    const event = new CustomEvent('openCommandPalette');
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText('Recent')).toBeInTheDocument();
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });
  });

  it('filters out commands based on permissions', () => {
    mockPermissions.hasPermission.mockImplementation((permission: Permission) => {
      return permission !== Permission.ANALYTICS_VIEW;
    });

    render(<CommandPalette />);

    // Verify registerBatch was called with filtered commands
    expect(commandRegistry.registerBatch).toHaveBeenCalled();
  });

  it('filters out admin-only commands for non-admin users', () => {
    mockPermissions.isAdmin.mockReturnValue(false);

    render(<CommandPalette />);

    // Verify registerBatch was called with filtered commands
    expect(commandRegistry.registerBatch).toHaveBeenCalled();
  });

  it('shows "No results found" when search yields no results', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    // Open the palette
    const event = new CustomEvent('openCommandPalette');
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Type a command or search...');
    await user.type(searchInput, 'nonexistentcommand');

    await waitFor(() => {
      expect(screen.getByText('No results found.')).toBeInTheDocument();
    });
  });

  it('closes the palette when command is executed', async () => {
    render(<CommandPalette />);

    // Open the palette
    const event = new CustomEvent('openCommandPalette');
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });

    // Click on a command
    fireEvent.click(screen.getByText('Go to Dashboard'));

    await waitFor(() => {
      expect(screen.queryByTestId('dialog-mock')).not.toBeInTheDocument();
    });
  });

  it('clears search input when palette is closed and reopened', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    // Open the palette
    let event = new CustomEvent('openCommandPalette');
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByTestId('dialog-mock')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Type a command or search...');
    await user.type(searchInput, 'test');

    // Close by pressing Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    // Reopen
    event = new CustomEvent('openCommandPalette');
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByTestId('dialog-mock')).toBeInTheDocument();
      const newSearchInput = screen.getByPlaceholderText('Type a command or search...');
      expect(newSearchInput).toHaveValue('');
    });
  });
});