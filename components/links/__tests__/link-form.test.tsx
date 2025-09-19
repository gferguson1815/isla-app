import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkForm } from '../link-form';

// Mock the dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('LinkForm Component', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form elements', () => {
    render(<LinkForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/destination url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/custom slug/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create link/i })).toBeInTheDocument();
  });

  it('should validate URL input', async () => {
    const user = userEvent.setup();
    render(<LinkForm onSubmit={mockOnSubmit} />);

    const urlInput = screen.getByLabelText(/destination url/i);
    const submitButton = screen.getByRole('button', { name: /create link/i });

    // Test invalid URL
    await user.type(urlInput, 'not-a-url');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
    });

    // Clear and test valid URL
    await user.clear(urlInput);
    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('should validate custom slug', async () => {
    const user = userEvent.setup();
    render(<LinkForm onSubmit={mockOnSubmit} />);

    const urlInput = screen.getByLabelText(/destination url/i);
    const slugInput = screen.getByLabelText(/custom slug/i);
    const submitButton = screen.getByRole('button', { name: /create link/i });

    await user.type(urlInput, 'https://example.com');

    // Test too short slug
    await user.type(slugInput, 'ab');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/slug must be at least 3 characters/i)).toBeInTheDocument();
    });

    // Test invalid characters
    await user.clear(slugInput);
    await user.type(slugInput, 'test slug');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/can only contain letters, numbers, and hyphens/i)).toBeInTheDocument();
    });
  });

  it('should generate random slug', async () => {
    const user = userEvent.setup();
    render(<LinkForm onSubmit={mockOnSubmit} />);

    const slugInput = screen.getByLabelText(/custom slug/i) as HTMLInputElement;
    const generateButton = screen.getByRole('button', { name: '' }); // Shuffle icon button

    expect(slugInput.value).toBe('');

    await user.click(generateButton);

    await waitFor(() => {
      expect(slugInput.value).toMatch(/^[a-zA-Z0-9]{6,8}$/);
    });
  });

  it('should show preview of short link', async () => {
    const user = userEvent.setup();
    render(<LinkForm onSubmit={mockOnSubmit} />);

    const slugInput = screen.getByLabelText(/custom slug/i);

    await user.type(slugInput, 'my-link');

    await waitFor(() => {
      expect(screen.getByText(/my-link/)).toBeInTheDocument();
    });
  });

  it('should handle successful submission', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(<LinkForm onSubmit={mockOnSubmit} />);

    const urlInput = screen.getByLabelText(/destination url/i);
    const submitButton = screen.getByRole('button', { name: /create link/i });

    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.com',
          finalSlug: expect.any(String)
        })
      );
    });
  });

  it('should show loading state', () => {
    render(<LinkForm onSubmit={mockOnSubmit} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /creating link/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show success state after creation', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(<LinkForm onSubmit={mockOnSubmit} />);

    const urlInput = screen.getByLabelText(/destination url/i);
    const submitButton = screen.getByRole('button', { name: /create link/i });

    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/link created successfully/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create another/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view all links/i })).toBeInTheDocument();
    });
  });
});