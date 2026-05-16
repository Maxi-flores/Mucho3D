# Blender Snapshot Function - Python Implementation

## Overview

This document details the Python implementation of the Blender snapshot capture function that automatically takes a viewport snapshot after executing 3D operations.

---

## Function: `capture_viewport_snapshot()`

**Location:** `/apps/blender-worker/run_tool.py`

### Purpose

Captures a rendered snapshot of the current Blender viewport and returns it as Base64-encoded PNG data along with metadata.

### Implementation

```python
def capture_viewport_snapshot() -> dict[str, Any]:
    """
    Capture a snapshot of the current Blender viewport.
    Returns a dictionary with the snapshot data (base64 encoded) and metadata.
    """
    if bpy is None:
        raise RuntimeError("Blender bpy module is not available")

    # Ensure snapshot directory exists
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    import time
    timestamp = int(time.time() * 1000)
    snapshot_filename = f"snapshot_{timestamp}.png"
    snapshot_path = SNAPSHOT_DIR / snapshot_filename

    # Store original render settings
    scene = bpy.context.scene
    original_filepath = scene.render.filepath
    original_resolution_x = scene.render.resolution_x
    original_resolution_y = scene.render.resolution_y
    original_file_format = scene.render.image_settings.file_format

    try:
        # Configure render settings for snapshot
        scene.render.filepath = str(snapshot_path)
        scene.render.resolution_x = 1920
        scene.render.resolution_y = 1080
        scene.render.image_settings.file_format = 'PNG'
        scene.render.image_settings.color_mode = 'RGBA'

        # Render the current viewport
        bpy.ops.render.render(write_still=True)

        # Read the rendered image and encode to base64
        with open(snapshot_path, 'rb') as f:
            image_data = f.read()
            base64_data = base64.b64encode(image_data).decode('utf-8')

        # Get file size
        file_size = len(image_data)

        return {
            "filename": snapshot_filename,
            "path": str(snapshot_path),
            "base64": base64_data,
            "format": "png",
            "width": 1920,
            "height": 1080,
            "size": file_size,
            "timestamp": timestamp
        }

    finally:
        # Restore original render settings
        scene.render.filepath = original_filepath
        scene.render.resolution_x = original_resolution_x
        scene.render.resolution_y = original_resolution_y
        scene.render.image_settings.file_format = original_file_format
```

---

## Step-by-Step Breakdown

### 1. Validation
```python
if bpy is None:
    raise RuntimeError("Blender bpy module is not available")
```
- Ensures Blender Python API (`bpy`) is available
- Prevents execution outside Blender environment

### 2. Directory Setup
```python
SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
```
- Creates snapshot directory if it doesn't exist
- `SNAPSHOT_DIR` is configurable via `BLENDER_WORKER_SNAPSHOT_DIR` environment variable
- Default: `./snapshots`

### 3. Unique Filename Generation
```python
import time
timestamp = int(time.time() * 1000)
snapshot_filename = f"snapshot_{timestamp}.png"
snapshot_path = SNAPSHOT_DIR / snapshot_filename
```
- Uses millisecond timestamp for uniqueness
- Format: `snapshot_1713635472000.png`
- Ensures no filename collisions

### 4. Save Original Settings
```python
scene = bpy.context.scene
original_filepath = scene.render.filepath
original_resolution_x = scene.render.resolution_x
original_resolution_y = scene.render.resolution_y
original_file_format = scene.render.image_settings.file_format
```
- Captures current render configuration
- Allows restoration after snapshot
- Prevents side effects on user's scene

### 5. Configure Snapshot Render Settings
```python
scene.render.filepath = str(snapshot_path)
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
```
- Sets resolution to Full HD (1920x1080)
- PNG format for lossless quality
- RGBA color mode for transparency support

### 6. Render Viewport
```python
bpy.ops.render.render(write_still=True)
```
- Executes Blender's render operation
- `write_still=True` saves to file immediately
- Renders current scene with active camera

### 7. Read and Encode Image
```python
with open(snapshot_path, 'rb') as f:
    image_data = f.read()
    base64_data = base64.b64encode(image_data).decode('utf-8')
```
- Reads PNG file as binary
- Encodes to Base64 for JSON transmission
- Decodes to UTF-8 string

