import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlobalNav } from '../GlobalNav';
import { usePathname } from 'next/navigation';
import { useSession } from '@supabase/auth-helpers-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/lib/permissions';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('@supabase/auth-helpers-react', () => ({
  useSession: vi.fn(),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: vi.fn(),
}));

vi.mock('@/components/workspace-selector', () => ({
  WorkspaceSelector: () => <div data-testid="workspace-selector">Workspace Selector</div>,
}));

describe('GlobalNav', () => {
  const mockUser = {
    email: 'test@example.com',
    user_metadata: {
      name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
    },
  };

  const mockPermissions = {
    hasPermission: vi.fn((permission: Permission) => true),
    isAdmin: vi.fn(() => true),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (usePathname as any).mockReturnValue('/dashboard');
    (useSession as any).mockReturnValue({ user: mockUser });
    (usePermissions as any).mockReturnValue(mockPermissions);
  });

  it('renders the navigation bar with logo', () => {
    render(<GlobalNav />);
    expect(screen.getByText('Isla')).toBeInTheDocument();
  });

  it('renders all navigation items for admin users', () => {
    render(<GlobalNav />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Links')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('hides admin-only navigation items for non-admin users', () => {
    mockPermissions.isAdmin.mockReturnValue(false);
    render(<GlobalNav />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Links')).toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('hides permission-based items when user lacks permission', () => {
    mockPermissions.hasPermission.mockImplementation((permission: Permission) => {
      return permission !== Permission.ANALYTICS_VIEW;
    });
    render(<GlobalNav />);
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
  });

  it('highlights the current active route', () => {
    (usePathname as any).mockReturnValue('/links');
    render(<GlobalNav />);
    const linksButton = screen.getByRole('link', { name: /links/i });
    expect(linksButton).toHaveClass('text-primary');
  });

  it('renders the workspace selector', () => {
    render(<GlobalNav />);
    expect(screen.getByTestId('workspace-selector')).toBeInTheDocument();
  });

  it('renders the command palette button', () => {
    render(<GlobalNav />);
    const cmdButton = screen.getByText('⌘K');
    expect(cmdButton).toBeInTheDocument();
  });

  it('fires custom event when command palette button is clicked', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<GlobalNav />);
    const cmdButton = screen.getByText('⌘K').closest('button');
    fireEvent.click(cmdButton!);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'openCommandPalette',
      })
    );
  });

  it('renders user avatar with correct user info', () => {
    render(<GlobalNav />);
    expect(screen.getByText('T')).toBeInTheDocument(); // Avatar fallback
  });

  it('renders mobile menu button on small screens', () => {
    render(<GlobalNav />);
    const menuButton = screen.getByRole('button', { name: /menu/i });
    expect(menuButton).toHaveClass('lg:hidden');
  });

  it('opens user dropdown menu with correct options', () => {
    render(<GlobalNav />);
    const avatarButton = screen.getByText('T').closest('button');
    fireEvent.click(avatarButton!);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Workspace Admin')).toBeInTheDocument();
    expect(screen.getByText('Command Palette')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('handles sign out action', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true } as Response));
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { href: '' } as any;

    render(<GlobalNav />);
    const avatarButton = screen.getByText('T').closest('button');
    fireEvent.click(avatarButton!);

    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);

    expect(fetch).toHaveBeenCalledWith('/api/auth/signout', { method: 'POST' });

    window.location = originalLocation;
  });
});