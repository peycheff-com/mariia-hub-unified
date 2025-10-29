import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SignatureCanvas } from 'react-signature-canvas'
import { FileText, Download, Upload, Calendar, User, Mail, Phone, Check, AlertCircle, Info } from 'lucide-react'

// DOMPurify removed - no longer needed after eliminating dangerouslySetInnerHTML
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

interface ConsentFormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'date' | 'checkbox' | 'textarea'
  label: string
  required: boolean
  options?: string[]
  description?: string
}

interface ConsentFormProps {
  formId: string
  title: string
  content: string
  fields: ConsentFormField[]
  onSubmit: (data: any, signature: string) => Promise<void>
  isSubmitting?: boolean
  className?: string
}

export const ModelConsentForm: React.FC<ConsentFormProps> = ({
  formId,
  title,
  content,
  fields,
  onSubmit,
  isSubmitting = false,
  className
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [signatureData, setSignatureData] = useState<string>('')
  const [isEmpty, setIsEmpty] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const signatureRef = useRef<SignatureCanvas>(null)

  useEffect(() => {
    // Initialize form with default values
    const initialData: Record<string, any> = {}
    fields.forEach(field => {
      if (field.type === 'checkbox') {
        initialData[field.id] = false
      }
    })
    setFormData(initialData)
  }, [fields])

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate required fields
    fields.forEach(field => {
      if (field.required) {
        const value = formData[field.id]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field.id] = `${field.label} is required`
        }
      }
    })

    // Validate signature
    if (isEmpty) {
      newErrors.signature = 'Signature is required'
    }

    // Validate terms agreement
    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const signatureString = signatureData
      await onSubmit(formData, signatureString)
    } catch (error) {
      console.error('Failed to submit consent form:', error)
    }
  }

  const clearSignature = () => {
    signatureRef.current?.clear()
    setSignatureData('')
    setIsEmpty(true)
  }

  const saveSignature = () => {
    if (signatureRef.current && !isEmpty) {
      const dataURL = signatureRef.current.toDataURL('image/png')
      setSignatureData(dataURL)
      setShowSignaturePad(false)
    }
  }

  const renderField = (field: ConsentFormField) => {
    const error = errors[field.id]
    const value = formData[field.id] || ''

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={cn(error && 'border-red-500')}
              placeholder={field.label}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={cn(error && 'border-red-500')}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={cn(error && 'border-red-500')}
              placeholder={field.label}
              rows={4}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id={field.id}
                checked={value}
                onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor={field.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </Label>
                {field.description && (
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                )}
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Content - Secure rendering without dangerouslySetInnerHTML */}
          <div className="prose prose-sm max-w-none">
            <div className="rounded-lg border p-4 bg-muted/30 whitespace-pre-wrap">
              {/* Content displayed as plain text to eliminate XSS risk */}
              {content}
            </div>
          </div>

          <Separator />

          {/* Form Fields */}
          <div className="grid gap-6 md:grid-cols-2">
            {fields.map(renderField)}
          </div>

          <Separator />

          {/* Signature Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Digital Signature</Label>
              {signatureData && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSignaturePad(true)}
                >
                  Edit Signature
                </Button>
              )}
            </div>

            <AnimatePresence>
              {showSignaturePad ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <SignatureCanvas
                      ref={signatureRef}
                      penColor="black"
                      canvasProps={{
                        className: 'w-full h-48 bg-white rounded border cursor-crosshair'
                      }}
                      onEnd={() => setIsEmpty(false)}
                      onBegin={() => setIsEmpty(false)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearSignature}
                    >
                      Clear
                    </Button>
                    <Button
                      type="button"
                      onClick={saveSignature}
                      disabled={isEmpty}
                    >
                      Save Signature
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowSignaturePad(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {signatureData ? (
                    <div className="space-y-2">
                      <img
                        src={signatureData}
                        alt="Signature"
                        className="h-32 border rounded bg-white"
                      />
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <Check className="h-4 w-4" />
                        Signature captured
                      </p>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSignaturePad(true)}
                      className="w-full h-32 border-dashed"
                    >
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileText className="h-8 w-8" />
                        <span>Click to sign</span>
                      </div>
                    </Button>
                  )}
                  {errors.signature && (
                    <p className="text-sm text-red-500">{errors.signature}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Terms Agreement */}
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                By signing this form, you agree that the images and/or videos may be used for promotional purposes,
                including but not limited to: website gallery, social media, marketing materials, and client testimonials.
                You retain the right to revoke this consent at any time by contacting us in writing.
              </AlertDescription>
            </Alert>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => {
                  setAgreedToTerms(checked as boolean)
                  if (errors.terms) {
                    setErrors(prev => ({ ...prev, terms: '' }))
                  }
                }}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="terms" className="text-sm font-medium">
                  I have read and agree to the terms and conditions above
                  <span className="text-red-500">*</span>
                </Label>
              </div>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-500">{errors.terms}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !signatureData || !agreedToTerms}
              className="min-w-[150px]"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Consent'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}