/**
 * Application-wide constants for Mucho3D V2
 */

// Design System
export const COLORS = {
  background: '#050505',
  primary: '#00A3FF',
  slate: {
    800: '#1E293B',
    850: '#162033',
    900: '#0F172A',
  },
} as const

// Layout
export const SIDEBAR_WIDTH = {
  expanded: 240,
  collapsed: 64,
} as const

export const TOPBAR_HEIGHT = 64 as const

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// Animation
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const

export const TRANSITION_SPRING = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
} as const

// 3D Scene
export const SCENE_CONFIG = {
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: [5, 5, 5] as [number, number, number],
  },
  grid: {
    size: 20,
    divisions: 20,
    color: '#00A3FF',
    fadeDistance: 50,
  },
  controls: {
    enableDamping: true,
    dampingFactor: 0.05,
    minDistance: 2,
    maxDistance: 50,
    maxPolarAngle: Math.PI / 1.5,
  },
} as const

// Commands
export const KEYBOARD_SHORTCUTS = {
  commandPalette: ['Meta+k', 'Control+k'],
  search: ['Meta+/', 'Control+/'],
  toggleSidebar: ['Meta+b', 'Control+b'],
  escape: ['Escape'],
} as const

// API
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
} as const

// Features
export const FEATURES = {
  aiChat: import.meta.env.VITE_ENABLE_AI_CHAT === 'true',
  studio3D: import.meta.env.VITE_ENABLE_3D_STUDIO === 'true',
} as const

// Navigation
export const NAVIGATION = [
  {
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/dashboard',
  },
  {
    label: 'Studio',
    icon: 'Box',
    path: '/studio',
  },
  {
    label: 'Settings',
    icon: 'Settings',
    path: '/settings',
  },
] as const

// Product Categories
export const PRODUCT_CATEGORIES = [
  'all',
  'filament',
  'printer',
  'part',
  'accessory',
  'service',
] as const

