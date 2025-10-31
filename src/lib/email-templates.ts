// Email and SMS templates for multi-language support
import { TranslationKeys } from './i18n/types';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface SMSTemplate {
  text: string;
}

export interface LocalizedTemplates {
  en: { email: Record<string, EmailTemplate>; sms: Record<string, SMSTemplate> };
  pl: { email: Record<string, EmailTemplate>; sms: Record<string, SMSTemplate> };
  ua: { email: Record<string, EmailTemplate>; sms: Record<string, SMSTemplate> };
  ru: { email: Record<string, EmailTemplate>; sms: Record<string, SMSTemplate> };
}

// Email templates with localization
export const emailTemplates: LocalizedTemplates = {
  en: {
    email: {
      'booking.confirmation': {
        subject: (data: { serviceName: string }) => `Booking Confirmed: ${data.serviceName}`,
        html: (data: any) => `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Booking Confirmation</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #D4AF37 0%, #C19A6B 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4AF37; }
                .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .label { font-weight: 600; color: #666; }
                .value { color: #333; }
                .button { display: inline-block; padding: 12px 30px; background: #D4AF37; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Booking Confirmed! ✨</h1>
                </div>
                <div class="content">
                  <p>Dear ${data.userName},</p>
                  <p>Thank you for your booking! Your appointment has been confirmed and payment received.</p>

                  <div class="details">
                    <h2>Booking Details</h2>
                    <div class="detail-row">
                      <span class="label">Service:</span>
                      <span class="value">${data.serviceName}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Date & Time:</span>
                      <span class="value">${data.bookingDate}</span>
                    </div>
                    ${data.duration ? `
                    <div class="detail-row">
                      <span class="label">Duration:</span>
                      <span class="value">${data.duration}</span>
                    </div>` : ''}
                    ${data.amount ? `
                    <div class="detail-row">
                      <span class="label">Amount Paid:</span>
                      <span class="value">${data.amount}</span>
                    </div>` : ''}
                    <div class="detail-row">
                      <span class="label">Status:</span>
                      <span class="value" style="color: #22c55e; font-weight: 600;">✓ Confirmed</span>
                    </div>
                  </div>

                  <p><strong>Location:</strong><br>
                  ul. Smolna 8, lok. 254<br>
                  Warszawa, Poland</p>

                  <a class="button" href="${data.dashboardUrl}">Open Dashboard</a>

                  <p>Looking forward to seeing you!</p>
                  <p>Best regards,<br>
                  <strong>Mariia Borysevych</strong></p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Mariia Borysevych. All rights reserved.</p>
                  <p>ul. Smolna 8, lok. 254, Warszawa, Poland</p>
                </div>
              </div>
            </body>
          </html>
        `,
      },
      'booking.reminder': {
        subject: (data: { serviceName: string }) => `Reminder: Your appointment tomorrow`,
        html: (data: any) => `
          <!-- Reminder email template for English -->
          <p>Hi ${data.userName},</p>
          <p>This is a friendly reminder about your appointment tomorrow:</p>
          <p><strong>${data.serviceName}</strong><br>
          ${data.bookingDate}</p>
          <p>Looking forward to seeing you!</p>
        `,
      },
      'booking.cancelled': {
        subject: 'Booking Cancelled',
        html: (data: any) => `
          <p>Hi ${data.userName},</p>
          <p>Your booking has been cancelled. If this was a mistake, please contact us.</p>
        `,
      },
      'newsletter.welcome': {
        subject: 'Welcome to Mariia Beauty & Fitness',
        html: (data: any) => `
          <p>Welcome ${data.userName}!</p>
          <p>Thank you for subscribing to our newsletter. You'll receive updates about new services, special offers, and wellness tips.</p>
        `,
      },
      'invoice.issued': {
        subject: (data: { invoiceNumber: string }) => `Invoice #${data.invoiceNumber} from mariiaborysevych`,
        html: (data: any) => `
          <!-- Invoice issued email template -->
          <p>Dear ${data.customerName},</p>
          <p>Thank you for your business. Please find your invoice details below:</p>
          <p>Invoice Number: ${data.invoiceNumber}</p>
          <p>Amount Due: ${data.amount} ${data.currency}</p>
          <p>Due Date: ${data.dueDate}</p>
          <p>View full invoice: <a href="${data.invoiceUrl}">${data.invoiceUrl}</a></p>
        `,
      },
      'invoice.reminder': {
        subject: (data: { invoiceNumber: string }) => `Payment Reminder for Invoice #${data.invoiceNumber}`,
        html: (data: any) => `
          <p>Dear ${data.customerName},</p>
          <p>This is a reminder that invoice #${data.invoiceNumber} is due soon.</p>
          <p>Amount: ${data.amount} ${data.currency}</p>
          <p>Due Date: ${data.dueDate}</p>
        `,
      },
      'invoice.overdue': {
        subject: (data: { invoiceNumber: string }) => `Overdue Invoice #${data.invoiceNumber}`,
        html: (data: any) => `
          <p>Dear ${data.customerName},</p>
          <p>Your invoice #${data.invoiceNumber} is now overdue.</p>
          <p>Please arrange payment immediately to avoid late fees.</p>
        `,
      },
    },
    sms: {
      'booking.confirmation': {
        text: (data: any) => `Booking confirmed! ${data.serviceName} on ${data.bookingDate}. See you soon! 📅`,
      },
      'booking.reminder': {
        text: (data: any) => `Reminder: ${data.serviceName} appointment tomorrow at ${data.time}. Reply CANCEL to reschedule.`,
      },
    },
  },
  pl: {
    email: {
      'booking.confirmation': {
        subject: (data: { serviceName: string }) => `Potwierdzenie rezerwacji: ${data.serviceName}`,
        html: (data: any) => `
          <div class="header">
            <h1>Rezerwacja potwierdzona! ✨</h1>
          </div>
          <div class="content">
            <p>Droga/Drogi ${data.userName},</p>
            <p>Dziękujemy za rezerwację! Twoja wizyta została potwierdzona, płatność otrzymana.</p>
            <!-- Polish booking details -->
          </div>
        `,
      },
      'booking.reminder': {
        subject: 'Przypomnienie: Twoja wizyta jutro',
        html: (data: any) => `
          <p>Cześć ${data.userName},</p>
          <p>To przypomnienie o Twojej wizycie jutro:</p>
        `,
      },
      'newsletter.welcome': {
        subject: 'Witaj w Mariia Beauty & Fitness',
        html: (data: any) => `
          <p>Witaj ${data.userName}!</p>
          <p>Dziękujemy za subskrypcję naszego newslettera.</p>
        `,
      },
      'invoice.issued': {
        subject: (data: { invoiceNumber: string }) => `Faktura nr ${data.invoiceNumber} od mariiaborysevych`,
        html: (data: any) => `
          <p>Dzień dobry ${data.customerName},</p>
          <p>Dziękujemy za zaufanie. Poniżej znajdują się szczegóły faktury:</p>
          <p>Numer faktury: ${data.invoiceNumber}</p>
          <p>Kwota do zapłaty: ${data.amount} ${data.currency}</p>
          <p>Termin płatności: ${data.dueDate}</p>
          <p>Zobacz pełną fakturę: <a href="${data.invoiceUrl}">${data.invoiceUrl}</a></p>
        `,
      },
      'invoice.reminder': {
        subject: (data: { invoiceNumber: string }) => `Przypomnienie o płatności za fakturę nr ${data.invoiceNumber}`,
        html: (data: any) => `
          <p>Dzień dobry ${data.customerName},</p>
          <p>To przypomnienie, że termin płatności faktury nr ${data.invoiceNumber} zbliża się.</p>
          <p>Kwota: ${data.amount} ${data.currency}</p>
          <p>Termin płatności: ${data.dueDate}</p>
        `,
      },
      'invoice.overdue': {
        subject: (data: { invoiceNumber: string }) => `Zaległa płatność - Faktura nr ${data.invoiceNumber}`,
        html: (data: any) => `
          <p>Dzień dobry ${data.customerName},</p>
          <p>Płatność za fakturę nr ${data.invoiceNumber} jest zaległa.</p>
          <p>Prosimy o niezwłoczne uregulowanie płatności.</p>
        `,
      },
    },
    sms: {
      'booking.confirmation': {
        text: (data: any) => `Rezerwacja potwierdzona! ${data.serviceName} w dniu ${data.bookingDate}. Do zobaczenia! 📅`,
      },
      'booking.reminder': {
        text: (data: any) => `Przypomnienie: wizyta ${data.serviceName} jutro o ${data.time}. Odpisz ANULUJ, aby przełożyć.`,
      },
    },
  },
  ua: {
    email: {
      'booking.confirmation': {
        subject: (data: { serviceName: string }) => `Підтвердження бронювання: ${data.serviceName}`,
        html: (data: any) => `
          <div class="header">
            <h1>Бронювання підтверджено! ✨</h1>
          </div>
          <div class="content">
            <p>Шановна/Шановний ${data.userName},</p>
            <p>Дякуємо за бронювання! Ваш візит підтверджено, оплату отримано.</p>
            <!-- Ukrainian booking details -->
          </div>
        `,
      },
      'booking.reminder': {
        subject: 'Нагадування: Ваш візит завтра',
        html: (data: any) => `
          <p>Вітаємо ${data.userName},</p>
          <p>Це нагадування про ваш візит завтра:</p>
        `,
      },
      'newsletter.welcome': {
        subject: 'Ласкаво просимо до Mariia Beauty & Fitness',
        html: (data: any) => `
          <p>Ласкаво просимо ${data.userName}!</p>
          <p>Дякуємо за підписку на нашу розсилку.</p>
        `,
      },
    },
    sms: {
      'booking.confirmation': {
        text: (data: any) => `Бронювання підтверджено! ${data.serviceName} на ${data.bookingDate}. До зустрічі! 📅`,
      },
      'booking.reminder': {
        text: (data: any) => `Нагадування: візит ${data.serviceName} завтра о ${data.time}. Відповідіть СКАСУВАТИ для перенесення.`,
      },
    },
  },
  ru: {
    email: {
      'booking.confirmation': {
        subject: (data: { serviceName: string }) => `Подтверждение записи: ${data.serviceName}`,
        html: (data: any) => `
          <div class="header">
            <h1>Запись подтверждена! ✨</h1>
          </div>
          <div class="content">
            <p>Уважаемая/Уважаемый ${data.userName},</p>
            <p>Спасибо за запись! Визит подтвержден, оплата получена.</p>
            <!-- Russian booking details -->
          </div>
        `,
      },
      'booking.reminder': {
        subject: 'Напоминание: Ваш визит завтра',
        html: (data: any) => `
          <p>Здравствуйте ${data.userName},</p>
          <p>Это напоминание о вашем визите завтра:</p>
        `,
      },
      'newsletter.welcome': {
        subject: 'Добро пожаловать в Mariia Beauty & Fitness',
        html: (data: any) => `
          <p>Добро пожаловать ${data.userName}!</p>
          <p>Спасибо за подписку на нашу рассылку.</p>
        `,
      },
    },
    sms: {
      'booking.confirmation': {
        text: (data: any) => `Запись подтверждена! ${data.serviceName} на ${data.bookingDate}. До встречи! 📅`,
      },
      'booking.reminder': {
        text: (data: any) => `Напоминание: визит ${data.serviceName} завтра в ${data.time}. Ответьте ОТМЕНИТЬ для переноса.`,
      },
    },
  },
};

