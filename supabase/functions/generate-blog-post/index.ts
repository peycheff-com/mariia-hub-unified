import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, language = "en", contentType = "blog" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !supabaseUrl || !supabaseKey) {
      throw new Error("Missing environment variables");
    }

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Language-specific instructions
    const languageInstructions: Record<string, string> = {
      en: "Write in English.",
      pl: "Write in Polish (Polski). Use proper Polish grammar and natural Polish expressions.",
      ru: "Write in Russian (Русский). Use proper Russian grammar and natural Russian expressions.",
      ua: "Write in Ukrainian (Українська). Use proper Ukrainian grammar and natural Ukrainian expressions.",
    };

    const contentTypeInstructions: Record<string, string> = {
      blog: "Generate a comprehensive blog post (500-800 words) with engaging narrative and practical insights.",
      service: "Generate professional service description (200-400 words) highlighting benefits and what to expect.",
      general: "Generate high-quality content (300-600 words) suitable for the website.",
    };

    // Generate article with AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert beauty and wellness content writer specializing in permanent makeup, beauty treatments, fitness, and wellness.

${languageInstructions[language] || languageInstructions.en}
${contentTypeInstructions[contentType] || contentTypeInstructions.blog}
            
Format your response as JSON with these fields:
- title: Engaging, SEO-friendly title in the target language
- excerpt: 2-3 sentence summary in the target language
- content: Full article in markdown format in the target language
- slug: URL-friendly slug (use English characters with hyphens)

Focus on being informative, professional, and engaging. Include practical tips and insights relevant to the beauty and wellness industry.`
          },
          {
            role: "user",
            content: `Write about: ${topic}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0].message.content;
    
    // Parse AI response
    let article;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || 
                       aiContent.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      article = JSON.parse(jsonStr);
    } catch (e) {
      // If parsing fails, create a structured response from the text
      article = {
        title: topic,
        slug: topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        excerpt: aiContent.substring(0, 200) + '...',
        content: aiContent
      };
    }

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Insert into database
    const { data: post, error: dbError } = await supabase
      .from("blog_posts")
      .insert({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        author_id: user.id,
        status: 'draft'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({ success: true, post }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in generate-blog-post:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
