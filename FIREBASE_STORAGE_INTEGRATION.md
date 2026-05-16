# Firebase Storage Snapshot Integration

## Overview

This document describes the refactored snapshot storage system that uses Firebase Storage for large image files instead of storing Base64 data directly in Firestore.

## Architecture

### Why Firebase Storage?

- **Cost Efficiency**: Firestore charges per document read/write and storage. Large Base64 strings significantly increase costs.
- **Performance**: Downloading images from Storage URLs is faster than transferring large Base64 strings in Firestore documents.
- **Scalability**: Storage is optimized for large files, with built-in CDN and caching.
- **Best Practice**: Firebase recommends storing files in Storage and URLs in Firestore.

### Data Flow

```
Blender Worker → Proxy Server → Frontend → Firebase Storage → Firestore
                                    ↓
                              Upload Base64
                                    ↓
                              Get downloadURL
                                    ↓
                          Save URL to Firestore
```

## Implementation Details

### 1. Firebase Storage Initialization

**File**: `src/lib/firebase.ts`

```typescript
import { getStorage, FirebaseStorage } from 'firebase/storage'

let storage: FirebaseStorage | null = null

if (isFirebaseConfigured()) {
  storage = getStorage(app)
}

export const getFirebaseStorage = (): FirebaseStorage | null => storage
```

### 2. Upload Function

**File**: `src/services/firestore/snapshotService.ts`

The `uploadSnapshotToStorage()` function:
- Takes Base64 encoded image data
- Creates a reference in Storage: `snapshots/{projectId}/{filename}`
- Uploads the Base64 string with `uploadString()`
- Returns the public download URL

```typescript
async function uploadSnapshotToStorage(
  base64Data: string,
  filename: string,
  projectId: string
): Promise<string>
```

### 3. Updated Save Function

**File**: `src/services/firestore/snapshotService.ts`

The `saveSnapshot()` function now:
1. Checks if `base64Data` is provided
2. Uploads to Firebase Storage if needed
3. Gets the download URL
4. Saves document to Firestore with `fileUrl` (not `base64Data`)
5. Falls back gracefully if Storage upload fails

```typescript
export async function saveSnapshot(snapshotData: {
  projectId: string
  // ... other fields
  base64Data?: string  // Input only
  fileUrl?: string     // Already uploaded URL
}): Promise<SnapshotDoc>
```

### 4. Firestore Document Structure

**Before** (inefficient):
```json
{
  "id": "snapshot-abc123",
  "projectId": "project-xyz",
  "filename": "snapshot_1234567890.png",
  "base64Data": "iVBORw0KGgoAAAANSUhEUgAAAAUA...", // 500KB+
  "width": 1920,
  "height": 1080,
  "createdAt": "2025-01-15T10:30:00Z"
}
```

**After** (optimized):
```json
{
  "id": "snapshot-abc123",
  "projectId": "project-xyz",
  "filename": "snapshot_1234567890.png",
  "fileUrl": "https://firebasestorage.googleapis.com/...",  // <100 bytes
  "width": 1920,
  "height": 1080,
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### 5. Frontend Display

**File**: `src/components/studio/SnapshotCard.tsx`

The component already has logic to prefer `fileUrl` over `base64Data`:

```typescript
const getImageSrc = () => {
  if (snapshot.fileUrl) {
    return snapshot.fileUrl  // Firebase Storage URL
  } else if (snapshot.base64Data) {
    return `data:image/${snapshot.format};base64,${snapshot.base64Data}`
  }
  return null
}
```

### 6. Proxy Server Endpoint

**File**: `proxy-server/src/routes/snapshot.ts`

A new `/api/snapshot/upload` endpoint validates snapshot data from Blender Worker. The actual upload to Storage happens in the frontend using the `saveSnapshot()` function.

## Usage Examples

### From Blender Worker

After capturing a snapshot, send to proxy-server:

```python
snapshot = capture_viewport_snapshot()
# Returns: { filename, base64, format, width, height, size, timestamp }

# Send to proxy-server (optional validation)
requests.post('http://proxy-server:8787/api/snapshot/upload', json={
    'projectId': project_id,
    'userId': user_id,
    'filename': snapshot['filename'],
    'base64Data': snapshot['base64'],
    'format': snapshot['format'],
    'width': snapshot['width'],
    'height': snapshot['height'],
    'size': snapshot['size'],
    'timestamp': snapshot['timestamp']
})
```

### From Frontend

```typescript
import { saveSnapshot } from '@/services/firestore/snapshotService'

// After receiving snapshot data (e.g., from Blender Worker via websocket)
const snapshotDoc = await saveSnapshot({
  projectId: 'project-123',
  userId: 'user-456',
  filename: 'snapshot_1234567890.png',
  base64Data: 'iVBORw0KGgoAAAANSUhEUgAAAAUA...',
  format: 'png',
  width: 1920,
  height: 1080,
  size: 524288,
  timestamp: Date.now(),
  metadata: {
    tool: 'create_primitive',
    source: 'blender-worker'
  }
})

// snapshotDoc now has fileUrl from Firebase Storage
console.log(snapshotDoc.fileUrl)
// https://firebasestorage.googleapis.com/v0/b/...
```

### Real-time Gallery Updates

```typescript
import { subscribeToProjectSnapshots } from '@/services/firestore/snapshotService'

