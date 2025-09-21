import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import UsageOnboardingPage from "../page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock auth context
vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(() => ({
    user: { email: "test@example.com" },
    signOut: vi.fn(),
  })),
}));

// Mock trpc client
vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    workspace: {
      getBySlug: {
        useQuery: vi.fn(),
      },
    },
  },
}));

// Mock components
vi.mock("@/components/help/HelpWidget", () => ({
  HelpWidget: () => <div>Help Widget</div>,
}));

vi.mock("@/components/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/UsageForm", () => ({
  default: ({ onContinue }: any) => (
    <button onClick={() => onContinue({})}>Continue</button>
  ),
}));

describe("UsageOnboardingPage", () => {
  const mockPush = vi.fn();
  const mockSearchParams = new Map();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (useSearchParams as any).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
    });
  });

  it("redirects to workspace page if no workspace parameter", () => {
    mockSearchParams.clear();
    const { trpc } = require("@/lib/trpc/client");
    trpc.workspace.getBySlug.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    render(<UsageOnboardingPage />);

    expect(mockPush).toHaveBeenCalledWith("/onboarding/workspace");
  });

  it("shows loading spinner while validating workspace", () => {
    mockSearchParams.set("workspace", "test-workspace");
    const { trpc } = require("@/lib/trpc/client");
    trpc.workspace.getBySlug.useQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<UsageOnboardingPage />);

    expect(screen.getByRole("presentation")).toHaveClass("animate-spin");
  });

  it("redirects to dashboard if workspace is invalid", async () => {
    mockSearchParams.set("workspace", "invalid-workspace");
    const { trpc } = require("@/lib/trpc/client");
    trpc.workspace.getBySlug.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: "Workspace not found" },
    });

    render(<UsageOnboardingPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("renders usage form when workspace is valid", async () => {
    mockSearchParams.set("workspace", "valid-workspace");
    const { trpc } = require("@/lib/trpc/client");
    trpc.workspace.getBySlug.useQuery.mockReturnValue({
      data: { id: "1", slug: "valid-workspace" },
      isLoading: false,
      error: null,
    });

    render(<UsageOnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText("Estimate your usage")).toBeInTheDocument();
      expect(screen.getByText("Continue")).toBeInTheDocument();
    });
  });

  it("displays user info and sign out button", async () => {
    mockSearchParams.set("workspace", "valid-workspace");
    const { trpc } = require("@/lib/trpc/client");
    trpc.workspace.getBySlug.useQuery.mockReturnValue({
      data: { id: "1", slug: "valid-workspace" },
      isLoading: false,
      error: null,
    });

    render(<UsageOnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText(/You're signed in as/)).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
      expect(screen.getByText("Sign in as a different user")).toBeInTheDocument();
    });
  });
});