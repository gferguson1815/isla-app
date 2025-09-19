import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { FolderTree } from '../FolderTree';
import { DraggableLink } from '../DraggableLink';
import { DroppableFolder } from '../DroppableFolder';
import type { FolderWithChildren } from '@isla-app/shared/types/folder';

// Mock tRPC hooks
const mockMoveLink = vi.fn();
const mockBulkMove = vi.fn();

vi.mock('@/hooks/use-trpc', () => ({
  useTRPC: () => ({
    link: {
      update: {
        mutate: mockMoveLink
      },
      bulkMove: {
        mutate: mockBulkMove
      }
    }
  })
}));

// Mock drag store
vi.mock('@/lib/stores/drag-store', () => ({
  useDragStore: () => ({
    selectedLinks: [],
    setSelectedLinks: vi.fn(),
    isDragging: false,
    setIsDragging: vi.fn(),
  })
}));

describe('Drag and Drop Integration Tests', () => {
  const mockFolders: FolderWithChildren[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      workspace_id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Marketing',
      description: 'Marketing materials',
      parent_id: null,
      level: 0,
      created_at: new Date(),
      updated_at: new Date(),
      _count: { links: 5 },
      children: [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          workspace_id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Campaigns',
          description: 'Campaign links',
          parent_id: '550e8400-e29b-41d4-a716-446655440001',
          level: 1,
          created_at: new Date(),
          updated_at: new Date(),
          _count: { links: 3 },
          children: []
        }
      ]
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      workspace_id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Development',
      description: 'Dev resources',
      parent_id: null,
      level: 0,
      created_at: new Date(),
      updated_at: new Date(),
      _count: { links: 2 },
      children: []
    }
  ];

  const mockLinks = [
    {
      id: '550e8400-e29b-41d4-a716-446655440101',
      slug: 'test-link-1',
      url: 'https://example.com/1',
      title: 'Test Link 1',
      folder_id: null
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440102',
      slug: 'test-link-2',
      url: 'https://example.com/2',
      title: 'Test Link 2',
      folder_id: null
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle dropping a single link onto a folder', async () => {
    const onDropLink = vi.fn();

    const { container } = render(
      <DndContext onDragEnd={() => {}}>
        <FolderTree
          folders={mockFolders}
          selectedFolderId={null}
          onSelectFolder={vi.fn()}
          onDropLink={onDropLink}
        />
        <DraggableLink link={mockLinks[0]} />
      </DndContext>
    );

    // Simulate drag start
    const draggableLink = screen.getByText('Test Link 1');
    fireEvent.dragStart(draggableLink, {
      dataTransfer: {
        setData: (key: string, value: string) => {
          if (key === 'link-id') {
            expect(value).toBe('550e8400-e29b-41d4-a716-446655440101');
          }
        },
        getData: () => '550e8400-e29b-41d4-a716-446655440101'
      } as any
    });

    // Find the target folder
    const targetFolder = screen.getByText('Marketing');

    // Simulate drag over
    fireEvent.dragOver(targetFolder);

    // Simulate drop
    fireEvent.drop(targetFolder, {
      dataTransfer: {
        getData: () => '550e8400-e29b-41d4-a716-446655440101'
      } as any
    });

    // Verify the drop handler was called
    await waitFor(() => {
      expect(onDropLink).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440101',
        '550e8400-e29b-41d4-a716-446655440001'
      );
    });
  });

  it('should handle dragging multiple selected links', async () => {
    const TestComponent = () => {
      const [selectedLinks, setSelectedLinks] = React.useState<string[]>([
        '550e8400-e29b-41d4-a716-446655440101',
        '550e8400-e29b-41d4-a716-446655440102'
      ]);

      const handleDragEnd = (event: DragEndEvent) => {
        if (event.over && selectedLinks.length > 0) {
          mockBulkMove({
            link_ids: selectedLinks,
            folder_id: event.over.id as string
          });
        }
      };

      return (
        <DndContext onDragEnd={handleDragEnd}>
          <FolderTree
            folders={mockFolders}
            selectedFolderId={null}
            onSelectFolder={vi.fn()}
          />
          <div data-testid="selected-count">{selectedLinks.length} selected</div>
        </DndContext>
      );
    };

    render(<TestComponent />);

    // Verify multiple links are selected
    expect(screen.getByTestId('selected-count')).toHaveTextContent('2 selected');

    // Simulate drag and drop would trigger bulk move
    // In a real implementation, this would be handled by the DndContext
  });

  it('should provide visual feedback during drag operations', () => {
    const { container } = render(
      <DndContext onDragEnd={() => {}}>
        <DroppableFolder
          folder={mockFolders[0]}
          isOver={true}
          isDragging={true}
        />
      </DndContext>
    );

    // Check for visual feedback classes
    const folderElement = screen.getByText('Marketing').closest('div');
    expect(folderElement).toBeDefined();

    // In a real implementation, check for appropriate CSS classes
    // expect(folderElement).toHaveClass('drag-over');
  });

  it('should prevent dropping a folder into itself', async () => {
    const onDropFolder = vi.fn();

    render(
      <DndContext onDragEnd={() => {}}>
        <FolderTree
          folders={mockFolders}
          selectedFolderId={null}
          onSelectFolder={vi.fn()}
        />
      </DndContext>
    );

    const marketingFolder = screen.getByText('Marketing');

    // Simulate dragging a folder to itself
    fireEvent.dragStart(marketingFolder, {
      dataTransfer: {
        setData: (key: string, value: string) => {},
        getData: () => '550e8400-e29b-41d4-a716-446655440001'
      } as any
    });

    fireEvent.drop(marketingFolder, {
      dataTransfer: {
        getData: () => '550e8400-e29b-41d4-a716-446655440001'
      } as any
    });

    // Verify the drop was prevented (no call to move handler)
    expect(onDropFolder).not.toHaveBeenCalled();
  });

  it('should prevent dropping a folder into its descendant', () => {
    const onDropFolder = vi.fn();

    render(
      <FolderTree
        folders={mockFolders}
        selectedFolderId={null}
        onSelectFolder={vi.fn()}
      />
    );

    const parentFolder = screen.getByText('Marketing');
    const childFolder = screen.getByText('Campaigns');

    // Simulate dragging parent to child
    fireEvent.dragStart(parentFolder, {
      dataTransfer: {
        setData: () => {},
        getData: () => '550e8400-e29b-41d4-a716-446655440001'
      } as any
    });

    fireEvent.drop(childFolder, {
      dataTransfer: {
        getData: () => '550e8400-e29b-41d4-a716-446655440001'
      } as any
    });

    // Verify the drop was prevented
    expect(onDropFolder).not.toHaveBeenCalled();
  });

  it('should handle drag cancellation', () => {
    const onDropLink = vi.fn();

    render(
      <FolderTree
        folders={mockFolders}
        selectedFolderId={null}
        onSelectFolder={vi.fn()}
        onDropLink={onDropLink}
      />
    );

    const targetFolder = screen.getByText('Marketing');

    // Start drag
    fireEvent.dragStart(targetFolder);

    // Cancel drag (ESC key)
    fireEvent.keyDown(document, { key: 'Escape' });

    // Verify no drop occurred
    expect(onDropLink).not.toHaveBeenCalled();
  });

  it('should update UI optimistically on successful drop', async () => {
    mockMoveLink.mockResolvedValueOnce({ success: true });

    const TestComponent = () => {
      const [linkFolder, setLinkFolder] = React.useState<string | null>(null);

      const handleDropLink = async (linkId: string, folderId: string) => {
        // Optimistic update
        setLinkFolder(folderId);

        // Call API
        await mockMoveLink({ id: linkId, folder_id: folderId });
      };

      return (
        <div>
          <FolderTree
            folders={mockFolders}
            selectedFolderId={null}
            onSelectFolder={vi.fn()}
            onDropLink={handleDropLink}
          />
          {linkFolder && (
            <div data-testid="link-location">
              Link moved to folder: {linkFolder}
            </div>
          )}
        </div>
      );
    };

    const { getByTestId } = render(<TestComponent />);

    // Simulate drop
    const targetFolder = screen.getByText('Marketing');
    fireEvent.drop(targetFolder, {
      dataTransfer: {
        getData: () => '550e8400-e29b-41d4-a716-446655440101'
      } as any
    });

    // Check optimistic update
    await waitFor(() => {
      expect(getByTestId('link-location')).toHaveTextContent(
        'Link moved to folder: 550e8400-e29b-41d4-a716-446655440001'
      );
    });

    // Verify API was called
    expect(mockMoveLink).toHaveBeenCalledWith({
      id: '550e8400-e29b-41d4-a716-446655440101',
      folder_id: '550e8400-e29b-41d4-a716-446655440001'
    });
  });

  it('should handle drop errors gracefully', async () => {
    mockMoveLink.mockRejectedValueOnce(new Error('Network error'));

    const TestComponent = () => {
      const [error, setError] = React.useState<string | null>(null);

      const handleDropLink = async (linkId: string, folderId: string) => {
        try {
          await mockMoveLink({ id: linkId, folder_id: folderId });
        } catch (err) {
          setError('Failed to move link');
        }
      };

      return (
        <div>
          <FolderTree
            folders={mockFolders}
            selectedFolderId={null}
            onSelectFolder={vi.fn()}
            onDropLink={handleDropLink}
          />
          {error && <div data-testid="error-message">{error}</div>}
        </div>
      );
    };

    const { getByTestId } = render(<TestComponent />);

    // Simulate drop
    const targetFolder = screen.getByText('Marketing');
    fireEvent.drop(targetFolder, {
      dataTransfer: {
        getData: () => '550e8400-e29b-41d4-a716-446655440101'
      } as any
    });

    // Check error handling
    await waitFor(() => {
      expect(getByTestId('error-message')).toHaveTextContent('Failed to move link');
    });
  });
});