import React, { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2, Shield, ShieldCheck, AlertCircle, Settings } from 'lucide-react'

import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { c2paService, C2PAProcessingOptions, C2PAManifestData } from '@/services/c2paService'

import { C2PAVerificationBadge } from './C2PAVerificationBadge'

interface C2PAImageUploadProps {
  bucket: string
  onUploadComplete: (data: { url: string; assetId: string; c2paVerified?: boolean }) => void
  currentImage?: string | null
  folder?: string
  enableC2PA?: boolean
  serviceType?: 'beauty' | 'fitness' | 'lifestyle'
  className?: string
}

interface ProcessingState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
  assetId?: string
}

export const C2PAImageUpload: React.FC<C2PAImageUploadProps> = ({
  bucket,
  onUploadComplete,
  currentImage,
  folder,
  enableC2PA = true,
  serviceType = 'beauty',
  className
}) => {
  const [processing, setProcessing] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: ''
  })
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [assetId, setAssetId] = useState<string | null>(null)
  const [c2paEnabled, setC2paEnabled] = useState(enableC2PA)
  const [showC2PASettings, setShowC2PASettings] = useState(false)
  const [c2paOptions, setC2paOptions] = useState<C2PAProcessingOptions>({
    watermark_text: 'Verified by BM Beauty Studio',
    position: 'bottom-right',
    opacity: 0.7,
    auto_verify: true
  })
  const [manifestData, setManifestData] = useState<C2PAManifestData>({
    title: '',
    description: '',
    assertions: []
  })
  const { toast aria-live="polite" aria-atomic="true" } = useToast()

  useEffect(() => {
    // Set default manifest data based on service type
    setManifestData(prev => ({
      ...prev,
      title: prev.title || `${serviceType} Service - Before/After Photo`,
      metadata: {
        ...prev.metadata,
        service_type: serviceType,
        business_name: 'BM Beauty Studio',
        location: 'Warsaw, Poland'
      }
    }))
  }, [serviceType])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setProcessing({
      status: 'uploading',
      progress: 0,
      message: 'Uploading image...'
    })

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = folder ? `${folder}/${fileName}` : fileName

      // Calculate file checksum
      const buffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      setProcessing(prev => ({ ...prev, progress: 40, message: 'Creating media record...' }))

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      // Create media asset record
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: asset, error: assetError } = await supabase
        .from('media_assets')
        .insert({
          original_filename: file.name,
          mime_type: file.type,
          file_size: file.size,
          checksum,
          cdn_url: publicUrl,
          bucket,
          path: filePath,
          uploaded_by: user.id,
          metadata: {
            uploaded_via: 'c2pa_upload_component',
            c2pa_enabled: c2paEnabled
          }
        })
        .select()
        .single()

      if (assetError) throw assetError

      setAssetId(asset.id)
      setProcessing(prev => ({ ...prev, progress: 60, assetId: asset.id }))

      setPreview(publicUrl)

      // Apply C2PA watermark if enabled
      if (c2paEnabled && asset.id) {
        setProcessing(prev => ({ ...prev, progress: 70, message: 'Applying C2PA watermark...' }))

        // Enhance manifest data with file information
        const enhancedManifestData: C2PAManifestData = {
          ...manifestData,
          title: manifestData.title || file.name,
          metadata: {
            ...manifestData.metadata,
            original_filename: file.name,
            file_size: file.size,
            mime_type: file.type,
            uploaded_at: new Date().toISOString(),
            asset_id: asset.id
          }
        }

        const c2paResult = await c2paService.addWatermark(
          asset.id,
          enhancedManifestData,
          c2paOptions
        )

        if (c2paResult.success) {
          setProcessing(prev => ({
            ...prev,
            status: 'completed',
            progress: 100,
            message: 'Image uploaded and C2PA verified successfully'
          }))

          toast aria-live="polite" aria-atomic="true"({
            title: "Image uploaded successfully",
            description: "C2PA watermark has been applied and verified",
          })

          onUploadComplete({
            url: publicUrl,
            assetId: asset.id,
            c2paVerified: true
          })
        } else {
          throw new Error(c2paResult.error || 'Failed to apply C2PA watermark')
        }
      } else {
        // No C2PA processing
        setProcessing(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          message: 'Image uploaded successfully'
        }))

        toast aria-live="polite" aria-atomic="true"({
          title: "Image uploaded successfully",
        })

        onUploadComplete({
          url: publicUrl,
          assetId: asset.id,
          c2paVerified: false
        })
      }
    } catch (error: any) {
      logger.error('Upload error:', error)
      setProcessing({
        status: 'error',
        progress: 0,
        message: error.message || 'Upload failed'
      })

      toast aria-live="polite" aria-atomic="true"({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [bucket, folder, onUploadComplete, toast aria-live="polite" aria-atomic="true", c2paEnabled, c2paOptions, manifestData])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.tiff']
    },
    maxFiles: 1,
    disabled: processing.status !== 'idle',
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const removeImage = () => {
    setPreview(null)
    setAssetId(null)
    setProcessing({ status: 'idle', progress: 0, message: '' })
    onUploadComplete({ url: '', assetId: '' })
  }

  const resetUpload = () => {
    setProcessing({ status: 'idle', progress: 0, message: '' })
  }

  return (
    <div className={cn('space-y-4', className)}>
      {preview ? (
        <div className="space-y-3">
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg border border-graphite/20"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={removeImage}
            >
              <X className="w-4 h-4" />
            </Button>

            {/* C2PA Verification Badge */}
            {assetId && processing.status === 'completed' && (
              <div className="absolute top-2 left-2">
                <C2PAVerificationBadge
                  mediaAssetId={assetId}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Asset Info */}
          {assetId && (
            <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">Asset ID:</span>
                <span className="font-mono">{assetId}</span>
              </div>
              {processing.status === 'completed' && (
                <div className="flex items-center gap-2">
                  {processing.message.includes('C2PA') ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-green-500" />
                      <span className="text-green-600">C2PA Protected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-yellow-500" />
                      <span className="text-yellow-600">No C2PA Protection</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-champagne bg-champagne/10'
              : 'border-graphite/30 hover:border-graphite/50 bg-cocoa/30',
            processing.status !== 'idle' && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          {processing.status !== 'idle' ? (
            <div className="space-y-3">
              <Loader2 className="w-8 h-8 mx-auto text-champagne animate-spin" />
              <p className="text-pearl/70 text-sm">{processing.message}</p>
              {processing.progress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-champagne h-2 rounded-full transition-all duration-300"
                    style={{ width: `${processing.progress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto text-pearl/60 mb-2" />
              <p className="text-pearl/70 text-sm">
                {isDragActive
                  ? 'Drop the image here'
                  : 'Drag & drop an image, or click to select'}
              </p>
              <p className="text-pearl/50 text-xs mt-1">
                PNG, JPG, WEBP, TIFF up to 10MB
              </p>
            </>
          )}
        </div>
      )}

      {/* C2PA Controls */}
      {processing.status === 'idle' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="c2pa-toggle"
                checked={c2paEnabled}
                onCheckedChange={setC2paEnabled}
              />
              <Label htmlFor="c2pa-toggle" className="flex items-center gap-2 text-sm font-medium">
                <Shield className="w-4 h-4" />
                Enable C2PA Protection
              </Label>
            </div>
            {c2paEnabled && (
              <Dialog open={showC2PASettings} onOpenChange={setShowC2PASettings}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-1" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>C2PA Protection Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="watermark-text">Watermark Text</Label>
                        <Input
                          id="watermark-text"
                          value={c2paOptions.watermark_text}
                          onChange={(e) => setC2paOptions(prev => ({
                            ...prev,
                            watermark_text: e.target.value
                          }))}
                          placeholder="Verified by BM Beauty Studio"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="watermark-position">Position</Label>
                        <Select
                          value={c2paOptions.position}
                          onValueChange={(value: any) => setC2paOptions(prev => ({
                            ...prev,
                            position: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top-left">Top Left</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="manifest-title">Title</Label>
                      <Input
                        id="manifest-title"
                        value={manifestData.title}
                        onChange={(e) => setManifestData(prev => ({
                          ...prev,
                          title: e.target.value
                        }))}
                        placeholder={`${serviceType} Service - Before/After Photo`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="manifest-description">Description</Label>
                      <Textarea
                        id="manifest-description"
                        value={manifestData.description}
                        onChange={(e) => setManifestData(prev => ({
                          ...prev,
                          description: e.target.value
                        }))}
                        placeholder="Describe this image (e.g., client treatment before/after)"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-verify"
                        checked={c2paOptions.auto_verify}
                        onCheckedChange={(checked) => setC2paOptions(prev => ({
                          ...prev,
                          auto_verify: checked
                        }))}
                      />
                      <Label htmlFor="auto-verify" className="text-sm">
                        Automatically verify after upload
                      </Label>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Shield className="w-3 h-3" />
                      <span>C2PA protection ensures content authenticity and prevents unauthorized use</span>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {c2paEnabled && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500 mt-0.5" />
                <div className="text-xs text-green-700">
                  <p className="font-medium">C2PA Protection Enabled</p>
                  <p className="mt-1">
                    Your image will be cryptographically signed with a C2PA manifest to ensure
                    authenticity and build trust with your clients.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {processing.status === 'error' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
            <div className="text-sm text-red-700">
              <p className="font-medium">Upload Failed</p>
              <p className="text-xs mt-1">{processing.message}</p>
              <Button variant="outline" size="sm" onClick={resetUpload} className="mt-2">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default C2PAImageUpload