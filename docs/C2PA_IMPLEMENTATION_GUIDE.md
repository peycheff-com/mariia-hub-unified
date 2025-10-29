# C2PA Implementation Guide

## Overview

This guide documents the implementation of C2PA (Coalition for Content Provenance and Authenticity) watermarking in the BM Beauty Studio platform. C2PA provides cryptographic proof of content authenticity, protecting before/after photos from misuse and building trust with clients.

## Architecture

### Components

1. **C2PA Service Client** (`src/services/c2paService.ts`)
   - Main service for C2PA operations
   - Handles watermark creation, verification, and metadata extraction
   - Supports batch processing and verification history

2. **Edge Function** (`supabase/functions/c2pa-watermark/index.ts`)
   - Server-side C2PA manifest creation and signing
   - ECDSA digital signature generation
   - Manifest storage and retrieval

3. **Media Processing** (`supabase/functions/media-processing/index.ts`)
   - Handles watermark embedding in images
   - Processes jobs asynchronously
   - Manages job queues and retries

4. **UI Components**
   - `C2PAImageUpload`: Enhanced upload with C2PA integration
   - `C2PAVerificationBadge`: Visual verification status indicator
   - `C2PAVerificationModal`: Detailed verification information
   - `C2PABatchProcessor`: Admin batch processing tool

5. **Verification Page** (`src/pages/VerifyContent.tsx`)
   - Public verification interface
   - Displays provenance information
   - Provides verification certificates

## Database Schema

### Core Tables

#### `c2pa_manifests`
Stores C2PA manifests and signatures:

```sql
CREATE TABLE c2pa_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_asset_id UUID NOT NULL REFERENCES media_assets(id),
  manifest JSONB NOT NULL,
  signature JSONB NOT NULL,
  claim_generator TEXT NOT NULL,
  claim_generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  validation_status TEXT NOT NULL DEFAULT 'valid',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by TEXT,
  revocation_reason TEXT
);
```

#### `c2pa_assertions`
Stores individual assertions within manifests:

```sql
CREATE TABLE c2pa_assertions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_id UUID NOT NULL REFERENCES c2pa_manifests(id),
  assertion_type TEXT NOT NULL,
  assertion_data JSONB NOT NULL,
  assertion_label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `c2pa_verification_logs`
Tracks verification attempts:

```sql
CREATE TABLE c2pa_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_asset_id UUID NOT NULL REFERENCES media_assets(id),
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verification_result JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT
);
```

## Implementation Details

### 1. Digital Signatures

The system uses ECDSA with P-256 curve for digital signatures:

- **Algorithm**: ES256 (ECDSA with SHA-256)
- **Key Generation**: Per-manifest key pair generation
- **Signature Storage**: Public key stored with manifest for verification
- **Security**: Private keys used only during signing, not stored

### 2. Manifest Structure

Each C2PA manifest includes:

```typescript
{
  claim_generator: string,
  claim_generated_at: string,
  title: string,
  description?: string,
  author: string,
  format: string,
  ingredients: [{
    ingredient_type: string,
    data: {
      asset_id: string,
      filename: string,
      checksum: string,
      created_at: string
    }
  }],
  assertions: [{
    label: string,
    assertion_data: any
  }]
}
```

### 3. Standard Assertions

The system includes these standard assertions:

- **Training/Mining Protection**: Prevents AI training use
- **Ingredients**: Links to original asset
- **Content Credentials**: Basic metadata
- **Custom Assertions**: Service-specific information

### 4. Verification Process

1. Retrieve manifest from database
2. Verify digital signature using public key
3. Check asset checksum against manifest
4. Validate manifest integrity
5. Return verification result with details

## Usage Guide

### Basic Upload with C2PA

```typescript
import { C2PAImageUpload } from '@/components/verification/C2PAImageUpload';

<C2PAImageUpload
  bucket="service-images"
  onUploadComplete={(data) => {
    console.log('Uploaded:', data.url);
    console.log('C2PA Verified:', data.c2paVerified);
  }}
  enableC2PA={true}
  serviceType="beauty"
/>
```

### Manual Verification

```typescript
import { c2paService } from '@/services/c2paService';

// Verify an asset
const result = await c2paService.verifyWatermark(assetId);

