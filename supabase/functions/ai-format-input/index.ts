import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIELD_PROMPTS = {
  slug: `Convert this text into a URL-friendly slug format:
- All lowercase
- Replace spaces with hyphens
- Remove special characters except hyphens
- No consecutive hyphens
- Trim hyphens from start and end
Return ONLY the slug, no explanations.`,

  title: `Format this as a professional, compelling title:
- Capitalize appropriately
- Clear and concise (max 80 chars)
- Professional tone
- Fix any typos
Return ONLY the formatted title.`,

  description: `Rewrite this as a user-friendly, engaging description:
- Clear and professional tone
- 2-3 sentences ideal (100-200 chars)
- Focus on benefits and value
- Fix grammar and typos
- Natural, conversational style
Return ONLY the formatted description.`,

  features: `Format this as a clean bulleted feature list:
- One feature per line
- Start each with a verb or benefit
- Clear and concise (5-10 words each)
- Professional tone
- Remove redundancies
Return ONLY the features, one per line.`,

  notes: `Clean up and format these notes professionally:
- Fix grammar and spelling
- Clear, professional tone
- Organized and readable
- Remove unnecessary words
Return ONLY the cleaned notes.`,

  address: `Format this address properly:
- Correct capitalization
- Standard address format
- Add proper spacing
- Fix typos
Return ONLY the formatted address.`,

  category: `Format this category name:
- Title Case
- Professional naming
- Singular form preferred
Return ONLY the formatted category.`,

  faq_question: `Format this FAQ question professionally:
- Start with question word (What, How, Why, etc.)
- Clear and specific
- End with question mark
- Professional tone
Return ONLY the question.`,

  faq_answer: `Format this FAQ answer:
- Clear, concise response
- Professional but friendly tone
- 2-3 sentences ideal
- Address the question directly
Return ONLY the answer.`,

  blog_content: `Improve this blog content:
- Clear structure and flow
- Engaging and informative
- Fix grammar and spelling
- Professional yet approachable tone
- Break into short paragraphs
Return ONLY the improved content.`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, fieldType } = await req.json();

    if (!text || !fieldType) {
      return new Response(
        JSON.stringify({ error: 'Missing text or fieldType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = FIELD_PROMPTS[fieldType as keyof typeof FIELD_PROMPTS] || FIELD_PROMPTS.notes;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const formattedText = data.choices?.[0]?.message?.content || text;

    return new Response(
      JSON.stringify({ formatted: formattedText.trim() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('AI format error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to format text' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
