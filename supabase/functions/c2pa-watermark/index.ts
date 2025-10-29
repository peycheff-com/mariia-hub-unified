import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std/crypto/mod.ts'
import { encode as base64encode, decode as base64decode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface C2PAManifest {
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
  assertions: Array<{
    label: string
    assertion_data: any
  }>
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { method, url } = req
    const urlParts = new URL(url)
    const path = urlParts.pathname

    // Route handling
    if (method === 'POST' && path.endsWith('/sign')) {
      return await handleC2PASign(req, supabaseClient, user)
    } else if (method === 'POST' && path.endsWith('/verify')) {
      return await handleC2PAVerify(req, supabaseClient)
    } else if (method === 'GET' && path.includes('/manifest/')) {
      return await handleGetManifest(req, supabaseClient)
    } else {
      return new Response(
        JSON.stringify({ error: 'Endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error in c2pa-watermark function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleC2PASign(req: Request, supabaseClient: any, user: any) {
  const { media_asset_id, manifest_data, signature_data } = await req.json()

  if (!media_asset_id || !manifest_data) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Verify user has permission to sign this asset
  const { data: asset, error: assetError } = await supabaseClient
    .from('media_assets')
    .select('*')
    .eq('id', media_asset_id)
    .single()

  if (assetError || !asset) {
    return new Response(
      JSON.stringify({ error: 'Media asset not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check if user is admin or asset owner
  const { data: userRole } = await supabaseClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()

  if (asset.uploaded_by !== user.id && !userRole) {
    return new Response(
      JSON.stringify({ error: 'Insufficient permissions' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create C2PA manifest
  const manifest: C2PAManifest = {
    claim_generator: 'BM Beauty Studio C2PA Service v1.0',
    claim_generated_at: new Date().toISOString(),
    title: manifest_data.title || asset.original_filename,
    description: manifest_data.description || asset.description,
    author: user.email || 'Unknown',
    format: asset.mime_type,
    ingredients: [
      {
        ingredient_type: 'media_asset',
        data: {
          asset_id: media_asset_id,
          filename: asset.original_filename,
          checksum: asset.checksum,
          created_at: asset.created_at
        }
      }
    ],
    assertions: manifest_data.assertions || []
  }

  // Generate proper ECDSA signature for C2PA compliance
  const manifestString = JSON.stringify(manifest)
  const encoder = new TextEncoder()
  const data = encoder.encode(manifestString)

  // Generate ECDSA key pair for signing
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign', 'verify']
  )

  // Sign the manifest
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256'
    },
    keyPair.privateKey,
    data
  )

  // Export public key for verification
  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey)
  const publicKeyBase64 = base64encode(publicKeyBuffer)

  // Store manifest in database
  const { data: c2paManifest, error: manifestError } = await supabaseClient
    .from('c2pa_manifests')
    .insert({
      media_asset_id,
      manifest,
      signature: {
        algorithm: 'ES256',
        signature: Array.from(new Uint8Array(signature)),
        public_key: publicKeyBase64
      },
      claim_generator: manifest.claim_generator,
      claim_generated_at: manifest.claim_generated_at,
      validation_status: 'valid'
    })
    .select()
    .single()

  if (manifestError) {
    throw new Error(`Failed to create C2PA manifest: ${manifestError.message}`)
  }

  // Store assertions
  if (manifest.assertions && manifest.assertions.length > 0) {
    const assertionsToInsert = manifest.assertions.map(assertion => ({
      manifest_id: c2paManifest.id,
      assertion_type: assertion.label,
      assertion_data: assertion.assertion_data,
      assertion_label: assertion.label
    }))

    await supabaseClient
      .from('c2pa_assertions')
      .insert(assertionsToInsert)
  }

  // Add processing job for watermark embedding
  await supabaseClient
    .from('media_processing_jobs')
    .insert({
      asset_id: media_asset_id,
      job_type: 'watermark',
      job_status: 'pending',
      priority: 1,
      job_data: {
        c2pa_manifest_id: c2paManifest.id,
        watermark_text: 'Verified by BM Beauty Studio',
        position: 'bottom-right'
      }
    })

  return new Response(
    JSON.stringify({
      success: true,
      manifest_id: c2paManifest.id,
      status: 'signed'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleC2PAVerify(req: Request, supabaseClient: any) {
  const { media_asset_id } = await req.json()

  if (!media_asset_id) {
    return new Response(
      JSON.stringify({ error: 'Missing media_asset_id' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get C2PA manifest
  const { data: manifest, error: manifestError } = await supabaseClient
    .from('c2pa_manifests')
    .select(`
      *,
      c2pa_assertions (*)
    `)
    .eq('media_asset_id', media_asset_id)
    .eq('is_active', true)
    .single()

  if (manifestError || !manifest) {
    return new Response(
      JSON.stringify({
        error: 'No C2PA manifest found',
        verified: false
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get asset info for comparison
  const { data: asset } = await supabaseClient
    .from('media_assets')
    .select('checksum, file_size, created_at')
    .eq('id', media_asset_id)
    .single()

  // Verify manifest integrity and signature
  const verificationResult = {
    verified: true,
    manifest_integrity: true,
    asset_integrity: true,
    signature_valid: false,
    issues: [] as string[]
  }

  // Verify digital signature
  if (manifest.signature && manifest.signature.public_key) {
    try {
      const manifestString = JSON.stringify(manifest.manifest)
      const encoder = new TextEncoder()
      const data = encoder.encode(manifestString)

      // Import public key
      const publicKeyBuffer = base64decode(manifest.signature.public_key)
      const publicKey = await crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        false,
        ['verify']
      )

      // Verify signature
      const signatureArray = new Uint8Array(manifest.signature.signature)
      const isValid = await crypto.subtle.verify(
        {
          name: 'ECDSA',
          hash: 'SHA-256'
        },
        publicKey,
        signatureArray,
        data
      )

      verificationResult.signature_valid = isValid
      if (!isValid) {
        verificationResult.verified = false
        verificationResult.issues.push('Digital signature verification failed')
      }
    } catch (error) {
      verificationResult.signature_valid = false
      verificationResult.verified = false
      verificationResult.issues.push('Error verifying signature: ' + error.message)
    }
  } else {
    verificationResult.signature_valid = false
    verificationResult.verified = false
    verificationResult.issues.push('No signature found for verification')
  }

  // Check if asset has been modified
  if (asset && manifest.manifest.ingredients[0]) {
    const manifestChecksum = manifest.manifest.ingredients[0].data.checksum
    if (manifestChecksum !== asset.checksum) {
      verificationResult.asset_integrity = false
      verificationResult.verified = false
      verificationResult.issues.push('Asset checksum mismatch - file may have been modified')
    }
  }

  // Update validation status
  await supabaseClient
    .from('c2pa_manifests')
    .update({
      validation_status: verificationResult.verified ? 'valid' : 'invalid',
      validation_details: verificationResult
    })
    .eq('id', manifest.id)

  return new Response(
    JSON.stringify({
      verified: verificationResult.verified,
      manifest: {
        ...manifest,
        verification_details: verificationResult
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleGetManifest(req: Request, supabaseClient: any) {
  const url = new URL(req.url)
  const manifestId = url.pathname.split('/').pop()

  if (!manifestId) {
    return new Response(
      JSON.stringify({ error: 'Missing manifest ID' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: manifest, error } = await supabaseClient
    .from('c2pa_manifests')
    .select(`
      *,
      c2pa_assertions (*),
      media_assets (original_filename, mime_type, cdn_url)
    `)
    .eq('id', manifestId)
    .single()

  if (error || !manifest) {
    return new Response(
      JSON.stringify({ error: 'Manifest not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ manifest }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}