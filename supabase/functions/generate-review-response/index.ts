import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResponseRequest {
  reviewContent: string;
  rating: number;
  serviceTitle?: string;
  serviceType?: string;
  customerName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { reviewContent, rating, serviceTitle, serviceType, customerName }: ResponseRequest = await req.json();

    if (!reviewContent || !rating || !customerName) {
      throw new Error('Missing required fields: reviewContent, rating, customerName');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get response templates
    const { data: templates } = await supabase
      .from('review_response_templates')
      .select('*')
      .eq('is_active', true)
      .lte('rating_range_start', rating)
      .gte('rating_range_end', rating)
      .order('rating_range_start', { ascending: false })
      .limit(1);

    let response = '';

    // Generate contextual response based on rating and content
    if (rating >= 5) {
      response = generatePositiveResponse(customerName, serviceTitle, reviewContent, templates?.[0]);
    } else if (rating === 4) {
      response = generateGoodResponse(customerName, serviceTitle, reviewContent, templates?.[0]);
    } else if (rating === 3) {
      response = generateNeutralResponse(customerName, serviceTitle, reviewContent, templates?.[0]);
    } else {
      response = generateNegativeResponse(customerName, serviceTitle, reviewContent, templates?.[0]);
    }

    // Add personalization based on review content analysis
    const analysis = analyzeReviewContent(reviewContent);
    if (analysis.mentionsStaff) {
      response = addStaffAcknowledgement(response);
    }
    if (analysis.mentionsSpecificService) {
      response = addServiceSpecificResponse(response, serviceTitle || 'our service');
    }
    if (analysis.isDetailed) {
      response = addDetailedAcknowledgement(response);
    }

    return new Response(
      JSON.stringify({
        response,
        tone: rating >= 4 ? 'enthusiastic' : rating >= 3 ? 'professional' : 'apologetic',
        personalized: analysis.isDetailed || analysis.mentionsStaff
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error generating response:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

function generatePositiveResponse(customerName: string, serviceTitle?: string, reviewContent?: string, template?: any): string {
  const baseResponses = [
    `Thank you so much ${customerName} for your wonderful 5-star review! We're absolutely thrilled to hear you had such a great experience.`,
    `Wow! ${customerName}, thank you for the amazing 5-star rating! We're delighted that you had such a positive experience.`,
    `${customerName}, we're overjoyed to receive your 5-star review! Thank you for taking the time to share your experience.`
  ];

  const templates = template?.template_content ? [template.template_content] : [
    "Thank you so much for your wonderful 5-star review! We're thrilled to hear you had such a great experience. Your feedback motivates us to continue providing the best service possible. We look forward to seeing you again soon!"
  ];

  let response = templates[Math.floor(Math.random() * templates.length)];

  // Replace placeholders
  response = response.replace(/\{customer_name\}/g, customerName);
  response = response.replace(/\{service_name\}/g, serviceTitle || 'our service');

  return response;
}

function generateGoodResponse(customerName: string, serviceTitle?: string, reviewContent?: string, template?: any): string {
  const responses = [
    `Thank you ${customerName} for your positive feedback! We're glad you had a good experience. We appreciate you taking the time to share your thoughts.`,
    `${customerName}, thank you for the 4-star rating! We're happy to hear you had a positive experience. We'd love to know what we could do to make it a 5-star experience next time.`,
    `Thank you ${customerName} for your review! We're pleased you had a good experience and appreciate your feedback.`
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

function generateNeutralResponse(customerName: string, serviceTitle?: string, reviewContent?: string, template?: any): string {
  const responses = [
    `Thank you ${customerName} for your feedback. We appreciate you taking the time to share your experience with us. We'd love to hear more about how we can improve your experience in the future.`,
    `${customerName}, thank you for your review. We value all feedback as it helps us improve. Please feel free to reach out to us directly if you'd like to discuss your experience further.`,
    `Thank you ${customerName} for sharing your thoughts. We're always looking to improve and would appreciate any specific suggestions you might have.`
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

function generateNegativeResponse(customerName: string, serviceTitle?: string, reviewContent?: string, template?: any): string {
  const responses = [
    `Dear ${customerName}, thank you for bringing this to our attention. We sincerely apologize that we didn't meet your expectations. Your feedback is important to us, and we'd like to understand more about what went wrong. Please contact us directly so we can make things right.`,
    `${customerName}, we're truly sorry to hear about your experience. We take all feedback seriously and would appreciate the opportunity to address your concerns. Please reach out to us at your convenience.`,
    `Thank you for your honest feedback, ${customerName}. We apologize that we fell short of your expectations. We're committed to providing excellent service and would like to learn more about your experience to prevent this from happening again.`
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

function analyzeReviewContent(content: string) {
  const mentionsStaff = /\b(staff|team|she|he|they|named)\b/i.test(content);
  const mentionsSpecificService = /\b(treatment|service|appointment|session|procedure)\b/i.test(content);
  const isDetailed = content.length > 100;

  return {
    mentionsStaff,
    mentionsSpecificService,
    isDetailed
  };
}

function addStaffAcknowledgement(response: string): string {
  return response + " We're especially glad that our team made a positive impression!";
}

function addServiceSpecificResponse(response: string, serviceName: string): string {
  return response + ` We're passionate about providing exceptional ${serviceName} experiences.`;
}

function addDetailedAcknowledgement(response: string): string {
  return response + " We truly appreciate you taking the time to share such detailed feedback.";
}