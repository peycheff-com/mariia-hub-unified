import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/lib/logger'
import { getEnvVar } from '@/lib/runtime-env'

export interface C2PAManifestData {
  title?: string
  description?: string
  assertions?: C2PAAssertion[]
  metadata?: Record<string, any>
}

export interface C2PAAssertion {
  label: string
  assertion_data: any
}

export interface C2PAVerificationResult {
  verified: boolean
  manifest?: C2PAManifest
  verification_details?: {
    manifest_integrity: boolean
    asset_integrity: boolean
    signature_valid: boolean
    issues: string[]
  }
  error?: string
}

export interface C2PAManifest {
  id: string
  media_asset_id: string
  manifest: {
    claim_generator: string
    claim_generated_at: string
    title: string
    description?: string
    author: string
    format: string
    ingredients: Array<{
      ingredient_type: string
      data: any
    }>
    assertions: C2PAAssertion[]
  }
  signature: {
    algorithm: string
    signature: number[]
    public_key?: string
  }
  validation_status: 'valid' | 'invalid' | 'pending'
  created_at: string
  c2pa_assertions?: Array<{
    assertion_type: string
    assertion_data: any
    assertion_label: string
  }>
  media_assets?: {
    original_filename: string
    mime_type: string
    cdn_url: string
  }
}

export interface MediaAsset {
  id: string
  original_filename: string
  mime_type: string
  file_size: number
  checksum: string
  cdn_url?: string
  bucket: string
  path: string
  uploaded_by: string
  created_at: string
}

export interface C2PAProcessingOptions {
  watermark_text?: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  opacity?: number
  auto_verify?: boolean
  batch_mode?: boolean
}

class C2PAService {
  private baseUrl = '/functions/v1/c2pa-watermark'
  private mediaProcessingUrl = '/functions/v1/media-processing'

  /**
   * Add C2PA watermark to a media asset
   */
  async addWatermark(
    mediaAssetId: string,
    manifestData: C2PAManifestData,
    options: C2PAProcessingOptions = {}
  ): Promise<{ success: boolean; manifest_id?: string; status?: string; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Authentication required')
      }

      // Prepare manifest data with standard assertions
      const enhancedManifestData: C2PAManifestData = {
        ...manifestData,
        assertions: [
          ...(manifestData.assertions || []),
          {
            label: 'c2pa.training-mining',
            assertion_data: {
              instances: [{ use: 'notAllowed' }],
              miners: [{ use: 'notAllowed' }]
            }
          },
          {
            label: 'c2pa.ingredients',
            assertion_data: {
              ingredients: [{
                uri: `supabase://${mediaAssetId}`,
                relationship: 'componentOf'
              }]
            }
          },
          {
            label: 'std.content.assertions',
            assertion_data: {
              content_credentials: {
                version: '1.0',
                format: manifestData.metadata?.format || 'image/jpeg',
                claim_generator: 'BM Beauty Studio C2PA Service v2.0',
                claim_generated: new Date().toISOString(),
                title: manifestData.title,
                thumbnail: null
              }
            }
          }
        ]
      }

