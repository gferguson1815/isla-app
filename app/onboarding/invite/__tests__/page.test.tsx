import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import InviteOnboardingPage from "../page";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn((key: string) => key === "workspace" ? "test-workspace" : null),
  })),
}));

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    workspace: {
      getBySlug: {
        useQuery: vi.fn(() => ({
          data: {
            id: "workspace-123",
            name: "Test Workspace",
            slug: "test-workspace"
          },
          isLoading: false,
          error: null,
        })),
      },
      sendInvitations: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn().mockResolvedValue({ invitations: 1, skipped: 0 }),
        })),
      },
    },
  },
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: "user-123",
      email: "test@example.com",
      name: "Test User"
    },
    signOut: vi.fn(),
  })),
}));

vi.mock("@/components/help/HelpWidget", () => ({
  HelpWidget: vi.fn(() => <div>HelpWidget</div>),
}));

vi.mock("@/components/ErrorBoundary", () => ({
  ErrorBoundary: vi.fn(({ children }) => <>{children}</>),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("InviteOnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page with correct heading and subheading", async () => {
    render(<InviteOnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText("Invite teammates")).toBeInTheDocument();
      expect(screen.getByText(/Invitations will be valid for 14 days/)).toBeInTheDocument();
    });
  });

  it("displays the paid plan required badge", async () => {
    render(<InviteOnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText("Paid plan required")).toBeInTheDocument();
    });
  });

  it("shows the user info at bottom left", async () => {
    render(<InviteOnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText(/You're signed in as/)).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });
  });

  it("displays the sign out button", async () => {
    render(<InviteOnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText("Sign in as a different user")).toBeInTheDocument();
    });
  });

  it("renders the HelpWidget", async () => {
    render(<InviteOnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText("HelpWidget")).toBeInTheDocument();
    });
  });

  it("shows the Isla logo", async () => {
    render(<InviteOnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText("isla")).toBeInTheDocument();
    });
  });

  it("redirects to workspace page if no workspace param", async () => {
    const useSearchParams = vi.fn(() => ({
      get: vi.fn(() => null), // No workspace param
    }));

    const pushMock = vi.fn();
    const useRouter = vi.fn(() => ({
      push: pushMock,
    }));

    vi.mocked(await import("next/navigation")).useSearchParams = useSearchParams;
    vi.mocked(await import("next/navigation")).useRouter = useRouter;

    render(<InviteOnboardingPage />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/onboarding/workspace");
    });
  });

  it("redirects to dashboard if workspace is invalid", async () => {
    const pushMock = vi.fn();
    const useRouter = vi.fn(() => ({
      push: pushMock,
    }));

    const useSearchParams = vi.fn(() => ({
      get: vi.fn((key: string) => key === "workspace" ? "test-workspace" : null), // Keep workspace param
    }));

    vi.mocked(await import("next/navigation")).useRouter = useRouter;
    vi.mocked(await import("next/navigation")).useSearchParams = useSearchParams;

    // Mock invalid workspace query
    vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.getBySlug.useQuery = vi.fn(() => ({
      data: null,
      isLoading: false,
      error: new Error("Workspace not found"),
    }) as any);

    render(<InviteOnboardingPage />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows loading spinner while workspace is loading", async () => {
    vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.getBySlug.useQuery = vi.fn(() => ({
      data: null,
      isLoading: true,
      error: null,
    }));

    const { container } = render(<InviteOnboardingPage />);

    // Check for the loading spinner element
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});