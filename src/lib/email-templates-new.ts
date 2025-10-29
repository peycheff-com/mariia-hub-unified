// Multi-language Email and SMS Templates
// Centralized template system for all communication

import { useI18n } from './i18n-utils';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
  variables?: Record<string, any>;
}

export interface SMSTemplate {
  text: string;
  variables?: Record<string, any>;
}

// Email templates
export const emailTemplates = {
  en: {
    bookingConfirmation: (data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
      location: string;
      price: string;
    }): EmailTemplate => ({
      subject: 'Booking Confirmation - Mariia Beauty & Fitness',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B4513, #D2691E); color: white; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed! ✨</h1>
              <p>Hi ${data.clientName}, your appointment has been successfully booked.</p>
            </div>
            <div class="content">
              <h2>Appointment Details</h2>
              <div class="details">
                <div class="detail-row">
                  <strong>Service:</strong>
                  <span>${data.serviceName}</span>
                </div>
                <div class="detail-row">
                  <strong>Date:</strong>
                  <span>${data.date}</span>
                </div>
                <div class="detail-row">
                  <strong>Time:</strong>
                  <span>${data.time}</span>
                </div>
                <div class="detail-row">
                  <strong>Location:</strong>
                  <span>${data.location}</span>
                </div>
                <div class="detail-row">
                  <strong>Price:</strong>
                  <span>${data.price}</span>
                </div>
              </div>
              <p>Please arrive 5 minutes early. If you need to reschedule, you can do so from your client portal.</p>
              <a href="https://bmbeautystudio.pl/client-portal" class="button">Manage Booking</a>
            </div>
            <div class="footer">
              <p>Mariia Beauty & Fitness</p>
              <p>Smolna 8, 00-001 Warsaw, Poland</p>
              <p>+48 536 200 573</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Booking Confirmation - Mariia Beauty & Fitness

        Hi ${data.clientName},

        Your appointment has been successfully booked:

        Service: ${data.serviceName}
        Date: ${data.date}
        Time: ${data.time}
        Location: ${data.location}
        Price: ${data.price}

        Please arrive 5 minutes early. If you need to reschedule, visit your client portal.

        Manage your booking: https://bmbeautystudio.pl/client-portal

        Mariia Beauty & Fitness
        Smolna 8, 00-001 Warsaw, Poland
        +48 536 200 573
      `,
    }),

    bookingReminder: (data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
      location: string;
    }): EmailTemplate => ({
      subject: 'Reminder: Your appointment tomorrow',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Reminder</title>
          <style>
            body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B4513, #D2691E); color: white; border-radius: 10px; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .reminder-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Reminder</h1>
            </div>
            <div class="content">
              <p>Hi ${data.clientName},</p>
              <div class="reminder-box">
                <h3>Tomorrow at ${data.time}</h3>
                <p><strong>${data.serviceName}</strong></p>
                <p>${data.location}</p>
              </div>
              <p>We're looking forward to seeing you! Please remember:</p>
              <ul>
                <li>Arrive 5 minutes early</li>
                <li>Bring any necessary documents</li>
                <li>Free parking is available nearby</li>
              </ul>
              <p>See you tomorrow!</p>
            </div>
            <div class="footer">
              <p>Mariia Beauty & Fitness</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Appointment Reminder

        Hi ${data.clientName},

        This is a reminder for your appointment tomorrow:

        Time: ${data.time}
        Service: ${data.serviceName}
        Location: ${data.location}

        Please arrive 5 minutes early.

        See you tomorrow!

        Mariia Beauty & Fitness
      `,
    }),

    welcomeEmail: (data: { clientName: string; email: string }): EmailTemplate => ({
      subject: 'Welcome to Mariia Beauty & Fitness! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Mariia Beauty & Fitness</title>
          <style>
            body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B4513, #D2691E); color: white; border-radius: 10px; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .feature { padding: 15px; margin: 10px 0; background: white; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome, ${data.clientName}! 🎉</h1>
              <p>Thank you for joining Mariia Beauty & Fitness</p>
            </div>
            <div class="content">
              <p>We're excited to have you as part of our community! Your account has been successfully created.</p>

              <h3>What's next?</h3>
              <div class="feature">
                <h4>📅 Book Your First Appointment</h4>
                <p>Browse our services and book your treatment online in just a few clicks.</p>
                <a href="https://bmbeautystudio.pl/book" class="button">Book Now</a>
              </div>

              <div class="feature">
                <h4>📱 Download Our App</h4>
                <p>Get instant access to your bookings and manage appointments on the go.</p>
              </div>

              <div class="feature">
                <h4>💎 Join Loyalty Program</h4>
                <p>Earn points with every booking and redeem them for exclusive discounts.</p>
              </div>

              <p>If you have any questions, feel free to reach out to us at info@bmbeautystudio.pl or call +48 536 200 573.</p>
            </div>
            <div class="footer">
              <p>Mariia Beauty & Fitness</p>
              <p>Smolna 8, 00-001 Warsaw, Poland</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Mariia Beauty & Fitness!

        Dear ${data.clientName},

        Thank you for creating an account with us! We're excited to help you on your beauty and wellness journey.

        What you can do now:
        - Book your first appointment: https://bmbeautystudio.pl/book
        - Browse our services: https://bmbeautystudio.pl/services
        - Join our loyalty program to earn rewards

        Questions? Email us at info@bmbeautystudio.pl or call +48 536 200 573.

        See you soon!

        Mariia Borysevych
        Mariia Beauty & Fitness
      `,
    }),
  },

  pl: {
    bookingConfirmation: (data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
      location: string;
      price: string;
    }): EmailTemplate => ({
      subject: 'Potwierdzenie Rezerwacji - Mariia Beauty & Fitness',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Potwierdzenie Rezerwacji</title>
          <style>
            body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B4513, #D2691E); color: white; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Rezerwacja Potwierdzona! ✨</h1>
              <p>Cześć ${data.clientName}, Twoja wizyta została pomyślnie zarezerwowana.</p>
            </div>
            <div class="content">
              <h2>Szczegóły Wizyty</h2>
              <div class="details">
                <div class="detail-row">
                  <strong>Usługa:</strong>
                  <span>${data.serviceName}</span>
                </div>
                <div class="detail-row">
                  <strong>Data:</strong>
                  <span>${data.date}</span>
                </div>
                <div class="detail-row">
                  <strong>Godzina:</strong>
                  <span>${data.time}</span>
                </div>
                <div class="detail-row">
                  <strong>Lokalizacja:</strong>
                  <span>${data.location}</span>
                </div>
                <div class="detail-row">
                  <strong>Cena:</strong>
                  <span>${data.price}</span>
                </div>
              </div>
              <p>Prosimy przybyć 5 minut wcześniej. Jeśli musisz zmienić termin, możesz to zrobić w portalu klienta.</p>
              <a href="https://bmbeautystudio.pl/client-portal" class="button">Zarządzaj Rezerwacją</a>
            </div>
            <div class="footer">
              <p>Mariia Beauty & Fitness</p>
              <p>Smolna 8, 00-001 Warszawa, Polska</p>
              <p>+48 536 200 573</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Potwierdzenie Rezerwacji - Mariia Beauty & Fitness

        Cześć ${data.clientName},

        Twoja wizyta została pomyślnie zarezerwowana:

        Usługa: ${data.serviceName}
        Data: ${data.date}
        Godzina: ${data.time}
        Lokalizacja: ${data.location}
        Cena: ${data.price}

        Prosimy przybyć 5 minut wcześniej. Jeśli musisz zmienić termin, odwiedź portal klienta.

        Zarządzaj rezerwacją: https://bmbeautystudio.pl/client-portal

        Mariia Beauty & Fitness
        Smolna 8, 00-001 Warszawa, Polska
        +48 536 200 573
      `,
    }),

    bookingReminder: (data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
      location: string;
    }): EmailTemplate => ({
      subject: 'Przypomnienie: Twoja wizyta jutro',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Przypomnienie o Wizycie</title>
          <style>
            body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B4513, #D2691E); color: white; border-radius: 10px; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .reminder-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Przypomnienie o Wizycie</h1>
            </div>
            <div class="content">
              <p>Cześć ${data.clientName},</p>
              <div class="reminder-box">
                <h3>Jutro o ${data.time}</h3>
                <p><strong>${data.serviceName}</strong></p>
                <p>${data.location}</p>
              </div>
              <p>Cieszymy się, że Cię zobaczymy! Pamiętaj:</p>
              <ul>
                <li>Przybądź 5 minut wcześniej</li>
                <li>Zabierz potrzebne dokumenty</li>
                <li>Bezpłatny parking dostępny w pobliżu</li>
              </ul>
              <p>Do zobaczenia jutro!</p>
            </div>
            <div class="footer">
              <p>Mariia Beauty & Fitness</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Przypomnienie o Wizycie

        Cześć ${data.clientName},

        To przypomnienie o Twojej wizycie jutro:

        Godzina: ${data.time}
        Usługa: ${data.serviceName}
        Lokalizacja: ${data.location}

        Prosimy przybyć 5 minut wcześniej.

        Do zobaczenia jutro!

        Mariia Beauty & Fitness
      `,
    }),

    welcomeEmail: (data: { clientName: string; email: string }): EmailTemplate => ({
      subject: 'Witaj w Mariia Beauty & Fitness! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Witaj w Mariia Beauty & Fitness</title>
          <style>
            body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B4513, #D2691E); color: white; border-radius: 10px; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .feature { padding: 15px; margin: 10px 0; background: white; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Witaj, ${data.clientName}! 🎉</h1>
              <p>Dziękujemy za dołączenie do Mariia Beauty & Fitness</p>
            </div>
            <div class="content">
              <p>Cieszymy się, że jesteś częścią naszej społeczności! Twoje konto zostało pomyślnie utworzone.</p>

              <h3>Co dalej?</h3>
              <div class="feature">
                <h4>📅 Zarezerwuj Pierwszą Wizytę</h4>
                <p>Przeglądaj nasze usługi i rezerwuj zabieg online w kilka kliknięć.</p>
                <a href="https://bmbeautystudio.pl/book" class="button">Zarezerwuj Teraz</a>
              </div>

              <div class="feature">
                <h4>📱 Pobierz Naszą Aplikację</h4>
                <p>Otrzymaj natychmiastowy dostęp do rezerwacji i zarządzaj wizytami w drodze.</p>
              </div>

              <div class="feature">
                <h4>💎 Dołącz do Programu Lojalnościowego</h4>
                <p>Zdobywaj punkty przy każdej rezerwacji i wymieniaj je na ekskluzywne zniżki.</p>
              </div>

              <p>Jeśli masz pytania, skontaktuj się z nami pod adresem info@bmbeautystudio.pl lub zadzwoń +48 536 200 573.</p>
            </div>
            <div class="footer">
              <p>Mariia Beauty & Fitness</p>
              <p>Smolna 8, 00-001 Warszawa, Polska</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Witaj w Mariia Beauty & Fitness!

        Droga/y ${data.clientName},

        Dziękujemy za utworzenie konta! Cieszymy się, że możemy pomóc Ci w podróży po piękno i wellness.

        Co możesz zrobić teraz:
        - Zarezerwuj pierwszą wizytę: https://bmbeautystudio.pl/book
        - Przeglądaj nasze usługi: https://bmbeautystudio.pl/services
        - Dołącz do programu lojalnościowego i zdobywaj nagrody

        Pytania? Napisz do nas na info@bmbeautystudio.pl lub zadzwoń +48 536 200 573.

        Do zobaczenia wkrótce!

        Mariia Borysevych
        Mariia Beauty & Fitness
      `,
    }),
  },

  ua: {
    bookingConfirmation: (data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
      location: string;
      price: string;
    }): EmailTemplate => ({
      subject: 'Підтвердження Бронювання - Mariia Beauty & Fitness',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Підтвердження Бронювання</title>
          <style>
            body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B4513, #D2691E); color: white; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Бронювання Підтверджено! ✨</h1>
              <p>Вітаємо, ${data.clientName}! Ваш візит успішно заброньовано.</p>
            </div>
            <div class="content">
              <h2>Деталі Візиту</h2>
              <div class="details">
                <div class="detail-row">
                  <strong>Послуга:</strong>
                  <span>${data.serviceName}</span>
                </div>
                <div class="detail-row">
                  <strong>Дата:</strong>
                  <span>${data.date}</span>
                </div>
                <div class="detail-row">
                  <strong>Час:</strong>
                  <span>${data.time}</span>
                </div>
                <div class="detail-row">
                  <strong>Локація:</strong>
                  <span>${data.location}</span>
                </div>
                <div class="detail-row">
                  <strong>Ціна:</strong>
                  <span>${data.price}</span>
                </div>
              </div>
              <p>Будь ласка, прибудьте за 5 хвилин до початку. Якщо вам потрібно змінити час, ви можете зробити це в клієнтському порталі.</p>
              <a href="https://bmbeautystudio.pl/client-portal" class="button">Керувати Бронюванням</a>
            </div>
            <div class="footer">
              <p>Mariia Beauty & Fitness</p>
              <p>Smolna 8, 00-001 Варшава, Польща</p>
              <p>+48 536 200 573</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Підтвердження Бронювання - Mariia Beauty & Fitness

        Вітаємо, ${data.clientName}!

        Ваш візит успішно заброньовано:

        Послуга: ${data.serviceName}
        Дата: ${data.date}
        Час: ${data.time}
        Локація: ${data.location}
        Ціна: ${data.price}

        Будь ласка, прибудьте за 5 хвилин до початку. Якщо вам потрібно змінити час, відвідайте клієнтський портал.

        Керувати бронюванням: https://bmbeautystudio.pl/client-portal

        Mariia Beauty & Fitness
        Smolna 8, 00-001 Варшава, Польща
        +48 536 200 573
      `,
    }),

    bookingReminder: (data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
      location: string;
    }): EmailTemplate => ({
      subject: 'Нагадування: Ваш візит завтра',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Нагадування про Візит</title>
          <style>
            body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B4513, #D2691E); color: white; border-radius: 10px; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .reminder-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Нагадування про Візит</h1>
            </div>
            <div class="content">
              <p>Вітаємо, ${data.clientName}!</p>
              <div class="reminder-box">
                <h3>Завтра о ${data.time}</h3>
                <p><strong>${data.serviceName}</strong></p>
                <p>${data.location}</p>
              </div>
              <p>Ми чекаємо на вас з нетерпінням! Будь ласка, пам\'ятайте:</p>
              <ul>
                <li>Прибудьте за 5 хвилин до початку</li>
                <li>Візьміть необхідні документи</li>
                <li>Безкоштовна парковка доступна поблизу</li>
              </ul>
              <p>До зустрічі завтра!</p>
            </div>
            <div class="footer">
              <p>Mariia Beauty & Fitness</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Нагадування про Візит

        Вітаємо, ${data.clientName}!

        Це нагадування про ваш візит завтра:

        Час: ${data.time}
        Послуга: ${data.serviceName}
        Локація: ${data.location}

        Будь ласка, прибудьте за 5 хвилин до початку.

        До зустрічі завтра!

        Mariia Beauty & Fitness
      `,
    }),

    welcomeEmail: (data: { clientName: string; email: string }): EmailTemplate => ({
      subject: 'Ласкаво просимо до Mariia Beauty & Fitness! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ласкаво просимо до Mariia Beauty & Fitness</title>
          <style>
            body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B4513, #D2691E); color: white; border-radius: 10px; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .feature { padding: 15px; margin: 10px 0; background: white; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Вітаємо, ${data.clientName}! 🎉</h1>
              <p>Дякуємо за приєднання до Mariia Beauty & Fitness</p>
            </div>
            <div class="content">
              <p>Ми раді вітати вас у нашій спільноті! Ваш акаунт успішно створено.</p>

              <h3>Що далі?</h3>
              <div class="feature">
                <h4>📅 Забронюйте Перший Візит</h4>
                <p>Перегляньте наші послуги та забронюйте процедуру онлайн за кілька кліків.</p>
                <a href="https://bmbeautystudio.pl/book" class="button">Забронювати Тепер</a>
              </div>

              <div class="feature">
                <h4>📱 Завантажте Наш Додаток</h4>
                <p>Отримайте миттєвий доступ до бронювань та керуйте візитами в дорозі.</p>
              </div>

              <div class="feature">
                <h4>💎 Приєднуйтесь до Програми Лояльності</h4>
                <p>Заробляйте бали при кожному бронюванні та обмінюйте їх на ексклюзивні знижки.</p>
              </div>

              <p>Якщо у вас є питання, зв\'яжіться з нами за адресою info@bmbeautystudio.pl або зателефонуйте +48 536 200 573.</p>
            </div>
            <div class="footer">
              <p>Mariia Beauty & Fitness</p>
              <p>Smolna 8, 00-001 Варшава, Польща</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Ласкаво просимо до Mariia Beauty & Fitness!

        Шановний/а ${data.clientName},

        Дякуємо за створення акаунту! Ми раді допомогти вам у подорожі до краси та велнесу.

        Що ви можете зробити зараз:
        - Забронюйте перший візит: https://bmbeautystudio.pl/book
        - Перегляньте наші послуги: https://bmbeautystudio.pl/services
        - Приєднуйтесь до програми лояльності та отримуйте нагороди

        Питання? Напишіть нам на info@bmbeautystudio.pl або зателефонуйте +48 536 200 573.

        До зустрічі!

        Mariia Borysevych
        Mariia Beauty & Fitness
      `,
    }),
  },

  ru: {
    bookingConfirmation: (data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
      location: string;
      price: string;
    }): EmailTemplate => ({
      subject: 'Подтверждение Бронирования - Mariia Beauty & Fitness',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Подтверждение Бронирования</title>
          <style>
            body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B4513, #D2691E); color: white; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Бронирование Подтверждено! ✨</h1>
              <p>Здравствуйте, ${data.clientName}! Ваш визит успешно забронирован.</p>
            </div>
            <div class="content">
              <h2>Детали Визита</h2>
              <div class="details">
                <div class="detail-row">
                  <strong>Услуга:</strong>
                  <span>${data.serviceName}</span>
                </div>
                <div class="detail-row">
                  <strong>Дата:</strong>
                  <span>${data.date}</span>
                </div>
                <div class="detail-row">
                  <strong>Время:</strong>
                  <span>${data.time}</span>
                </div>
                <div class="detail-row">
                  <strong>Локация:</strong>
                  <span>${data.location}</span>
                </div>
                <div class="detail-row">
                  <strong>Цена:</strong>
                  <span>${data.price}</span>
                </div>
              </div>
              <p>Пожалуйста, приходите за 5 минут до начала. Если вам нужно изменить время, вы можете сделать это в клиентском портале.</p>
              <a href="https://bmbeautystudio.pl/client-portal" class="button">Управлять Бронированием</a>
            </div>
            <div class="footer">
              <p>Mariia Beauty & Fitness</p>
              <p>Smolna 8, 00-001 Варшава, Польша</p>
              <p>+48 536 200 573</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Подтверждение Бронирования - Mariia Beauty & Fitness

        Здравствуйте, ${data.clientName}!

        Ваш визит успешно забронирован:

        Услуга: ${data.serviceName}
        Дата: ${data.date}
        Время: ${data.time}
        Локация: ${data.location}
        Цена: ${data.price}

        Пожалуйста, приходите за 5 минут до начала. Если вам нужно изменить время, посетите клиентский портал.

        Управлять бронированием: https://bmbeautystudio.pl/client-portal

        Mariia Beauty & Fitness
        Smolna 8, 00-001 Варшава, Польша
        +48 536 200 573
      `,
    }),

    bookingReminder: (data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
      location: string;
    }): EmailTemplate => ({
      subject: 'Напоминание: Ваш визит завтра',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Напоминание о Визите</title>
          <style>
            body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B4513, #D2691E); color: white; border-radius: 10px; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .reminder-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Напоминание о Визите</h1>
            </div>
            <div class="content">
              <p>Здравствуйте, ${data.clientName}!</p>
              <div class="reminder-box">
                <h3>Завтра в ${data.time}</h3>
                <p><strong>${data.serviceName}</strong></p>
                <p>${data.location}</p>
              </div>
              <p>Мы с нетерпением ждём вас! Пожалуйста, помните:</p>
              <ul>
                <li>Приходите за 5 минут до начала</li>
                <li>Возьмите необходимые документы</li>
                <li>Бесплатная парковка доступна поблизости</li>
              </ul>
              <p>До встречи завтра!</p>
            </div>
            <div class="footer">
              <p>Mariia Beauty & Fitness</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Напоминание о Визите

        Здравствуйте, ${data.clientName}!

        Это напоминание о вашем визите завтра:

        Время: ${data.time}
        Услуга: ${data.serviceName}
        Локация: ${data.location}

        Пожалуйста, приходите за 5 минут до начала.

        До встречи завтра!

        Mariia Beauty & Fitness
      `,
    }),

    welcomeEmail: (data: { clientName: string; email: string }): EmailTemplate => ({
      subject: 'Добро пожаловать в Mariia Beauty & Fitness! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Добро пожаловать в Mariia Beauty & Fitness</title>
          <style>
            body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B4513, #D2691E); color: white; border-radius: 10px; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .feature { padding: 15px; margin: 10px 0; background: white; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Добро пожаловать, ${data.clientName}! 🎉</h1>
              <p>Спасибо за присоединение к Mariia Beauty & Fitness</p>
            </div>
            <div class="content">
              <p>Мы рады приветствовать вас в нашем сообществе! Ваш аккаунт успешно создан.</p>

              <h3>Что дальше?</h3>
              <div class="feature">
                <h4>📅 Забронируйте Первый Визит</h4>
                <p>Просмотрите наши услуги и забронируйте процедуру онлайн в несколько кликов.</p>
                <a href="https://bmbeautystudio.pl/book" class="button">Забронировать Сейчас</a>
              </div>

              <div class="feature">
                <h4>📱 Скачайте Наше Приложение</h4>
                <p>Получите мгновенный доступ к бронированиям и управляйте визитами в пути.</p>
              </div>

              <div class="feature">
                <h4>💎 Присоединяйтесь к Программе Лояльности</h4>
                <p>Зарабатывайте баллы при каждом бронировании и обменивайте их на эксклюзивные скидки.</p>
              </div>

              <p>Если у вас есть вопросы, свяжитесь с нами по адресу info@bmbeautystudio.pl или позвоните +48 536 200 573.</p>
            </div>
            <div class="footer">
              <p>Mariia Beauty & Fitness</p>
              <p>Smolna 8, 00-001 Варшава, Польша</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Добро пожаловать в Mariia Beauty & Fitness!

        Уважаемый/ая ${data.clientName},

        Спасибо за создание аккаунта! Мы рады помочь вам в путешествии к красоте и велнесу.

        Что вы можете сделать сейчас:
        - Забронируйте первый визит: https://bmbeautystudio.pl/book
        - Просмотрите наши услуги: https://bmbeautystudio.pl/services
        - Присоединяйтесь к программе лояльности и получайте награды

        Вопросы? Напишите нам на info@bmbeautystudio.pl или позвоните +48 536 200 573.

        До встречи!

        Mariia Borysevych
        Mariia Beauty & Fitness
      `,
    }),
  },
};

// SMS templates
export const smsTemplates = {
  en: {
    bookingConfirmation: (data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
    }): SMSTemplate => ({
      text: `Hi ${data.clientName}! Your ${data.serviceName} appointment is confirmed for ${data.date} at ${data.time}. Reply STOP to unsubscribe.`,
    }),

    bookingReminder: (data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
    }): SMSTemplate => ({
      text: `Reminder: Hi ${data.clientName}, you have a ${data.serviceName} appointment tomorrow at ${data.time}. See you there!`,
    }),

    appointmentCancellation: (data: {
      clientName: string;
      serviceName: string;
      date: string;
    }): SMSTemplate => ({
      text: `Hi ${data.clientName}, your ${data.serviceName} appointment on ${data.date} has been cancelled. Please book a new appointment at your convenience.`,
    }),
  },

  pl: {
    bookingConfirmation: (data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
    }): SMSTemplate => ({
      text: `Cześć ${data.clientName}! Twoja wizyta ${data.serviceName} jest potwierdzona na ${data.date} o ${data.time}. Odpisz STOP, aby zrezygnować.`,
    }),

    bookingReminder: (data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
    }): SMSTemplate => ({
      text: `Przypomnienie: Cześć ${data.clientName}, masz wizytę ${data.serviceName} jutro o ${data.time}. Do zobaczenia!`,
    }),

    appointmentCancellation: (data: {
      clientName: string;
      serviceName: string;
      date: string;
    }): SMSTemplate => ({
      text: `Cześć ${data.clientName}, Twoja wizyta ${data.serviceName} dnia ${data.date} została odwołana. Prosimy o zarezerwowanie nowej wizyty.`,
    }),
  },

  ua: {
    bookingConfirmation: (data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
    }): SMSTemplate => ({
      text: `Вітаємо, ${data.clientName}! Ваш візит ${data.serviceName} підтверджено на ${data.date} о ${data.time}. Відповідь STOP для відписки.`,
    }),

    bookingReminder: (data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
    }): SMSTemplate => ({
      text: `Нагадування: Вітаємо, ${data.clientName}, у вас візит ${data.serviceName} завтра о ${data.time}. До зустрічі!`,
    }),

    appointmentCancellation: (data: {
      clientName: string;
      serviceName: string;
      date: string;
    }): SMSTemplate => ({
      text: `Вітаємо, ${data.clientName}, ваш візит ${data.serviceName} на ${data.date} скасовано. Будь ласка, забронюйте новий візит.`,
    }),
  },

  ru: {
    bookingConfirmation: (data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
    }): SMSTemplate => ({
      text: `Здравствуйте, ${data.clientName}! Ваш визит ${data.serviceName} подтверждён на ${data.date} в ${data.time}. Ответьте STOP для отписки.`,
    }),

    bookingReminder: (data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
    }): SMSTemplate => ({
      text: `Напоминание: Здравствуйте, ${data.clientName}, у вас визит ${data.serviceName} завтра в ${data.time}. До встречи!`,
    }),

    appointmentCancellation: (data: {
      clientName: string;
      serviceName: string;
      date: string;
    }): SMSTemplate => ({
      text: `Здравствуйте, ${data.clientName}, ваш визит ${data.serviceName} на ${data.date} отменён. Пожалуйста, забронируйте новый визит.`,
    }),
  },
};

