import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, ShieldCheck, ShieldX, AlertCircle, ExternalLink, Share2, Copy, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast aria-live="polite" aria-atomic="true" } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/integrations/supabase/client'
import { c2paService, C2PAVerificationResult, C2PAManifest } from '@/services/c2paService'
import { logger } from '@/lib/logger'

interface MediaAsset {
  id: string
  original_filename: string
  mime_type: string
  file_size: number
  cdn_url?: string
  created_at: string
  metadata?: Record<string, any>
}

export const VerifyContentPage: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>()
  const navigate = useNavigate()

  const [asset, setAsset] = useState<MediaAsset | null>(null)
  const [verificationResult, setVerificationResult] = useState<C2PAVerificationResult | null>(null)
  const [manifest, setManifest] = useState<C2PAManifest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    if (assetId) {
      loadAsset()
      setShareUrl(window.location.href)
    }
  }, [assetId])

  const loadAsset = async () => {
    if (!assetId) return

    setIsLoading(true)
    try {
      // Load asset information
      const { data: assetData, error: assetError } = await supabase
        .from('media_assets')
        .select('*')
        .eq('id', assetId)
        .single()

      if (assetError || !assetData) {
        throw new Error('Media asset not found')
      }

      setAsset(assetData)

      // Load manifest data
      const manifestData = await c2paService.extractMetadata(assetId)
      setManifest(manifestData)

      // Perform verification
      await performVerification()
    } catch (error) {
      logger.error('Failed to load asset:', error)
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to load media asset',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const performVerification = async () => {
    if (!assetId) return

    setIsVerifying(true)
    try {
      const result = await c2paService.verifyWatermark(assetId)
      setVerificationResult(result)
    } catch (error) {
      logger.error('Verification failed:', error)
      setVerificationResult({
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl)
    toast aria-live="polite" aria-atomic="true"({
      title: 'Copied',
      description: 'Verification URL copied to clipboard'
    })
  }

  const downloadCertificate = () => {
    if (!verificationResult || !manifest) return

    const certificateData = {
      verified_at: new Date().toISOString(),
      media_asset_id: assetId,
      asset: asset,
      verification_result: verificationResult,
      manifest: manifest
    }

    const blob = new Blob([JSON.stringify(certificateData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `verification-certificate-${assetId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cocoa/20 to-champagne/20 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="w-10 h-10 rounded" />
            <Skeleton className="w-48 h-6 rounded" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="w-64 h-6 rounded mb-2" />
              <Skeleton className="w-96 h-4 rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="w-full h-64 rounded" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="w-full h-32 rounded" />
                <Skeleton className="w-full h-32 rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cocoa/20 to-champagne/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Asset Not Found</h2>
            <p className="text-gray-600 mb-4">
              The media asset you're trying to verify could not be found.
            </p>
            <Button onClick={() => navigate('/')}>
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cocoa/20 to-champagne/20 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Content Verification
              </h1>
              <p className="text-gray-600">
                Verify the authenticity of this media using C2PA standards
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyShareUrl}>
              <Copy className="w-4 h-4 mr-1" />
              Share
            </Button>
            {verificationResult?.verified && (
              <Button variant="outline" size="sm" onClick={downloadCertificate}>
                <Download className="w-4 h-4 mr-1" />
                Certificate
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Verification Status Badge */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{asset.original_filename}</h2>
                    {isVerifying ? (
                      <Badge className="bg-blue-100 text-blue-800">
                        <AlertCircle className="w-3 h-3 mr-1 animate-pulse" />
                        Verifying...
                      </Badge>
                    ) : verificationResult?.verified ? (
                      <Badge className="bg-green-100 text-green-800">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        C2PA Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">
                        <ShieldX className="w-3 h-3 mr-1" />
                        Not Verified
                      </Badge>
                    )}
                  </div>

                  {/* Image Display */}
                  {asset.cdn_url && (
                    <div className="relative group">
                      <img
                        src={asset.cdn_url}
                        alt={asset.original_filename}
                        className="w-full h-auto max-h-[500px] object-contain bg-gray-50 rounded-lg border"
                      />
                      {verificationResult?.verified && (
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                            <p className="text-xs font-medium text-green-700">
                              ✓ C2PA Protected
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button onClick={performVerification} disabled={isVerifying}>
                      {isVerifying ? (
                        <>
                          <AlertCircle className="w-4 h-4 mr-1 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 mr-1" />
                          Re-verify
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={asset.cdn_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Original
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Verification Results */}
            {verificationResult && !isVerifying && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Verification Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {verificationResult.verified ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="font-medium text-green-800 mb-2">
                          ✓ Content Authenticity Verified
                        </h3>
                        <p className="text-sm text-green-700">
                          This content has been verified using the C2PA standard. The digital signature
                          confirms that the content has not been altered since creation.
                        </p>
                      </div>

                      {verificationResult.verification_details && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${
                                verificationResult.verification_details.manifest_integrity
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              }`} />
                              <span className="text-sm font-medium">Manifest Integrity</span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {verificationResult.verification_details.manifest_integrity
                                ? 'Valid - Manifest is intact'
                                : 'Invalid - Manifest has been modified'}
                            </p>
                          </div>

                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${
                                verificationResult.verification_details.asset_integrity
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              }`} />
                              <span className="text-sm font-medium">Asset Integrity</span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {verificationResult.verification_details.asset_integrity
                                ? 'Valid - File is unchanged'
                                : 'Invalid - File has been modified'}
                            </p>
                          </div>

                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${
                                verificationResult.verification_details.signature_valid
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              }`} />
                              <span className="text-sm font-medium">Digital Signature</span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {verificationResult.verification_details.signature_valid
                                ? 'Valid - Signature verified'
                                : 'Invalid - Signature verification failed'}
                            </p>
                          </div>

                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${
                                verificationResult.verified
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              }`} />
                              <span className="text-sm font-medium">Overall Status</span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {verificationResult.verified
                                ? 'Verified - Content is authentic'
                                : 'Failed - Verification unsuccessful'}
                            </p>
                          </div>
                        </div>
                      )}

                      {verificationResult.verification_details?.issues &&
                        verificationResult.verification_details.issues.length > 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <h4 className="font-medium text-yellow-800 mb-2">Issues Detected</h4>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            {verificationResult.verification_details.issues.map((issue, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="font-medium text-red-800 mb-2">
                        ✗ Verification Failed
                      </h3>
                      <p className="text-sm text-red-700">
                        {verificationResult.error || 'This content could not be verified.'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Information */}
          <div className="space-y-6">
            {/* Asset Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Asset Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500">Filename</p>
                  <p className="text-sm break-all">{asset.original_filename}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Asset ID</p>
                  <p className="text-xs font-mono bg-gray-100 p-1 rounded">{asset.id}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">File Type</p>
                  <p className="text-sm">{asset.mime_type}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">File Size</p>
                  <p className="text-sm">{formatFileSize(asset.file_size)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Uploaded</p>
                  <p className="text-sm">{formatDate(asset.created_at)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Manifest Information */}
            {manifest && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">C2PA Manifest</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Generated By</p>
                    <p className="text-xs">{manifest.manifest.claim_generator}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Generated At</p>
                    <p className="text-xs">{formatDate(manifest.claim_generated_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Author</p>
                    <p className="text-xs">{manifest.manifest.author}</p>
                  </div>
                  {manifest.manifest.title && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">Title</p>
                      <p className="text-xs">{manifest.manifest.title}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-gray-500">Signature Algorithm</p>
                    <p className="text-xs">{manifest.signature.algorithm}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Validation Status</p>
                    <Badge variant={manifest.validation_status === 'valid' ? 'default' : 'destructive'}>
                      {manifest.validation_status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trust Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trust Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {verificationResult?.verified ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                      <span className="text-sm">C2PA Certified</span>
                    </>
                  ) : (
                    <>
                      <ShieldX className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Not Certified</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Cryptographic Signature</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Tamper-Evident</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Provenance Tracked</span>
                </div>
              </CardContent>
            </Card>

            {/* Share Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Share Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full" onClick={copyShareUrl}>
                  <Share2 className="w-4 h-4 mr-1" />
                  Copy Verification Link
                </Button>
                {verificationResult?.verified && (
                  <Button variant="outline" size="sm" className="w-full" onClick={downloadCertificate}>
                    <Download className="w-4 h-4 mr-1" />
                    Download Certificate
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyContentPage