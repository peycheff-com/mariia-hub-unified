# C2PA API Documentation

## Overview

The C2PA API provides endpoints for creating, verifying, and managing C2PA watermarked content. All endpoints require appropriate authentication unless noted otherwise.

## Base URL

```
https://your-project.supabase.co/functions/v1
```

## Authentication

Most endpoints require a Supabase JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
apikey: <your-anon-key>
```

## Endpoints

### 1. Create C2PA Manifest and Signature

**POST** `/c2pa-watermark/sign`

Creates a C2PA manifest and digital signature for a media asset.

#### Request Body

```json
{
  "media_asset_id": "uuid",
  "manifest_data": {
    "title": "string",
    "description": "string",
    "assertions": [
      {
        "label": "string",
        "assertion_data": {}
      }
    ],
    "metadata": {}
  },
  "signature_data": {
    "algorithm": "ES256",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### Response

```json
{
  "success": true,
  "manifest_id": "uuid",
  "status": "signed"
}
```

#### Errors

- `400`: Missing required fields
- `401`: Unauthorized
- `403`: Insufficient permissions
- `404`: Media asset not found
- `500`: Server error

### 2. Verify C2PA Watermark

**POST** `/c2pa-watermark/verify`

Verifies the authenticity of a C2PA-watermarked media asset.

#### Request Body

```json
{
  "media_asset_id": "uuid"
}
```

#### Response

```json
{
  "verified": true,
  "manifest": {
    "id": "uuid",
    "manifest": {
      "claim_generator": "string",
      "claim_generated_at": "2024-01-01T00:00:00Z",
      "title": "string",
      "author": "string",
      "format": "string",
      "ingredients": [],
      "assertions": []
    },
    "signature": {
      "algorithm": "ES256",
      "signature": [],
      "public_key": "string"
    },
    "validation_status": "valid"
  },
  "verification_details": {
    "manifest_integrity": true,
    "asset_integrity": true,
    "signature_valid": true,
    "issues": []
  }
}
```

#### Errors

- `400`: Missing media_asset_id
- `404`: No C2PA manifest found

### 3. Get C2PA Manifest

**GET** `/c2pa-watermark/manifest/{manifestId}`

Retrieves a specific C2PA manifest.

#### Response

```json
{
  "id": "uuid",
  "media_asset_id": "uuid",
  "manifest": {},
  "signature": {},
  "validation_status": "valid",
  "created_at": "2024-01-01T00:00:00Z",
  "c2pa_assertions": [],
  "media_assets": {
    "original_filename": "string",
    "mime_type": "string",
    "cdn_url": "string"
  }
}
```

### 4. Queue Media Processing Job

**POST** `/media-processing/queue`

Queues a job for media processing (e.g., watermark embedding).

#### Request Body

```json
{
  "asset_id": "uuid",
  "job_type": "c2pa_sign",
  "job_data": {
    "c2pa_manifest_id": "uuid",
    "watermark_text": "Verified by BM Beauty Studio",
    "position": "bottom-right",
    "opacity": 0.7,
    "auto_verify": true
  },
  "priority": 1
}
```

#### Response

```json
{
  "success": true,
  "job_id": "uuid",
  "status": "queued"
}
```

### 5. Process Media Job

**POST** `/media-processing/process`

Processes a queued media job.

#### Request Body

```json
{
  "job_id": "uuid"
}
```

#### Response

```json
{
  "success": true,
  "job_id": "uuid",
  "result": {
    "c2pa_path": "string",
    "c2pa_url": "string",
    "c2pa_signed": true,
    "manifest_id": "uuid",
    "watermark_text": "string",
    "authenticity_guaranteed": true
  }
}
```

### 6. Get Processing Queue

**GET** `/media-processing/queue`

Retrieves the current processing queue.

#### Query Parameters

- `status`: Filter by status (pending, processing, completed, failed)
- `limit`: Number of jobs to return (default: 10)

#### Response

```json
[
  {
    "id": "uuid",
    "asset_id": "uuid",
    "job_type": "string",
    "job_status": "string",
    "progress": 50,
    "started_at": "2024-01-01T00:00:00Z",
    "media_assets": {
      "original_filename": "string",
      "mime_type": "string"
    }
  }
]
```

### 7. Batch Process Media Assets

**POST** `/media-processing/batch`

Processes multiple media assets with the same job types.

#### Request Body

```json
{
  "asset_ids": ["uuid1", "uuid2"],
  "job_types": ["c2pa_sign"],
  "job_data": {
    "watermark_text": "string",
    "position": "bottom-right"
  }
}
```

#### Response

```json
{
  "success": true,
  "jobs_queued": 2,
  "job_ids": ["uuid1", "uuid2"]
}
```

## Client Library

### JavaScript/TypeScript

```typescript
import { c2paService } from '@/services/c2paService'

// Add watermark
const result = await c2paService.addWatermark(
  'asset-id',
  {
    title: 'Before/After Photo',
    description: 'Lip enhancement procedure'
  },
  {
    watermark_text: 'Verified by BM Beauty Studio',
    position: 'bottom-right'
  }
)

// Verify watermark
const verification = await c2paService.verifyWatermark('asset-id')

// Extract metadata
const manifest = await c2paService.extractMetadata('asset-id')

// Batch process
const batchResult = await c2paService.batchProcessWatermarks(
  ['asset1', 'asset2'],
  manifestTemplate,
  options
)
```

### Python

```python
import requests
import json

class C2PAClient:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.api_key = api_key
        self.headers = {
            'apikey': api_key,
            'Content-Type': 'application/json'
        }

    def add_watermark(self, asset_id, manifest_data, signature_data=None):
        """Add C2PA watermark to an asset"""
        url = f"{self.base_url}/c2pa-watermark/sign"
        data = {
            'media_asset_id': asset_id,
            'manifest_data': manifest_data,
            'signature_data': signature_data or {
                'algorithm': 'ES256',
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()

    def verify_watermark(self, asset_id):
        """Verify C2PA watermark"""
        url = f"{self.base_url}/c2pa-watermark/verify"
        data = {'media_asset_id': asset_id}
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()

    def get_manifest(self, manifest_id):
        """Get C2PA manifest"""
        url = f"{self.base_url}/c2pa-watermark/manifest/{manifest_id}"
        response = requests.get(url, headers=self.headers)
        return response.json()

# Usage
client = C2PAClient(
    'https://your-project.supabase.co/functions/v1',
    'your-anon-key'
)

# Add watermark
result = client.add_watermark(
    'asset-uuid',
    {
        'title': 'Treatment Photo',
        'description': 'Before and after'
    }
)

# Verify
verification = client.verify_watermark('asset-uuid')
```

## Webhooks

### Verification Completed

Triggered when a verification is completed.

```json
{
  "event": "verification.completed",
  "data": {
    "media_asset_id": "uuid",
    "verified": true,
    "verified_at": "2024-01-01T00:00:00Z",
    "manifest_id": "uuid"
  }
}
```

### Processing Job Completed

Triggered when a media processing job completes.

```json
{
  "event": "processing.completed",
  "data": {
    "job_id": "uuid",
    "asset_id": "uuid",
    "job_type": "c2pa_sign",
    "status": "completed",
    "result": {
      "c2pa_signed": true,
      "manifest_id": "uuid"
    }
  }
}
```

## Rate Limits

- **Verification**: 100 requests/minute per IP
- **Signing**: 50 requests/minute per user
- **Batch Processing**: 10 batches/hour per user

## Error Codes

| Code | Description |
|------|-------------|
| C2PA_001 | Invalid manifest data |
| C2PA_002 | Signature verification failed |
| C2PA_003 | Asset not found |
| C2PA_004 | Processing job failed |
| C2PA_005 | Rate limit exceeded |
| C2PA_006 | Invalid permissions |

## Examples

### React Component

```tsx
import React, { useState, useEffect } from 'react'
import { c2paService } from '@/services/c2paService'

const VerifiedImage = ({ assetId, imageUrl }) => {
  const [verified, setVerified] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verify = async () => {
      const result = await c2paService.verifyWatermark(assetId)
      setVerified(result.verified)
      setLoading(false)
    }
    verify()
  }, [assetId])

  return (
    <div className="relative">
      <img src={imageUrl} alt="Verified content" />
      {loading ? (
        <div className="absolute top-2 right-2">
          Verifying...
        </div>
      ) : verified ? (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded">
          ✓ C2PA Verified
        </div>
      ) : (
        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded">
          ✗ Not Verified
        </div>
      )}
    </div>
  )
}
```

### Verification Page

```html
<!DOCTYPE html>
<html>
<head>
  <title>C2PA Verification</title>
  <script src="https://cdn.jsdelivr.net/npm/@c2pa/sdk@latest"></script>
</head>
<body>
  <div id="verification-result"></div>

  <script>
    // Get asset ID from URL
    const assetId = new URLSearchParams(window.location.search).get('id')

    // Verify asset
    C2PA.verify(assetId).then(result => {
      const div = document.getElementById('verification-result')
      if (result.verified) {
        div.innerHTML = `
          <h2>✓ Content Verified</h2>
          <p>This content is authentic and has not been modified.</p>
          <pre>${JSON.stringify(result.manifest, null, 2)}</pre>
        `
      } else {
        div.innerHTML = `
          <h2>✗ Verification Failed</h2>
          <p>${result.error}</p>
        `
      }
    })
  </script>
</body>
</html>
```

## SDK Integration

### React Native

```javascript
import { C2PA } from '@c2pa/react-native'

const verifyImage = async (imageUri) => {
  try {
    const result = await C2PA.verify(imageUri)
    console.log('Verified:', result.verified)
    return result
  } catch (error) {
    console.error('Verification failed:', error)
  }
}
```

### iOS (Swift)

```swift
import C2PA

func verifyImage(url: URL) async throws -> VerificationResult {
    let sdk = C2PASDK()
    let result = try await sdk.verify(url: url)
    return result
}
```

### Android (Kotlin)

```kotlin
import com.c2pa.sdk.C2PA

suspend fun verifyImage(uri: Uri): VerificationResult {
    val sdk = C2PA(context)
    return sdk.verify(uri)
}
```

## Testing

### Unit Tests

```typescript
import { c2paService } from '@/services/c2paService'

describe('C2PA Service', () => {
  test('should verify authentic content', async () => {
    const result = await c2paService.verifyWatermark('test-asset-id')
    expect(result.verified).toBe(true)
  })

  test('should fail verification for modified content', async () => {
    const result = await c2paService.verifyWatermark('modified-asset-id')
    expect(result.verified).toBe(false)
  })
})
```

### Integration Tests

```typescript
describe('C2PA Integration', () => {
  test('full workflow', async () => {
    // Upload image
    const uploadResult = await uploadImage(testImage)

    // Add C2PA watermark
    const c2paResult = await c2paService.addWatermark(
      uploadResult.assetId,
      testManifest
    )
    expect(c2paResult.success).toBe(true)

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Verify
    const verification = await c2paService.verifyWatermark(uploadResult.assetId)
    expect(verification.verified).toBe(true)
  })
})
```

## Security Considerations

1. **API Keys**: Never expose service role keys in client-side code
2. **Validation**: Always validate manifest data before signing
3. **Rate Limiting**: Implement client-side rate limiting
4. **HTTPS**: Always use HTTPS for API calls
5. **CORS**: Configure CORS properly for your domain

## Support

For API support:

- **Documentation**: Check this guide first
- **Examples**: See `/examples` directory
- **Issues**: Report via GitHub issues
- **Email**: api-support@bmbeauty.pl