// Helper functions
export function getEmailTemplate(language: string, type: string, data: any): EmailTemplate {
  const templates = emailTemplates[language as keyof typeof emailTemplates];
  if (!templates) {
    console.warn(`No email templates found for language: ${language}`);
    return emailTemplates.en[type as keyof typeof emailTemplates.en]?.(data) || {
      subject: 'Email',
      html: '<p>Email content</p>',
      text: 'Email content',
    };
  }

  const template = templates[type as keyof typeof templates];
  if (!template || typeof template !== 'function') {
    console.warn(`No email template found for type: ${type}`);
    return {
      subject: 'Email',
      html: '<p>Email content</p>',
      text: 'Email content',
    };
  }

  return template(data);
}

export function getSMSTemplate(language: string, type: string, data: any): SMSTemplate {
  const templates = smsTemplates[language as keyof typeof smsTemplates];
  if (!templates) {
    console.warn(`No SMS templates found for language: ${language}`);
    return smsTemplates.en[type as keyof typeof smsTemplates.en]?.(data) || {
      text: 'SMS content',
    };
  }

  const template = templates[type as keyof typeof templates];
  if (!template || typeof template !== 'function') {
    console.warn(`No SMS template found for type: ${type}`);
    return { text: 'SMS content' };
  }

  return template(data);
}

// React hook for templates
export function useEmailTemplates() {
  const { currentLanguage } = useI18n();

  return {
    getEmailTemplate: (type: string, data: any) => getEmailTemplate(currentLanguage, type, data),
    getSMSTemplate: (type: string, data: any) => getSMSTemplate(currentLanguage, type, data),
  };
}

export default {
  emailTemplates,
  smsTemplates,
  getEmailTemplate,
  getSMSTemplate,
  useEmailTemplates,
};