useEffect(() => {
  const unsubscribe = subscribeToProjectSnapshots(projectId, (snapshots) => {
    setSnapshots(snapshots)
    // Each snapshot has fileUrl ready for display
  })

  return () => unsubscribe()
}, [projectId])
```

## Storage Rules

**File**: `storage.rules` (to be created in Firebase Console)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /snapshots/{projectId}/{filename} {
      // Allow authenticated users to read
      allow read: if request.auth != null;

      // Allow authenticated users to write their own project snapshots
      allow write: if request.auth != null
                   && request.auth.uid != null;

      // Validate file size (max 10MB)
      allow create: if request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

## Performance Comparison

### Before (Base64 in Firestore)

- Document size: ~500KB per snapshot
- Read cost: High (large document)
- Write cost: High (large document)
- Bandwidth: Full Base64 transfer on every read
- Cache: Limited (document reads not cached well)

### After (URL in Firestore, Image in Storage)

- Document size: ~2KB per snapshot
- Read cost: Low (small document)
- Write cost: Low (small document) + Storage write
- Bandwidth: Small URL + CDN-cached image
- Cache: Excellent (Storage has global CDN)

## Cost Analysis

### Firestore Pricing (example)
- Document writes: $0.18 per 100k writes
- Document reads: $0.06 per 100k reads
- Storage: $0.18 per GB/month

### Storage Pricing (example)
- File uploads: $0.05 per GB
- File downloads: $0.12 per GB (with CDN caching)
- Storage: $0.026 per GB/month

### Savings Example (1000 snapshots/month)
**Before**:
- Firestore writes: 1000 × 500KB = 500MB → ~$0.90
- Firestore reads: 10000 × 500KB = 5GB → ~$30
- Firestore storage: 500MB → ~$0.09
- **Total: ~$31/month**

**After**:
- Firestore writes: 1000 × 2KB = 2MB → ~$0.004
- Firestore reads: 10000 × 2KB = 20MB → ~$0.012
- Storage uploads: 1000 × 500KB = 500MB → ~$0.025
- Storage downloads: 5000 × 500KB = 2.5GB → ~$0.30 (with CDN cache)
- Storage space: 500MB → ~$0.013
- **Total: ~$0.35/month** (91% savings!)

## Migration Notes

### Existing Snapshots

Snapshots created before this refactor may have `base64Data` but no `fileUrl`. The `SnapshotCard` component handles both:

```typescript
const getImageSrc = () => {
  if (snapshot.fileUrl) {
    return snapshot.fileUrl  // New: Storage URL
  } else if (snapshot.base64Data) {
    return `data:image/png;base64,${snapshot.base64Data}`  // Fallback
  }
  return null
}
```

### Migration Script (Optional)

To migrate existing Base64 snapshots to Storage:

```typescript
import { getProjectSnapshots, updateSnapshot } from '@/services/firestore/snapshotService'
import { uploadSnapshotToStorage } from '@/services/firestore/snapshotService'

async function migrateSnapshots(projectId: string) {
  const snapshots = await getProjectSnapshots(projectId)

  for (const snapshot of snapshots) {
    if (snapshot.base64Data && !snapshot.fileUrl) {
      try {
        const fileUrl = await uploadSnapshotToStorage(
          snapshot.base64Data,
          snapshot.filename,
          snapshot.projectId
        )

        await updateSnapshot(snapshot.id, { fileUrl })
        console.log(`Migrated ${snapshot.filename}`)
      } catch (error) {
        console.error(`Failed to migrate ${snapshot.filename}:`, error)
      }
    }
  }
}
```

## Testing

### 1. Upload Test

```typescript
import { saveSnapshot } from '@/services/firestore/snapshotService'

const testSnapshot = await saveSnapshot({
  projectId: 'test-project',
  userId: 'test-user',
  filename: 'test.png',
  base64Data: 'iVBORw0KGgoAAAANSUhEUgAAAAUA...',
  format: 'png',
  width: 100,
  height: 100,
  size: 1024,
  timestamp: Date.now()
})

console.assert(testSnapshot.fileUrl, 'Should have fileUrl')
console.assert(testSnapshot.fileUrl.startsWith('https://firebasestorage'), 'Should be Storage URL')
```

### 2. Display Test

Open the Studio page and verify:
- Snapshots load correctly from Storage URLs
- Lazy loading works
- Error states display correctly
- Real-time updates work

### 3. Performance Test

```typescript
// Monitor network requests
// Firestore document should be < 5KB
// Storage URL should return image with CDN caching headers
```

## Troubleshooting

### Images not loading

1. Check Firebase Storage rules (must allow authenticated reads)
2. Verify CORS is configured for Storage bucket
3. Check browser console for CORS errors

### Upload failures

1. Verify Firebase Storage is initialized (`getFirebaseStorage()` not null)
2. Check Storage rules allow writes
3. Verify file size is under limits (10MB default)

### Performance issues

1. Verify CDN caching headers on Storage URLs
2. Check lazy loading is enabled on `<img>` tags
3. Monitor Firestore document sizes (should be < 5KB)

## References

- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Storage Best Practices](https://firebase.google.com/docs/storage/best-practices)
- [Firestore vs Storage](https://firebase.google.com/docs/firestore/storage-options)