// Helper function to get localized template
export function getEmailTemplate(
  language: string,
  templateType: string,
  data: any = {}
): EmailTemplate {
  const lang = language in emailTemplates ? language as keyof LocalizedTemplates : 'en';
  const templates = emailTemplates[lang].email;

  if (!templates[templateType]) {
    console.warn(`Template ${templateType} not found for language ${language}, falling back to English`);
    return emailTemplates.en.email[templateType] || emailTemplates.en.email['booking.confirmation'];
  }

  const template = templates[templateType];

  // Handle function-based subjects and content
  return {
    subject: typeof template.subject === 'function' ? template.subject(data) : template.subject,
    html: typeof template.html === 'function' ? template.html(data) : template.html,
    text: template.text && typeof template.text === 'function' ? template.text(data) : template.text,
  };
}

// Helper function to get localized SMS template
export function getSMSTemplate(
  language: string,
  templateType: string,
  data: any = {}
): SMSTemplate {
  const lang = language in emailTemplates ? language as keyof LocalizedTemplates : 'en';
  const templates = emailTemplates[lang].sms;

  if (!templates[templateType]) {
    console.warn(`SMS template ${templateType} not found for language ${language}, falling back to English`);
    return emailTemplates.en.sms[templateType] || emailTemplates.en.sms['booking.confirmation'];
  }

  const template = templates[templateType];

  return {
    text: typeof template.text === 'function' ? template.text(data) : template.text,
  };
}

// Date/time localization helpers
export const dateLocales = {
  en: 'en-GB',
  pl: 'pl-PL',
  ua: 'uk-UA',
  ru: 'ru-RU',
};

export function formatDate(date: Date, language: string, options?: Intl.DateTimeFormatOptions): string {
  const locale = dateLocales[language as keyof typeof dateLocales] || 'en-GB';
  const defaultOptions: Intl.DateTimeFormatOptions = {
    dateStyle: 'full',
    timeStyle: 'short',
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
}

export function formatCurrency(
  amount: number,
  currency: string,
  language: string
): string {
  const locale = dateLocales[language as keyof typeof dateLocales] || 'en-GB';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

export function formatDuration(minutes: number, language: string): string {
  const units = {
    en: 'minutes',
    pl: 'minuty',
    ua: 'хвилини',
    ru: 'минуты',
  };

  const unit = units[language as keyof typeof units] || 'minutes';
  return `${minutes} ${unit}`;
}