// Mock Products (for demo)
export const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'PLA+ Premium Filament',
    description: 'High-quality PLA+ filament with enhanced strength and durability',
    price: 24.99,
    currency: 'USD',
    image: '/assets/products/filament-1.jpg',
    category: 'filament' as const,
    stock: 150,
    featured: true,
    tags: ['PLA', 'Premium', 'Eco-friendly'],
    specifications: { color: 'Multi', weight: '1kg', temperature: '200°C' },
  },
  {
    id: '2',
    name: 'Mucho3D Pro Printer',
    description: 'Professional-grade 3D printer with auto-leveling and WiFi',
    price: 799.99,
    currency: 'USD',
    image: '/assets/products/printer-1.jpg',
    category: 'printer' as const,
    stock: 25,
    featured: true,
    tags: ['Professional', 'Auto-leveling', 'WiFi'],
    specifications: { buildSize: '220x220x250mm', resolution: '0.1mm', speed: '200mm/s' },
  },
  {
    id: '3',
    name: 'Build Plate Kit',
    description: 'Magnetic build plate with PEI surface',
    price: 39.99,
    currency: 'USD',
    image: '/assets/products/plate-1.jpg',
    category: 'part' as const,
    stock: 80,
    tags: ['Magnetic', 'PEI', 'Easy-removal'],
    specifications: { material: 'PEI', thickness: '2mm', magnetic: 'Yes' },
  },
  {
    id: '4',
    name: 'PETG Engineering Filament',
    description: 'Strong PETG filament for functional parts',
    price: 32.99,
    currency: 'USD',
    image: '/assets/products/filament-2.jpg',
    category: 'filament' as const,
    stock: 120,
    featured: true,
    tags: ['PETG', 'Strong', 'Engineering'],
    specifications: { color: 'Black', weight: '1kg', temperature: '240°C' },
  },
  {
    id: '5',
    name: 'Nozzle Set (10pcs)',
    description: 'Premium brass nozzles in multiple sizes',
    price: 19.99,
    currency: 'USD',
    image: '/assets/products/nozzle-1.jpg',
    category: 'part' as const,
    stock: 200,
    tags: ['Nozzles', 'Brass', 'Set'],
    specifications: { sizes: '0.4-1.0mm', material: 'Brass', quantity: '10' },
  },
  {
    id: '6',
    name: 'Design Consultation Service',
    description: 'Professional design optimization for 3D printing',
    price: 149.99,
    currency: 'USD',
    image: '/assets/products/service-1.jpg',
    category: 'service' as const,
    stock: 999,
    tags: ['Service', 'Consultation', 'Design'],
    specifications: { duration: '1 hour', format: 'Video Call', support: 'Follow-up' },
  },
  {
    id: '7',
    name: 'TPU Flexible Filament',
    description: 'Flexible TPU filament for soft parts',
    price: 42.99,
    currency: 'USD',
    image: '/assets/products/filament-3.jpg',
    category: 'filament' as const,
    stock: 45,
    tags: ['TPU', 'Flexible', 'Rubber-like'],
    specifications: { color: 'Clear', weight: '1kg', flexibility: 'High' },
  },
  {
    id: '8',
    name: 'Print Bed Cleaner',
    description: 'Specialized cleaning solution for build plates',
    price: 12.99,
    currency: 'USD',
    image: '/assets/products/cleaner-1.jpg',
    category: 'accessory' as const,
    stock: 300,
    tags: ['Cleaning', 'Maintenance', 'Accessory'],
    specifications: { volume: '500ml', safe: 'All Surfaces', eco: 'Biodegradable' },
  },
  {
    id: '9',
    name: 'Advanced 3D Studio Pro',
    description: 'Premium software suite for 3D design and slicing',
    price: 299.99,
    currency: 'USD',
    image: '/assets/products/software-1.jpg',
    category: 'service' as const,
    stock: 999,
    featured: true,
    tags: ['Software', 'Professional', 'Lifetime'],
    specifications: { license: 'Lifetime', updates: 'Free', support: '24/7' },
  },
] as const

// Sample Commands
export const SAMPLE_COMMANDS = [
  {
    id: 'new-project',
    label: 'New Project',
    description: 'Create a new 3D printing project',
    category: 'action' as const,
    keywords: ['new', 'create', 'project'],
  },
  {
    id: 'import-model',
    label: 'Import 3D Model',
    description: 'Import STL, OBJ, or GLTF file',
    category: 'action' as const,
    keywords: ['import', 'upload', 'model', 'stl', 'obj'],
  },
  {
    id: 'toggle-grid',
    label: 'Toggle Grid',
    description: 'Show/hide engineering grid',
    category: 'view' as const,
    keywords: ['grid', 'toggle', 'view'],
  },
  {
    id: 'save-project',
    label: 'Save Project',
    description: 'Save current project to storage',
    category: 'action' as const,
    keywords: ['save', 'export', 'download'],
  },
  {
    id: 'go-to-studio',
    label: 'Go to Studio',
    description: 'Navigate to the 3D studio',
    category: 'navigation' as const,
    keywords: ['studio', '3d', 'navigate'],
  },
  {
    id: 'help',
    label: 'Show Help',
    description: 'Display help and documentation',
    category: 'help' as const,
    keywords: ['help', 'docs', 'documentation'],
  },
  {
    id: 'zoom-in',
    label: 'Zoom In',
    description: 'Zoom into the 3D scene',
    category: 'view' as const,
    keywords: ['zoom', 'in', 'magnify'],
  },
  {
    id: 'zoom-out',
    label: 'Zoom Out',
    description: 'Zoom out from the 3D scene',
    category: 'view' as const,
    keywords: ['zoom', 'out', 'shrink'],
  },
  {
    id: 'reset-view',
    label: 'Reset View',
    description: 'Reset the 3D camera to default position',
    category: 'view' as const,
    keywords: ['reset', 'view', 'camera'],
  },
] as const
