import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TagFilterBar } from '../TagFilterBar'
import { useTagFilterStore } from '@/lib/stores/tag-filter-store'
import { trpc } from '@/lib/trpc/client'

// Mock the tRPC client
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    tag: {
      list: {
        useQuery: vi.fn(),
      },
    },
  },
}))

// Mock the Zustand store
vi.mock('@/lib/stores/tag-filter-store', () => ({
  useTagFilterStore: vi.fn(),
}))

describe('TagFilterBar', () => {
  const workspaceId = 'test-workspace-id'
  const mockTags = [
    { id: '1', name: 'javascript', usage_count: 10, color: '#3B82F6', created_at: new Date() },
    { id: '2', name: 'react', usage_count: 8, color: '#10B981', created_at: new Date() },
    { id: '3', name: 'typescript', usage_count: 6, color: null, created_at: new Date() },
  ]

  const mockStore = {
    selectedTags: [],
    filterMode: 'AND' as const,
    isFilterActive: false,
    toggleTag: vi.fn(),
    clearTags: vi.fn(),
    setFilterMode: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useTagFilterStore as any).mockReturnValue(mockStore)
    ;(trpc.tag.list.useQuery as any).mockReturnValue({ data: mockTags })
  })

  it('should render popular tags when showPopularTags is true', () => {
    render(<TagFilterBar workspaceId={workspaceId} />)

    expect(screen.getByText('Popular tags:')).toBeInTheDocument()
    expect(screen.getByText('javascript')).toBeInTheDocument()
    expect(screen.getByText('react')).toBeInTheDocument()
    expect(screen.getByText('typescript')).toBeInTheDocument()
  })

  it('should not render popular tags when showPopularTags is false', () => {
    render(<TagFilterBar workspaceId={workspaceId} showPopularTags={false} />)

    expect(screen.queryByText('Popular tags:')).not.toBeInTheDocument()
  })

  it('should limit popular tags to maxPopularTags', () => {
    render(<TagFilterBar workspaceId={workspaceId} maxPopularTags={2} />)

    expect(screen.getByText('javascript')).toBeInTheDocument()
    expect(screen.getByText('react')).toBeInTheDocument()
    expect(screen.queryByText('typescript')).not.toBeInTheDocument()
  })

  it('should call toggleTag when a popular tag is clicked', () => {
    render(<TagFilterBar workspaceId={workspaceId} />)

    const tag = screen.getByText('javascript').parentElement
    fireEvent.click(tag!)

    expect(mockStore.toggleTag).toHaveBeenCalledWith('javascript')
  })

  it('should display active filters', () => {
    mockStore.selectedTags = ['javascript', 'react']
    mockStore.isFilterActive = true

    render(<TagFilterBar workspaceId={workspaceId} />)

    expect(screen.getByText('Active filters:')).toBeInTheDocument()
    // Tags are displayed in TagPill components
    expect(screen.getAllByText('javascript')).toHaveLength(2) // One in active, one in popular
    expect(screen.getAllByText('react')).toHaveLength(2)
  })

  it('should show filter mode selector when multiple tags selected', () => {
    mockStore.selectedTags = ['javascript', 'react']
    mockStore.isFilterActive = true

    render(<TagFilterBar workspaceId={workspaceId} />)

    expect(screen.getByText('AND')).toBeInTheDocument()
  })

  it('should call clearTags when clear button clicked', () => {
    mockStore.selectedTags = ['javascript', 'react']
    mockStore.isFilterActive = true

    render(<TagFilterBar workspaceId={workspaceId} />)

    const clearButton = screen.getByText('Clear')
    fireEvent.click(clearButton)

    expect(mockStore.clearTags).toHaveBeenCalled()
  })

  it('should highlight selected tags in popular tags', () => {
    mockStore.selectedTags = ['javascript']

    const { container } = render(<TagFilterBar workspaceId={workspaceId} />)

    // Find the popular tag that is selected
    const popularTags = container.querySelectorAll('.cursor-pointer')
    const selectedTag = Array.from(popularTags).find(tag =>
      tag.textContent?.includes('javascript')
    )

    expect(selectedTag).toHaveClass('ring-2', 'ring-blue-500')
  })

  it('should return null when no popular tags and no selected tags', () => {
    ;(trpc.tag.list.useQuery as any).mockReturnValue({ data: [] })
    mockStore.selectedTags = []

    const { container } = render(
      <TagFilterBar workspaceId={workspaceId} showPopularTags={true} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should call removeTag when tag pill remove button clicked', () => {
    mockStore.selectedTags = ['javascript']
    mockStore.isFilterActive = true

    render(<TagFilterBar workspaceId={workspaceId} />)

    // Find the remove button in the active filters section
    const removeButtons = screen.getAllByLabelText(/Remove .* tag/)
    const activeFilterRemove = removeButtons[0] // First one should be in active filters

    fireEvent.click(activeFilterRemove)

    expect(mockStore.toggleTag).toHaveBeenCalledWith('javascript')
  })
})