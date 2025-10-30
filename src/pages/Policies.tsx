import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Policies = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto space-y-12">
          <div>
            <h1 className="text-4xl font-bold mb-4">Booking & Cancellation Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <Card className="p-8 space-y-6">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Booking Process</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  When you book a service through our website, you'll be guided through a simple 4-step process:
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Select your desired service (Beauty or Fitness)</li>
                  <li>Choose your preferred date and time</li>
                  <li>Provide your contact details</li>
                  <li>Complete payment securely through Stripe</li>
                </ol>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Payment Methods</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>We accept the following payment methods through our secure Stripe integration:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Credit and Debit Cards (Visa, Mastercard, etc.)</li>
                  <li>Apple Pay and Google Pay</li>
                  <li>BLIK (instant Polish payments)</li>
                  <li>Przelewy24 (P24) - Polish bank transfers</li>
                </ul>
                <p className="mt-2">
                  All payment information is processed securely and we never store your payment details.
                </p>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Booking Confirmation</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  For Beauty services booked through our site:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>You'll receive an immediate confirmation email</li>
                  <li>Your appointment will be mirrored to our Booksy calendar within 1-3 business hours</li>
                  <li>You'll receive official reminders from Booksy before your appointment</li>
                  <li>Optional WhatsApp notification aria-live="polite" aria-atomic="true"s if you opt in</li>
                </ul>
                <p className="mt-2">
                  For Fitness services, you'll receive instant confirmation as your appointment is directly added to our system.
                </p>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Cancellation Policy</h2>
              <div className="space-y-2 text-muted-foreground">
                <h3 className="font-medium text-foreground mt-4">Beauty Services</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>24+ hours notice:</strong> Full refund of deposit</li>
                  <li><strong>12-24 hours notice:</strong> 50% refund of deposit</li>
                  <li><strong>Less than 12 hours:</strong> No refund</li>
                  <li><strong>No-show:</strong> Full deposit charged</li>
                </ul>
                
                <h3 className="font-medium text-foreground mt-4">Fitness Services</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>48+ hours notice:</strong> Full refund of deposit</li>
                  <li><strong>24-48 hours notice:</strong> 50% refund of deposit</li>
                  <li><strong>Less than 24 hours:</strong> No refund</li>
                  <li><strong>No-show:</strong> Full session fee charged</li>
                </ul>

                <p className="mt-4">
                  To cancel or reschedule, contact us via:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>WhatsApp (preferred): +48 536 200 573</li>
                  <li>Email: hi@mariiaborysevych.com</li>
                  <li>Phone: +48 536 200 573</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Refund Processing</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  Refunds are processed according to our cancellation policy:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Refunds are processed within 5-10 business days</li>
                  <li>BLIK and P24 payments support full refunds per Stripe policy</li>
                  <li>Refund timing may vary depending on your bank or payment method</li>
                  <li>You'll receive a confirmation email once the refund is processed</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Package Purchases</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  For multi-session packages:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Packages are valid for 6 months from purchase date</li>
                  <li>Individual sessions within a package follow the same cancellation policy</li>
                  <li>Unused package sessions are non-refundable after the validity period</li>
                  <li>Package extensions may be available - contact us to discuss</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Late Arrivals</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  We value your time and ask that you respect ours:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Please arrive 5-10 minutes before your appointment time</li>
                  <li>Late arrivals may result in shortened session time</li>
                  <li>Arrivals more than 15 minutes late may be considered a no-show</li>
                  <li>No refunds are provided for shortened sessions due to late arrival</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Contact Us</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  If you have any questions about our booking or cancellation policy, please contact us:
                </p>
                <ul className="list-none space-y-1">
                  <li>📧 Email: hi@mariiaborysevych.com</li>
                  <li>📱 WhatsApp: +48 536 200 573</li>
                  <li>📞 Phone: +48 536 200 573</li>
                </ul>
              </div>
            </section>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Policies;
