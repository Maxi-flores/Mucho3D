# R3F Hook Context Error - Fix Summary

## Problem
React Three Fiber hooks can only be used within the `<Canvas>` component context. The original code violated this by using `useThree()` in **FloatingHUD.tsx**, which was rendered outside the Canvas.

### Error Message
```
R3F: Hooks can only be used within the Canvas component
```

### Root Cause
```jsx
// BEFORE (Incorrect)
<Scene3D>
  <Lights />
  <WireframeMesh />
  <CameraController />
</Scene3D>
{showHUD && <FloatingHUD />}  // ❌ Uses useThree() OUTSIDE Canvas
```

---

## Solution

Used **Architecture Pattern A**: Separated R3F hook logic from UI rendering by creating a dedicated `CameraTracker` component that runs inside Canvas and feeds data to Zustand, which FloatingHUD then reads.

### Benefits
✅ Proper R3F architecture  
✅ Clean separation of concerns  
✅ FloatingHUD is pure UI (no R3F hooks)  
✅ Camera tracking is efficient (only runs in Canvas context)  
✅ Easy to extend with more tracking data  

---

## Changes Made

### 1. Created `CameraTracker.tsx`
**File:** `src/components/3d/CameraTracker.tsx`

```typescript
import { useFrame, useThree } from '@react-three/fiber'
import { useSceneStore } from '@/store'

export function CameraTracker() {
  const { camera } = useThree()
  const setCameraPosition = useSceneStore((state) => state.setCameraPosition)

  useFrame(() => {
    // Update store with current camera position every frame
    setCameraPosition([
      parseFloat(camera.position.x.toFixed(2)),
      parseFloat(camera.position.y.toFixed(2)),
      parseFloat(camera.position.z.toFixed(2)),
    ])
  })

  return null // Invisible component
}
```

**Purpose:**
- Lives INSIDE `<Canvas>` where R3F hooks are allowed
- Uses `useThree()` to access camera object
- Uses `useFrame()` to update on every render
- Pushes camera data to Zustand store

**Key Point:** This component renders `null` - it's purely for side effects, not UI.

---

### 2. Refactored `FloatingHUD.tsx`
**File:** `src/components/3d/FloatingHUD.tsx`

**Removed:**
- `import { useThree } from '@react-three/fiber'` ❌
- `const { camera } = useThree()` ❌
- `useState` for camera position ❌

**Added:**
- `const cameraPosition = useSceneStore((state) => state.cameraPosition)`
- Updated display to use `cameraPosition[0]`, `cameraPosition[1]`, etc.

**Before:**
```typescript
const { camera } = useThree()  // ❌ R3F hook - not allowed
const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 0 })

useEffect(() => {
  const interval = setInterval(() => {
    setCameraPosition({
      x: parseFloat(camera.position.x.toFixed(2)),
      // ...
    })
  }, 100)
}, [camera])
```

**After:**
```typescript
const cameraPosition = useSceneStore((state) => state.cameraPosition)
// No R3F hooks - pure UI component!
```

---

### 3. Updated `sceneStore`
**File:** `src/store/sceneStore.ts`

**Added to interface:**
```typescript
interface SceneState {
  // ... existing code ...
  
  // Camera position tracking
  cameraPosition: [number, number, number]
  setCameraPosition: (pos: [number, number, number]) => void
}
```

**Added to implementation:**
```typescript
cameraPosition: [5, 5, 5],
setCameraPosition: (pos) => set({ cameraPosition: pos }),
```

---

### 4. Updated `src/components/3d/index.ts`
**Added export:**
```typescript
export { CameraTracker } from './CameraTracker'
```

---

### 5. Updated `Studio.tsx`
**File:** `src/pages/Studio.tsx`

**Changed import:**
```typescript
// Added CameraTracker to imports
import { Scene3D, EngineeringGrid, WireframeMesh, CameraController, Lights, FloatingHUD, CameraTracker } from '@/components/3d'
```

**Changed component structure:**
```jsx
// BEFORE (Incorrect)
<Scene3D>
  <Lights />
  {showGrid && <EngineeringGrid />}
  <WireframeMesh type="torus" />
  <CameraController />
</Scene3D>
{showHUD && <FloatingHUD />}  // ❌ Outside Canvas

// AFTER (Correct)
<Scene3D>
  <Lights />
  {showGrid && <EngineeringGrid />}
  <WireframeMesh type="torus" />
  <CameraController />
  <CameraTracker />  // ✅ Inside Canvas - uses R3F hooks
</Scene3D>
{showHUD && <FloatingHUD />}  // ✅ Still outside, but no R3F hooks
```

