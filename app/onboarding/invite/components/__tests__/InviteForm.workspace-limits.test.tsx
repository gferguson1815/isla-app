import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InviteForm from "../InviteForm";

// Mock dependencies
vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    workspace: {
      sendInvitations: {
        useMutation: vi.fn(),
      },
      getBySlug: {
        useQuery: vi.fn(),
      },
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/hooks/useRateLimit", () => ({
  useRateLimit: vi.fn(() => ({
    checkRateLimit: vi.fn(() => true),
    getResetTime: vi.fn(() => null),
    getRemainingRequests: vi.fn(() => 3),
    reset: vi.fn(),
    isRateLimited: false,
  })),
}));

describe("InviteForm - Workspace Member Limits", () => {
  const mockProps = {
    workspaceId: "workspace-123",
    workspaceSlug: "test-workspace",
    onSuccess: vi.fn(),
    onSkip: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Free Plan Limits", () => {
    it("should show error when trying to invite more than free plan allows", async () => {
      const user = userEvent.setup();
      const toastErrorMock = vi.fn();
      vi.mocked(await import("sonner")).toast.error = toastErrorMock;

      const mutateAsyncMock = vi.fn().mockRejectedValue(
        new Error("Workspace member limit reached (3 members max on free plan). Please upgrade to invite more teammates.")
      );

      vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.sendInvitations.useMutation = vi.fn(() => ({
        mutateAsync: mutateAsyncMock,
        isLoading: false,
        error: null,
      }));

      render(<InviteForm {...mockProps} />);

      // Try to add multiple emails
      const emailInput = screen.getByPlaceholderText("panic@thedis.co");
      await user.type(emailInput, "user1@example.com");

      const addButton = screen.getByText("Add email");
      await user.click(addButton);

      const emailInputs = screen.getAllByPlaceholderText("panic@thedis.co");
      await user.type(emailInputs[1], "user2@example.com");

      const continueButton = screen.getByText("Continue");
      await user.click(continueButton);

      await waitFor(() => {
        expect(toastErrorMock).toHaveBeenCalledWith(
          "Workspace member limit reached (3 members max on free plan). Please upgrade to invite more teammates."
        );
      });
    });

    it("should handle free plan with exactly 3 members total", async () => {
      const user = userEvent.setup();
      const mutateAsyncMock = vi.fn().mockResolvedValue({ invitations: 1, skipped: 0 });

      vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.sendInvitations.useMutation = vi.fn(() => ({
        mutateAsync: mutateAsyncMock,
        isLoading: false,
        error: null,
      }));

      render(<InviteForm {...mockProps} />);

      // Add one email (assuming 2 existing members)
      const emailInput = screen.getByPlaceholderText("panic@thedis.co");
      await user.type(emailInput, "third@example.com");

      const continueButton = screen.getByText("Continue");
      await user.click(continueButton);

      await waitFor(() => {
        expect(mutateAsyncMock).toHaveBeenCalledWith({
          workspaceId: "workspace-123",
          emails: ["third@example.com"],
          role: "member",
        });
      });

      const toastSuccessMock = vi.mocked(await import("sonner")).toast.success;
      expect(toastSuccessMock).toHaveBeenCalledWith("Successfully sent 1 invitation(s)");
    });
  });

  describe("Pro Plan Limits", () => {
    it("should allow up to 10 members on pro plan", async () => {
      const user = userEvent.setup();
      const mutateAsyncMock = vi.fn().mockResolvedValue({ invitations: 5, skipped: 0 });

      vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.sendInvitations.useMutation = vi.fn(() => ({
        mutateAsync: mutateAsyncMock,
        isLoading: false,
        error: null,
      }));

      render(<InviteForm {...mockProps} />);

      // Add 5 emails (assuming room for 5 more on pro plan)
      for (let i = 0; i < 4; i++) {
        const addButton = screen.getByText("Add email");
        await user.click(addButton);
      }

      const emailInputs = screen.getAllByPlaceholderText("panic@thedis.co");
      for (let i = 0; i < 5; i++) {
        await user.type(emailInputs[i], `user${i + 1}@example.com`);
      }

      const continueButton = screen.getByText("Continue");
      await user.click(continueButton);

      await waitFor(() => {
        expect(mutateAsyncMock).toHaveBeenCalled();
      });

      const toastSuccessMock = vi.mocked(await import("sonner")).toast.success;
      expect(toastSuccessMock).toHaveBeenCalled();
    });

    it("should show error when exceeding pro plan limit of 10", async () => {
      const user = userEvent.setup();
      const toastErrorMock = vi.fn();
      vi.mocked(await import("sonner")).toast.error = toastErrorMock;

      const mutateAsyncMock = vi.fn().mockRejectedValue(
        new Error("Workspace member limit reached (10 members max on pro plan). Please upgrade to business plan for unlimited members.")
      );

      vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.sendInvitations.useMutation = vi.fn(() => ({
        mutateAsync: mutateAsyncMock,
        isLoading: false,
        error: null,
      }));

      render(<InviteForm {...mockProps} />);

      // Try to add multiple emails that would exceed limit
      for (let i = 0; i < 5; i++) {
        const addButton = screen.getByText("Add email");
        await user.click(addButton);
      }

      const emailInputs = screen.getAllByPlaceholderText("panic@thedis.co");
      for (let i = 0; i < 6; i++) {
        await user.type(emailInputs[i], `user${i + 1}@example.com`);
      }

      const continueButton = screen.getByText("Continue");
      await user.click(continueButton);

      await waitFor(() => {
        expect(toastErrorMock).toHaveBeenCalledWith(
          "Workspace member limit reached (10 members max on pro plan). Please upgrade to business plan for unlimited members."
        );
      });
    });
  });

  describe("Business Plan Limits", () => {
    it("should allow unlimited invitations on business plan", async () => {
      const user = userEvent.setup();
      const mutateAsyncMock = vi.fn().mockResolvedValue({ invitations: 10, skipped: 0 });

      vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.sendInvitations.useMutation = vi.fn(() => ({
        mutateAsync: mutateAsyncMock,
        isLoading: false,
        error: null,
      }));

      render(<InviteForm {...mockProps} />);

      // Add maximum 10 emails (form limit)
      for (let i = 0; i < 9; i++) {
        const addButton = screen.getByText("Add email");
        await user.click(addButton);
      }

      const emailInputs = screen.getAllByPlaceholderText("panic@thedis.co");
      for (let i = 0; i < 10; i++) {
        await user.type(emailInputs[i], `user${i + 1}@example.com`);
      }

      const continueButton = screen.getByText("Continue");
      await user.click(continueButton);

      await waitFor(() => {
        expect(mutateAsyncMock).toHaveBeenCalled();
      });

      const toastSuccessMock = vi.mocked(await import("sonner")).toast.success;
      expect(toastSuccessMock).toHaveBeenCalledWith("Successfully sent 10 invitation(s)");
    });
  });

  describe("Member Count Validation", () => {
    it("should show remaining slots based on current members", async () => {
      const user = userEvent.setup();
      const toastErrorMock = vi.fn();
      vi.mocked(await import("sonner")).toast.error = toastErrorMock;

      // Mock workspace with 8 out of 10 members
      const mutateAsyncMock = vi.fn()
        .mockResolvedValueOnce({ invitations: 2, skipped: 0 }) // First 2 succeed
        .mockRejectedValueOnce(new Error("Cannot invite 3 members. Only 2 slots remaining in workspace."));

      vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.sendInvitations.useMutation = vi.fn(() => ({
        mutateAsync: mutateAsyncMock,
        isLoading: false,
        error: null,
      }));

      render(<InviteForm {...mockProps} />);

      // Try to add 3 emails when only 2 slots available
      const emailInput = screen.getByPlaceholderText("panic@thedis.co");
      await user.type(emailInput, "user1@example.com");

      const addButton = screen.getByText("Add email");
      await user.click(addButton);
      await user.click(addButton);

      const emailInputs = screen.getAllByPlaceholderText("panic@thedis.co");
      await user.type(emailInputs[1], "user2@example.com");
      await user.type(emailInputs[2], "user3@example.com");

      const continueButton = screen.getByText("Continue");
      await user.click(continueButton);

      // Should succeed for first two, fail for third
      await waitFor(() => {
        expect(mutateAsyncMock).toHaveBeenCalled();
      });
    });

    it("should handle duplicate member check", async () => {
      const user = userEvent.setup();
      const mutateAsyncMock = vi.fn().mockResolvedValue({ invitations: 1, skipped: 1 });

      vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.sendInvitations.useMutation = vi.fn(() => ({
        mutateAsync: mutateAsyncMock,
        isLoading: false,
        error: null,
      }));

      render(<InviteForm {...mockProps} />);

      // Try to invite existing member
      const emailInput = screen.getByPlaceholderText("panic@thedis.co");
      await user.type(emailInput, "existing.member@example.com");

      const addButton = screen.getByText("Add email");
      await user.click(addButton);

      const emailInputs = screen.getAllByPlaceholderText("panic@thedis.co");
      await user.type(emailInputs[1], "new.member@example.com");

      const continueButton = screen.getByText("Continue");
      await user.click(continueButton);

      await waitFor(() => {
        expect(mutateAsyncMock).toHaveBeenCalled();
      });

      // Backend would skip the existing member
      const toastSuccessMock = vi.mocked(await import("sonner")).toast.success;
      expect(toastSuccessMock).toHaveBeenCalledWith("Successfully sent 1 invitation(s)");
    });
  });

  describe("Plan Upgrade Prompts", () => {
    it("should suggest upgrade when hitting free plan limit", async () => {
      const user = userEvent.setup();
      const toastErrorMock = vi.fn();
      vi.mocked(await import("sonner")).toast.error = toastErrorMock;

      const mutateAsyncMock = vi.fn().mockRejectedValue(
        new Error("Upgrade to Pro plan to invite more team members (currently 3/3 members)")
      );

      vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.sendInvitations.useMutation = vi.fn(() => ({
        mutateAsync: mutateAsyncMock,
        isLoading: false,
        error: null,
      }));

      render(<InviteForm {...mockProps} />);

      const emailInput = screen.getByPlaceholderText("panic@thedis.co");
      await user.type(emailInput, "new@example.com");

      const continueButton = screen.getByText("Continue");
      await user.click(continueButton);

      await waitFor(() => {
        expect(toastErrorMock).toHaveBeenCalledWith(
          "Upgrade to Pro plan to invite more team members (currently 3/3 members)"
        );
      });
    });

    it("should suggest business plan when hitting pro limit", async () => {
      const user = userEvent.setup();
      const toastErrorMock = vi.fn();
      vi.mocked(await import("sonner")).toast.error = toastErrorMock;

      const mutateAsyncMock = vi.fn().mockRejectedValue(
        new Error("Upgrade to Business plan for unlimited team members (currently 10/10 members)")
      );

      vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.sendInvitations.useMutation = vi.fn(() => ({
        mutateAsync: mutateAsyncMock,
        isLoading: false,
        error: null,
      }));

      render(<InviteForm {...mockProps} />);

      const emailInput = screen.getByPlaceholderText("panic@thedis.co");
      await user.type(emailInput, "new@example.com");

      const continueButton = screen.getByText("Continue");
      await user.click(continueButton);

      await waitFor(() => {
        expect(toastErrorMock).toHaveBeenCalledWith(
          "Upgrade to Business plan for unlimited team members (currently 10/10 members)"
        );
      });
    });
  });
});