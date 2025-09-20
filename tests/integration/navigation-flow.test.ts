import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCProvider } from '@/app/providers/trpc-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { WorkspaceProvider } from '@/contexts/workspace-context';
import { GlobalNav } from '@/components/navigation/GlobalNav';
import { CommandPalette } from '@/components/command/CommandPalette';
import { KeyboardShortcutsDialog } from '@/components/help/KeyboardShortcutsDialog';
import { QuickCreateDialog } from '@/components/links/QuickCreateDialog';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}));

vi.mock('@supabase/auth-helpers-react', () => ({
  useSession: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      },
    },
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn(),
      signInWithOtp: vi.fn(),
    },
  }),
}));

vi.mock('@/contexts/workspace-context', () => ({
  useWorkspace: () => ({
    currentWorkspace: {
      id: 'workspace-1',
      name: 'Test Workspace',
      slug: 'test-workspace',
      plan: 'free',
    },
    workspaces: [
      {
        id: 'workspace-1',
        name: 'Test Workspace',
        slug: 'test-workspace',
        plan: 'free',
      },
    ],
    loading: false,
    error: null,
    selectWorkspace: vi.fn(),
    refreshWorkspaces: vi.fn(),
  }),
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isAdmin: () => true,
  }),
}));

vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    user: {
      initialize: {
        useMutation: () => ({
          mutate: vi.fn(),
        }),
      },
    },
    workspace: {
      list: {
        useQuery: () => ({
          data: [],
          isLoading: false,
          error: null,
        }),
      },
    },
    link: {
      create: {
        useMutation: () => ({
          mutate: vi.fn(),
          isLoading: false,
          error: null,
        }),
      },
    },
    useUtils: () => ({
      link: {
        list: {
          invalidate: vi.fn(),
        },
      },
    }),
  },
}));

// Mock global config
vi.mock('@/lib/config/app', () => ({
  appConfig: {
    shortDomain: 'short.ly',
    links: {
      customSlugMinLength: 3,
      customSlugMaxLength: 50,
    },
  },
}));

// Mock utilities
vi.mock('@/lib/utils/slug', () => ({
  generateRandomSlug: () => 'random-slug',
}));

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider>
        <AuthProvider>
          <WorkspaceProvider>
            {children}
          </WorkspaceProvider>
        </AuthProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
}

function NavigationTestApp() {
  return (
    <TestWrapper>
      <div>
        <GlobalNav />
        <CommandPalette />
        <KeyboardShortcutsDialog />
        <QuickCreateDialog />
      </div>
    </TestWrapper>
  );
}

describe('Navigation Flow Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render complete navigation system', async () => {
    render(<NavigationTestApp />);

    // Check global navigation is rendered
    expect(screen.getByText('Isla')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Links')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // Check command palette trigger is rendered
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('should open command palette with keyboard shortcut', async () => {
    render(<NavigationTestApp />);

    // Command palette should not be visible initially
    expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();

    // Press Cmd+K
    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    // Command palette should now be visible
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });
  });

  it('should open command palette with click', async () => {
    render(<NavigationTestApp />);

    // Click on command palette button
    const cmdButton = screen.getByText('⌘K').closest('button');
    await user.click(cmdButton!);

    // Command palette should be visible
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });
  });

  it('should navigate through command palette with keyboard', async () => {
    render(<NavigationTestApp />);

    // Open command palette
    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });

    // Check that navigation commands are visible
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Go to Links')).toBeInTheDocument();
  });

  it('should search commands in command palette', async () => {
    render(<NavigationTestApp />);

    // Open command palette
    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });

    // Type search query
    const searchInput = screen.getByPlaceholderText('Type a command or search...');
    await user.type(searchInput, 'dashboard');

    // Should show search results
    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });
  });

  it('should open quick create dialog with keyboard shortcut', async () => {
    render(<NavigationTestApp />);

    // Press 'c' key
    fireEvent.keyDown(document, { key: 'c' });

    // Quick create dialog should be visible
    await waitFor(() => {
      expect(screen.getByText('Create Short Link')).toBeInTheDocument();
    });
  });

  it('should open quick create from command palette', async () => {
    render(<NavigationTestApp />);

    // Open command palette
    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    await waitFor(() => {
      expect(screen.getByText('Create New Link')).toBeInTheDocument();
    });

    // Click on create link command
    await user.click(screen.getByText('Create New Link'));

    // Quick create dialog should be visible
    await waitFor(() => {
      expect(screen.getByText('Create Short Link')).toBeInTheDocument();
    });
  });

  it('should open keyboard shortcuts help with ? key', async () => {
    render(<NavigationTestApp />);

    // Press Shift+? (which is the ? key)
    fireEvent.keyDown(document, { key: '?', shiftKey: true });

    // Keyboard shortcuts dialog should be visible
    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
  });

  it('should handle user dropdown menu interactions', async () => {
    render(<NavigationTestApp />);

    // Click on user avatar
    const avatarButton = screen.getByText('T').closest('button'); // Avatar fallback
    await user.click(avatarButton!);

    // User dropdown should be visible
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Command Palette')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    // Click on keyboard shortcuts
    await user.click(screen.getByText('Keyboard Shortcuts'));

    // Keyboard shortcuts dialog should be visible
    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
  });

  it('should close dialogs when pressing Escape', async () => {
    render(<NavigationTestApp />);

    // Open command palette
    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    // Command palette should be closed
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
    });
  });

  it('should maintain focus management in command palette', async () => {
    render(<NavigationTestApp />);

    // Open command palette
    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Type a command or search...');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveFocus();
    });
  });

  it('should not trigger shortcuts when typing in input fields', async () => {
    render(
      <TestWrapper>
        <input data-testid="test-input" placeholder="Test input" />
        <GlobalNav />
        <CommandPalette />
      </TestWrapper>
    );

    // Focus on input field
    const input = screen.getByTestId('test-input');
    await user.click(input);

    // Press 'c' key (should not open quick create when typing)
    fireEvent.keyDown(document, { key: 'c' });

    // Quick create dialog should not be visible
    expect(screen.queryByText('Create Short Link')).not.toBeInTheDocument();
  });

  it('should allow Cmd+K to work even when typing in input fields', async () => {
    render(
      <TestWrapper>
        <input data-testid="test-input" placeholder="Test input" />
        <GlobalNav />
        <CommandPalette />
      </TestWrapper>
    );

    // Focus on input field
    const input = screen.getByTestId('test-input');
    await user.click(input);

    // Press Cmd+K (should work even when typing)
    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    // Command palette should be visible
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });
  });
});