import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-BOOKING-CONFIRMATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { bookingId, userId } = await req.json();
    if (!bookingId || !userId) throw new Error("Missing required fields");
    logStep("Request data", { bookingId, userId });

    // Get booking details with service and user info
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        services (
          title,
          service_type,
          duration_minutes
        ),
        profiles (
          full_name,
          email
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }
    logStep("Booking found", { serviceTitle: booking.services?.title });

    const userEmail = booking.profiles?.email;
    const userName = booking.profiles?.full_name || 'Valued Client';
    const serviceName = booking.services?.title || 'Service';
    const localePref = (booking.language_preference || booking.profiles?.preferred_language || 'en').toLowerCase();
    const locale = localePref === 'pl' ? 'pl-PL' : localePref === 'ua' ? 'uk-UA' : localePref === 'ru' ? 'ru-RU' : 'en-GB';
    const bookingDate = new Date(booking.booking_date).toLocaleString(locale, {
      dateStyle: 'full',
      timeStyle: 'short',
    });
    const isPL = locale.startsWith('pl');
    const isUA = locale.startsWith('uk');
    const isRU = locale.startsWith('ru');
    const duration = booking.services?.duration_minutes ? `${booking.services.duration_minutes} ${isPL ? 'min' : isUA ? 'хв' : isRU ? 'мин' : 'minutes'}` : '';
    const amount = booking.amount_paid ? `${booking.amount_paid} ${booking.currency?.toUpperCase()}` : '';

    const t = (key: string) => {
      const K = ['en','pl','ua','ru'] as const;
      const lang = isPL ? 'pl' : isUA ? 'ua' : isRU ? 'ru' : 'en';
      const dict: Record<typeof K[number], Record<string,string>> = {
        en: { subject: `Booking Confirmed: ${serviceName}`, confirmed: 'Booking Confirmed! ✨', greeting: `Dear ${userName},`, thanks: 'Thank you for your booking! Your appointment has been confirmed and payment received.', details: 'Booking Details', service: 'Service:', datetime: 'Date & Time:', duration: 'Duration:', amount: 'Amount Paid:', status: 'Status:', confirmedBadge: '✓ Confirmed', locationLabel: 'Location:', location: 'ul. Smolna 8, lok. 254\nWarszawa, Poland', needReschedule: 'Need to reschedule?', reschedInfo: 'Use your dashboard or the reschedule link (if available) at least 24 hours in advance:', lookingForward: 'Looking forward to seeing you!', best: 'Best regards,' },
        pl: { subject: `Potwierdzenie rezerwacji: ${serviceName}`, confirmed: 'Rezerwacja potwierdzona! ✨', greeting: `Droga/Drogi ${userName},`, thanks: 'Dziękujemy za rezerwację! Twoja wizyta została potwierdzona, płatność otrzymana.', details: 'Szczegóły rezerwacji', service: 'Usługa:', datetime: 'Data i godzina:', duration: 'Czas trwania:', amount: 'Kwota:', status: 'Status:', confirmedBadge: '✓ Potwierdzona', locationLabel: 'Miejsce:', location: 'ul. Smolna 8, lok. 254\nWarszawa, Polska', needReschedule: 'Chcesz przełożyć?', reschedInfo: 'Użyj panelu klienta lub linku do zmiany terminu (jeśli dostępny) co najmniej 24h wcześniej:', lookingForward: 'Do zobaczenia!', best: 'Pozdrawiamy,' },
        ua: { subject: `Підтвердження бронювання: ${serviceName}`, confirmed: 'Бронювання підтверджено! ✨', greeting: `Шановна/Шановний ${userName},`, thanks: 'Дякуємо за бронювання! Ваш візит підтверджено, оплату отримано.', details: 'Деталі бронювання', service: 'Послуга:', datetime: 'Дата і час:', duration: 'Тривалість:', amount: 'Сума:', status: 'Статус:', confirmedBadge: '✓ Підтверджено', locationLabel: 'Локація:', location: 'ul. Smolna 8, lok. 254\nВаршава, Польща', needReschedule: 'Потрібно перенести?', reschedInfo: 'Використовуйте кабінет або посилання для перенесення (якщо доступно) щонайменше за 24 год:', lookingForward: 'До зустрічі!', best: 'З повагою,' },
        ru: { subject: `Подтверждение записи: ${serviceName}`, confirmed: 'Запись подтверждена! ✨', greeting: `Уважаемая/Уважаемый ${userName},`, thanks: 'Спасибо за запись! Визит подтвержден, оплата получена.', details: 'Детали записи', service: 'Услуга:', datetime: 'Дата и время:', duration: 'Длительность:', amount: 'Сумма:', status: 'Статус:', confirmedBadge: '✓ Подтверждено', locationLabel: 'Место:', location: 'ul. Smolna 8, lok. 254\nВаршава, Польша', needReschedule: 'Хотите перенести?', reschedInfo: 'Используйте кабинет или ссылку для переноса (если доступна) минимум за 24 часа:', lookingForward: 'До встречи!', best: 'С уважением,' },
      };
      return dict[lang][key];
    };

    // Optional: generate ICS calendar content
    const start = new Date(booking.booking_date);
    const end = new Date(start.getTime() + (booking.services?.duration_minutes || 60) * 60000);
    const dt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Mariia//Booking//EN\nBEGIN:VEVENT\nUID:${booking.id}\nDTSTAMP:${dt(new Date())}\nDTSTART:${dt(start)}\nDTEND:${dt(end)}\nSUMMARY:${serviceName}\nLOCATION:ul. Smolna 8, lok. 254, Warszawa\nDESCRIPTION:Booking with Mariia Borysevych\nEND:VEVENT\nEND:VCALENDAR`;

    // Send confirmation email using Resend SDK
    const { data: emailData, error } = await resend.emails.send({
      from: "BM Beauty Studio <bookings@bmbeautystudio.pl>",
      to: [userEmail],
      subject: t('subject'),
      attachments: [{ filename: "booking.ics", content: ics }],
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #D4AF37 0%, #C19A6B 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .booking-details {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #D4AF37;
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #eee;
              }
              .detail-row:last-child {
                border-bottom: none;
              }
              .label {
                font-weight: 600;
                color: #666;
              }
              .value {
                color: #333;
              }
              .footer {
                text-align: center;
                padding: 20px;
                color: #999;
                font-size: 12px;
              }
              .button {
                display: inline-block;
                padding: 12px 30px;
                background: #D4AF37;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">${t('confirmed')}</h1>
            </div>
            <div class="content">
              <p>${t('greeting')}</p>
              <p>${t('thanks')}</p>
              
              <div class="booking-details">
                <h2 style="margin-top: 0; color: #D4AF37;">${t('details')}</h2>
                <div class="detail-row">
                  <span class="label">${t('service')}</span>
                  <span class="value">${serviceName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">${t('datetime')}</span>
                  <span class="value">${bookingDate}</span>
                </div>
                ${duration ? `
                <div class="detail-row">
                  <span class="label">${t('duration')}</span>
                  <span class="value">${duration}</span>
                </div>
                ` : ''}
                ${amount ? `
                <div class="detail-row">
                  <span class="label">${t('amount')}</span>
                  <span class="value">${amount}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span class="label">${t('status')}</span>
                  <span class="value" style="color: #22c55e; font-weight: 600;">${t('confirmedBadge')}</span>
                </div>
              </div>

              <p><strong>${t('locationLabel')}</strong><br>
              ${t('location').replace(/\n/g,'<br>')}</p>

              <p><strong>What to bring:</strong></p>
              <ul>
                <li>Valid ID</li>
                <li>Any relevant medical information</li>
                <li>Comfortable clothing (for fitness sessions)</li>
              </ul>

              <p><strong>${t('needReschedule')}</strong><br>
              ${t('reschedInfo')}</p>

              <p>
                <a class="button" href="${Deno.env.get('SITE_URL') || 'https://lovable.app'}/dashboard">Open Dashboard</a>
              </p>

              <p style="margin-top: 30px;">${t('lookingForward')}</p>
              <p>${t('best')}<br>
              <strong>Mariia Borysevych</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Mariia Borysevych. All rights reserved.</p>
              <p>ul. Smolna 8, lok. 254, Warszawa, Poland</p>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(error.message);
    }

    logStep("Email sent", { response: emailData });

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
