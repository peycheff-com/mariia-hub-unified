import React, { useState, useEffect } from 'react'
import {
  Shield,
  ShieldCheck,
  ShieldX,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  FileText,
  User,
  Calendar,
  Fingerprint,
  Link2,
  Download,
  Share2
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { c2paService, C2PAVerificationResult, C2PAManifest } from '@/services/c2paService'
import { logger } from '@/lib/logger'

interface C2PAVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  mediaAssetId: string
  imageUrl?: string
  title?: string
}

export const C2PAVerificationModal: React.FC<C2PAVerificationModalProps> = ({
  isOpen,
  onClose,
  mediaAssetId,
  imageUrl,
  title = 'Image Verification'
}) => {
  const [verificationResult, setVerificationResult] = useState<C2PAVerificationResult | null>(null)
  const [manifest, setManifest] = useState<C2PAManifest | null>(null)
  const [verificationHistory, setVerificationHistory] = useState<any[]>([])
  const [isVerifying, setIsVerifying] = useState(false)
  const [activeTab, setActiveTab] = useState('verification')

  useEffect(() => {
    if (isOpen && mediaAssetId) {
      performVerification()
      loadManifest()
      loadVerificationHistory()
    }
  }, [isOpen, mediaAssetId])

  const performVerification = async () => {
    setIsVerifying(true)
    try {
      const result = await c2paService.verifyWatermark(mediaAssetId)
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

  const loadManifest = async () => {
    try {
      const manifestData = await c2paService.extractMetadata(mediaAssetId)
      setManifest(manifestData)
    } catch (error) {
      logger.error('Failed to load manifest:', error)
    }
  }

  const loadVerificationHistory = async () => {
    try {
      const history = await c2paService.getVerificationHistory(mediaAssetId)
      setVerificationHistory(history)
    } catch (error) {
      logger.error('Failed to load verification history:', error)
    }
  }

  const getStatusBadge = (verified: boolean, error?: string) => {
    if (verified) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <ShieldCheck className="w-4 h-4 mr-1" />
          Verified Authentic
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <ShieldX className="w-4 h-4 mr-1" />
          {error || 'Not Verified'}
        </Badge>
      )
    }
  }

  const copyVerificationUrl = () => {
    const url = c2paService.createVerificationUrl(mediaAssetId)
    navigator.clipboard.writeText(url)
  }

  const downloadCertificate = () => {
    if (!verificationResult || !verificationResult.verified) return

    const certificateData = {
      verified_at: new Date().toISOString(),
      media_asset_id: mediaAssetId,
      verification_result: verificationResult,
      manifest: manifest
    }

    const blob = new Blob([JSON.stringify(certificateData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `c2pa-certificate-${mediaAssetId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            C2PA Content Verification
          </DialogTitle>
          <DialogDescription>
            Verify the authenticity and provenance of this content using the C2PA standard
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="verification">Verification</TabsTrigger>
              <TabsTrigger value="manifest">Manifest</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              <TabsContent value="verification" className="space-y-4">
                {imageUrl && (
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-64 object-contain bg-gray-50 rounded-lg"
                    />
                    {verificationResult?.verified && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500 text-white">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          C2PA Verified
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Verification Status</h3>
                  {isVerifying ? (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Clock className="w-4 h-4 mr-1 animate-spin" />
                      Verifying...
                    </Badge>
                  ) : (
                    verificationResult && getStatusBadge(verificationResult.verified, verificationResult.error)
                  )}
                </div>

                {verificationResult && !isVerifying && (
                  <div className="space-y-4">
                    {verificationResult.verified ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Verification Successful</h4>
                        <p className="text-sm text-green-700">
                          This content has been verified using the C2PA standard. The authenticity and
                          integrity of the content are guaranteed by the digital signature.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">Verification Failed</h4>
                        <p className="text-sm text-red-700">
                          {verificationResult.error || 'This content could not be verified.'}
                        </p>
                      </div>
                    )}

                    {verificationResult.verification_details && (
                      <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <h4 className="font-medium">Security Checks</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className={cn(
                            "p-3 rounded-lg border",
                            verificationResult.verification_details.manifest_integrity
                              ? "bg-green-50 border-green-200"
                              : "bg-red-50 border-red-200"
                          )}>
                            <div className="flex items-center gap-2">
                              {verificationResult.verification_details.manifest_integrity ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                              <span className="text-sm font-medium">Manifest Integrity</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {verificationResult.verification_details.manifest_integrity
                                ? 'Valid - Manifest is intact'
                                : 'Invalid - Manifest has been modified'}
                            </p>
                          </div>

                          <div className={cn(
                            "p-3 rounded-lg border",
                            verificationResult.verification_details.asset_integrity
                              ? "bg-green-50 border-green-200"
                              : "bg-red-50 border-red-200"
                          )}>
                            <div className="flex items-center gap-2">
                              {verificationResult.verification_details.asset_integrity ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                              <span className="text-sm font-medium">Asset Integrity</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {verificationResult.verification_details.asset_integrity
                                ? 'Valid - File is unchanged'
                                : 'Invalid - File has been modified'}
                            </p>
                          </div>

                          <div className={cn(
                            "p-3 rounded-lg border",
                            verificationResult.verification_details.signature_valid
                              ? "bg-green-50 border-green-200"
                              : "bg-red-50 border-red-200"
                          )}>
                            <div className="flex items-center gap-2">
                              {verificationResult.verification_details.signature_valid ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                              <span className="text-sm font-medium">Digital Signature</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {verificationResult.verification_details.signature_valid
                                ? 'Valid - Signature verified'
                                : 'Invalid - Signature verification failed'}
                            </p>
                          </div>
                        </div>

                        {verificationResult.verification_details.issues &&
                          verificationResult.verification_details.issues.length > 0 && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h5 className="font-medium text-yellow-800 mb-2">Issues Detected</h5>
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
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="manifest" className="space-y-4">
                {manifest ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Manifest Information
                      </h4>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="font-medium text-gray-600">Claim Generator</dt>
                          <dd>{manifest.manifest.claim_generator}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-600">Generated At</dt>
                          <dd>{new Date(manifest.claim_generated_at).toLocaleString()}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-600 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Author
                          </dt>
                          <dd>{manifest.manifest.author}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-600">Format</dt>
                          <dd>{manifest.manifest.format}</dd>
                        </div>
                        {manifest.manifest.title && (
                          <div className="md:col-span-2">
                            <dt className="font-medium text-gray-600">Title</dt>
                            <dd>{manifest.manifest.title}</dd>
                          </div>
                        )}
                        {manifest.manifest.description && (
                          <div className="md:col-span-2">
                            <dt className="font-medium text-gray-600">Description</dt>
                            <dd>{manifest.manifest.description}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <Separator />

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Fingerprint className="w-4 h-4" />
                        Signature Information
                      </h4>
                      <dl className="text-sm space-y-2">
                        <div>
                          <dt className="font-medium text-gray-600">Algorithm</dt>
                          <dd>{manifest.signature.algorithm}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-600">Public Key</dt>
                          <dd className="font-mono text-xs bg-white p-2 rounded border break-all">
                            {manifest.signature.public_key}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {manifest.c2pa_assertions && manifest.c2pa_assertions.length > 0 && (
                      <>
                        <Separator />
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium mb-3">Assertions</h4>
                          <div className="space-y-2">
                            {manifest.c2pa_assertions.map((assertion, idx) => (
                              <div key={idx} className="p-3 bg-white rounded border">
                                <dt className="font-medium text-sm text-gray-600">{assertion.assertion_label}</dt>
                                <dd className="text-xs text-gray-700 mt-1">
                                  {typeof assertion.assertion_data === 'object'
                                    ? JSON.stringify(assertion.assertion_data, null, 2)
                                    : String(assertion.assertion_data)}
                                </dd>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No manifest data available</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {verificationHistory.length > 0 ? (
                  <div className="space-y-3">
                    {verificationHistory.map((entry, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {entry.verification_result.verified ? 'Verified' : 'Failed'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.verified_at).toLocaleString()}
                          </span>
                        </div>
                        {entry.ip_address && (
                          <p className="text-xs text-gray-600">IP: {entry.ip_address}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No verification history available</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tools" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      Verification URL
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Share this public verification URL with others
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={copyVerificationUrl} className="flex-1">
                        <Share2 className="w-4 h-4 mr-1" />
                        Copy URL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(c2paService.createVerificationUrl(mediaAssetId), '_blank')}
                      >
                        <Globe className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Certificate
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Download a JSON certificate of verification
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadCertificate}
                      disabled={!verificationResult?.verified}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download Certificate
                    </Button>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Fingerprint className="w-4 h-4" />
                      QR Code
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Generate QR code for easy verification
                    </p>
                    <img
                      src={c2paService.generateVerificationQR(mediaAssetId)}
                      alt="Verification QR Code"
                      className="w-32 h-32 mx-auto bg-white p-2 rounded border"
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3">Browser Support</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Digital Signatures</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>C2PA Verification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Manifest Extraction</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {!isVerifying && (
            <Button onClick={performVerification}>
              <ShieldCheck className="w-4 h-4 mr-1" />
              Re-verify
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default C2PAVerificationModal