import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('booking_packages')
    .update({ status: 'expired' })
    .lte('expires_at', now)
    .eq('status', 'active')
    .select('id');

  return new Response(JSON.stringify({ success: !error, updated: data?.length || 0 }), {
    headers: { 'Content-Type': 'application/json' },
    status: error ? 500 : 200,
  });
});


