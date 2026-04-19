import { create } from 'zustand'
import type { SceneObject, CameraState, SceneStats } from '@/types'

interface SceneState {
  // Scene objects
  objects: SceneObject[]
  selectedObjectId: string | null
  addObject: (object: SceneObject) => void
  removeObject: (id: string) => void
  deleteObject: (id: string) => void
  duplicateObject: (id: string) => void
  updateObject: (id: string, updates: Partial<SceneObject>) => void
  selectObject: (id: string | null) => void

  // Camera
  camera: CameraState
  updateCamera: (updates: Partial<CameraState>) => void
  cameraPosition: [number, number, number]
  setCameraPosition: (pos: [number, number, number]) => void

  // Grid
  showGrid: boolean
  toggleGrid: () => void

  // Wireframe
  showWireframe: boolean
  toggleWireframe: () => void

  // Stats
  stats: SceneStats
  updateStats: (stats: Partial<SceneStats>) => void

  // Animation
  isAnimating: boolean
  setIsAnimating: (isAnimating: boolean) => void
  animationSpeed: number
  setAnimationSpeed: (speed: number) => void

  // HUD
  showHUD: boolean
  toggleHUD: () => void

  // Lights
  ambientIntensity: number
  setAmbientIntensity: (intensity: number) => void

  // Export/Import
  exportAsJSON: () => string
  importFromJSON: (json: string) => void
}

export const useSceneStore = create<SceneState>((set, get) => ({
  // Scene objects
  objects: [
    {
      id: 'default-mesh',
      type: 'mesh',
      name: 'Wireframe Sphere',
      visible: true,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  ],
  selectedObjectId: null,
  addObject: (object) =>
    set((state) => ({ objects: [...state.objects, object] })),
  removeObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
    })),
  deleteObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
    })),
  duplicateObject: (id) =>
    set((state) => {
      const objToDuplicate = state.objects.find((obj) => obj.id === id)
      if (!objToDuplicate) return { objects: state.objects }
      const newObj = {
        ...objToDuplicate,
        id: 'obj-' + Math.random().toString(36).slice(2, 9),
        name: objToDuplicate.name + ' (Copy)',
      }
      return { objects: [...state.objects, newObj] }
    }),
  updateObject: (id, updates) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      ),
    })),
  selectObject: (id) => set({ selectedObjectId: id }),

  // Camera
  camera: {
    position: [5, 5, 5],
    target: [0, 0, 0],
    fov: 75,
    zoom: 1,
  },
  updateCamera: (updates) =>
    set((state) => ({
      camera: { ...state.camera, ...updates },
    })),
  cameraPosition: [5, 5, 5],
  setCameraPosition: (pos) => set({ cameraPosition: pos }),

  // Grid
  showGrid: true,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  // Wireframe
  showWireframe: true,
  toggleWireframe: () =>
    set((state) => ({ showWireframe: !state.showWireframe })),

  // Stats
  stats: {
    fps: 60,
    triangles: 0,
    drawCalls: 0,
    memory: 0,
  },
  updateStats: (stats) =>
    set((state) => ({
      stats: { ...state.stats, ...stats },
    })),

  // Animation
  isAnimating: true,
  setIsAnimating: (isAnimating) => set({ isAnimating }),
  animationSpeed: 1,
  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),

  // HUD
  showHUD: true,
  toggleHUD: () => set((state) => ({ showHUD: !state.showHUD })),

  // Lights
  ambientIntensity: 0.5,
  setAmbientIntensity: (intensity) => set({ ambientIntensity: intensity }),

  // Export/Import
  exportAsJSON: (): string => {
    const state = get()
    return JSON.stringify(
      {
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        objects: state.objects,
        camera: state.camera,
        settings: {
          ambientIntensity: state.ambientIntensity,
          showGrid: state.showGrid,
          showWireframe: state.showWireframe,
        },
      },
      null,
      2
    )
  },

  importFromJSON: (json) => {
    try {
      const data = JSON.parse(json)
      if (data.objects && Array.isArray(data.objects)) {
        set({
          objects: data.objects,
          camera: data.camera || { position: [5, 5, 5], target: [0, 0, 0], fov: 75, zoom: 1 },
          ambientIntensity: data.settings?.ambientIntensity || 0.5,
          showGrid: data.settings?.showGrid !== false,
          showWireframe: data.settings?.showWireframe !== false,
        })
      }
    } catch (error) {
      console.error('Failed to import scene:', error)
    }
  },
}))