      // Create C2PA manifest and signature
      const response = await fetch(`${this.baseUrl}/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': getEnvVar('VITE_SUPABASE_ANON_KEY', ['NEXT_PUBLIC_SUPABASE_ANON_KEY']) || ''
        },
        body: JSON.stringify({
          media_asset_id: mediaAssetId,
          manifest_data: enhancedManifestData,
          signature_data: {
            algorithm: 'ES256',
            timestamp: new Date().toISOString()
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create C2PA manifest')
      }

      const result = await response.json()

      // Queue watermark processing job
      await this.queueProcessingJob(mediaAssetId, result.manifest_id, options)

      logger.info('C2PA watermark created successfully', {
        mediaAssetId,
        manifestId: result.manifest_id,
        status: result.status
      })

      return result
    } catch (error) {
      logger.error('Error adding C2PA watermark:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Verify C2PA watermark on a media asset
   */
  async verifyWatermark(mediaAssetId: string): Promise<C2PAVerificationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': getEnvVar('VITE_SUPABASE_ANON_KEY', ['NEXT_PUBLIC_SUPABASE_ANON_KEY']) || ''
        },
        body: JSON.stringify({
          media_asset_id: mediaAssetId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          verified: false,
          error: error.error || 'Verification failed'
        }
      }

      const result = await response.json()
      return result
    } catch (error) {
      logger.error('Error verifying C2PA watermark:', error)
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Verification error'
      }
    }
  }

  /**
   * Extract C2PA metadata from a media asset
   */
  async extractMetadata(mediaAssetId: string): Promise<C2PAManifest | null> {
    try {
      const { data: manifest, error } = await supabase
        .from('c2pa_manifests')
        .select(`
          *,
          c2pa_assertions (*),
          media_assets (original_filename, mime_type, cdn_url)
        `)
        .eq('media_asset_id', mediaAssetId)
        .eq('is_active', true)
        .single()

      if (error || !manifest) {
        return null
      }

      return manifest as C2PAManifest
    } catch (error) {
      logger.error('Error extracting C2PA metadata:', error)
      return null
    }
  }

  /**
   * Batch process multiple media assets with C2PA watermarking
   */
  async batchProcessWatermarks(
    mediaAssetIds: string[],
    manifestDataTemplate: C2PAManifestData,
    options: C2PAProcessingOptions = {}
  ): Promise<{
    success: boolean
    results: Array<{ asset_id: string; success: boolean; manifest_id?: string; error?: string }>
    total_processed: number
    failed: number
  }> {
    const results = []
    let failed = 0

    for (const assetId of mediaAssetIds) {
      // Customize manifest for each asset
      const customManifestData = {
        ...manifestDataTemplate,
        title: manifestDataTemplate.title?.replace('{asset_id}', assetId) || `Asset ${assetId}`,
        metadata: {
          ...manifestDataTemplate.metadata,
          batch_id: `batch_${Date.now()}`,
          asset_id
        }
      }

      const result = await this.addWatermark(assetId, customManifestData, {
        ...options,
        batch_mode: true
      })

      results.push({
        asset_id: assetId,
        success: result.success,
        manifest_id: result.manifest_id,
        error: result.error
      })

      if (!result.success) {
        failed++
      }

      // Add delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    logger.info('Batch C2PA processing completed', {
      total: mediaAssetIds.length,
      successful: mediaAssetIds.length - failed,
      failed
    })

    return {
      success: failed === 0,
      results,
      total_processed: mediaAssetIds.length,
      failed
    }
  }

  /**
   * Queue a media processing job for watermark application
   */
  private async queueProcessingJob(
    mediaAssetId: string,
    manifestId: string,
    options: C2PAProcessingOptions
  ): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`${this.mediaProcessingUrl}/queue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': getEnvVar('VITE_SUPABASE_ANON_KEY', ['NEXT_PUBLIC_SUPABASE_ANON_KEY']) || ''
        },
        body: JSON.stringify({
          asset_id: mediaAssetId,
          job_type: 'c2pa_sign',
          job_data: {
            c2pa_manifest_id: manifestId,
            watermark_text: options.watermark_text || 'Verified by BM Beauty Studio',
            position: options.position || 'bottom-right',
            opacity: options.opacity || 0.7,
            auto_verify: options.auto_verify !== false
          },
          priority: options.batch_mode ? 5 : 1
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to queue processing job')
      }

      logger.info('Processing job queued successfully', {
        mediaAssetId,
        manifestId,
        jobType: 'c2pa_sign'
      })
    } catch (error) {
      logger.error('Error queueing processing job:', error)
      throw error
    }
  }

  /**
   * Get processing job status
   */
  async getProcessingStatus(jobId: string): Promise<any> {
    try {
      const { data: job, error } = await supabase
        .from('media_processing_jobs')
        .select(`
          *,
          media_assets (*)
        `)
        .eq('id', jobId)
        .single()

      if (error || !job) {
        throw new Error('Job not found')
      }

      return job
    } catch (error) {
      logger.error('Error getting processing status:', error)
      throw error
    }
  }

  /**
   * Create a public verification URL for sharing
   */
  createVerificationUrl(mediaAssetId: string): string {
    const baseUrl = window.location.origin
    return `${baseUrl}/verify/${mediaAssetId}`
  }

  /**
   * Generate QR code for verification
   */
  generateVerificationQR(mediaAssetId: string): string {
    const verificationUrl = this.createVerificationUrl(mediaAssetId)
    // Using a simple QR code API - in production, use a proper QR library
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}`
  }

  /**
   * Check if browser supports C2PA verification
   */
  static isBrowserSupported(): boolean {
    // Check for required APIs
    return !!(
      window.crypto &&
      window.crypto.subtle &&
      window.TextEncoder &&
      window.fetch &&
      window.FormData
    )
  }

  /**
   * Validate manifest data before submission
   */
  static validateManifestData(data: C2PAManifestData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required')
    }

    if (data.title && data.title.length > 200) {
      errors.push('Title must be less than 200 characters')
    }

    if (data.description && data.description.length > 1000) {
      errors.push('Description must be less than 1000 characters')
    }

    if (data.assertions) {
      if (!Array.isArray(data.assertions)) {
        errors.push('Assertions must be an array')
      } else if (data.assertions.length > 50) {
        errors.push('Too many assertions (max 50)')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get verification history for an asset
   */
  async getVerificationHistory(mediaAssetId: string): Promise<Array<{
    id: string
    verified_at: string
    verification_result: C2PAVerificationResult
    ip_address?: string
    user_agent?: string
  }>> {
    try {
      const { data, error } = await supabase
        .from('c2pa_verification_logs')
        .select('*')
        .eq('media_asset_id', mediaAssetId)
        .order('verified_at', { ascending: false })
        .limit(100)

      if (error) {
        throw new Error(`Failed to fetch verification history: ${error.message}`)
      }

      return data || []
    } catch (error) {
      logger.error('Error getting verification history:', error)
      return []
    }
  }

  /**
   * Revoke a C2PA manifest (e.g., for policy violations)
   */
  async revokeManifest(
    manifestId: string,
    reason: string,
    revokedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Authentication required')
      }

      // Check admin permissions
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single()

      if (!userRole) {
        throw new Error('Insufficient permissions to revoke manifest')
      }

      const { error } = await supabase
        .from('c2pa_manifests')
        .update({
          is_active: false,
          validation_status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by: revokedBy,
          revocation_reason: reason
        })
        .eq('id', manifestId)

      if (error) {
        throw new Error(`Failed to revoke manifest: ${error.message}`)
      }

      logger.warn('C2PA manifest revoked', {
        manifestId,
        reason,
        revokedBy
      })

      return { success: true }
    } catch (error) {
      logger.error('Error revoking manifest:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Revocation failed'
      }
    }
  }
}

export const c2paService = new C2PAService()
export default c2paService
