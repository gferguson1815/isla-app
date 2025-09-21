import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UsageForm from "../components/UsageForm";

describe("UsageForm", () => {
  const mockOnContinue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all usage estimation questions", () => {
    render(
      <UsageForm
        onContinue={mockOnContinue}
      />
    );

    // Question 1
    expect(screen.getByText(/How many.*links.*do you create per month\?/)).toBeInTheDocument();
    expect(screen.getByText("1K or less")).toBeInTheDocument();
    expect(screen.getByText("10K")).toBeInTheDocument();
    expect(screen.getByText("50K")).toBeInTheDocument();

    // Question 2
    expect(screen.getByText(/How many.*clicks.*do your links get per month\?/)).toBeInTheDocument();
    expect(screen.getByText("50K or less")).toBeInTheDocument();
    expect(screen.getByText("250K")).toBeInTheDocument();
    expect(screen.getByText("1M")).toBeInTheDocument();

    // Question 3
    expect(screen.getByText(/Do you want to.*track conversions.*on your links\?/)).toBeInTheDocument();
    expect(screen.getAllByText("No")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Yes")[0]).toBeInTheDocument();

    // Question 4
    expect(screen.getByText(/Do you want to create a.*partner program.*\?/)).toBeInTheDocument();
    expect(screen.getAllByText("No")[1]).toBeInTheDocument();
    expect(screen.getAllByText("Yes")[1]).toBeInTheDocument();
  });

  it("has correct default values selected", () => {
    render(
      <UsageForm
        onContinue={mockOnContinue}
      />
    );

    // Default selections - check by button styles since we use custom buttons
    const links1k = screen.getByText("1K or less");
    expect(links1k.className).toContain("bg-white");

    const clicks50k = screen.getByText("50K or less");
    expect(clicks50k.className).toContain("bg-white");

    const conversionsNo = screen.getAllByText("No")[0];
    expect(conversionsNo.className).toContain("bg-white");

    const partnerNo = screen.getAllByText("No")[1];
    expect(partnerNo.className).toContain("bg-white");
  });

  it("allows changing radio button selections", () => {
    render(
      <UsageForm
        onContinue={mockOnContinue}
      />
    );

    // Change links per month
    const links10k = screen.getByText("10K");
    fireEvent.click(links10k);
    expect(links10k.className).toContain("bg-white");

    // Change clicks per month
    const clicks1m = screen.getByText("1M");
    fireEvent.click(clicks1m);
    expect(clicks1m.className).toContain("bg-white");

    // Change track conversions
    const conversionsYes = screen.getAllByText("Yes")[0];
    fireEvent.click(conversionsYes);
    expect(conversionsYes.className).toContain("bg-white");

    // Change partner program
    const partnerYes = screen.getAllByText("Yes")[1];
    fireEvent.click(partnerYes);
    expect(partnerYes.className).toContain("bg-white");
  });

  it("renders Continue button", () => {
    render(
      <UsageForm
        onContinue={mockOnContinue}
      />
    );

    const continueButton = screen.getByRole("button", { name: /Continue/i });
    expect(continueButton).toBeInTheDocument();
    expect(continueButton).toHaveClass("bg-gray-900");
  });

  it("renders Enterprise link", () => {
    render(
      <UsageForm
        onContinue={mockOnContinue}
      />
    );

    const enterpriseLink = screen.getByText(/Chat with us about Enterprise/);
    expect(enterpriseLink).toBeInTheDocument();
    expect(enterpriseLink.closest("a")).toHaveAttribute("href", "/contact/sales");
  });

  it("calls onContinue with form data when submitted", () => {
    render(
      <UsageForm
        onContinue={mockOnContinue}
      />
    );

    // Change some selections
    fireEvent.click(screen.getByText("10K"));
    fireEvent.click(screen.getByText("1M"));
    fireEvent.click(screen.getAllByText("Yes")[0]); // Track conversions
    fireEvent.click(screen.getAllByText("Yes")[1]); // Partner program

    // Submit form
    const continueButton = screen.getByRole("button", { name: /Continue/i });
    fireEvent.click(continueButton);

    expect(mockOnContinue).toHaveBeenCalledWith({
      linksPerMonth: "10k",
      clicksPerMonth: "1m",
      trackConversions: "yes",
      partnerProgram: "yes",
    });
  });

  it("form has responsive design classes", () => {
    const { container } = render(
      <UsageForm
        workspaceSlug="test-workspace"
        onContinue={mockOnContinue}
      />
    );

    // Check for hover states on button options
    const buttonOptions = container.querySelectorAll(".hover\\:text-gray-700");
    expect(buttonOptions.length).toBeGreaterThan(0);

    // Check for proper spacing
    const form = container.querySelector("form");
    expect(form).toHaveClass("space-y-6");
  });
});