if (result.verified) {
  console.log('Content is authentic');
  console.log('Manifest:', result.manifest);
} else {
  console.log('Verification failed:', result.error);
}
```

### Batch Processing

```typescript
// Process multiple assets
const batchResult = await c2paService.batchProcessWatermarks(
  ['asset1', 'asset2', 'asset3'],
  {
    title: 'Before/After Treatment Photos',
    description: 'Professional treatment documentation'
  },
  {
    watermark_text: 'Verified by BM Beauty Studio',
    position: 'bottom-right'
  }
);
```

## Security Considerations

### 1. Key Management

- **Per-Manifest Keys**: Each manifest gets a unique key pair
- **No Key Storage**: Private keys destroyed after signing
- **Public Key Distribution**: Public keys embedded in manifests

### 2. Tamper Detection

- **Checksum Verification**: SHA-256 hash of original file
- **Manifest Integrity**: Manifest itself is signed
- **Asset Integrity**: Any modification breaks verification

### 3. Privacy Controls

- **Consent Required**: Images must have consent for C2PA processing
- **Metadata Filtering**: Sensitive metadata excluded
- **Access Control**: Admin-only access to processing tools

## Performance Optimization

### 1. Async Processing

- **Job Queue**: Watermarking happens in background
- **Progress Tracking**: Real-time progress updates
- **Retry Logic**: Failed jobs retry automatically

### 2. Caching

- **Verification Cache**: Results cached for 5 minutes
- **Manifest Cache**: Frequently accessed manifests cached
- **CDN Delivery**: Processed images served via CDN

### 3. Batch Operations

- **Bulk Processing**: Multiple assets processed together
- **Queue Management**: Priority-based job queuing
- **Resource Limits**: Concurrent processing limits

## Client Integration

### 1. Website Integration

```html
<!-- Verification Badge -->
<img src="/verify/asset-id" alt="C2PA Verified" />
<script src="/c2pa-verification.js"></script>
<script>
  C2PA.verify('asset-id').then(result => {
    console.log('Verified:', result.verified);
  });
</script>
```

### 2. Mobile App Integration

```javascript
// React Native example
import { C2PASDK } from '@c2pa/sdk';

const verifyImage = async (imageUrl) => {
  const sdk = new C2PASDK();
  const result = await sdk.verify(imageUrl);
  return result;
};
```

### 3. Third-Party Integration

```python
# Python example using requests
import requests

def verify_asset(asset_id):
    response = requests.post(
        'https://api.bmbeauty.pl/c2pa/verify',
        json={'media_asset_id': asset_id}
    )
    return response.json()
```

## Compliance and Standards

### 1. C2PA Standard Compliance

- **Specification**: Follows C2PA 2.0 specification
- **Assertions**: Uses standard assertion formats
- **Interoperability**: Compatible with C2PA tools

### 2. GDPR Compliance

- **Data Minimization**: Only necessary metadata stored
- **Consent Management**: Explicit consent required
- **Right to Erasure**: Manifests can be revoked

### 3. Accessibility

- **Alt Text**: Verification badges include alt text
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Compatible with screen readers

## Troubleshooting

### Common Issues

1. **Verification Fails**
   - Check if image has been modified
   - Verify manifest exists in database
   - Check signature validation

2. **Processing Times Out**
   - Increase job timeout in settings
   - Check server resources
   - Verify image size limits

3. **Badge Not Showing**
   - Check asset ID is correct
   - Verify C2PA processing completed
   - Check browser console for errors

### Debug Tools

1. **Browser Console**: Check for C2PA errors
2. **Network Tab**: Verify API calls
3. **Database Logs**: Check processing logs
4. **Supabase Logs**: Edge function errors

## Future Enhancements

### 1. Advanced Features

- **Video Support**: Extend to video content
- **AI Detection**: AI-based content analysis
- **Blockchain**: Optional blockchain anchoring

### 2. Integration Improvements

- **Social Media**: Direct social verification
- **API v2**: Enhanced API capabilities
- **SDK Release**: Public SDK for developers

### 3. Performance

- **Edge Computing**: Processing at edge locations
- **WebAssembly**: Client-side verification
- **GPU Acceleration**: Faster image processing

## Support

For technical support:

1. **Documentation**: Check this guide first
2. **Issues**: Create GitHub issue with details
3. **Email**: support@bmbeauty.pl
4. **Community**: Join Discord community

## License

This C2PA implementation is proprietary to BM Beauty Studio.
C2PA standard is governed by the Coalition for Content Provenance and Authenticity.