import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[APPLY-RESCHEDULE] ${step}${detailsStr}`);
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

    const { token, newDateTime } = await req.json();
    if (!token || !newDateTime) throw new Error("Missing token or newDateTime");

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, service_id, booking_date, reschedule_token_expires_at')
      .eq('reschedule_token', token)
      .single();
    if (error || !booking) throw new Error("Invalid token");

    if (booking.reschedule_token_expires_at && new Date(booking.reschedule_token_expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Token expired" }), { status: 400, headers: corsHeaders });
    }

    // Check availability via RPC
    const start = new Date(newDateTime);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // fallback 60min; real duration can be fetched if needed

    const { data: resource } = await supabase.from('resources').select('id').eq('is_active', true).single();
    if (!resource) return new Response(JSON.stringify({ error: "No resource" }), { status: 400, headers: corsHeaders });

    const { data: available } = await supabase.rpc('check_slot_availability', {
      p_resource_id: resource.id,
      p_start_time: start.toISOString(),
      p_end_time: end.toISOString(),
    });
    if (!available) {
      return new Response(JSON.stringify({ error: "Slot unavailable" }), { status: 409, headers: corsHeaders });
    }

    await supabase
      .from('bookings')
      .update({ booking_date: start.toISOString(), reschedule_token: null, reschedule_token_expires_at: null })
      .eq('id', booking.id);

    await supabase.rpc('log_booking_event', {
      p_booking_id: booking.id,
      p_event_type: 'rescheduled',
      p_event_data: { from: booking.booking_date, to: start.toISOString() },
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders });
  }
});


