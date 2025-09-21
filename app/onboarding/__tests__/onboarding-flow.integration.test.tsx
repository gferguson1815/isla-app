import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import UsageOnboardingPage from "../usage/page";

// Mock next/navigation
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === "workspace") return "test-workspace";
      return null;
    },
  }),
}));

// Mock auth context
vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(() => ({
    user: {
      email: "test@example.com",
      id: "test-user-id",
      name: "Test User"
    },
    signOut: vi.fn(),
  })),
}));

// Mock trpc client
vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    workspace: {
      getBySlug: {
        useQuery: vi.fn(() => ({
          data: {
            id: "workspace-1",
            slug: "test-workspace",
            name: "Test Workspace",
            owner_id: "test-user-id"
          },
          isLoading: false,
          error: null,
        })),
      },
    },
  },
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock components
vi.mock("@/components/help/HelpWidget", () => ({
  HelpWidget: () => <div data-testid="help-widget">Help Widget</div>,
}));

vi.mock("@/components/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Onboarding Flow Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Usage Estimation Page Flow", () => {
    it("should complete the entire usage estimation flow", async () => {
      render(<UsageOnboardingPage />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText(/Estimate your usage/)).toBeInTheDocument();
      });

      // Verify all questions are present by checking for option buttons
      expect(screen.getByText("1K or less")).toBeInTheDocument();
      expect(screen.getByText("50K or less")).toBeInTheDocument();
      expect(screen.getAllByText("No")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Yes")[0]).toBeInTheDocument();

      // Select options for Pro tier
      fireEvent.click(screen.getByText("1K or less"));
      fireEvent.click(screen.getByText("50K or less"));
      fireEvent.click(screen.getAllByText("No")[0]); // No conversions
      fireEvent.click(screen.getAllByText("No")[1]); // No partner program

      // Submit the form
      const continueButton = screen.getByRole("button", { name: /Continue/i });
      fireEvent.click(continueButton);

      // Verify navigation to plan page with Pro recommendation
      expect(mockPush).toHaveBeenCalledWith("/onboarding/plan?plan=pro&workspace=test-workspace");
    });

    it("should recommend Business tier for conversion tracking", async () => {
      render(<UsageOnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText(/Estimate your usage/)).toBeInTheDocument();
      });

      // Select options that require Business tier
      fireEvent.click(screen.getByText("1K or less"));
      fireEvent.click(screen.getByText("50K or less"));
      fireEvent.click(screen.getAllByText("Yes")[0]); // Yes to conversions
      fireEvent.click(screen.getAllByText("No")[1]); // No partner program

      // Submit the form
      const continueButton = screen.getByRole("button", { name: /Continue/i });
      fireEvent.click(continueButton);

      // Verify navigation to plan page with Business recommendation
      expect(mockPush).toHaveBeenCalledWith("/onboarding/plan?plan=business&workspace=test-workspace");
    });

    it("should recommend Business tier for partner program", async () => {
      render(<UsageOnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText(/Estimate your usage/)).toBeInTheDocument();
      });

      // Select options that require Business tier
      fireEvent.click(screen.getByText("1K or less"));
      fireEvent.click(screen.getByText("50K or less"));
      fireEvent.click(screen.getAllByText("No")[0]); // No conversions
      fireEvent.click(screen.getAllByText("Yes")[1]); // Yes to partner program

      // Submit the form
      const continueButton = screen.getByRole("button", { name: /Continue/i });
      fireEvent.click(continueButton);

      // Verify navigation to plan page with Business recommendation
      expect(mockPush).toHaveBeenCalledWith("/onboarding/plan?plan=business&workspace=test-workspace");
    });

    it("should recommend Advanced tier for high usage", async () => {
      render(<UsageOnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText(/Estimate your usage/)).toBeInTheDocument();
      });

      // Select high usage options
      fireEvent.click(screen.getByText("50K")); // 50K links
      fireEvent.click(screen.getByText("1M")); // 1M clicks
      fireEvent.click(screen.getAllByText("Yes")[0]); // Yes conversions
      fireEvent.click(screen.getAllByText("Yes")[1]); // Yes partner

      // Submit the form
      const continueButton = screen.getByRole("button", { name: /Continue/i });
      fireEvent.click(continueButton);

      // Verify navigation to plan page with Advanced recommendation
      expect(mockPush).toHaveBeenCalledWith("/onboarding/plan?plan=advanced&workspace=test-workspace");
    });

    it("should show enterprise link with correct href", () => {
      render(<UsageOnboardingPage />);

      const enterpriseLink = screen.getByText(/Chat with us about Enterprise/);
      expect(enterpriseLink).toBeInTheDocument();
      expect(enterpriseLink.closest("a")).toHaveAttribute("href", "/contact/sales");
    });

    it("should display user information and sign out option", async () => {
      render(<UsageOnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText(/You're signed in as/)).toBeInTheDocument();
        expect(screen.getByText("test@example.com")).toBeInTheDocument();
        expect(screen.getByText("Sign in as a different user")).toBeInTheDocument();
      });
    });

    it("should show help widget", () => {
      render(<UsageOnboardingPage />);
      expect(screen.getByTestId("help-widget")).toBeInTheDocument();
    });
  });

  describe("Accessibility Features", () => {
    it("should have proper ARIA attributes on radio groups", async () => {
      render(<UsageOnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText(/Estimate your usage/)).toBeInTheDocument();
      });

      // Check for radio group roles
      const radioGroups = screen.getAllByRole("radiogroup");
      expect(radioGroups).toHaveLength(4);

      // Check that radio groups have proper labelling
      radioGroups.forEach((group) => {
        expect(group).toHaveAttribute("aria-labelledby");
        expect(group).toHaveAttribute("aria-required", "true");
      });

      // Check radio buttons have proper roles and states
      const radioButtons = screen.getAllByRole("radio");
      expect(radioButtons.length).toBeGreaterThan(0);

      // Check first option is selected by default in each group
      expect(screen.getByLabelText("1,000 links or less per month")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByLabelText("50,000 clicks or less per month")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByLabelText("No, do not track conversions")).toHaveAttribute("aria-checked", "true");
      expect(screen.getByLabelText("No, do not create a partner program")).toHaveAttribute("aria-checked", "true");
    });

    it("should handle keyboard navigation", async () => {
      render(<UsageOnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText(/Estimate your usage/)).toBeInTheDocument();
      });

      // Focus on first button
      const firstButton = screen.getByText("1K or less");
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);

      // Simulate tab navigation
      const allButtons = screen.getAllByRole("button");
      expect(allButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should redirect to dashboard on workspace validation error", async () => {
      // Override the mock for this test
      vi.clearAllMocks();
      vi.mock("@/lib/trpc/client", () => ({
        trpc: {
          workspace: {
            getBySlug: {
              useQuery: vi.fn(() => ({
                data: null,
                isLoading: false,
                error: { message: "Workspace not found" },
              })),
            },
          },
        },
      }));

      render(<UsageOnboardingPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should redirect to workspace page if no workspace parameter", async () => {
      // Override the search params mock for this test
      vi.clearAllMocks();
      vi.mock("next/navigation", () => ({
        useRouter: () => mockRouter,
        useSearchParams: () => ({
          get: () => null,
        }),
      }));

      render(<UsageOnboardingPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/onboarding/workspace");
      });
    });
  });

  describe("Form State Management", () => {
    it("should maintain form state across selections", async () => {
      render(<UsageOnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText(/Estimate your usage/)).toBeInTheDocument();
      });

      // Make multiple selections
      fireEvent.click(screen.getByText("10K"));
      fireEvent.click(screen.getByText("250K"));
      fireEvent.click(screen.getAllByText("Yes")[0]);

      // Verify selections are maintained (by checking button styles)
      expect(screen.getByText("10K").className).toContain("bg-white");
      expect(screen.getByText("250K").className).toContain("bg-white");
      expect(screen.getAllByText("Yes")[0].className).toContain("bg-white");

      // Change a selection
      fireEvent.click(screen.getByText("50K"));
      expect(screen.getByText("50K").className).toContain("bg-white");
      expect(screen.getByText("10K").className).not.toContain("bg-white");
    });

    it("should pass correct form data to continue handler", async () => {
      render(<UsageOnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText(/Estimate your usage/)).toBeInTheDocument();
      });

      // Select specific options
      fireEvent.click(screen.getByText("10K"));
      fireEvent.click(screen.getByText("250K"));
      fireEvent.click(screen.getAllByText("Yes")[0]); // Yes to conversions
      fireEvent.click(screen.getAllByText("Yes")[1]); // Yes to partner

      // Submit the form
      const continueButton = screen.getByRole("button", { name: /Continue/i });
      fireEvent.click(continueButton);

      // Verify correct plan recommendation based on selections
      expect(mockPush).toHaveBeenCalledWith("/onboarding/plan?plan=business&workspace=test-workspace");
    });
  });
});