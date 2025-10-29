import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import QRCode from 'https://deno.land/x/qrcode@v2.0.0/mod.ts'
import { PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    const { giftCardId, design } = await req.json()

    if (!giftCardId) {
      return new Response(
        JSON.stringify({ error: 'Gift card ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch gift card details
    const { data: giftCard, error: fetchError } = await supabaseClient
      .from('gift_cards')
      .select('*')
      .eq('id', giftCardId)
      .single()

    if (fetchError || !giftCard) {
      return new Response(
        JSON.stringify({ error: 'Gift card not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate QR code
    const qrData = JSON.stringify({
      code: giftCard.card_code,
      balance: giftCard.current_balance,
      currency: giftCard.currency,
      expiryDate: giftCard.expiry_date,
    })

    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([600, 850])
    const { width, height } = page.getSize()

    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Background color based on design
    const backgroundColors = {
      birthday: rgb(0.95, 0.85, 0.88), // Light pink
      holiday: rgb(0.9, 0.95, 0.9), // Light green
      general: rgb(0.94, 0.92, 0.84), // Light gold
      custom: rgb(0.93, 0.93, 0.93), // Light gray
    }

    const accentColors = {
      birthday: rgb(0.82, 0.4, 0.5),
      holiday: rgb(0.2, 0.6, 0.2),
      general: rgb(0.55, 0.35, 0.15),
      custom: rgb(0.3, 0.3, 0.3),
    }

    const bgColor = backgroundColors[design as keyof typeof backgroundColors] || backgroundColors.general
    const accentColor = accentColors[design as keyof typeof accentColors] || accentColors.general

    // Draw background
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: bgColor,
    })

    // Draw decorative border
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: accentColor,
      borderWidth: 3,
    })

    // Title
    const title = design === 'birthday' ? 'Voucher Urodzinowy!' :
                  design === 'holiday' ? 'Voucher Świąteczny!' :
                  'Voucher Podarunkowy!'

    page.drawText(title, {
      x: width / 2,
      y: height - 120,
      size: 36,
      font: boldFont,
      color: accentColor,
      textAlign: 'center',
    })

    // Add decorative elements
    if (design === 'birthday') {
      // Draw balloons
      for (let i = 0; i < 3; i++) {
        page.drawCircle({
          x: 100 + i * 200,
          y: height - 200,
          radius: 15,
          color: rgb(0.9, 0.4, 0.5),
        })
        page.drawLine({
          start: { x: 100 + i * 200, y: height - 215 },
          end: { x: 100 + i * 200, y: height - 250 },
          thickness: 2,
          color: rgb(0.3, 0.3, 0.3),
        })
      }
    } else if (design === 'holiday') {
      // Draw stars
      const drawStar = (cx: number, cy: number, size: number) => {
        const spikes = 5
        const outerRadius = size
        const innerRadius = size / 2
        let rot = Math.PI / 2 * 3
        const step = Math.PI / spikes

        let x = cx
        let y = cy

        page.moveTo(x, y)

        for (let i = 0; i < spikes; i++) {
          x = cx + Math.cos(rot) * outerRadius
          y = cy + Math.sin(rot) * outerRadius
          page.lineTo(x, y)
          rot += step

          x = cx + Math.cos(rot) * innerRadius
          y = cy + Math.sin(rot) * innerRadius
          page.lineTo(x, y)
          rot += step
        }

        page.lineTo(cx, cy - outerRadius)
        page.closePath()
        page.fillColor(rgb(1, 0.8, 0))
        page.fill()
      }

      drawStar(150, height - 180, 20)
      drawStar(450, height - 180, 20)
    }

    // Gift card code section
    page.drawText('Kod Vouchera:', {
      x: width / 2,
      y: height - 320,
      size: 16,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
      textAlign: 'center',
    })

    // Draw code box
    const codeBoxY = height - 380
    page.drawRectangle({
      x: width / 2 - 120,
      y: codeBoxY - 30,
      width: 240,
      height: 60,
      color: rgb(1, 1, 1),
      borderColor: accentColor,
      borderWidth: 2,
    })

    page.drawText(giftCard.card_code, {
      x: width / 2,
      y: codeBoxY,
      size: 24,
      font: boldFont,
      color: accentColor,
      textAlign: 'center',
    })

    // QR Code
    // Convert QR data URL to image
    const qrImageBytes = await fetch(qrCodeDataUrl).then(res => res.arrayBuffer())
    const qrImage = await pdfDoc.embedPng(qrImageBytes)

    const qrSize = 120
    const qrX = (width - qrSize) / 2
    const qrY = height - 560

    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    })

    // Amount section
    const balanceText = `Wartość: ${giftCard.current_balance.toFixed(2)} ${giftCard.currency}`
    page.drawText(balanceText, {
      x: width / 2,
      y: qrY - 50,
      size: 20,
      font: boldFont,
      color: accentColor,
      textAlign: 'center',
    })

    // Recipient section
    if (giftCard.recipient_name) {
      page.drawText('Dla:', {
        x: 60,
        y: 200,
        size: 14,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      })

      page.drawText(giftCard.recipient_name, {
        x: 60,
        y: 180,
        size: 18,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      })
    }

    // Message section
    if (giftCard.message) {
      const messageY = 140
      page.drawText('Wiadomość:', {
        x: 60,
        y: messageY,
        size: 14,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      })

      // Split message into lines if too long
      const maxLineLength = 60
      const messageLines = []
      let currentLine = ''

      for (const word of giftCard.message.split(' ')) {
        if ((currentLine + word).length <= maxLineLength) {
          currentLine += (currentLine ? ' ' : '') + word
        } else {
          if (currentLine) messageLines.push(currentLine)
          currentLine = word
        }
      }
      if (currentLine) messageLines.push(currentLine)

      messageLines.forEach((line, index) => {
        page.drawText(line, {
          x: 60,
          y: messageY - 20 - (index * 18),
          size: 14,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        })
      })
    }

    // Expiry date
    if (giftCard.expiry_date) {
      const expiryDate = new Date(giftCard.expiry_date).toLocaleDateString('pl-PL')
      page.drawText(`Ważny do: ${expiryDate}`, {
        x: width - 60,
        y: 80,
        size: 12,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
        textAlign: 'right',
      })
    }

    // Footer
    page.drawText('Mariia Hub - Beauty & Fitness', {
      x: width / 2,
      y: 50,
      size: 12,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
      textAlign: 'center',
    })

    // Serialize PDF
    const pdfBytes = await pdfDoc.save()

    // Upload to Supabase Storage
    const fileName = `gift-card-${giftCard.card_code}.pdf`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('gift-cards')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('gift-cards')
      .getPublicUrl(fileName)

    // Update gift card record with PDF URL
    await supabaseClient
      .from('gift_cards')
      .update({ pdf_url: publicUrl })
      .eq('id', giftCardId)

    // Return PDF
    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="gift-card-${giftCard.card_code}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating gift card PDF:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})