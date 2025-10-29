import React, { useState, useEffect } from 'react'
import { Shield, ShieldCheck, ShieldX, CheckCircle, AlertCircle, Info } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { c2paService, C2PAVerificationResult } from '@/services/c2paService'
import { logger } from '@/lib/logger'

interface C2PAVerificationBadgeProps {
  mediaAssetId: string
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
  className?: string
  onVerificationComplete?: (result: C2PAVerificationResult) => void
}

type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'invalid' | 'error'

export const C2PAVerificationBadge: React.FC<C2PAVerificationBadgeProps> = ({
  mediaAssetId,
  size = 'md',
  showDetails = false,
  className,
  onVerificationComplete
}) => {
  const [status, setStatus] = useState<VerificationStatus>('idle')
  const [result, setResult] = useState<C2PAVerificationResult | null>(null)
  const [showFullDetails, setShowFullDetails] = useState(false)

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20
  }

  useEffect(() => {
    if (mediaAssetId && status === 'idle') {
      verifyImage()
    }
  }, [mediaAssetId])

  const verifyImage = async () => {
    setStatus('verifying')
    setResult(null)

    try {
      const verificationResult = await c2paService.verifyWatermark(mediaAssetId)
      setResult(verificationResult)

      if (verificationResult.verified) {
        setStatus('verified')
      } else {
        setStatus('invalid')
      }

      onVerificationComplete?.(verificationResult)
    } catch (error) {
      logger.error('Verification failed:', error)
      setStatus('error')
      setResult({
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      })
    }
  }

  const getStatusIcon = () => {
    const iconSize = iconSizes[size]

    switch (status) {
      case 'verifying':
        return <AlertCircle className={`animate-pulse text-blue-500`} size={iconSize} />
      case 'verified':
        return <ShieldCheck className="text-green-500" size={iconSize} />
      case 'invalid':
        return <ShieldX className="text-red-500" size={iconSize} />
      case 'error':
        return <AlertCircle className="text-orange-500" size={iconSize} />
      default:
        return <Shield className="text-gray-400" size={iconSize} />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'verifying':
        return 'Verifying...'
      case 'verified':
        return 'C2PA Verified'
      case 'invalid':
        return 'Not Verified'
      case 'error':
        return 'Verification Error'
      default:
        return 'Check Authenticity'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'verifying':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'invalid':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'error':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const BadgeContent = () => (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-2 font-medium cursor-pointer transition-all hover:shadow-md',
        sizeClasses[size],
        getStatusColor(),
        className
      )}
      onClick={() => showDetails && setShowFullDetails(!showFullDetails)}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {showDetails && status === 'verified' && (
        <Info size={iconSizes[size]} className="text-blue-500" />
      )}
    </Badge>
  )

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <BadgeContent />
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              {status === 'verified' ? (
                <div>
                  <p className="font-medium text-green-600">Authentic Content</p>
                  <p className="text-xs text-gray-600">C2PA watermark verified</p>
                </div>
              ) : status === 'invalid' ? (
                <div>
                  <p className="font-medium text-red-600">Unverified Content</p>
                  <p className="text-xs text-gray-600">{result?.error || 'No C2PA watermark found'}</p>
                </div>
              ) : status === 'verifying' ? (
                <div>
                  <p className="font-medium text-blue-600">Verifying...</p>
                  <p className="text-xs text-gray-600">Checking authenticity</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-600">Unknown Status</p>
                  <p className="text-xs text-gray-600">Click to verify</p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="space-y-3">
      <BadgeContent />

      {showFullDetails && result && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <ShieldCheck className="text-green-500" size={18} />
            Verification Details
          </h4>

          {result.verified ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="text-green-500" size={16} />
                <span className="text-green-700">Content authenticity verified</span>
              </div>

              {result.manifest && (
                <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="font-medium">Generated by:</span>{' '}
                      {result.manifest.manifest.claim_generator}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {new Date(result.manifest.claim_generated_at).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Author:</span>{' '}
                      {result.manifest.manifest.author}
                    </div>
                    {result.manifest.manifest.title && (
                      <div>
                        <span className="font-medium">Title:</span>{' '}
                        {result.manifest.manifest.title}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.verification_details && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium">Security Checks:</p>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={result.verification_details.manifest_integrity ? 'text-green-500' : 'text-red-500'} size={14} />
                      <span>Manifest Integrity: {result.verification_details.manifest_integrity ? 'Valid' : 'Invalid'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={result.verification_details.asset_integrity ? 'text-green-500' : 'text-red-500'} size={14} />
                      <span>Asset Integrity: {result.verification_details.asset_integrity ? 'Valid' : 'Modified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={result.verification_details.signature_valid ? 'text-green-500' : 'text-red-500'} size={14} />
                      <span>Digital Signature: {result.verification_details.signature_valid ? 'Valid' : 'Invalid'}</span>
                    </div>
                  </div>

                  {result.verification_details.issues && result.verification_details.issues.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs font-medium text-yellow-800">Issues:</p>
                      <ul className="text-xs text-yellow-700 list-disc list-inside">
                        {result.verification_details.issues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="text-red-500" size={16} />
                <span className="text-red-700">Content could not be verified</span>
              </div>
              {result.error && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {result.error}
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={verifyImage}
              className="text-xs"
            >
              Re-verify
            </Button>

            {result.verified && result.manifest && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(c2paService.createVerificationUrl(mediaAssetId), '_blank')}
                className="text-xs"
              >
                View Certificate
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default C2PAVerificationBadge