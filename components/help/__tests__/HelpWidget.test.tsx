import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HelpWidget } from "../HelpWidget";
import userEvent from "@testing-library/user-event";

describe("HelpWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("renders floating help button", () => {
    render(<HelpWidget />);

    const helpButton = screen.getByRole("button", { name: /open help/i });
    expect(helpButton).toBeInTheDocument();
    // Check parent container has positioning classes
    const container = helpButton.closest('.fixed.bottom-6.right-6');
    expect(container).toBeInTheDocument();
  });

  it("opens help dialog when button is clicked", async () => {
    render(<HelpWidget />);

    const helpButton = screen.getByRole("button", { name: /open help/i });
    fireEvent.click(helpButton);

    await waitFor(() => {
      expect(screen.getByText("How can we help?")).toBeInTheDocument();
    });
  });

  it("displays all help articles", async () => {
    render(<HelpWidget />);

    const helpButton = screen.getByRole("button", { name: /open help/i });
    fireEvent.click(helpButton);

    await waitFor(() => {
      expect(screen.getByText("What is Isla?")).toBeInTheDocument();
      expect(screen.getByText("How to create a short link on Isla?")).toBeInTheDocument();
      expect(screen.getByText("How to add a custom domain to Isla")).toBeInTheDocument();
      expect(screen.getByText("How to invite teammates on Isla")).toBeInTheDocument();
      expect(screen.getByText("Isla Analytics Overview")).toBeInTheDocument();
      expect(screen.getByText("Isla Conversions Overview")).toBeInTheDocument();
    });
  });

  it("displays search input with placeholder", async () => {
    render(<HelpWidget />);

    const helpButton = screen.getByRole("button", { name: /open help/i });
    fireEvent.click(helpButton);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText("Search articles, guides, and more...");
      expect(searchInput).toBeInTheDocument();
    });
  });

  it("filters articles based on search query", async () => {
    render(<HelpWidget />);

    const helpButton = screen.getByRole("button", { name: /open help/i });
    fireEvent.click(helpButton);

    const searchInput = await screen.findByPlaceholderText("Search articles, guides, and more...");
    fireEvent.change(searchInput, { target: { value: "domain" } });

    // Wait a bit for the debounce
    await new Promise(resolve => setTimeout(resolve, 350));

    await waitFor(() => {
      expect(screen.getByText("How to add a custom domain to Isla")).toBeInTheDocument();
      expect(screen.queryByText("What is Isla?")).not.toBeInTheDocument();
      expect(screen.queryByText("How to invite teammates on Isla")).not.toBeInTheDocument();
    });
  });

  it("shows no articles found message when search has no results", async () => {
    render(<HelpWidget />);

    const helpButton = screen.getByRole("button", { name: /open help/i });
    fireEvent.click(helpButton);

    const searchInput = await screen.findByPlaceholderText("Search articles, guides, and more...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    // Wait a bit for the debounce
    await new Promise(resolve => setTimeout(resolve, 350));

    await waitFor(() => {
      expect(screen.getByText("No articles found")).toBeInTheDocument();
      expect(screen.getByText("Try a different search term")).toBeInTheDocument();
    });
  });

  it("displays Contact us and Help center options", async () => {
    render(<HelpWidget />);

    const helpButton = screen.getByRole("button", { name: /open help/i });
    fireEvent.click(helpButton);

    await waitFor(() => {
      expect(screen.getByText("Contact us")).toBeInTheDocument();
      expect(screen.getByText("Help center")).toBeInTheDocument();
    });
  });

  it("closes dialog when close button is clicked", async () => {
    render(<HelpWidget />);

    const helpButton = screen.getByRole("button", { name: /open help/i });
    fireEvent.click(helpButton);

    await waitFor(() => {
      expect(screen.getByText("How can we help?")).toBeInTheDocument();
    });

    // Find the X button
    const closeButtons = screen.getAllByRole("button");
    const closeButton = closeButtons.find(button => {
      const svgChild = button.querySelector('svg.lucide-x');
      return svgChild !== null;
    });

    if (closeButton) {
      fireEvent.click(closeButton);
    }

    await waitFor(() => {
      expect(screen.queryByText("How can we help?")).not.toBeInTheDocument();
    });
  });

  it("opens dialog with keyboard shortcut (?)", async () => {
    render(<HelpWidget />);

    const event = new KeyboardEvent("keydown", {
      key: "?",
      shiftKey: true,
    });

    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText("How can we help?")).toBeInTheDocument();
    });
  });

  it("toggles dialog with keyboard shortcut", async () => {
    render(<HelpWidget />);

    const event = new KeyboardEvent("keydown", {
      key: "?",
      shiftKey: true,
    });

    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText("How can we help?")).toBeInTheDocument();
    });

    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.queryByText("How can we help?")).not.toBeInTheDocument();
    });
  });

  it("opens article in new window when clicked", async () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<HelpWidget />);

    const helpButton = screen.getByRole("button", { name: /open help/i });
    fireEvent.click(helpButton);

    await waitFor(() => {
      const article = screen.getByText("What is Isla?").closest("button");
      if (article) {
        fireEvent.click(article);
      }
    });

    expect(windowOpenSpy).toHaveBeenCalledWith("/help/what-is-isla", "_blank");

    windowOpenSpy.mockRestore();
  });

  it("renders with proper accessibility attributes", () => {
    render(<HelpWidget />);

    const helpButton = screen.getByRole("button", { name: /open help/i });
    expect(helpButton).toHaveAttribute("aria-label", "Open help");
  });
});