import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-RESCHEDULE-LINK] ${step}${detailsStr}`);
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

    const { bookingId, cutoffHours = 24 } = await req.json();
    if (!bookingId) throw new Error("Missing bookingId");

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, user_id, booking_date')
      .eq('id', bookingId)
      .single();
    if (error || !booking) throw new Error("Booking not found");
    if (booking.user_id !== userData.user.id) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    const start = new Date(booking.booking_date).getTime();
    const now = Date.now();
    const msUntilStart = start - now;
    if (msUntilStart < cutoffHours * 60 * 60 * 1000) {
      return new Response(JSON.stringify({ error: "Within cutoff window" }), { status: 400, headers: corsHeaders });
    }

    const tokenValue = crypto.randomUUID();
    const expiresAt = new Date(start - cutoffHours * 60 * 60 * 1000).toISOString();
    await supabase
      .from('bookings')
      .update({ reschedule_token: tokenValue, reschedule_token_expires_at: expiresAt })
      .eq('id', bookingId);

    const siteUrl = Deno.env.get('SITE_URL') || 'https://lovable.app';
    const url = `${siteUrl}/reschedule?token=${tokenValue}`;

    return new Response(JSON.stringify({ url, token: tokenValue, expiresAt }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders });
  }
});


