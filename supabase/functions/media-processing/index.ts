import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash } from 'https://deno.land/std/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessingJob {
  id: string
  asset_id: string
  job_type: string
  job_status: string
  priority: number
  job_data: any
  result_data: any
  attempts: number
  max_attempts: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        },
      }
    )

    const { method, url } = req
    const urlParts = new URL(url)
    const path = urlParts.pathname

    // Route handling
    if (method === 'POST' && path.endsWith('/process')) {
      return await handleProcessJob(req, supabaseClient)
    } else if (method === 'POST' && path.endsWith('/queue')) {
      return await handleQueueJob(req, supabaseClient)
    } else if (method === 'GET' && path.endsWith('/queue')) {
      return await handleGetQueue(req, supabaseClient)
    } else if (method === 'POST' && path.endsWith('/batch')) {
      return await handleBatchProcess(req, supabaseClient)
    } else {
      return new Response(
        JSON.stringify({ error: 'Endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error in media-processing function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleProcessJob(req: Request, supabaseClient: any) {
  const { job_id } = await req.json()

  if (!job_id) {
    return new Response(
      JSON.stringify({ error: 'Missing job_id' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get job details
  const { data: job, error: jobError } = await supabaseClient
    .from('media_processing_jobs')
    .select(`
      *,
      media_assets (*)
    `)
    .eq('id', job_id)
    .single()

  if (jobError || !job) {
    return new Response(
      JSON.stringify({ error: 'Job not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Update job status to processing
  await supabaseClient
    .from('media_processing_jobs')
    .update({
      job_status: 'processing',
      started_at: new Date().toISOString()
    })
    .eq('id', job_id)

  try {
    let result: any = {}

    // Process based on job type
    switch (job.job_type) {
      case 'thumbnail':
        result = await generateThumbnail(job)
        break
      case 'watermark':
        result = await applyWatermark(job, supabaseClient)
        break
      case 'compress':
        result = await compressImage(job)
        break
      case 'analyze':
        result = await analyzeImage(job, supabaseClient)
        break
      case 'c2pa_sign':
        result = await applyC2PAWatermark(job, supabaseClient)
        break
      case 'face_detect':
        result = await detectFaces(job, supabaseClient)
        break
      case 'nsfw_detect':
        result = await detectNSFW(job, supabaseClient)
        break
      default:
        throw new Error(`Unknown job type: ${job.job_type}`)
    }

    // Update job as completed
    await supabaseClient
      .from('media_processing_jobs')
      .update({
        job_status: 'completed',
        progress: 100,
        result_data: result,
        completed_at: new Date().toISOString()
      })
      .eq('id', job_id)

    return new Response(
      JSON.stringify({
        success: true,
        job_id,
        result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error(`Job ${job_id} failed:`, error)

    // Update job as failed
    const newAttempts = job.attempts + 1
    const nextRetryAt = newAttempts < job.max_attempts
      ? new Date(Date.now() + Math.pow(2, newAttempts) * 60000).toISOString() // Exponential backoff
      : null

    await supabaseClient
      .from('media_processing_jobs')
      .update({
        job_status: newAttempts >= job.max_attempts ? 'failed' : 'pending',
        attempts: newAttempts,
        error_message: error.message,
        next_retry_at: nextRetryAt
      })
      .eq('id', job_id)

    return new Response(
      JSON.stringify({
        error: error.message,
        job_id,
        attempts: newAttempts,
        will_retry: newAttempts < job.max_attempts
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function generateThumbnail(job: ProcessingJob) {
  // Simulate thumbnail generation
  // In production, this would use image processing library
  await new Promise(resolve => setTimeout(resolve, 2000))

  const asset = job.media_assets
  const thumbnailPath = `thumbnails/${asset.id}_thumb.jpg`

  return {
    thumbnail_path: thumbnailPath,
    thumbnail_url: `https://cdn.example.com/${thumbnailPath}`,
    width: 300,
    height: 300,
    file_size: Math.floor(asset.file_size * 0.1)
  }
}

async function applyWatermark(job: ProcessingJob, supabaseClient: any) {
  const { watermark_text, position = 'bottom-right' } = job.job_data

  // Simulate watermark application
  await new Promise(resolve => setTimeout(resolve, 3000))

  const watermarkedPath = `watermarked/${job.asset_id}_wm.jpg`

  // Store watermark info in privacy controls
  await supabaseClient
    .from('media_privacy_controls')
    .insert({
      asset_id: job.asset_id,
      control_type: 'watermark',
      control_config: {
        text: watermark_text,
        position,
        opacity: 0.7,
        applied_at: new Date().toISOString()
      }
    })

  return {
    watermarked_path: watermarkedPath,
    watermarked_url: `https://cdn.example.com/${watermarkedPath}`,
    watermark_applied: true
  }
}

async function compressImage(job: ProcessingJob) {
  const { quality = 80, format = 'jpeg' } = job.job_data

  // Simulate compression
  await new Promise(resolve => setTimeout(resolve, 1500))

  const originalSize = job.media_assets.file_size
  const compressedSize = Math.floor(originalSize * (quality / 100))
  const savings = originalSize - compressedSize

  const compressedPath = `compressed/${job.asset_id}_comp.${format}`

  return {
    compressed_path: compressedPath,
    compressed_url: `https://cdn.example.com/${compressedPath}`,
    original_size: originalSize,
    compressed_size: compressedSize,
    size_savings: savings,
    compression_ratio: ((savings / originalSize) * 100).toFixed(2) + '%'
  }
}

async function analyzeImage(job: ProcessingJob, supabaseClient: any) {
  // Simulate AI analysis
  await new Promise(resolve => setTimeout(resolve, 5000))

  const analysis = {
    colors: ['#E8D5C4', '#8B4513', '#F5DEB3', '#D2691E', '#DEB887'],
    dominant_color: '#E8D5C4',
    brightness: 0.75,
    contrast: 0.65,
    sharpness: 0.85,
    tags: ['portrait', 'beauty', 'close-up', 'professional'],
    objects: [
      { label: 'face', confidence: 0.98, bbox: { x: 150, y: 50, width: 200, height: 250 } },
      { label: 'lips', confidence: 0.92, bbox: { x: 200, y: 200, width: 100, height: 40 } }
    ]
  }

  // Auto-assign detected tags
  for (const tag of analysis.tags) {
    const { data: tagRecord } = await supabaseClient
      .from('media_metadata_tags')
      .select('id')
      .eq('name', tag)
      .single()

    if (tagRecord) {
      await supabaseClient
        .from('media_asset_tags')
        .insert({
          asset_id: job.asset_id,
          tag_id: tagRecord.id,
          auto_detected: true,
          detected_by: { model: 'vision-analyzer-v1', confidence: 0.9 }
        })
        .onConflict().ignore()
    }
  }

  return analysis
}

async function applyC2PAWatermark(job: ProcessingJob, supabaseClient: any) {
  const { c2pa_manifest_id, watermark_text, position } = job.job_data

  // Get C2PA manifest
  const { data: manifest } = await supabaseClient
    .from('c2pa_manifests')
    .select('manifest')
    .eq('id', c2pa_manifest_id)
    .single()

  // Simulate C2PA watermark embedding
  await new Promise(resolve => setTimeout(resolve, 4000))

  const c2paPath = `c2pa/${job.asset_id}_c2pa.jpg`

  return {
    c2pa_path: c2paPath,
    c2pa_url: `https://cdn.example.com/${c2paPath}`,
    c2pa_signed: true,
    manifest_id: c2pa_manifest_id,
    watermark_text,
    authenticity_guaranteed: true
  }
}

async function detectFaces(job: ProcessingJob, supabaseClient: any) {
  // Simulate face detection
  await new Promise(resolve => setTimeout(resolve, 3000))

  const detections = [
    {
      face_id: `face_${job.asset_id}_1`,
      bounding_box: { x: 180, y: 100, width: 140, height: 170 },
      confidence_score: 0.97,
      age_estimate: 28,
      gender: 'female',
      expression: 'neutral',
      landmarks: {
        left_eye: { x: 210, y: 140 },
        right_eye: { x: 290, y: 140 },
        nose: { x: 250, y: 180 },
        mouth: { x: 250, y: 220 }
      }
    }
  ]

  // Store face detections
  for (const face of detections) {
    await supabaseClient
      .from('media_face_detections')
      .insert({
        asset_id: job.asset_id,
        ...face
      })
  }

  return {
    faces_detected: detections.length,
    face_locations: detections,
    auto_blur_available: true
  }
}

async function detectNSFW(job: ProcessingJob, supabaseClient: any) {
  // Simulate NSFW detection
  await new Promise(resolve => setTimeout(resolve, 2000))

  const result = {
    safe: true,
    confidence: 0.99,
    categories: {
      explicit: 0.01,
      suggestive: 0.05,
      violence: 0.00,
      medical: 0.10
    }
  }

  // Auto-flag if potentially problematic
  if (result.confidence < 0.95) {
    await supabaseClient
      .from('media_moderation_queue')
      .insert({
        asset_id: job.asset_id,
        auto_flagged: true,
        flag_confidence: result.confidence,
        flag_reasons: Object.entries(result.categories)
          .filter(([_, score]) => (score as number) > 0.5)
          .map(([category]) => category),
        report_reason: 'Auto-detected potentially sensitive content'
      })
  }

  return result
}

async function handleQueueJob(req: Request, supabaseClient: any) {
  const { asset_id, job_type, job_data, priority = 5 } = await req.json()

  if (!asset_id || !job_type) {
    return new Response(
      JSON.stringify({ error: 'Missing asset_id or job_type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: job, error } = await supabaseClient
    .from('media_processing_jobs')
    .insert({
      asset_id,
      job_type,
      job_status: 'pending',
      priority,
      job_data: job_data || {},
      max_attempts: 3
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to queue job: ${error.message}`)
  }

  return new Response(
    JSON.stringify({
      success: true,
      job_id: job.id,
      status: 'queued'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleGetQueue(req: Request, supabaseClient: any) {
  const url = new URL(req.url)
  const status = url.searchParams.get('status') || 'pending'
  const limit = parseInt(url.searchParams.get('limit') || '10')

  const { data: jobs, error } = await supabaseClient
    .from('media_processing_jobs')
    .select(`
      *,
      media_assets (original_filename, mime_type)
    `)
    .eq('job_status', status)
    .order('priority, created_at', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch queue: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ jobs }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleBatchProcess(req: Request, supabaseClient: any) {
  const { asset_ids, job_types, job_data } = await req.json()

  if (!asset_ids || !Array.isArray(asset_ids) || !job_types) {
    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const jobs = []

  for (const asset_id of asset_ids) {
    for (const job_type of job_types) {
      const { data: job } = await supabaseClient
        .from('media_processing_jobs')
        .insert({
          asset_id,
          job_type,
          job_status: 'pending',
          priority: 5,
          job_data: job_data || {},
          max_attempts: 3
        })
        .select()
        .single()

      jobs.push(job)
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      jobs_queued: jobs.length,
      job_ids: jobs.map(j => j.id)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}