---

## Architecture Diagram

### Before (Broken)
```
App
└── DashboardLayout
    └── Studio
        ├── Scene3D (Canvas)
        │   ├── Lights
        │   ├── Grid
        │   ├── Mesh
        │   └── CameraController
        │
        └── FloatingHUD ❌ OUTSIDE Canvas but uses useThree()
```

### After (Fixed)
```
App
└── DashboardLayout
    └── Studio
        ├── Scene3D (Canvas)
        │   ├── Lights
        │   ├── Grid
        │   ├── Mesh
        │   ├── CameraController
        │   └── CameraTracker ✅ INSIDE Canvas - uses useThree() + useFrame()
        │       └── Updates Zustand with camera data
        │
        └── FloatingHUD ✅ OUTSIDE Canvas, reads from Zustand
            └── No R3F hooks - pure UI
```

---

## Data Flow

```
1. CameraTracker (inside Canvas)
   ├── useThree() → Gets camera object
   ├── useFrame() → Runs every render
   └── setCameraPosition() → Updates Zustand

2. Zustand Store (sceneStore)
   └── Stores: cameraPosition: [x, y, z]

3. FloatingHUD (outside Canvas)
   ├── Reads: cameraPosition from Zustand
   ├── Reads: showHUD from Zustand
   ├── Reads: stats from Zustand
   └── Renders: UI with current values
```

---

## Testing Checklist

✅ App starts without R3F hook context errors  
✅ FloatingHUD displays correctly  
✅ Camera position updates in real-time  
✅ FPS counter works  
✅ Scene stats display  
✅ HUD can be toggled on/off  
✅ 3D rendering still smooth  
✅ Camera controls responsive  

---

## Key Principles Applied

### ✅ Correct R3F Usage
- R3F hooks (`useThree`, `useFrame`, etc.) are **only** used inside `<Canvas>`
- CameraTracker component satisfies this requirement

### ✅ Separation of Concerns
- **CameraTracker:** Data collection (R3F-specific)
- **FloatingHUD:** UI rendering (React-only)

### ✅ State Management
- Camera data flows through Zustand, not React state
- Allows FloatingHUD to exist anywhere in the component tree

### ✅ Performance
- CameraTracker uses `useFrame()` (efficient animation loop)
- No polling intervals or setTimeout hacks
- Direct R3F render loop integration

---

## Files Modified

| File | Change | Type |
|------|--------|------|
| `src/components/3d/CameraTracker.tsx` | Created | New |
| `src/components/3d/FloatingHUD.tsx` | Refactored | Updated |
| `src/components/3d/index.ts` | Added export | Updated |
| `src/store/sceneStore.ts` | Added camera position | Updated |
| `src/pages/Studio.tsx` | Added CameraTracker inside Canvas | Updated |

---

## Validation

All R3F hooks are now properly scoped:

```bash
# Verify only CameraTracker and WireframeMesh use R3F hooks
grep -r "useThree\|useFrame\|useLoader" src/components/3d

# Should return:
# src/components/3d/CameraTracker.tsx  ✓ (inside Canvas)
# src/components/3d/WireframeMesh.tsx  ✓ (inside Canvas)
```

---

## References

### R3F Documentation
- [Hooks only work inside Canvas](https://docs.pmndrs.org/react-three-fiber/guide/api)
- [useThree hook](https://docs.pmndrs.org/react-three-fiber/api/hooks#usethree)
- [useFrame hook](https://docs.pmndrs.org/react-three-fiber/api/hooks#useframe)

### Related Concepts
- Canvas Provider context requirement
- React Context rules for hooks
- Zustand state management pattern

---

## Conclusion

The R3F hook context error has been **completely resolved** by:
1. Creating a dedicated `CameraTracker` component inside Canvas
2. Refactoring `FloatingHUD` to be pure UI without R3F hooks
3. Using Zustand as the communication bridge

The app now follows correct React Three Fiber architecture patterns and is ready for production. ✅

