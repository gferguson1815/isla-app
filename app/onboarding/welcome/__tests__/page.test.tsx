import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OnboardingWelcomePage from "../page";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { trpc } from "@/lib/trpc/client";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    workspace: {
      list: {
        useQuery: vi.fn(),
      },
    },
  },
}));

vi.mock("@/components/help/HelpWidget", () => ({
  HelpWidget: () => <div data-testid="help-widget">Help Widget</div>,
}));

vi.mock("@/components/ui/aurora-background", () => ({
  AuroraBackground: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="aurora-background">{children}</div>
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe("OnboardingWelcomePage", () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
  });

  it("renders welcome page with all UI elements", () => {
    (useAuth as any).mockReturnValue({
      user: { email: "test@example.com" },
    });
    (trpc.workspace.list.useQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<OnboardingWelcomePage />);

    expect(screen.getByText("Welcome to Isla")).toBeInTheDocument();
    expect(
      screen.getByText("See which marketing efforts actually drive revenue, not just vanity metrics.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    expect(screen.getByTestId("help-widget")).toBeInTheDocument();
    expect(screen.getByTestId("aurora-background")).toBeInTheDocument();
  });

  it("navigates to workspace creation when Get started is clicked", () => {
    (useAuth as any).mockReturnValue({
      user: { email: "test@example.com" },
    });
    (trpc.workspace.list.useQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<OnboardingWelcomePage />);

    const getStartedButton = screen.getByRole("button", { name: /get started/i });
    fireEvent.click(getStartedButton);

    expect(mockPush).toHaveBeenCalledWith("/onboarding/workspace-creation");
  });

  it("shows loading state while checking workspaces", () => {
    (useAuth as any).mockReturnValue({
      user: { email: "test@example.com" },
    });
    (trpc.workspace.list.useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = render(<OnboardingWelcomePage />);

    expect(screen.queryByTestId("aurora-background")).not.toBeInTheDocument();
    const loadingContainer = container.querySelector(".animate-pulse");
    expect(loadingContainer).toBeInTheDocument();
  });

  it("redirects to default workspace if user has workspaces", async () => {
    (useAuth as any).mockReturnValue({
      user: { email: "test@example.com" },
    });
    (trpc.workspace.list.useQuery as any).mockReturnValue({
      data: [{ slug: "test-workspace", name: "Test Workspace" }],
      isLoading: false,
    });

    render(<OnboardingWelcomePage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/test-workspace/links");
    });
  });

  it("shows user email when authenticated", () => {
    const userEmail = "user@example.com";
    (useAuth as any).mockReturnValue({
      user: { email: userEmail },
    });
    (trpc.workspace.list.useQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<OnboardingWelcomePage />);

    expect(screen.getByText(`You're signed in as`)).toBeInTheDocument();
    expect(screen.getByText(userEmail)).toBeInTheDocument();
  });

  it("shows sign in as different user link", () => {
    (useAuth as any).mockReturnValue({
      user: { email: "test@example.com" },
    });
    (trpc.workspace.list.useQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<OnboardingWelcomePage />);

    const signInLink = screen.getByText("Sign in as a different user");
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute("href", "/logout");
  });

  it("does not show user info when not authenticated", () => {
    (useAuth as any).mockReturnValue({
      user: null,
    });
    (trpc.workspace.list.useQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<OnboardingWelcomePage />);

    expect(screen.queryByText(/You're signed in as/)).not.toBeInTheDocument();
    expect(screen.queryByText("Sign in as a different user")).not.toBeInTheDocument();
  });

  it("only queries workspaces when user is authenticated", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: [],
      isLoading: false,
    });
    (trpc.workspace.list.useQuery as any) = mockUseQuery;

    (useAuth as any).mockReturnValue({
      user: null,
    });

    render(<OnboardingWelcomePage />);

    expect(mockUseQuery).toHaveBeenCalledWith(undefined, {
      enabled: false,
    });
  });
});