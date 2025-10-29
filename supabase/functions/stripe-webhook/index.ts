import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-08-20",
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      logStep("ERROR: STRIPE_WEBHOOK_SECRET not configured");
      throw new Error("Webhook configuration error");
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Idempotency: skip if already processed
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { data: existing } = await supabaseAdmin
      .from('processed_webhook_events')
      .select('id')
      .eq('id', event.id)
      .maybeSingle();
    if (existing) {
      logStep("Duplicate event skipped", { id: event.id });
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Event type", { type: event.type });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id });

        const bookingId = session.metadata?.booking_id;
        if (!bookingId) {
          logStep("No booking ID in metadata");
          break;
        }

        // Update booking with payment info
        const { error: updateError } = await supabase
          .from("bookings")
          .update({
            payment_status: "paid",
            stripe_payment_intent_id: session.payment_intent as string,
            payment_method: session.payment_method_types?.[0] || "card",
          })
          .eq("id", bookingId);

        if (updateError) throw updateError;

        // Log payment event
        await supabase.rpc("log_booking_event", {
          p_booking_id: bookingId,
          p_event_type: "payment_received",
          p_event_data: {
            amount: session.amount_total,
            currency: session.currency,
            payment_method: session.payment_method_types?.[0],
          },
        });

        logStep("Booking updated with payment", { bookingId });
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment failed", { paymentIntentId: paymentIntent.id });

        // Find booking by payment intent
        const { data: bookings } = await supabase
          .from("bookings")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .single();

        if (bookings) {
          await supabase
            .from("bookings")
            .update({ payment_status: "failed" })
            .eq("id", bookings.id);

          await supabase.rpc("log_booking_event", {
            p_booking_id: bookings.id,
            p_event_type: "payment_received",
            p_notes: "Payment failed",
          });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        logStep("Charge refunded", { chargeId: charge.id });

        // Find booking by payment intent
        const { data: bookings } = await supabase
          .from("bookings")
          .select("id")
          .eq("stripe_payment_intent_id", charge.payment_intent as string)
          .single();

        if (bookings) {
          await supabase.rpc("log_booking_event", {
            p_booking_id: bookings.id,
            p_event_type: "cancelled",
            p_event_data: {
              refund_amount: charge.amount_refunded,
              currency: charge.currency,
            },
            p_notes: "Payment refunded via Stripe",
          });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    // Record processed event id to ensure idempotency
    await supabaseAdmin.from('processed_webhook_events').insert({ id: event.id }).select().maybeSingle();

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