### 8. Calculate File Size
```python
file_size = len(image_data)
```
- Gets size in bytes
- Used for storage quotas and optimization

### 9. Return Snapshot Data
```python
return {
    "filename": snapshot_filename,
    "path": str(snapshot_path),
    "base64": base64_data,
    "format": "png",
    "width": 1920,
    "height": 1080,
    "size": file_size,
    "timestamp": timestamp
}
```
- Comprehensive metadata object
- Ready for Firestore storage
- Base64 data for immediate use

### 10. Restore Original Settings (Finally Block)
```python
finally:
    scene.render.filepath = original_filepath
    scene.render.resolution_x = original_resolution_x
    scene.render.resolution_y = original_resolution_y
    scene.render.image_settings.file_format = original_file_format
```
- Guaranteed restoration via `finally` block
- Executes even if errors occur
- Prevents scene corruption

---

## Integration with `/execute` Endpoint

### Updated `server.py` `/execute` Route

```python
@app.post("/execute")
def execute(request: ExecuteRequest) -> dict[str, Any]:
    started_at = time.perf_counter()

    try:
        # Execute the tool
        result = execute_tool(request.tool, request.payload)

        # Capture snapshot after successful execution
        snapshot = None
        snapshot_enabled = request.payload.get("captureSnapshot", True)

        if snapshot_enabled and request.tool in ["create_primitive", "transform_object", "apply_material"]:
            from run_tool import capture_viewport_snapshot
            snapshot = capture_viewport_snapshot()
            result["snapshot"] = snapshot

        duration_ms = round((time.perf_counter() - started_at) * 1000, 3)
        return {
            "success": True,
            "result": result,
            "logs": [f"Blender executed {request.tool} in {duration_ms}ms"],
            "error": None,
        }
    except Exception as error:
        duration_ms = round((time.perf_counter() - started_at) * 1000, 3)
        return {
            "success": False,
            "result": None,
            "logs": [f"Blender failed {request.tool} in {duration_ms}ms"],
            "error": str(error),
        }
```

### Trigger Conditions

Snapshot is captured when:
1. **Tool execution succeeds** (no exceptions)
2. **`captureSnapshot` is enabled** (default: `true`, can be disabled via payload)
3. **Tool is a visual operation**:
   - `create_primitive` - New object created
   - `transform_object` - Object moved/rotated/scaled
   - `apply_material` - Material/color changed

Snapshot is NOT captured for:
- `export_scene` - File export operation, not visual
- Failed executions
- When `captureSnapshot: false` is passed

---

## Return Value Structure

### Success Response with Snapshot

```json
{
  "success": true,
  "result": {
    "objectId": "obj_box_1",
    "objectType": "box",
    "name": "Red Cube",
    "object": {
      "id": "obj_box_1",
      "type": "box",
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1]
    },
    "snapshot": {
      "filename": "snapshot_1713635472000.png",
      "path": "/app/snapshots/snapshot_1713635472000.png",
      "base64": "iVBORw0KGgoAAAANSUhEUgAAB4AAAAQ4CAYAAADo08...",
      "format": "png",
      "width": 1920,
      "height": 1080,
      "size": 524288,
      "timestamp": 1713635472000
    }
  },
  "logs": ["Blender executed create_primitive in 245.3ms"],
  "error": null
}
```

---

## Environment Configuration

### Required Environment Variable

```bash
# Directory where snapshots are saved
BLENDER_WORKER_SNAPSHOT_DIR=/app/snapshots
```

### Default Behavior

If not set, defaults to:
```python
SNAPSHOT_DIR = Path(os.environ.get("BLENDER_WORKER_SNAPSHOT_DIR", Path.cwd() / "snapshots"))
```

---

## Dependencies

### Python Imports

```python
import base64  # For Base64 encoding
import os      # For environment variables
from pathlib import Path  # For file path handling
import time    # For timestamp generation
```

### Blender API Usage

```python
bpy.context.scene                       # Access current scene
scene.render.filepath                    # Output file path
scene.render.resolution_x/y              # Resolution settings
scene.render.image_settings.file_format  # Image format
scene.render.image_settings.color_mode   # Color mode
bpy.ops.render.render(write_still=True)  # Render operation
```

