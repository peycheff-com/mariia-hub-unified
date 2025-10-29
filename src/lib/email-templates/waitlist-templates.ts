import { Service } from '@/types/booking';

export const waitlistNotificationTemplates = {
  // When customer joins waitlist
  joinConfirmation: {
    subject: 'You\'re on the waitlist! - Mariia Hub',
    html: (data: { service: Service; preferredDate: string; preferredTime: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">You're on the Waitlist! 🌟</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">We'll notify you when a spot opens up</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #8B4513; margin-bottom: 20px;">Waitlist Confirmation</h2>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #374151;">Selected Service Details:</h3>
            <p style="margin: 10px 0;"><strong>Service:</strong> ${data.service.title}</p>
            <p style="margin: 10px 0;"><strong>Preferred Date:</strong> ${data.preferredDate}</p>
            <p style="margin: 10px 0;"><strong>Preferred Time:</strong> ${data.preferredTime}</p>
            <p style="margin: 10px 0;"><strong>Duration:</strong> ${data.service.duration_minutes} minutes</p>
            <p style="margin: 10px 0;"><strong>Price:</strong> From ${data.service.price_from} PLN</p>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #92400e;">How It Works:</h3>
            <ol style="padding-left: 20px; color: #78350f;">
              <li style="margin: 10px 0;">We'll monitor availability for your preferred slot</li>
              <li style="margin: 10px 0;">When a spot opens up, you'll get an immediate notification</li>
              <li style="margin: 10px 0;">You'll have 15 minutes to claim your spot</li>
              <li style="margin: 10px 0;">If you don't respond, we'll offer it to the next person</li>
            </ol>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; margin-bottom: 20px;">Keep an eye on your email and phone for notifications!</p>
            <div style="background: #8B4513; color: white; padding: 15px 30px; border-radius: 8px; display: inline-block;">
              <strong>Priority Access</strong><br>
              <span style="font-size: 14px;">You're now in our priority waitlist system</span>
            </div>
          </div>
        </div>

        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #6b7280;">
          <p>Mariia Hub - Premium Beauty & Fitness Services</p>
          <p>Need help? Contact us at hello@mariiahub.pl | +48 123 456 789</p>
          <p style="margin-top: 10px;">
            <a href="#" style="color: #8B4513;">Manage Waitlist</a> |
            <a href="#" style="color: #8B4513;">Book Different Time</a> |
            <a href="#" style="color: #8B4513;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `,
  },

  // When spot becomes available
  spotAvailable: {
    subject: 'Good news! A spot opened up for your preferred service - Mariia Hub',
    html: (data: { service: Service; availableDate: string; availableTime: time; claimLink: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Spot Available! 🎉</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your waitlist spot has opened up</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <div style="background: #dcfce7; border: 2px solid #16a34a; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <h2 style="margin-top: 0; color: #15803d;">Great News!</h2>
            <p style="color: #166534; font-size: 16px;">A spot has opened up for your preferred service</p>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #374151;">Available Slot Details:</h3>
            <p style="margin: 10px 0;"><strong>Service:</strong> ${data.service.title}</p>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${data.availableDate}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${data.availableTime}</p>
            <p style="margin: 10px 0;"><strong>Duration:</strong> ${data.service.duration_minutes} minutes</p>
            <p style="margin: 10px 0;"><strong>Price:</strong> ${data.service.price_from} PLN</p>
          </div>

          <div style="background: #fef2f2; border: 1px solid #ef4444; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #991b1b;">⏰ Limited Time Offer</h3>
            <p style="color: #7f1d1d;">
              <strong>You have 15 minutes to claim this spot!</strong><br>
              After 15 minutes, we'll offer it to the next person on the waitlist.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.claimLink}"
               style="background: #16a34a; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">
              Claim Your Spot Now
            </a>
            <p style="margin-top: 15px; color: #6b7280; font-size: 14px;">
              Button expires in 15 minutes
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p style="color: #6b7280; font-size: 14px;">
              Can't make this time?
              <a href="#" style="color: #8B4513;">See other available times</a> or
              <a href="#" style="color: #8B4513;">stay on the waitlist</a>
            </p>
          </div>
        </div>

        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #6b7280;">
          <p>Mariia Hub - Premium Beauty & Fitness Services</p>
          <p>Questions? Reply to this email or call us at +48 123 456 789</p>
        </div>
      </div>
    `,
  },

  // When promotion window expires
  promotionExpired: {
    subject: 'The waitlist spot has been offered to someone else - Mariia Hub',
    html: (data: { service: Service; requestedDate: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Waitlist Update</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">The 15-minute window has expired</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #92400e;">Waitlist Update</h2>
            <p style="color: #78350f;">The spot for ${data.service.title} on ${data.requestedDate} has been offered to another customer.</p>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #374151;">What Happened?</h3>
            <p style="margin: 10px 0;">You were notified about an available spot, but the 15-minute claim window has expired. We've offered the spot to the next person on the waitlist.</p>
          </div>

          <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #1e40af;">You're Still on the Waitlist!</h3>
            <p style="color: #1e3a8a;">Don't worry - you're still on our waitlist for future openings. We'll notify you as soon as another spot becomes available.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #8B4513; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Check Other Available Times
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px;">
              No longer interested?
              <a href="#" style="color: #dc2626;">Remove from waitlist</a>
            </p>
          </div>
        </div>

        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #6b7280;">
          <p>Mariia Hub - Premium Beauty & Fitness Services</p>
        </div>
      </div>
    `,
  },

  // When successfully promoted and booked
  promotionSuccess: {
    subject: 'Congratulations! Your booking is confirmed - Mariia Hub',
    html: (data: { service: Service; bookingDate: string; bookingTime: string; bookingId: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Booking Confirmed! ✨</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your waitlist promotion was successful</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <div style="background: #dcfce7; border: 2px solid #16a34a; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <h2 style="margin-top: 0; color: #15803d;">🎉 Congratulations!</h2>
            <p style="color: #166534;">You've successfully claimed your waitlist spot</p>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #374151;">Booking Confirmation</h3>
            <p style="margin: 10px 0;"><strong>Booking ID:</strong> ${data.bookingId}</p>
            <p style="margin: 10px 0;"><strong>Service:</strong> ${data.service.title}</p>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${data.bookingDate}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${data.bookingTime}</p>
            <p style="margin: 10px 0;"><strong>Duration:</strong> ${data.service.duration_minutes} minutes</p>
            <p style="margin: 10px 0;"><strong>Price:</strong> ${data.service.price_from} PLN</p>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #92400e;">What's Next?</h3>
            <ol style="padding-left: 20px; color: #78350f;">
              <li style="margin: 10px 0;">You'll receive a reminder 24 hours before your appointment</li>
              <li style="margin: 10px 0;">Please arrive 10 minutes early</li>
              <li style="margin: 10px 0;">Bring any necessary items mentioned in your service details</li>
              <li style="margin: 10px 0;">Cancellation policy applies (24 hours notice)</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #8B4513; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 5px;">
              View Booking Details
            </a>
            <a href="#" style="background: #6b7280; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 5px;">
              Add to Calendar
            </a>
          </div>
        </div>

        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #6b7280;">
          <p>Mariia Hub - Premium Beauty & Fitness Services</p>
          <p>Questions? Reply to this email or call us at +48 123 456 789</p>
        </div>
      </div>
    `,
  },

  // SMS Templates
  sms: {
    spotAvailable: (data: { serviceTitle: string; time: string; claimLink: string }) =>
      `🎉 Spot available! ${data.serviceTitle} at ${data.time}. Claim within 15 mins: ${data.claimLink}`,

    promotionReminder: (data: { serviceTitle: string; timeLeft: number }) =>
      `⏰ Only ${data.timeLeft} minutes left to claim your spot for ${data.serviceTitle}!`,

    promotionSuccess: (data: { serviceTitle: string; date: string; time: string }) =>
      `✅ Booking confirmed! ${data.serviceTitle} on ${data.date} at ${data.time}. See you soon!`,
  },
};

// Export a function to send waitlist notifications
export const sendWaitlistNotification = async (
  type: keyof typeof waitlistNotificationTemplates,
  recipient: { email?: string; phone?: string },
  data: any
) => {
  // This would integrate with your email/SMS service
  // For now, just logging the template
  if (recipient.email) {
    const template = waitlistNotificationTemplates[type];
    if ('subject' in template && 'html' in template) {
      console.log('Email to send:', {
        to: recipient.email,
        subject: template.subject,
        html: template.html(data),
      });
    }
  }

  if (recipient.phone && type === 'spotAvailable') {
    const smsTemplate = waitlistNotificationTemplates.sms[type];
    if (typeof smsTemplate === 'function') {
      console.log('SMS to send:', {
        to: recipient.phone,
        message: smsTemplate(data),
      });
    }
  }
};