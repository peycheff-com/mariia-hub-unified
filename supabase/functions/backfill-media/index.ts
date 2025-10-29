// Backfill service media using AI image generation and upload to Storage
// Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, optional LOVABLE_API_KEY if calling external
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Service = {
  id: string;
  title: string;
  slug: string;
  service_type: "beauty" | "fitness" | "lifestyle";
  image_url: string | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { onlyMissing = true, galleryCount = 2, limit = 50 } = await req.json().catch(() => ({
      onlyMissing: true,
      galleryCount: 2,
      limit: 50,
    }));

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing service role configuration" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch services
    let query = supabase
      .from("services")
      .select("id,title,slug,service_type,image_url")
      .eq("is_active", true)
      .order("display_order")
      .limit(limit);
    if (onlyMissing) query = query.is("image_url", null);
    const { data: services, error: svcErr } = await query;
    if (svcErr) throw svcErr;

    const toProcess = (services as Service[]) || [];
    const results: Record<string, any> = {};

    for (const svc of toProcess) {
      // Generate hero image via internal function
      const heroPrompt = svc.service_type === "beauty"
        ? `Luxury PMU hero for ${svc.title}. Photorealistic soft glam; cocoa/champagne palette (#8B4513, #F5DEB3); 16:9 right-side negative space; soft studio light; no text.`
        : `Luxury fitness hero for ${svc.title}. Photorealistic boutique-gym; women-first aesthetic; subtle cyan accents within cocoa/champagne palette; 16:9 right-side negative space; no text.`;

      const genRes = await fetch(`${supabaseUrl}/functions/v1/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
        body: JSON.stringify({ prompt: heroPrompt }),
      });
      const genJson = await genRes.json();
      if (!genRes.ok || !genJson?.imageUrl) {
        results[svc.slug] = { error: genJson?.error || "generate-image failed" };
        continue;
      }

      // Fetch and upload hero
      const imgResp = await fetch(genJson.imageUrl);
      const imageBuf = new Uint8Array(await imgResp.arrayBuffer());
      const heroPath = `services/${svc.slug}-hero.png`;
      const { error: upErr } = await supabase.storage.from("service-images").upload(heroPath, imageBuf, {
        upsert: true,
        contentType: "image/png",
        cacheControl: "3600",
      });
      if (upErr) {
        results[svc.slug] = { error: upErr.message };
        continue;
      }
      const { data: heroPub } = supabase.storage.from("service-images").getPublicUrl(heroPath);
      const heroUrl = heroPub?.publicUrl;
      await supabase.from("services").update({ image_url: heroUrl }).eq("id", svc.id);

      // Generate gallery images
      for (let i = 0; i < Number(galleryCount || 0); i++) {
        const galleryPrompt = `Luxury gallery image for ${svc.title}. Photorealistic, clean composition matching cocoa/champagne palette. Square 1:1. No text.`;
        const gRes = await fetch(`${supabaseUrl}/functions/v1/generate-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
          body: JSON.stringify({ prompt: galleryPrompt }),
        });
        const gJson = await gRes.json();
        if (!gRes.ok || !gJson?.imageUrl) continue;
        const gFile = await fetch(gJson.imageUrl);
        const gBuf = new Uint8Array(await gFile.arrayBuffer());
        const gPath = `services/${svc.slug}/gallery-${Date.now()}-${i}.png`;
        await supabase.storage.from("gallery-images").upload(gPath, gBuf, { upsert: true, contentType: "image/png", cacheControl: "3600" });
        const { data: gPub } = supabase.storage.from("gallery-images").getPublicUrl(gPath);
        // Determine next display_order
        const { data: lastRow } = await supabase
          .from("service_gallery")
          .select("display_order")
          .eq("service_id", svc.id)
          .order("display_order", { ascending: false })
          .limit(1);
        const nextOrder = lastRow && lastRow.length > 0 ? (lastRow[0].display_order + 1) : 0;
        await supabase.from("service_gallery").insert({ service_id: svc.id, image_url: gPub?.publicUrl, caption: null, is_featured: false, display_order: nextOrder });
      }

      results[svc.slug] = { hero: "ok", galleries: Number(galleryCount || 0) };
    }

    return new Response(JSON.stringify({ success: true, count: toProcess.length, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});


