// Core Types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

// UI Types
export interface Modal {
  id: string
  isOpen: boolean
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message?: string
  description?: string
  duration?: number
}

// 3D Scene Types
export interface SceneObject {
  id: string
  type: 'mesh' | 'light' | 'camera' | 'group' | 'box' | 'sphere' | 'torus' | 'cylinder' | 'cone'
  name: string
  visible: boolean
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color?: string
}

export interface CameraState {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  zoom: number
}

export interface SceneStats {
  fps: number
  triangles: number
  drawCalls: number
  memory: number
}

// AI Types
export interface Command {
  id: string
  label: string
  description?: string
  keywords?: string[]
  category: 'navigation' | 'action' | 'edit' | 'view' | 'help'
  icon?: string
  action: () => void
  shortcut?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

// Shop Types
export interface Product {
  id: string
  name: string
  description: string
  price: number
  currency: string
  image: string
  category: 'filament' | 'printer' | 'part' | 'accessory' | 'service'
  stock: number
  featured?: boolean
  tags?: string[]
  specifications?: Record<string, string>
}

export interface CartItem {
  productId: string
  quantity: number
  price: number
}

export interface Cart {
  items: CartItem[]
  total: number
  currency: string
}

// Layout Types
export type SidebarState = 'expanded' | 'collapsed'

export interface Navigation {
  label: string
  icon: string
  path: string
  badge?: string | number
  children?: Navigation[]
}

// Animation Types
export interface AnimationVariant {
  initial?: Record<string, unknown>
  animate?: Record<string, unknown>
  exit?: Record<string, unknown>
  transition?: Record<string, unknown>
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

export type Nullable<T> = T | null

export type Optional<T> = T | undefined
