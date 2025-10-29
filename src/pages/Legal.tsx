import { SEO } from "@/components/SEO";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileFooter from "@/components/MobileFooter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Legal = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Legal Information — BM BEAUTY & Mariia"
        description="Privacy policy, terms of service, booking and cancellation policies."
      />
      <Navigation />
      
      <main className="py-20 pb-32 md:pb-20">
        <div className="container mx-auto px-6 md:px-8 max-w-4xl">
          <h1 className="heading-serif text-4xl font-semibold mb-8">Legal Information</h1>
          
          <Tabs defaultValue="privacy" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
              <TabsTrigger value="terms">Terms of Service</TabsTrigger>
              <TabsTrigger value="booking">Booking Policy</TabsTrigger>
            </TabsList>
            
            <TabsContent value="privacy" className="space-y-6 mt-8">
              <section>
                <h2 className="heading-serif text-2xl font-medium mb-4">Privacy Policy</h2>
                <div className="space-y-4 text-muted-foreground text-body">
                  <p>
                    BM BEAUTY ("we", "our", "us") respects your privacy and is committed to protecting your personal data.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-foreground mt-6">Data We Collect</h3>
                  <p>
                    When you book a service or subscribe to our newsletter, we collect:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Name and contact information (phone, email)</li>
                    <li>Booking details and preferences</li>
                    <li>Language preference</li>
                    <li>Communication history</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-foreground mt-6">How We Use Your Data</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>To process and confirm your bookings</li>
                    <li>To send appointment reminders and aftercare instructions</li>
                    <li>To respond to your inquiries</li>
                    <li>To send newsletters (only if you opted in)</li>
                    <li>To improve our services</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-foreground mt-6">Data Protection</h3>
                  <p>
                    Your data is stored securely and is never shared with third parties except as required to provide our services (e.g., booking platforms like Booksy).
                  </p>
                  
                  <h3 className="text-lg font-semibold text-foreground mt-6">Your Rights</h3>
                  <p>
                    You have the right to access, correct, or delete your personal data. Contact us at hi@mariiaborysevych.com to exercise these rights.
                  </p>
                </div>
              </section>
            </TabsContent>
            
            <TabsContent value="terms" className="space-y-6 mt-8">
              <section>
                <h2 className="heading-serif text-2xl font-medium mb-4">Terms of Service</h2>
                <div className="space-y-4 text-muted-foreground text-body">
                  <p>
                    By using our services, you agree to the following terms and conditions.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-foreground mt-6">Service Agreement</h3>
                  <p>
                    All services are provided by licensed and certified professionals. We reserve the right to refuse service if contraindications are present or if professional standards cannot be met.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-foreground mt-6">Professional Standards</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>All permanent makeup procedures follow strict hygiene protocols</li>
                    <li>Personal training sessions are conducted by certified trainers</li>
                    <li>We use only premium, certified products and equipment</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-foreground mt-6">Liability</h3>
                  <p>
                    While we take every precaution, individual results may vary. Clients must follow all aftercare instructions provided. We are not responsible for complications arising from failure to follow aftercare guidelines.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-foreground mt-6">Business Information</h3>
                  <p>
                    BM BEAUTY<br />
                    ul. Smolna 8, lok. 254<br />
                    00-375 Warszawa, Poland
                  </p>
                </div>
              </section>
            </TabsContent>
            
            <TabsContent value="booking" className="space-y-6 mt-8">
              <section>
                <h2 className="heading-serif text-2xl font-medium mb-4">Booking & Cancellation Policy</h2>
                <div className="space-y-4 text-muted-foreground text-body">
                  <h3 className="text-lg font-semibold text-foreground">Booking Confirmation</h3>
                  <p>
                    All bookings are confirmed via email and/or WhatsApp. Please arrive 5-10 minutes before your scheduled appointment.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-foreground mt-6">Beauty Services - Cancellation Policy</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>24+ hours notice:</strong> Full refund or free rescheduling</li>
                    <li><strong>12-24 hours notice:</strong> 50% fee or reschedule with 50 PLN charge</li>
                    <li><strong>Less than 12 hours:</strong> Full charge applies</li>
                    <li><strong>No-show:</strong> Full charge applies</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-foreground mt-6">Fitness Services - Cancellation Policy</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>12+ hours notice:</strong> Free cancellation or rescheduling</li>
                    <li><strong>6-12 hours notice:</strong> 50% session fee applies</li>
                    <li><strong>Less than 6 hours:</strong> Full session fee applies</li>
                    <li><strong>No-show:</strong> Full session fee applies</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-foreground mt-6">How to Cancel or Reschedule</h3>
                  <p>
                    Contact us via:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>WhatsApp: [phone number]</li>
                    <li>Email: hi@mariiaborysevych.com</li>
                    <li>Through your booking platform (Booksy)</li>
                    <li>Your account dashboard (if logged in)</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-foreground mt-6">Late Arrivals</h3>
                  <p>
                    If you arrive more than 15 minutes late, we reserve the right to reschedule your appointment. The cancellation policy will apply.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-foreground mt-6">Payment Terms</h3>
                  <p>
                    Payment is due at the time of service. We accept cash, card, and digital payments. Package deals require upfront payment.
                  </p>
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      <MobileFooter />
    </div>
  );
};

export default Legal;