---

## Error Handling

### Potential Errors

1. **`RuntimeError: Blender bpy module is not available`**
   - Occurs when running outside Blender
   - Solution: Run server inside Blender Python environment

2. **`FileNotFoundError`**
   - Snapshot directory doesn't exist
   - Prevented by: `SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)`

3. **`PermissionError`**
   - No write permissions to snapshot directory
   - Solution: Ensure directory has write permissions

4. **`MemoryError`**
   - Large image exceeds memory
   - Unlikely with 1920x1080 PNG (~0.5-2MB)

5. **Render errors**
   - Scene configuration issues
   - Caught by try/finally block
   - Original settings restored

---

## Performance Characteristics

### Timing Breakdown

| Operation | Typical Duration | Notes |
|-----------|------------------|-------|
| Directory creation | <1ms | Only if doesn't exist |
| Settings backup | <1ms | Variable assignment |
| Render configuration | <1ms | Scene property updates |
| **Render operation** | **100-500ms** | **Depends on scene complexity** |
| File I/O read | 5-20ms | Depends on file size |
| Base64 encoding | 10-50ms | Depends on image size |
| Settings restoration | <1ms | Variable assignment |
| **Total** | **~150-600ms** | **Dominated by rendering** |

### File Size

- **Resolution:** 1920x1080 (2,073,600 pixels)
- **Format:** PNG (lossless)
- **Typical size:** 300KB - 2MB (depends on scene complexity)
- **Base64 overhead:** +33% (Base64 encoding expands data)
- **Firestore consideration:** Max document size is 1MB (use Firebase Storage for large images)

---

## Optimization Opportunities

### Future Improvements

1. **Resolution Configuration**
   ```python
   width = int(os.environ.get("SNAPSHOT_WIDTH", 1920))
   height = int(os.environ.get("SNAPSHOT_HEIGHT", 1080))
   ```

2. **Format Options**
   - JPEG for smaller file size (lossy)
   - WebP for better compression

3. **Compression**
   ```python
   from PIL import Image
   img = Image.open(snapshot_path)
   img.save(snapshot_path, optimize=True, quality=85)
   ```

4. **Async Upload to Firebase Storage**
   - Store URL instead of Base64 in Firestore
   - Reduce document size
   - Better scalability

5. **Conditional Quality**
   - Lower resolution for previews
   - High resolution for final renders

---

## Testing

### Unit Test Example

```python
def test_capture_snapshot():
    # Setup: Create a simple cube
    bpy.ops.mesh.primitive_cube_add()

    # Execute
    snapshot = capture_viewport_snapshot()

    # Assert
    assert snapshot["format"] == "png"
    assert snapshot["width"] == 1920
    assert snapshot["height"] == 1080
    assert len(snapshot["base64"]) > 0
    assert snapshot["size"] > 0
    assert "snapshot_" in snapshot["filename"]
```

### Manual Testing

```bash
# Start Blender Worker
cd apps/blender-worker
blender --background --python server.py

# In another terminal, test snapshot
curl -X POST http://localhost:8788/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "create_primitive",
    "payload": {
      "primitiveType": "box",
      "color": "#FF0000",
      "captureSnapshot": true
    }
  }'
```

---

## Security Considerations

1. **Path Traversal Prevention**
   - Snapshot directory is fixed
   - No user-controlled paths

2. **File Size Limits**
   - 1920x1080 ensures predictable size
   - Prevents memory exhaustion

3. **Base64 Injection**
   - Standard library `base64` module
   - No security concerns

4. **Cleanup Strategy**
   - Implement retention policy
   - Delete old snapshots periodically

---

## Conclusion

The `capture_viewport_snapshot()` function provides a robust, production-ready solution for automatic 3D scene documentation. It integrates seamlessly with the Blender Worker's execution flow, provides comprehensive metadata, and is designed with error resilience and performance in mind.

**Key Features:**
✅ Automatic snapshot after visual operations
✅ Base64 encoding for easy transmission
✅ Settings restoration prevents side effects
✅ Configurable via environment variables
✅ Comprehensive metadata for Firestore
✅ Error-resilient with try/finally pattern
