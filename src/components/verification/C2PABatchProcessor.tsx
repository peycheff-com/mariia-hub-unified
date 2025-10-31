import React, { useState, useEffect } from 'react'
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Upload,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Settings,
  Info
} from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { c2paService, C2PAProcessingOptions, C2PAManifestData } from '@/services/c2paService'
import { logger } from '@/lib/logger'

interface MediaAsset {
  id: string
  original_filename: string
  mime_type: string
  file_size: number
  cdn_url?: string
  created_at: string
  c2pa_status?: 'unprocessed' | 'processing' | 'verified' | 'failed'
  c2pa_manifest_id?: string
}

interface BatchJob {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  progress: number
  total_assets: number
  processed_assets: number
  successful_assets: number
  failed_assets: number
  started_at?: string
  completed_at?: string
  error?: string
}

interface ProcessingState {
  [assetId: string]: {
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    error?: string
    manifestId?: string
  }
}

export const C2PABatchProcessor: React.FC = () => {
  const { toast } = useToast()

  // State
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [currentJob, setCurrentJob] = useState<BatchJob | null>(null)
  const [processingStates, setProcessingStates] = useState<ProcessingState>({})
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState('queue')

  // Settings
  const [c2paOptions, setC2paOptions] = useState<C2PAProcessingOptions>({
    watermark_text: 'Verified by BM Beauty Studio',
    position: 'bottom-right',
    opacity: 0.7,
    auto_verify: true,
    batch_mode: true
  })

  const [manifestTemplate, setManifestTemplate] = useState<C2PAManifestData>({
    title: '{service_type} Service Photo',
    description: 'Professional treatment documentation',
    assertions: [
      {
        label: 'c2pa.training-mining',
        assertion_data: {
          instances: [{ use: 'notAllowed' }],
          miners: [{ use: 'notAllowed' }]
        }
      }
    ],
    metadata: {
      business_name: 'BM Beauty Studio',
      location: 'Warsaw, Poland',
      batch_processed: true
    }
  })

  // Load assets
  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('media_assets')
        .select(`
          *,
          c2pa_manifests (
            id,
            validation_status
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const processedAssets = data.map(asset => ({
        ...asset,
        c2pa_status: asset.c2pa_manifests?.[0]?.validation_status || 'unprocessed',
        c2pa_manifest_id: asset.c2pa_manifests?.[0]?.id
      }))

      setAssets(processedAssets)
    } catch (error) {
      logger.error('Failed to load assets:', error)
      toast({
        title: 'Error',
        description: 'Failed to load media assets',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssets(assets.filter(a => a.c2pa_status === 'unprocessed').map(a => a.id))
    } else {
      setSelectedAssets([])
    }
  }

  const handleSelectAsset = (assetId: string, checked: boolean) => {
    if (checked) {
      setSelectedAssets(prev => [...prev, assetId])
    } else {
      setSelectedAssets(prev => prev.filter(id => id !== assetId))
    }
  }

  const startBatchProcessing = async () => {
    if (selectedAssets.length === 0) {
      toast({
        title: 'No assets selected',
        description: 'Please select at least one asset to process',
        variant: 'destructive'
      })
      return
    }

    setProcessing(true)
    setCurrentJob({
      id: `batch_${Date.now()}`,
      status: 'running',
      progress: 0,
      total_assets: selectedAssets.length,
      processed_assets: 0,
      successful_assets: 0,
      failed_assets: 0,
      started_at: new Date().toISOString()
    })

    // Initialize processing states
    const initialStates: ProcessingState = {}
    selectedAssets.forEach(assetId => {
      initialStates[assetId] = { status: 'pending', progress: 0 }
    })
    setProcessingStates(initialStates)

    try {
      // Process assets one by one
      let successful = 0
      let failed = 0

      for (let i = 0; i < selectedAssets.length; i++) {
        const assetId = selectedAssets[i]

        // Update asset status to processing
        setProcessingStates(prev => ({
          ...prev,
          [assetId]: { status: 'processing', progress: 10 }
        }))

        try {
          // Customize manifest for this asset
          const asset = assets.find(a => a.id === assetId)
          const customManifest = {
            ...manifestTemplate,
            title: manifestTemplate.title.replace('{service_type}', 'Beauty'),
            metadata: {
              ...manifestTemplate.metadata,
              asset_id,
              original_filename: asset?.original_filename,
              batch_job_id: currentJob?.id
            }
          }

          setProcessingStates(prev => ({
            ...prev,
            [assetId]: { status: 'processing', progress: 30 }
          }))

          // Apply C2PA watermark
          const result = await c2paService.addWatermark(assetId, customManifest, c2paOptions)

          if (result.success) {
            successful++
            setProcessingStates(prev => ({
              ...prev,
              [assetId]: {
                status: 'completed',
                progress: 100,
                manifestId: result.manifest_id
              }
            }))
          } else {
            failed++
            setProcessingStates(prev => ({
              ...prev,
              [assetId]: {
                status: 'failed',
                progress: 0,
                error: result.error
              }
            }))
          }
        } catch (error) {
          failed++
          setProcessingStates(prev => ({
            ...prev,
            [assetId]: {
              status: 'failed',
              progress: 0,
              error: error instanceof Error ? error.message : 'Processing failed'
            }
          }))
        }

        // Update job progress
        const progress = Math.round(((i + 1) / selectedAssets.length) * 100)
        setCurrentJob(prev => prev ? {
          ...prev,
          progress,
          processed_assets: i + 1,
          successful_assets: successful,
          failed_assets: failed
        } : null)

        // Small delay between assets
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Complete job
      setCurrentJob(prev => prev ? {
        ...prev,
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString()
      } : null)

      toast({
        title: 'Batch processing completed',
        description: `Successfully processed ${successful} assets, ${failed} failed`,
        variant: failed === 0 ? 'default' : 'destructive'
      })

      // Reload assets
      await loadAssets()
    } catch (error) {
      logger.error('Batch processing failed:', error)
      setCurrentJob(prev => prev ? {
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      } : null)

      toast({
        title: 'Batch processing failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    } finally {
      setProcessing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      verified: 'default',
      processing: 'secondary',
      failed: 'destructive',
      unprocessed: 'outline'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    )
  }

  const exportResults = () => {
    if (!currentJob) return

    const results = {
      job: currentJob,
      assets: selectedAssets.map(assetId => {
        const asset = assets.find(a => a.id === assetId)
        const state = processingStates[assetId]
        return {
          asset_id: assetId,
          filename: asset?.original_filename,
          status: state?.status,
          manifest_id: state?.manifestId,
          error: state?.error
        }
      })
    }

    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `c2pa-batch-results-${currentJob.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            C2PA Batch Processing
          </h2>
          <p className="text-gray-600">
            Process multiple media assets with C2PA watermarking simultaneously
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Batch Processing Settings</DialogTitle>
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
                  <Label htmlFor="manifest-template">Default Title Template</Label>
                  <Input
                    id="manifest-template"
                    value={manifestTemplate.title}
                    onChange={(e) => setManifestTemplate(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    placeholder="Use {service_type} for dynamic insertion"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manifest-description">Default Description</Label>
                  <Textarea
                    id="manifest-description"
                    value={manifestTemplate.description}
                    onChange={(e) => setManifestTemplate(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                  />
                </div>

                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    These settings will be applied to all assets in the batch. You can customize
                    individual asset details during processing.
                  </AlertDescription>
                </Alert>
              </div>
            </DialogContent>
          </Dialog>

          {currentJob && currentJob.status === 'completed' && (
            <Button variant="outline" onClick={exportResults}>
              <Download className="w-4 h-4 mr-1" />
              Export Results
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="queue">
            Asset Queue ({selectedAssets.length})
          </TabsTrigger>
          <TabsTrigger value="processing">
            Processing
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {/* Job Status */}
          {currentJob && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Batch Job Status</span>
                  <Badge variant={
                    currentJob.status === 'completed' ? 'default' :
                    currentJob.status === 'failed' ? 'destructive' :
                    currentJob.status === 'running' ? 'secondary' : 'outline'
                  }>
                    {currentJob.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={currentJob.progress} className="w-full" />
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{currentJob.total_assets}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-500">{currentJob.processed_assets}</p>
                    <p className="text-xs text-gray-500">Processed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">{currentJob.successful_assets}</p>
                    <p className="text-xs text-gray-500">Successful</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-500">{currentJob.failed_assets}</p>
                    <p className="text-xs text-gray-500">Failed</p>
                  </div>
                </div>
                {currentJob.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{currentJob.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Asset Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Select Assets</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedAssets.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="select-all" className="text-sm">
                      Select All Unprocessed
                    </Label>
                  </div>
                  <Button
                    onClick={startBatchProcessing}
                    disabled={selectedAssets.length === 0 || processing}
                  >
                    {processing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Start Batch
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="w-4 h-4" />
                      <Skeleton className="w-full h-10" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Filename</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Processing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets.map((asset) => {
                        const processingState = processingStates[asset.id]
                        const isSelected = selectedAssets.includes(asset.id)
                        const canSelect = asset.c2pa_status === 'unprocessed'

                        return (
                          <TableRow key={asset.id}>
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handleSelectAsset(asset.id, !!checked)}
                                disabled={!canSelect || processing}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {asset.original_filename}
                            </TableCell>
                            <TableCell>{asset.mime_type}</TableCell>
                            <TableCell>
                              {(asset.file_size / 1024 / 1024).toFixed(2)} MB
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(asset.c2pa_status)}
                            </TableCell>
                            <TableCell>
                              {processingState ? (
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(processingState.status)}
                                  <Progress value={processingState.progress} className="w-16 h-2" />
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing">
          <Card>
            <CardHeader>
              <CardTitle>Currently Processing</CardTitle>
            </CardHeader>
            <CardContent>
              {currentJob && currentJob.status === 'running' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                    <div>
                      <p className="font-medium">Processing assets...</p>
                      <p className="text-sm text-gray-500">
                        {currentJob.processed_assets} of {currentJob.total_assets} completed
                      </p>
                    </div>
                  </div>
                  <Progress value={currentJob.progress} className="w-full" />
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No assets are currently being processed
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Manifest ID</TableHead>
                      <TableHead>Verification Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets
                      .filter(a => a.c2pa_status === 'verified' && a.c2pa_manifest_id)
                      .map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell className="font-medium">
                            {asset.original_filename}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {asset.c2pa_manifest_id}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/verify/${asset.id}`, '_blank')}
                            >
                              Verify
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default C2PABatchProcessor