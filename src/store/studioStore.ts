import { create } from 'zustand'
import { StudioNode, StudioViewport } from '@/types/studio'

interface StudioState {
  nodes: StudioNode[]
  selectedNodeId: string | null
  viewport: StudioViewport
  filterTags: string[]
  isDirty: boolean

  // Node operations
  setNodes: (nodes: StudioNode[]) => void
  addNode: (node: StudioNode) => void
  updateNode: (id: string, updates: Partial<StudioNode>) => void
  deleteNode: (id: string) => void
  selectNode: (id: string | null) => void

  // Viewport operations
  setViewport: (viewport: StudioViewport) => void
  panViewport: (dx: number, dy: number) => void
  zoomViewport: (zoom: number) => void

  // Filter operations
  setFilterTags: (tags: string[]) => void
  toggleFilterTag: (tag: string) => void

  // Dirty state (for save indicator)
  markDirty: () => void
  markClean: () => void

  // Batch operations
  reset: () => void
}

const initialViewport: StudioViewport = { x: 0, y: 0, zoom: 1 }

export const useStudioStore = create<StudioState>((set) => ({
  nodes: [],
  selectedNodeId: null,
  viewport: initialViewport,
  filterTags: [],
  isDirty: false,

  setNodes: (nodes) => set({ nodes, isDirty: true }),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
      isDirty: true,
    })),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === id ? { ...node, ...updates } : node)),
      isDirty: true,
    })),

  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      isDirty: true,
    })),

  selectNode: (id) => set({ selectedNodeId: id }),

  setViewport: (viewport) => set({ viewport }),

  panViewport: (dx, dy) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        x: state.viewport.x + dx,
        y: state.viewport.y + dy,
      },
    })),

  zoomViewport: (zoom) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        zoom: Math.max(0.1, Math.min(3, zoom)),
      },
    })),

  setFilterTags: (tags) => set({ filterTags: tags }),

  toggleFilterTag: (tag) =>
    set((state) => ({
      filterTags: state.filterTags.includes(tag)
        ? state.filterTags.filter((t) => t !== tag)
        : [...state.filterTags, tag],
    })),

  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),

  reset: () =>
    set({
      nodes: [],
      selectedNodeId: null,
      viewport: initialViewport,
      filterTags: [],
      isDirty: false,
    }),
}))
