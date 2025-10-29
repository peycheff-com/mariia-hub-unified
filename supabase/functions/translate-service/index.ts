import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, sourceLanguage, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const languageNames: Record<string, string> = {
      en: 'English',
      pl: 'Polish',
      ua: 'Ukrainian',
      ru: 'Russian'
    };

    const allLanguages = ['en', 'pl', 'ua', 'ru'];
    const targetLangs = allLanguages.filter(l => l !== sourceLanguage);

    const translations: Record<string, string> = {};

    // Translate to each target language
    for (const lang of targetLangs) {
      const prompt = type === 'features' 
        ? `Translate the following service features from ${languageNames[sourceLanguage]} into ${languageNames[lang]}. Return ONLY the translated features as a JSON array, no explanation:\n${text}`
        : `Translate the following ${type} from ${languageNames[sourceLanguage]} into ${languageNames[lang]}. Maintain the same tone and style. Return ONLY the translation, no explanation:\n${text}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a professional translator. Provide accurate, natural translations while preserving formatting and style.' },
            { role: 'user', content: prompt }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Translation error for ${lang}:`, errorText);
        throw new Error(`Translation failed for ${lang}`);
      }

      const data = await response.json();
      translations[lang] = data.choices[0].message.content.trim();

      // For features, try to parse as JSON array
      if (type === 'features') {
        try {
          const parsed = JSON.parse(translations[lang]);
          translations[lang] = Array.isArray(parsed) ? parsed.join('\n') : translations[lang];
        } catch {
          // Already a string, keep as is
        }
      }
    }

    return new Response(
      JSON.stringify({ translations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Translation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});