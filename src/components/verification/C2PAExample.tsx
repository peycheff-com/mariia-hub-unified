import React, { useState } from 'react'
import { Shield, Upload, CheckCircle, Info, ExternalLink } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { c2paService } from '@/services/c2paService'

import { C2PAImageUpload } from './C2PAImageUpload'
import { C2PAVerificationBadge } from './C2PAVerificationBadge'
import { C2PAVerificationModal } from './C2PAVerificationModal'
import { C2PABatchProcessor } from './C2PABatchProcessor'

export const C2PAExample: React.FC = () => {
  const [uploadedAsset, setUploadedAsset] = useState<{ url: string; assetId: string; c2paVerified?: boolean } | null>(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)

  const handleUploadComplete = (data: { url: string; assetId: string; c2paVerified?: boolean }) => {
    setUploadedAsset(data)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Shield className="w-8 h-8" />
          C2PA Integration Example
        </h1>
        <p className="text-gray-600">
          Complete example of C2PA watermarking and verification system
        </p>
      </div>

      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          This is a comprehensive demonstration of the C2PA (Coalition for Content Provenance and Authenticity)
          implementation. C2PA provides cryptographic proof of content authenticity, perfect for protecting
          before/after photos in beauty and fitness industries.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="batch">Batch Processing</TabsTrigger>
          <TabsTrigger value="apis">API Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                C2PA-Enabled Upload
              </CardTitle>
              <CardDescription>
                Upload an image with optional C2PA watermarking for authenticity protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <C2PAImageUpload
                bucket="demo-uploads"
                onUploadComplete={handleUploadComplete}
                enableC2PA={true}
                serviceType="beauty"
                folder="demo"
              />

              {uploadedAsset && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-green-800">Upload Successful!</h3>
                    {uploadedAsset.c2paVerified && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        C2PA Protected
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Asset ID:</span>{' '}
                      <code className="bg-white px-1 rounded">{uploadedAsset.assetId}</code>
                    </div>
                    <div>
                      <span className="font-medium">URL:</span>{' '}
                      <a href={uploadedAsset.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {uploadedAsset.url}
                        <ExternalLink className="w-3 h-3 inline ml-1" />
                      </a>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVerificationModal(true)}
                    >
                      View Verification Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/verify/${uploadedAsset.assetId}`, '_blank')}
                    >
                      Public Verification Page
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification Components</CardTitle>
              <CardDescription>
                Different ways to display C2PA verification status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Simple Badge</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Minimal verification indicator
                  </p>
                  <C2PAVerificationBadge
                    mediaAssetId="example-asset-id"
                    size="sm"
                  />
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Detailed Badge</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Shows verification details on hover
                  </p>
                  <C2PAVerificationBadge
                    mediaAssetId="example-asset-id"
                    size="md"
                    showDetails={true}
                  />
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Large Badge</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Prominent verification display
                  </p>
                  <C2PAVerificationBadge
                    mediaAssetId="example-asset-id"
                    size="lg"
                    showDetails={true}
                  />
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Modal Trigger</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Opens detailed verification modal
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowVerificationModal(true)}
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Open Verification
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Batch Processing</CardTitle>
              <CardDescription>
                Process multiple images with C2PA watermarking simultaneously
              </CardDescription>
            </CardHeader>
            <CardContent>
              <C2PABatchProcessor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Client-Side API</CardTitle>
                <CardDescription>
                  Using the C2PA service client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`import { c2paService } from '@/services/c2paService'

// Add watermark to an asset
const result = await c2paService.addWatermark(
  'asset-id',
  {
    title: 'Before/After Photo',
    description: 'Lip enhancement procedure',
    metadata: {
      service_type: 'beauty',
      client_id: 'client-123'
    }
  },
  {
    watermark_text: 'Verified by BM Beauty Studio',
    position: 'bottom-right',
    opacity: 0.7
  }
)

// Verify an asset
const verification = await c2paService.verifyWatermark('asset-id')
console.log('Verified:', verification.verified)

// Extract metadata
const manifest = await c2paService.extractMetadata('asset-id')
console.log('Manifest:', manifest.manifest)

// Batch process
const batchResult = await c2paService.batchProcessWatermarks(
  ['asset1', 'asset2', 'asset3'],
  manifestTemplate,
  options
)`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>REST API</CardTitle>
                <CardDescription>
                  Direct API calls to edge functions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`// Create C2PA manifest
POST /functions/v1/c2pa-watermark/sign
{
  "media_asset_id": "uuid",
  "manifest_data": {
    "title": "Treatment Photo",
    "description": "Before/After"
  }
}

// Verify C2PA watermark
POST /functions/v1/c2pa-watermark/verify
{
  "media_asset_id": "uuid"
}

// Queue processing job
POST /functions/v1/media-processing/queue
{
  "asset_id": "uuid",
  "job_type": "c2pa_sign",
  "job_data": {
    "watermark_text": "Verified",
    "position": "bottom-right"
  }
}

// Get manifest
GET /functions/v1/c2pa-watermark/manifest/{id}`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Python Example</CardTitle>
                <CardDescription>
                  Server-side integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`import requests

class C2PAClient:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            'apikey': api_key,
            'Content-Type': 'application/json'
        }

    def verify_watermark(self, asset_id):
        url = f"{self.base_url}/c2pa-watermark/verify"
        data = {'media_asset_id': asset_id}
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()

# Usage
client = C2PAClient(
    'https://project.supabase.co/functions/v1',
    'your-api-key'
)

result = client.verify_watermark('asset-uuid')
print(f"Verified: {result['verified']}")`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook Example</CardTitle>
                <CardDescription>
                  Handle verification events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`// Webhook handler for verification completed
app.post('/webhook/c2pa', (req, res) => {
  const { event, data } = req.body

  if (event === 'verification.completed') {
    const { media_asset_id, verified, manifest_id } = data

    // Update your database
    await db.assets.update({
      where: { id: media_asset_id },
      data: {
        c2pa_verified: verified,
        c2pa_manifest_id: manifest_id
      }
    })

    // Send notification
    if (verified) {
      await sendNotification({
        type: 'c2pa_verified',
        assetId: media_asset_id
      })
    }
  }

  res.status(200).end()
})`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Verification Modal */}
      {uploadedAsset && (
        <C2PAVerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          mediaAssetId={uploadedAsset.assetId}
          imageUrl={uploadedAsset.url}
          title="Example Content"
        />
      )}
    </div>
  )
}

export default C2PAExample