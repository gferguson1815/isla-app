import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WorkspaceCreationPage from "../page";
import { generateSlugFromName, validateWorkspaceSlug, isSlugReserved } from "@/lib/utils/slug";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "test@example.com" },
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "https://test-url.com/logo.png" } }),
      }),
    },
  }),
}));

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    workspace: {
      create: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({
            id: "workspace-id",
            slug: "test-workspace",
          }),
        }),
      },
      checkSlug: {
        useQuery: vi.fn(() => ({
          data: { available: true },
          refetch: vi.fn().mockResolvedValue({ data: { available: true } }),
        })),
      },
    },
  },
}));

vi.mock("@/components/help/HelpWidget", () => ({
  HelpWidget: () => null,
}));

vi.mock("@/components/ui/aurora-background", () => ({
  AuroraBackground: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
}));

describe("WorkspaceCreationPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the workspace creation form", () => {
    render(<WorkspaceCreationPage />);

    expect(screen.getByText("Create your workspace")).toBeInTheDocument();
    expect(screen.getByLabelText("Workspace name")).toBeInTheDocument();
    expect(screen.getByLabelText("Workspace slug")).toBeInTheDocument();
    expect(screen.getByLabelText("Workspace logo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create workspace/i })).toBeInTheDocument();
  });

  it("displays user email in the footer", () => {
    render(<WorkspaceCreationPage />);
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  describe("Workspace Name Field", () => {
    it("accepts input", async () => {
      render(<WorkspaceCreationPage />);
      const nameInput = screen.getByLabelText("Workspace name");

      await user.type(nameInput, "Acme, Inc.");
      expect(nameInput).toHaveValue("Acme, Inc.");
    });

    it("enforces max length of 50 characters", async () => {
      render(<WorkspaceCreationPage />);
      const nameInput = screen.getByLabelText("Workspace name");
      const longName = "a".repeat(60);

      await user.type(nameInput, longName);
      expect(nameInput).toHaveValue("a".repeat(50));
    });
  });

  describe("Slug Generation and Validation", () => {
    it("auto-generates slug from workspace name", async () => {
      render(<WorkspaceCreationPage />);
      const nameInput = screen.getByLabelText("Workspace name");
      const slugInput = screen.getByLabelText("Workspace slug");

      await user.type(nameInput, "Acme, Inc.");
      await waitFor(() => {
        expect(slugInput).toHaveValue("acme-inc");
      });
    });

    it("transforms various name formats correctly", () => {
      expect(generateSlugFromName("Acme, Inc.")).toBe("acme-inc");
      expect(generateSlugFromName("Bob's Burgers")).toBe("bobs-burgers");
      expect(generateSlugFromName("Test #123!")).toBe("test-123");
      expect(generateSlugFromName("New  York  Times")).toBe("new-york-times");
    });

    it("allows manual slug editing", async () => {
      render(<WorkspaceCreationPage />);
      const slugInput = screen.getByLabelText("Workspace slug");

      await user.clear(slugInput);
      await user.type(slugInput, "custom-slug");
      expect(slugInput).toHaveValue("custom-slug");
    });

    it("validates slug constraints", () => {
      const { valid: valid1, error: error1 } = validateWorkspaceSlug("");
      expect(valid1).toBe(false);
      expect(error1).toBe("Slug is required");

      const { valid: valid2, error: error2 } = validateWorkspaceSlug("ab");
      expect(valid2).toBe(false);
      expect(error2).toBe("Slug must be at least 3 characters");

      const { valid: valid3, error: error3 } = validateWorkspaceSlug("a".repeat(31));
      expect(valid3).toBe(false);
      expect(error3).toBe("Slug must be 30 characters or less");

      const { valid: valid4, error: error4 } = validateWorkspaceSlug("Test-123!");
      expect(valid4).toBe(false);
      expect(error4).toBe("Slug can only contain lowercase letters, numbers, and hyphens");

      const { valid: valid5 } = validateWorkspaceSlug("valid-slug-123");
      expect(valid5).toBe(true);
    });

    it("blocks reserved slugs", () => {
      expect(isSlugReserved("admin")).toBe(true);
      expect(isSlugReserved("api")).toBe(true);
      expect(isSlugReserved("app")).toBe(true);
      expect(isSlugReserved("www")).toBe(true);
      expect(isSlugReserved("support")).toBe(true);
      expect(isSlugReserved("help")).toBe(true);
      expect(isSlugReserved("docs")).toBe(true);
      expect(isSlugReserved("blog")).toBe(true);
      expect(isSlugReserved("status")).toBe(true);
      expect(isSlugReserved("my-workspace")).toBe(false);
    });
  });

  describe("Logo Upload", () => {
    it("shows upload button initially", () => {
      render(<WorkspaceCreationPage />);
      expect(screen.getByText("Upload image")).toBeInTheDocument();
      expect(screen.getByText("Recommended size: 160x160px")).toBeInTheDocument();
    });

    it("accepts valid image files", async () => {
      render(<WorkspaceCreationPage />);
      const fileInput = screen.getByLabelText("Workspace logo");
      const file = new File(["image"], "logo.png", { type: "image/png" });

      await user.upload(fileInput, file);
      await waitFor(() => {
        expect(screen.getByText("logo.png")).toBeInTheDocument();
      });
    });

    it("rejects invalid file types", async () => {
      render(<WorkspaceCreationPage />);
      const fileInput = screen.getByLabelText("Workspace logo");
      const file = new File(["doc"], "document.pdf", { type: "application/pdf" });

      await user.upload(fileInput, file);
      await waitFor(() => {
        expect(screen.getByText("Please upload a PNG, JPG, SVG, or WebP image")).toBeInTheDocument();
      });
    });

    it("enforces 5MB file size limit", async () => {
      render(<WorkspaceCreationPage />);
      const fileInput = screen.getByLabelText("Workspace logo");
      const largeFile = new File(["x".repeat(6 * 1024 * 1024)], "large.png", { type: "image/png" });
      Object.defineProperty(largeFile, "size", { value: 6 * 1024 * 1024 });

      await user.upload(fileInput, largeFile);
      await waitFor(() => {
        expect(screen.getByText("File size must be less than 5MB")).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("disables submit button when form is incomplete", () => {
      render(<WorkspaceCreationPage />);
      const submitButton = screen.getByRole("button", { name: /create workspace/i });
      expect(submitButton).toBeDisabled();
    });

    it("enables submit button when form is valid", async () => {
      render(<WorkspaceCreationPage />);

      const nameInput = screen.getByLabelText("Workspace name");
      const fileInput = screen.getByLabelText("Workspace logo");
      const file = new File(["image"], "logo.png", { type: "image/png" });

      await user.type(nameInput, "Test Workspace");
      await user.upload(fileInput, file);

      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: /create workspace/i });
        expect(submitButton).not.toBeDisabled();
      }, { timeout: 2000 });
    });

    it("shows validation errors on invalid input", async () => {
      render(<WorkspaceCreationPage />);
      const slugInput = screen.getByLabelText("Workspace slug");

      await user.clear(slugInput);
      await user.type(slugInput, "a");
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText("Slug must be at least 3 characters")).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("creates workspace with valid data", async () => {
      const mockPush = vi.fn();
      vi.mocked((await import("next/navigation")).useRouter).mockReturnValue({
        push: mockPush,
        replace: vi.fn(),
      } as ReturnType<typeof import("next/navigation").useRouter>);

      render(<WorkspaceCreationPage />);

      const nameInput = screen.getByLabelText("Workspace name");
      const fileInput = screen.getByLabelText("Workspace logo");
      const file = new File(["image"], "logo.png", { type: "image/png" });

      await user.type(nameInput, "Test Workspace");
      await user.upload(fileInput, file);

      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: /create workspace/i });
        expect(submitButton).not.toBeDisabled();
      });

      const submitButton = screen.getByRole("button", { name: /create workspace/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/onboarding/domain?workspace=test-workspace");
      });
    });

    it("shows loading state during submission", async () => {
      render(<WorkspaceCreationPage />);

      const nameInput = screen.getByLabelText("Workspace name");
      const fileInput = screen.getByLabelText("Workspace logo");
      const file = new File(["image"], "logo.png", { type: "image/png" });

      await user.type(nameInput, "Test Workspace");
      await user.upload(fileInput, file);

      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: /create workspace/i });
        expect(submitButton).not.toBeDisabled();
      });

      const submitButton = screen.getByRole("button", { name: /create workspace/i });
      await user.click(submitButton);

      expect(screen.getByText("Creating workspace...")).toBeInTheDocument();
    });
  });
});