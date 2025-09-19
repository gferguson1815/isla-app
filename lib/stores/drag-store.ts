import { create } from 'zustand';

interface DragState {
  selectedLinkIds: Set<string>;
  isDragging: boolean;
  draggedLinkId: string | null;
  toggleLinkSelection: (linkId: string) => void;
  selectLinks: (linkIds: string[]) => void;
  clearSelection: () => void;
  setDragging: (isDragging: boolean, linkId?: string | null) => void;
}

export const useDragStore = create<DragState>((set) => ({
  selectedLinkIds: new Set(),
  isDragging: false,
  draggedLinkId: null,

  toggleLinkSelection: (linkId) =>
    set((state) => {
      const newSelection = new Set(state.selectedLinkIds);
      if (newSelection.has(linkId)) {
        newSelection.delete(linkId);
      } else {
        newSelection.add(linkId);
      }
      return { selectedLinkIds: newSelection };
    }),

  selectLinks: (linkIds) =>
    set({ selectedLinkIds: new Set(linkIds) }),

  clearSelection: () =>
    set({ selectedLinkIds: new Set() }),

  setDragging: (isDragging, linkId = null) =>
    set({ isDragging, draggedLinkId: linkId }),
}));