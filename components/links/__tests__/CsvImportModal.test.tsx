import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CsvImportModal } from "../CsvImportModal";

describe("CsvImportModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onImport: vi.fn(),
    workspaceSlug: "test-workspace",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render modal when open", () => {
    render(<CsvImportModal {...defaultProps} />);
    
    expect(screen.getByText("Import Links from CSV")).toBeInTheDocument();
    expect(screen.getByText("Upload a CSV file to bulk import links to your workspace")).toBeInTheDocument();
  });

  it("should not render modal when closed", () => {
    render(<CsvImportModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText("Import Links from CSV")).not.toBeInTheDocument();
  });

  it("should show drag and drop zone initially", () => {
    render(<CsvImportModal {...defaultProps} />);
    
    expect(screen.getByText(/Drag and drop your CSV file here/i)).toBeInTheDocument();
    expect(screen.getByText("Maximum file size: 5MB")).toBeInTheDocument();
  });

  it("should handle file selection via click", async () => {
    render(<CsvImportModal {...defaultProps} />);
    
    const csvContent = `destination_url,custom_slug
https://example.com,test-slug`;
    const file = new File([csvContent], "test.csv", { type: "text/csv" });
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await userEvent.upload(input, file);
    await waitFor(() => {
      expect(screen.getByText("test.csv")).toBeInTheDocument();
    });
  });

  it("should reject files larger than 5MB", async () => {
    render(<CsvImportModal {...defaultProps} />);
    
    const largeContent = new Array(5 * 1024 * 1024 + 1).join("a");
    const file = new File([largeContent], "large.csv", { type: "text/csv" });
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await userEvent.upload(input, file);
    await waitFor(() => {
      expect(screen.getByText("File size exceeds 5MB limit")).toBeInTheDocument();
    });
  });

  it("should reject non-CSV files", async () => {
    render(<CsvImportModal {...defaultProps} />);
    
    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await userEvent.upload(input, file);
    await waitFor(() => {
      expect(screen.getByText("Please upload a CSV file")).toBeInTheDocument();
    });
  });

  it("should show column mapping interface after file selection", async () => {
    render(<CsvImportModal {...defaultProps} />);
    
    const csvContent = `destination_url,custom_slug,title
https://example.com,test-slug,Test Title`;
    const file = new File([csvContent], "test.csv", { type: "text/csv" });
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await userEvent.upload(input, file);
    await waitFor(() => {
      expect(screen.getByText("Column Mapping")).toBeInTheDocument();
      expect(screen.getByText("Map your CSV columns to link fields")).toBeInTheDocument();
    });
  });

  it("should auto-detect column mappings", async () => {
    render(<CsvImportModal {...defaultProps} />);
    
    const csvContent = `destination_url,slug,title,tags,folder
https://example.com,test,Title,"tag1,tag2",folder1`;
    const file = new File([csvContent], "test.csv", { type: "text/csv" });
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await userEvent.upload(input, file);
    await waitFor(() => {
      const destinationSelect = screen.getByRole("combobox", { name: /Destination URL/i });
      expect(destinationSelect).toHaveTextContent("destination_url");
    });
  });

  it("should call onImport when Continue button is clicked", async () => {
    const onImport = vi.fn();
    render(<CsvImportModal {...defaultProps} onImport={onImport} />);
    
    const csvContent = `destination_url
https://example.com`;
    const file = new File([csvContent], "test.csv", { type: "text/csv" });
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await userEvent.upload(input, file);
    await waitFor(() => {
      expect(screen.getByText("Continue to Preview")).toBeInTheDocument();
    });

    const continueButton = screen.getByText("Continue to Preview");
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(onImport).toHaveBeenCalledWith(
        expect.any(File),
        expect.objectContaining({
          destinationUrl: "destination_url",
        })
      );
    });
  });

  it("should disable Continue button without destination URL mapping", async () => {
    render(<CsvImportModal {...defaultProps} />);
    
    const csvContent = `custom_slug,title
test,Title`;
    const file = new File([csvContent], "test.csv", { type: "text/csv" });
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await userEvent.upload(input, file);
    await waitFor(() => {
      const continueButton = screen.getByText("Continue to Preview");
      expect(continueButton).toBeDisabled();
    });
  });

  it("should call onClose when Cancel button is clicked", () => {
    const onClose = vi.fn();
    render(<CsvImportModal {...defaultProps} onClose={onClose} />);
    
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalled();
  });
});