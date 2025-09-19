import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TagFilterState {
  selectedTags: string[]
  filterMode: 'AND' | 'OR'
  isFilterActive: boolean

  // Actions
  addTag: (tag: string) => void
  removeTag: (tag: string) => void
  clearTags: () => void
  setTags: (tags: string[]) => void
  toggleTag: (tag: string) => void
  setFilterMode: (mode: 'AND' | 'OR') => void
  resetFilters: () => void
}

export const useTagFilterStore = create<TagFilterState>()(
  persist(
    (set) => ({
      selectedTags: [],
      filterMode: 'AND',
      isFilterActive: false,

      addTag: (tag) =>
        set((state) => ({
          selectedTags: [...new Set([...state.selectedTags, tag])],
          isFilterActive: true,
        })),

      removeTag: (tag) =>
        set((state) => {
          const newTags = state.selectedTags.filter((t) => t !== tag)
          return {
            selectedTags: newTags,
            isFilterActive: newTags.length > 0,
          }
        }),

      clearTags: () =>
        set({
          selectedTags: [],
          isFilterActive: false,
        }),

      setTags: (tags) =>
        set({
          selectedTags: tags,
          isFilterActive: tags.length > 0,
        }),

      toggleTag: (tag) =>
        set((state) => {
          const isSelected = state.selectedTags.includes(tag)
          const newTags = isSelected
            ? state.selectedTags.filter((t) => t !== tag)
            : [...state.selectedTags, tag]

          return {
            selectedTags: newTags,
            isFilterActive: newTags.length > 0,
          }
        }),

      setFilterMode: (mode) =>
        set({ filterMode: mode }),

      resetFilters: () =>
        set({
          selectedTags: [],
          filterMode: 'AND',
          isFilterActive: false,
        }),
    }),
    {
      name: 'tag-filter-storage',
      partialize: (state) => ({
        filterMode: state.filterMode,
      }),
    }
  )
)