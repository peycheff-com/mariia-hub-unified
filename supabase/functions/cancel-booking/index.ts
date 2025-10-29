import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { token } = await req.json();
    if (!token) throw new Error("Missing token");

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, cancellation_token_expires_at, status')
      .eq('cancellation_token', token)
      .single();
    if (error || !booking) throw new Error('Invalid token');
    if (booking.status === 'cancelled') return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    if (booking.cancellation_token_expires_at && new Date(booking.cancellation_token_expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: 'Token expired' }), { status: 400, headers: corsHeaders });
    }

    await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking.id);

    await supabase.rpc('log_booking_event', {
      p_booking_id: booking.id,
      p_event_type: 'cancelled',
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders });
  }
});


