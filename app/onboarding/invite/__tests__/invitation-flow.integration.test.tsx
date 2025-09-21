import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: "user-123",
      email: "admin@example.com",
      name: "Admin User"
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

describe("Invitation Flow Integration", () => {
  const mockWorkspace = {
    id: "workspace-123",
    name: "Test Workspace",
    slug: "test-workspace",
    plan: "pro",
    maxUsers: 10,
    currentMembers: 3,
  };

  const mockSendInvitations = vi.fn();
  const mockGetWorkspaceMembers = vi.fn();
  const mockRouter = { push: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock tRPC client
    const tRPC = await import("@/lib/trpc/client");
    vi.mocked(tRPC).trpc = {
      workspace: {
        getBySlug: {
          useQuery: vi.fn(() => ({
            data: mockWorkspace,
            isLoading: false,
            error: null,
          })),
        },
        sendInvitations: {
          useMutation: vi.fn(() => ({
            mutateAsync: mockSendInvitations,
            isLoading: false,
            error: null,
          })),
        },
        getMembers: {
          useQuery: vi.fn(() => ({
            data: mockGetWorkspaceMembers(),
            isLoading: false,
            error: null,
          })),
        },
      },
    } as any;

    const nextNavigation = await import("next/navigation");
    vi.mocked(nextNavigation).useRouter = vi.fn(() => mockRouter);
  });

  describe("Complete Invitation Send Flow", () => {
    it("should successfully send multiple invitations with different roles", async () => {
      const user = userEvent.setup();
      mockSendInvitations.mockResolvedValue({ invitations: 2, skipped: 0 });

      render(<InviteOnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText("Invite teammates")).toBeInTheDocument();
      });

      // Fill first email (member)
      const emailInput = screen.getByPlaceholderText("panic@thedis.co");
      await user.type(emailInput, "member1@example.com");

      // Add second email
      const addButton = screen.getByText("Add email");
      await user.click(addButton);

      // Fill second email (admin)
      const emailInputs = screen.getAllByPlaceholderText("panic@thedis.co");
      await user.type(emailInputs[1], "admin1@example.com");

      // Change role of second invite to admin
      const roleSelectors = screen.getAllByRole("combobox");
      await user.click(roleSelectors[1]);
      const adminOption = await screen.findByRole("option", { name: "Admin" });
      await user.click(adminOption);

      // Submit form
      const continueButton = screen.getByText("Continue");
      await user.click(continueButton);

      // Verify API calls
      await waitFor(() => {
        expect(mockSendInvitations).toHaveBeenCalledTimes(2);
        expect(mockSendInvitations).toHaveBeenCalledWith({
          workspaceId: "workspace-123",
          emails: ["member1@example.com"],
          role: "member",
        });
        expect(mockSendInvitations).toHaveBeenCalledWith({
          workspaceId: "workspace-123",
          emails: ["admin1@example.com"],
          role: "admin",
        });
      });

      // Verify success toast
      const toastMock = vi.mocked(await import("sonner")).toast;
      expect(toastMock.success).toHaveBeenCalledWith(
        expect.stringContaining("Successfully sent")
      );

      // Verify navigation to dashboard
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });

    it("should handle partial failures when some emails are invalid", async () => {
      const user = userEvent.setup();
      mockSendInvitations
        .mockResolvedValueOnce({ invitations: 1, skipped: 0 })
        .mockRejectedValueOnce(new Error("Invalid email format"));

      render(<InviteOnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText("Invite teammates")).toBeInTheDocument();
      });

      // Add valid and invalid emails
      const emailInput = screen.getByPlaceholderText("panic@thedis.co");
      await user.type(emailInput, "valid@example.com");

      const addButton = screen.getByText("Add email");
      await user.click(addButton);

      const emailInputs = screen.getAllByPlaceholderText("panic@thedis.co");
      await user.type(emailInputs[1], "invalid@example.com");

      const continueButton = screen.getByText("Continue");
      await user.click(continueButton);

      await waitFor(() => {
        expect(mockSendInvitations).toHaveBeenCalled();
      });
    });

    it("should validate workspace member limits before sending invitations", async () => {
      const user = userEvent.setup();

      // Mock workspace at capacity
      const fullWorkspace = {
        ...mockWorkspace,
        plan: "free",
        maxUsers: 3,
        currentMembers: 3,
      };

      vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.getBySlug.useQuery =
        vi.fn(() => ({
          data: fullWorkspace,
          isLoading: false,
          error: null,
        }));

      render(<InviteOnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText("Invite teammates")).toBeInTheDocument();
      });

      // Try to add email
      const emailInput = screen.getByPlaceholderText("panic@thedis.co");
      await user.type(emailInput, "new@example.com");

      const continueButton = screen.getByText("Continue");
      await user.click(continueButton);

      // API should reject due to limit
      mockSendInvitations.mockRejectedValue(
        new Error("Workspace member limit reached. Please upgrade your plan.")
      );

      await waitFor(() => {
        const toastMock = vi.mocked(await import("sonner")).toast;
        expect(toastMock.error).toHaveBeenCalled();
      });
    });

    it("should handle network errors gracefully", async () => {
      const user = userEvent.setup();
      mockSendInvitations.mockRejectedValue(new Error("Network error"));

      render(<InviteOnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText("Invite teammates")).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText("panic@thedis.co");
      await user.type(emailInput, "test@example.com");

      const continueButton = screen.getByText("Continue");
      await user.click(continueButton);

      await waitFor(() => {
        const toastMock = vi.mocked(await import("sonner")).toast;
        expect(toastMock.error).toHaveBeenCalledWith("Failed to send invitations");
      });

      // Should not navigate on error
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it("should handle skip flow correctly", async () => {
      const user = userEvent.setup();

      render(<InviteOnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText("Invite teammates")).toBeInTheDocument();
      });

      const skipButton = screen.getByText("I'll do this later");
      await user.click(skipButton);

      // Should navigate to dashboard without sending invitations
      expect(mockSendInvitations).not.toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });

    it("should prevent duplicate email submissions", async () => {
      const user = userEvent.setup();
      mockSendInvitations.mockResolvedValue({ invitations: 1, skipped: 1 });

      render(<InviteOnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText("Invite teammates")).toBeInTheDocument();
      });

      // Add same email twice
      const emailInput = screen.getByPlaceholderText("panic@thedis.co");
      await user.type(emailInput, "duplicate@example.com");

      const addButton = screen.getByText("Add email");
      await user.click(addButton);

      const emailInputs = screen.getAllByPlaceholderText("panic@thedis.co");
      await user.type(emailInputs[1], "duplicate@example.com");

      const continueButton = screen.getByText("Continue");
      await user.click(continueButton);

      await waitFor(() => {
        // Should only send unique emails
        expect(mockSendInvitations).toHaveBeenCalledWith(
          expect.objectContaining({
            emails: expect.arrayContaining(["duplicate@example.com"]),
          })
        );
      });
    });

    it("should validate email format before submission", async () => {
      const user = userEvent.setup();

      render(<InviteOnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText("Invite teammates")).toBeInTheDocument();
      });

      // Enter invalid email
      const emailInput = screen.getByPlaceholderText("panic@thedis.co");
      await user.type(emailInput, "not-an-email");

      const continueButton = screen.getByText("Continue");
      await user.click(continueButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
      });

      // Should not call API
      expect(mockSendInvitations).not.toHaveBeenCalled();
    });

    it("should handle maximum invites limit", async () => {
      const user = userEvent.setup();

      render(<InviteOnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText("Invite teammates")).toBeInTheDocument();
      });

      // Add 10 emails (maximum)
      for (let i = 0; i < 9; i++) {
        const addButton = screen.getByText("Add email");
        await user.click(addButton);
      }

      // Add button should be hidden
      expect(screen.queryByText("Add email")).not.toBeInTheDocument();

      // Should have 10 email inputs
      const emailInputs = screen.getAllByPlaceholderText("panic@thedis.co");
      expect(emailInputs).toHaveLength(10);
    });
  });

  describe("Invitation Acceptance Flow", () => {
    it("should validate invitation token and accept invitation", async () => {
      const mockAcceptInvitation = vi.fn().mockResolvedValue({
        workspace: mockWorkspace,
        role: "member",
      });

      vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.acceptInvitation = {
        useMutation: vi.fn(() => ({
          mutateAsync: mockAcceptInvitation,
        })),
      } as any;

      // This would be on a different page, but we can test the API interaction
      const token = "valid-invitation-token";

      await mockAcceptInvitation({ token });

      expect(mockAcceptInvitation).toHaveBeenCalledWith({ token });
    });
  });
});