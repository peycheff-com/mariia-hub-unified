import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-BOOKING-PAYMENT] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Missing session ID");
    logStep("Verifying session", { sessionId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { status: session.payment_status, metadata: session.metadata });

    // Get booking from metadata
    const bookingId = session.metadata?.booking_id;
    if (!bookingId) throw new Error("Booking ID not found in session");

    // Update booking based on payment status
    if (session.payment_status === 'paid') {
      const updateData: any = {
        payment_status: 'paid',
        status: 'confirmed',
        stripe_payment_intent_id: session.payment_intent as string,
        amount_paid: (session.amount_total || 0) / 100, // Convert from cents
        currency: session.currency || 'pln',
      };

      await supabaseClient
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      logStep("Booking updated to paid", { bookingId });

      // If this is a package, create package record
      if (session.metadata?.is_package === 'true') {
        const { data: booking } = await supabaseClient
          .from('bookings')
          .select('*, services(*)')
          .eq('id', bookingId)
          .single();

        if (booking && booking.services) {
          const packageSessions = booking.services.package_sessions || 5;
          
          await supabaseClient
            .from('booking_packages')
            .insert({
              user_id: user.id,
              service_id: booking.service_id,
              stripe_price_id: booking.price_id,
              total_sessions: packageSessions,
              sessions_used: 1, // First session is this booking
              sessions_remaining: packageSessions - 1,
              amount_paid: booking.amount_paid,
              currency: booking.currency,
              expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
            });

          logStep("Package created", { packageSessions, bookingId });
        }
      }

      // Trigger email notification
      try {
        await supabaseClient.functions.invoke('send-booking-confirmation', {
          body: { bookingId, userId: user.id }
        });
        logStep("Email notification triggered");
      } catch (emailError) {
        logStep("Email notification failed (non-critical)", { error: emailError });
      }

      return new Response(JSON.stringify({ 
        success: true,
        paymentStatus: 'paid',
        bookingId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Payment not completed
      await supabaseClient
        .from('bookings')
        .update({
          payment_status: 'failed',
          status: 'cancelled',
        })
        .eq('id', bookingId);

      logStep("Booking marked as failed", { bookingId });

      return new Response(JSON.stringify({ 
        success: false,
        paymentStatus: session.payment_status,
        bookingId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: "Failed to verify payment" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
