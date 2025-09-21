import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InviteForm from "../InviteForm";

// Mock dependencies
vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    workspace: {
      sendInvitations: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn().mockResolvedValue({ invitations: 1, skipped: 0 }),
          isLoading: false,
          error: null,
        })),
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

describe("InviteForm", () => {
  const mockProps = {
    workspaceId: "workspace-123",
    workspaceSlug: "test-workspace",
    onSuccess: vi.fn(),
    onSkip: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form with initial email input", () => {
    render(<InviteForm {...mockProps} />);

    expect(screen.getByPlaceholderText("panic@thedis.co")).toBeInTheDocument();
    expect(screen.getAllByText("Member")[0]).toBeInTheDocument();
    expect(screen.getByText("Continue")).toBeInTheDocument();
    expect(screen.getByText("I'll do this later")).toBeInTheDocument();
  });

  it("allows adding multiple email inputs", async () => {
    const user = userEvent.setup();
    render(<InviteForm {...mockProps} />);

    const addButton = screen.getByText("Add email");
    await user.click(addButton);

    const emailInputs = screen.getAllByPlaceholderText("panic@thedis.co");
    expect(emailInputs).toHaveLength(2);
  });

  it("limits maximum invites to 10", async () => {
    const user = userEvent.setup();
    render(<InviteForm {...mockProps} />);

    const addButton = screen.getByText("Add email");

    // Add 9 more emails (total 10)
    for (let i = 0; i < 9; i++) {
      await user.click(addButton);
    }

    // Add button should no longer be visible
    expect(screen.queryByText("Add email")).not.toBeInTheDocument();

    const emailInputs = screen.getAllByPlaceholderText("panic@thedis.co");
    expect(emailInputs).toHaveLength(10);
  });

  it("allows removing invite rows except the first", async () => {
    const user = userEvent.setup();
    render(<InviteForm {...mockProps} />);

    // Add a second email input
    const addButton = screen.getByText("Add email");
    await user.click(addButton);

    // Should have 2 inputs now
    let emailInputs = screen.getAllByPlaceholderText("panic@thedis.co");
    expect(emailInputs).toHaveLength(2);

    // Find and click the remove button (X)
    const removeButtons = screen.getAllByRole("button").filter(btn =>
      btn.querySelector("svg")
    );

    // Click the remove button for the second row
    await user.click(removeButtons[removeButtons.length - 1]);

    // Should have 1 input now
    emailInputs = screen.getAllByPlaceholderText("panic@thedis.co");
    expect(emailInputs).toHaveLength(1);
  });

  it("validates email format", async () => {
    const user = userEvent.setup();
    render(<InviteForm {...mockProps} />);

    const emailInput = screen.getByPlaceholderText("panic@thedis.co");
    await user.type(emailInput, "invalid-email");

    const continueButton = screen.getByText("Continue");
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    });
  });

  it("disables Continue button when no valid email is entered", () => {
    render(<InviteForm {...mockProps} />);

    const continueButton = screen.getByText("Continue");
    expect(continueButton).toBeDisabled();
  });

  it("enables Continue button when valid email is entered", async () => {
    const user = userEvent.setup();
    render(<InviteForm {...mockProps} />);

    const emailInput = screen.getByPlaceholderText("panic@thedis.co");
    await user.type(emailInput, "test@example.com");

    const continueButton = screen.getByText("Continue");
    expect(continueButton).not.toBeDisabled();
  });

  it("allows selecting role for each invite", async () => {
    const user = userEvent.setup();
    render(<InviteForm {...mockProps} />);

    // Click on the role selector
    const roleSelectors = screen.getAllByRole('combobox');
    await user.click(roleSelectors[0]);

    // Select Admin role
    const adminOption = await screen.findByRole('option', { name: 'Admin' });
    await user.click(adminOption);

    // Verify role changed
    expect(screen.getAllByText("Admin")[0]).toBeInTheDocument();
  });

  it("calls onSkip when 'I'll do this later' is clicked", async () => {
    const user = userEvent.setup();
    render(<InviteForm {...mockProps} />);

    const skipButton = screen.getByText("I'll do this later");
    await user.click(skipButton);

    expect(mockProps.onSkip).toHaveBeenCalled();
  });

  it("sends invitations and calls onSuccess", async () => {
    const user = userEvent.setup();
    const mutateAsyncMock = vi.fn().mockResolvedValue({ invitations: 1, skipped: 0 });

    vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.sendInvitations.useMutation = vi.fn(() => ({
      mutateAsync: mutateAsyncMock,
      isLoading: false,
      error: null,
    }));

    render(<InviteForm {...mockProps} />);

    const emailInput = screen.getByPlaceholderText("panic@thedis.co");
    await user.type(emailInput, "test@example.com");

    const continueButton = screen.getByText("Continue");
    await user.click(continueButton);

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        workspaceId: "workspace-123",
        emails: ["test@example.com"],
        role: "member",
      });
      expect(mockProps.onSuccess).toHaveBeenCalled();
    });
  });

  it("groups invitations by role when sending", async () => {
    const user = userEvent.setup();
    const mutateAsyncMock = vi.fn().mockResolvedValue({ invitations: 2, skipped: 0 });

    vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.sendInvitations.useMutation = vi.fn(() => ({
      mutateAsync: mutateAsyncMock,
      isLoading: false,
      error: null,
    }));

    render(<InviteForm {...mockProps} />);

    // Add first email as member
    const emailInput1 = screen.getByPlaceholderText("panic@thedis.co");
    await user.type(emailInput1, "member@example.com");

    // Add second email
    const addButton = screen.getByText("Add email");
    await user.click(addButton);

    const emailInputs = screen.getAllByPlaceholderText("panic@thedis.co");
    await user.type(emailInputs[1], "admin@example.com");

    // Change second email's role to admin
    const roleSelectors = screen.getAllByRole('combobox');
    await user.click(roleSelectors[1]);
    const adminOption = await screen.findByRole('option', { name: 'Admin' });
    await user.click(adminOption);

    const continueButton = screen.getByText("Continue");
    await user.click(continueButton);

    await waitFor(() => {
      // Should be called twice - once for members, once for admins
      expect(mutateAsyncMock).toHaveBeenCalledTimes(2);

      expect(mutateAsyncMock).toHaveBeenCalledWith({
        workspaceId: "workspace-123",
        emails: ["admin@example.com"],
        role: "admin",
      });

      expect(mutateAsyncMock).toHaveBeenCalledWith({
        workspaceId: "workspace-123",
        emails: ["member@example.com"],
        role: "member",
      });
    });
  });

  it("shows loading state when submitting", async () => {
    const user = userEvent.setup();

    // Mock a delayed response
    const mutateAsyncMock = vi.fn(() =>
      new Promise(resolve => setTimeout(() => resolve({ invitations: 1, skipped: 0 }), 100))
    );

    vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.sendInvitations.useMutation = vi.fn(() => ({
      mutateAsync: mutateAsyncMock,
      isLoading: false,
      error: null,
    }));

    render(<InviteForm {...mockProps} />);

    const emailInput = screen.getByPlaceholderText("panic@thedis.co");
    await user.type(emailInput, "test@example.com");

    const continueButton = screen.getByText("Continue");
    await user.click(continueButton);

    expect(screen.getByText("Sending invitations...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Continue")).toBeInTheDocument();
    });
  });

  it("handles errors gracefully", async () => {
    const user = userEvent.setup();
    const toastErrorMock = vi.fn();

    vi.mocked(await import("sonner")).toast.error = toastErrorMock;

    const mutateAsyncMock = vi.fn().mockRejectedValue(new Error("Failed to send"));

    vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.sendInvitations.useMutation = vi.fn(() => ({
      mutateAsync: mutateAsyncMock,
      isLoading: false,
      error: null,
    }));

    render(<InviteForm {...mockProps} />);

    const emailInput = screen.getByPlaceholderText("panic@thedis.co");
    await user.type(emailInput, "test@example.com");

    const continueButton = screen.getByText("Continue");
    await user.click(continueButton);

    await waitFor(() => {
      expect(mockProps.onSuccess).not.toHaveBeenCalled();
    });
  });

  it("filters out empty email fields when submitting", async () => {
    const user = userEvent.setup();
    const mutateAsyncMock = vi.fn().mockResolvedValue({ invitations: 1, skipped: 0 });

    vi.mocked(await import("@/lib/trpc/client")).trpc.workspace.sendInvitations.useMutation = vi.fn(() => ({
      mutateAsync: mutateAsyncMock,
      isLoading: false,
      error: null,
    }));

    render(<InviteForm {...mockProps} />);

    // Add second email input
    const addButton = screen.getByText("Add email");
    await user.click(addButton);

    // Only fill in the first email
    const emailInputs = screen.getAllByPlaceholderText("panic@thedis.co");
    await user.type(emailInputs[0], "test@example.com");

    const continueButton = screen.getByText("Continue");
    await user.click(continueButton);

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        workspaceId: "workspace-123",
        emails: ["test@example.com"],
        role: "member",
      });
    });
  });
});