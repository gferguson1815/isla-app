import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FolderTree, FolderTreeItem } from '../FolderTree';
import type { FolderWithChildren } from '@/packages/shared/src/types/folder';

describe('FolderTree', () => {
  const mockFolders: FolderWithChildren[] = [
    {
      id: 'folder-1',
      workspace_id: 'workspace-1',
      name: 'Marketing',
      description: null,
      parent_id: null,
      level: 0,
      created_at: new Date(),
      updated_at: new Date(),
      children: [
        {
          id: 'folder-2',
          workspace_id: 'workspace-1',
          name: 'Campaigns',
          description: null,
          parent_id: 'folder-1',
          level: 1,
          created_at: new Date(),
          updated_at: new Date(),
          children: [],
          _count: { links: 3 }
        }
      ],
      _count: { links: 5 }
    },
    {
      id: 'folder-3',
      workspace_id: 'workspace-1',
      name: 'Sales',
      description: null,
      parent_id: null,
      level: 0,
      created_at: new Date(),
      updated_at: new Date(),
      children: [],
      _count: { links: 2 }
    }
  ];

  it('should render all root folders', () => {
    const onSelectFolder = vi.fn();

    render(
      <FolderTree
        folders={mockFolders}
        selectedFolderId={null}
        onSelectFolder={onSelectFolder}
      />
    );

    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
  });

  it('should show link counts', () => {
    const onSelectFolder = vi.fn();

    render(
      <FolderTree
        folders={mockFolders}
        selectedFolderId={null}
        onSelectFolder={onSelectFolder}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument(); // Marketing links
    expect(screen.getByText('2')).toBeInTheDocument(); // Sales links
  });

  it('should expand/collapse folders with children', () => {
    const onSelectFolder = vi.fn();

    render(
      <FolderTree
        folders={mockFolders}
        selectedFolderId={null}
        onSelectFolder={onSelectFolder}
      />
    );

    // Initially, child folder should not be visible
    expect(screen.queryByText('Campaigns')).not.toBeInTheDocument();

    // Click to expand Marketing folder
    const expandButton = screen.getAllByRole('button')[0];
    fireEvent.click(expandButton);

    // Now child should be visible
    expect(screen.getByText('Campaigns')).toBeInTheDocument();
  });

  it('should call onSelectFolder when a folder is clicked', () => {
    const onSelectFolder = vi.fn();

    render(
      <FolderTree
        folders={mockFolders}
        selectedFolderId={null}
        onSelectFolder={onSelectFolder}
      />
    );

    fireEvent.click(screen.getByText('Marketing'));
    expect(onSelectFolder).toHaveBeenCalledWith('folder-1');

    fireEvent.click(screen.getByText('Sales'));
    expect(onSelectFolder).toHaveBeenCalledWith('folder-3');
  });

  it('should highlight selected folder', () => {
    const onSelectFolder = vi.fn();

    const { rerender } = render(
      <FolderTree
        folders={mockFolders}
        selectedFolderId="folder-1"
        onSelectFolder={onSelectFolder}
      />
    );

    // Check that Marketing has the selected class
    const marketingFolder = screen.getByText('Marketing').parentElement;
    expect(marketingFolder).toHaveClass('bg-accent');

    // Rerender with different selection
    rerender(
      <FolderTree
        folders={mockFolders}
        selectedFolderId="folder-3"
        onSelectFolder={onSelectFolder}
      />
    );

    const salesFolder = screen.getByText('Sales').parentElement;
    expect(salesFolder).toHaveClass('bg-accent');
  });
});

describe('FolderTreeItem', () => {
  const mockFolder: FolderWithChildren = {
    id: 'folder-1',
    workspace_id: 'workspace-1',
    name: 'Test Folder',
    description: null,
    parent_id: null,
    level: 0,
    created_at: new Date(),
    updated_at: new Date(),
    children: [],
    _count: { links: 10 }
  };

  it('should handle drag and drop events', () => {
    const onSelectFolder = vi.fn();
    const onDropLink = vi.fn();

    render(
      <FolderTreeItem
        folder={mockFolder}
        selectedFolderId={null}
        onSelectFolder={onSelectFolder}
        onDropLink={onDropLink}
        level={0}
      />
    );

    const folderElement = screen.getByText('Test Folder').parentElement;

    // Simulate drag over
    const dragOverEvent = new Event('dragover', { bubbles: true });
    Object.defineProperty(dragOverEvent, 'preventDefault', {
      value: vi.fn(),
      writable: false
    });
    fireEvent(folderElement!, dragOverEvent);
    expect(dragOverEvent.preventDefault).toHaveBeenCalled();

    // Simulate drop
    const dropEvent = new Event('drop', { bubbles: true }) as any;
    dropEvent.dataTransfer = {
      getData: vi.fn(() => 'link-123')
    };
    Object.defineProperty(dropEvent, 'preventDefault', {
      value: vi.fn(),
      writable: false
    });

    fireEvent(folderElement!, dropEvent);
    expect(onDropLink).toHaveBeenCalledWith('link-123', 'folder-1');
  });

  it('should apply correct indentation based on level', () => {
    const onSelectFolder = vi.fn();

    render(
      <FolderTreeItem
        folder={mockFolder}
        selectedFolderId={null}
        onSelectFolder={onSelectFolder}
        level={2}
      />
    );

    const folderElement = screen.getByText('Test Folder').parentElement;
    expect(folderElement).toHaveStyle({ paddingLeft: '40px' }); // 2 * 16 + 8
  });
});