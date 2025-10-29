import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const getEmailTemplate = (giftCard: any, design: string) => {
  const templates = {
    birthday: {
      subject: '🎉 Voucher Urodzinowy od Mariia Hub!',
      theme: '#FF69B4',
      emoji: '🎂',
      title: 'Wszystkiego najlepszego!',
    },
    holiday: {
      subject: '🎄 Voucher Świąteczny od Mariia Hub!',
      theme: '#228B22',
      emoji: '🎁',
      title: 'Magiczne Święta!',
    },
    general: {
      subject: '🎁 Voucher Podarunkowy od Mariia Hub!',
      theme: '#DAA520',
      emoji: '💝',
      title: 'Specjalny Prezent!',
    },
    custom: {
      subject: '🎁 Voucher Podarunkowy od Mariia Hub!',
      theme: '#708090',
      emoji: '🌟',
      title: 'Dla Ciebie!',
    },
  }

  const template = templates[design as keyof typeof templates] || templates.general

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Voucher Podarunkowy</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, ${template.theme}, ${template.theme}dd);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 48px;
            margin: 0;
            font-weight: 700;
        }
        .header p {
            font-size: 20px;
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .voucher-info {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border: 2px dashed ${template.theme};
        }
        .code-box {
            background-color: white;
            border: 2px solid ${template.theme};
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 3px;
            color: ${template.theme};
            font-family: 'Courier New', monospace;
        }
        .amount {
            font-size: 24px;
            font-weight: 600;
            color: #333;
            margin: 10px 0;
        }
        .message {
            background-color: #fff9e6;
            border-left: 4px solid ${template.theme};
            padding: 15px;
            margin: 20px 0;
            font-style: italic;
        }
        .footer {
            background-color: #333;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .button {
            display: inline-block;
            background-color: ${template.theme};
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            transition: background-color 0.3s;
        }
        .button:hover {
            background-color: ${template.theme}dd;
        }
        .expiry {
            font-size: 14px;
            color: #666;
            margin-top: 10px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
            }
            .header h1 {
                font-size: 36px;
            }
            .code {
                font-size: 24px;
                letter-spacing: 1px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">✨ Mariia Hub</div>
            <h1>${template.emoji} ${template.title}</h1>
            <p>Otrzymałeś/aś voucher podarunkowy!</p>
        </div>

        <div class="content">
            <h2 style="color: ${template.theme}; margin-bottom: 10px;">
                Cześć ${giftCard.recipient_name || 'drogi/a przyjacielu'}!
            </h2>

            <p>Ktoś specjalny wręczył Ci voucher podarunkowy do Mariia Hub! Możesz go wykorzystać na nasze usługi beauty i fitness w Warszawie.</p>

            <div class="voucher-info">
                <h3 style="margin-top: 0; color: ${template.theme};">Szczegóły Vouchera:</h3>
                <div class="amount">
                    Wartość: <strong>${giftCard.current_balance.toFixed(2)} ${giftCard.currency}</strong>
                </div>
                ${giftCard.expiry_date ? `<div class="expiry">Ważny do: ${new Date(giftCard.expiry_date).toLocaleDateString('pl-PL')}</div>` : ''}
            </div>

            <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #666;">Twój unikalny kod vouchera:</p>
                <div class="code">${giftCard.card_code}</div>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                    Wpisz ten kod podczas rezerwacji online
                </p>
            </div>

            ${giftCard.message ? `
            <div class="message">
                <strong>Wiadomość od darczyńcy:</strong><br>
                "${giftCard.message}"
            </div>
            ` : ''}

            <div style="text-align: center;">
                <a href="https://mariia-hub.pl/rezerwacja" class="button">
                    Zarezerwuj teraz
                </a>
            </div>

            <h3 style="color: ${template.theme}; margin-top: 40px;">Jak wykorzystać voucher?</h3>
            <ol style="line-height: 1.8;">
                <li>Odwiedź naszą stronę i wybierz usługę</li>
                <li>Podczas płatności wpisz kod vouchera</li>
                <li>Ciesz się swoim zabiegiem!</li>
            </ol>

            <p style="margin-top: 30px; padding: 15px; background-color: #e8f4fd; border-radius: 8px;">
                <strong>Ważne informacje:</strong><br>
                • Voucher można wykorzystać na wszystkie usługi<br>
                • Można go wykorzystać częściowo - pozostała kwota zostaje zapisana<br>
                • Voucher jest ważny ${giftCard.expiry_date ? `do ${new Date(giftCard.expiry_date).toLocaleDateString('pl-PL')}` : 'bez ograniczeń czasowych'}<br>
                • W razie pytań skontaktuj się z nami: info@mariia-hub.pl
            </p>
        </div>

        <div class="footer">
            <div style="margin-bottom: 10px;">
                <strong>Mariia Hub</strong><br>
                Beauty & Fitness Studio<br>
                Warszawa, Polska
            </div>
            <div style="font-size: 12px; opacity: 0.8;">
                <p>tel: +48 123 456 789</p>
                <p>email: info@mariia-hub.pl</p>
                <p>web: mariia-hub.pl</p>
            </div>
        </div>
    </div>
</body>
</html>
`
}

serve(async (req) => {
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

    const { giftCardId, scheduleDate } = await req.json()

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

    // Get design from personalization data
    const design = giftCard.personalization_data?.design || 'general'

    // Generate PDF
    const pdfResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-gift-card-pdf`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ giftCardId, design }),
    })

    if (!pdfResponse.ok) {
      throw new Error('Failed to generate PDF')
    }

    const pdfBlob = await pdfResponse.blob()
    const pdfBase64 = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result?.toString().split(',')[1])
      reader.readAsDataURL(pdfBlob)
    })

    // Get email template
    const emailHtml = getEmailTemplate(giftCard, design)
    const template = templates[design as keyof typeof templates] || templates.general

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Mariia Hub <noreply@mariia-hub.pl>',
      to: [giftCard.recipient_email!],
      subject: template.subject,
      html: emailHtml,
      attachments: [
        {
          filename: `voucher-${giftCard.card_code}.pdf`,
          content: pdfBase64,
          type: 'application/pdf',
        },
      ],
    })

    if (emailError) {
      console.error('Email error:', emailError)
      throw emailError
    }

    // Update gift card delivery status
    const updateData: any = {
      delivery_status: 'sent',
      delivery_scheduled_at: null,
    }

    if (scheduleDate) {
      updateData.delivery_status = 'scheduled'
      updateData.delivery_scheduled_at = scheduleDate
    } else {
      updateData.delivery_status = 'delivered'
    }

    await supabaseClient
      .from('gift_cards')
      .update(updateData)
      .eq('id', giftCardId)

    // Log analytics
    await supabaseClient.from('gift_card_analytics').insert({
      gift_card_id: giftCardId,
      event_type: 'viewed',
      event_data: {
        delivery_method: 'email',
        email_id: emailData?.id,
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        messageId: emailData?.id,
        scheduled: !!scheduleDate,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending gift card email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

const templates = {
  birthday: {
    subject: '🎉 Voucher Urodzinowy od Mariia Hub!',
    theme: '#FF69B4',
    emoji: '🎂',
    title: 'Wszystkiego najlepszego!',
  },
  holiday: {
    subject: '🎄 Voucher Świąteczny od Mariia Hub!',
    theme: '#228B22',
    emoji: '🎁',
    title: 'Magiczne Święta!',
  },
  general: {
    subject: '🎁 Voucher Podarunkowy od Mariia Hub!',
    theme: '#DAA520',
    emoji: '💝',
    title: 'Specjalny Prezent!',
  },
  custom: {
    subject: '🎁 Voucher Podarunkowy od Mariia Hub!',
    theme: '#708090',
    emoji: '🌟',
    title: 'Dla Ciebie!',
  },
}