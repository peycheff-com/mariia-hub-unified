import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REFUND-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader?.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Optionally check role via RPC or a roles table
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', userData.user.id).maybeSingle();
    if (roles?.role !== 'admin') return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    const { bookingId, amount, reason } = await req.json();
    if (!bookingId || !amount) throw new Error("Missing bookingId or amount");

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, stripe_payment_intent_id, amount_paid, currency, booking_date')
      .eq('id', bookingId)
      .single();
    if (error || !booking) throw new Error("Booking not found");

    const start = new Date(booking.booking_date).getTime();
    const hoursUntil = (start - Date.now()) / (60 * 60 * 1000);

    // Policy check: >=24h -> allow full deposit refund, <24h -> deposit forfeited
    // Here we allow any amount up to amount_paid for admin; policy messaging handled in UI.

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    if (!booking.stripe_payment_intent_id) throw new Error("No payment intent on booking");

    const refund = await stripe.refunds.create({
      payment_intent: booking.stripe_payment_intent_id,
      amount: Math.round(amount * 100),
      reason: 'requested_by_customer',
    });

    await supabase
      .from('bookings')
      .update({ payment_status: 'refunded' })
      .eq('id', bookingId);

    await supabase.rpc('log_booking_event', {
      p_booking_id: bookingId,
      p_event_type: 'refund_issued',
      p_event_data: { amount, reason, refund_id: refund.id },
    });

    return new Response(JSON.stringify({ success: true, refundId: refund.id }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders });
  }
});


