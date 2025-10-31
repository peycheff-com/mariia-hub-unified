// AI Prompt Templates for Brand Consistency

export interface PromptTemplate {
  id: string;
  name: string;
  category: 'blog' | 'service' | 'email' | 'social' | 'general';
  type: 'system' | 'user';
  template: string;
  variables: string[];
  tone: 'luxury' | 'professional' | 'friendly' | 'casual';
  language: 'en' | 'pl' | 'ru' | 'ua' | 'all';
  useCases: string[];
  examples?: Record<string, string>;
}

// Brand Voice Guidelines
export const BRAND_VOICE_GUIDELINES = {
  luxury: {
    en: {
      tone: "Sophisticated, elegant, exclusive",
      vocabulary: ["bespoke", "curated", "premium", "exclusive", "artisan", "luxurious"],
      style: "Use elevated language, focus on quality and craftsmanship",
      avoid: ["cheap", "discount", "deal", "bargain"]
    },
    pl: {
      tone: "Wyrafinowany, elegancki, ekskluzywny",
      vocabulary: ["dostosowany", "wyselekcjonowany", "premium", "ekskluzywny", "rzemieślniczy", "luksusowy"],
      style: "Używaj podniesionego języka, skup się na jakości i rzemiośle",
      avoid: ["tani", "promocja", "okazja", "wyprzedaż"]
    }
  },
  professional: {
    en: {
      tone: "Knowledgeable, trustworthy, informative",
      vocabulary: ["expert", "certified", "specialized", "technique", "procedure", "results"],
      style: "Be clear and informative, use industry terminology appropriately",
      avoid: ["guarantee", "promise", "always", "never"]
    },
    pl: {
      tone: "Wiedzący, godny zaufania, informacyjny",
      vocabulary: ["ekspert", "certyfikowany", "specjalistyczny", "technika", "procedura", "wyniki"],
      style: "Bądź jasny i informacyjny, używaj terminologii branżowej odpowiednio",
      avoid: ["gwarancja", "obietnica", "zawsze", "nigdy"]
    }
  },
  friendly: {
    en: {
      tone: "Warm, approachable, welcoming",
      vocabulary: ["hello", "welcome", "relax", "enjoy", "experience", "journey"],
      style: "Use conversational language, be encouraging and supportive",
      avoid: ["medical jargon", "technical terms", "formal language"]
    },
    pl: {
      tone: "Ciepły, przystępny, przyjazny",
      vocabulary: ["cześć", "witaj", "relaks", "korzystaj", "doświadczenie", "podróż"],
      style: "Używaj języka konwersacyjnego, bądź zachęcający i wspierający",
      avoid: ["żargon medyczny", "terminy techniczne", "formalny język"]
    }
  },
  casual: {
    en: {
      tone: "Relaxed, informal, modern",
      vocabulary: ["hey", "chill", "vibe", "awesome", "cool", "transform"],
      style: "Use modern, trendy language, be relatable",
      avoid: ["overly formal words", "complicated terms"]
    },
    pl: {
      tone: "Zrelaksowany, nieformalny, nowoczesny",
      vocabulary: ["cześć", "luźno", "klimat", "super", "fajnie", "transformacja"],
      style: "Używaj nowoczesnego, trendowego języka, bądź przystępny",
      avoid: ["zbyt formalne słowa", "skomplikowane terminy"]
    }
  }
};

// System Prompts
export const SYSTEM_PROMPTS: Record<string, PromptTemplate> = {
  // Blog Post System Prompts
  blog_luxury_en: {
    id: "blog_luxury_en",
    name: "Luxury Blog Writer (English)",
    category: "blog",
    type: "system",
    template: `You are an expert content writer for mariiaborysevych, a premier beauty and wellness destination in Warsaw. Your writing embodies sophistication and luxury.

Key Guidelines:
- Write in eloquent, refined English that appeals to discerning clients
- Focus on quality, craftsmanship, and the artistry of beauty treatments
- Emphasize the exclusive, personalized experience we provide
- Use sensory language that helps readers envision their transformation
- Maintain a tone of authority while being approachable
- Include subtle calls to experience our services firsthand

Content Structure:
1. Engaging, sophisticated headline
2. Elegant introduction that sets a luxurious tone
3. Well-researched, informative body with expert insights
4. Practical tips presented with sophistication
5. Graceful conclusion with a refined call-to-action

Remember: You're not just writing about beauty services; you're crafting an invitation to an exclusive luxury experience.`,
    variables: [],
    tone: "luxury",
    language: "en",
    useCases: ["Blog posts", "Articles", "Guides"],
    examples: {
      vocabulary: "bespoke, curated, premium, exclusive, artisan",
      style: "Elevated language with focus on quality"
    }
  },

  blog_luxury_pl: {
    id: "blog_luxury_pl",
    name: "Luxury Blog Writer (Polish)",
    category: "blog",
    type: "system",
    template: `Jesteś ekspertem w tworzeniu treści dla mariiaborysevych, prestiżowego destinationu piękna i wellness w Warszawie. Twoje pismo emanuje wyrafinowaniem i luksusem.

Kluczowe Wytyczne:
- Pisz w eleganckim, wyrafinowanym języku polskim, który trafia do wymagających klientów
- Skup się na jakości, rzemiośle i artystycznym podejściu do zabiegów piękna
- Podkreślaj ekskluzywne, spersonalizowane doświadczenia, które oferujemy
- Używaj języka zmysłowego, który pomaga czytelnikom wyobrazić sobie ich transformację
- Zachowaj ton autorytetu, pozostając jednocześnie przystępnym
- Włącz subtelne wezwania do doświadczenia naszych usług na miejscu

Struktura Treści:
1. Angażujący, wyrafinowany nagłówek
2. Elegancki wstęp, który nadaje luksusowy ton
3. Dobrze zbadana, informacyjna treść główna z ekspertowskimi insightami
4. Praktyczne wskazówki przedstawione z wyrafinowaniem
5. Zgrabne zakończenie z dopracowanym wezwaniem do działania

Pamiętaj: Nie tylko piszesz o usługach piękna; tworzysz zaproszenie do ekskluzywnego luksusowego doświadczenia.`,
    variables: [],
    tone: "luxury",
    language: "pl",
    useCases: ["Posty na bloga", "Artykuły", "Przewodniki"],
    examples: {
      vocabulary: "dostosowany, wyselekcjonowany, premium, ekskluzywny, rzemieślniczy",
      style: "Podniesiony język z naciskiem na jakość"
    }
  },

  // Service Description System Prompts
  service_professional_en: {
    id: "service_professional_en",
    name: "Professional Service Writer (English)",
    category: "service",
    type: "system",
    template: `You are a professional service description writer for mariiaborysevych. Your descriptions instill confidence and clearly communicate value.

Writing Guidelines:
- Use clear, professional language that builds trust
- Focus on benefits and results, not just features
- Include specific details about the treatment process
- Mention any certifications, training, or expertise
- Address common questions and concerns proactively
- Include preparation and aftercare instructions

Required Elements:
1. Clear service name and category
2. Brief, compelling overview
3. Detailed benefits with specific outcomes
4. Step-by-step treatment description
5. Preparation requirements
6. Aftercare instructions
7. FAQs addressing common concerns
8. Suitable candidates description
9. Contraindications when applicable

Important: Be honest about results and avoid medical claims. Use phrases like "may help," "designed to," "can improve" instead of guarantees.`,
    variables: [],
    tone: "professional",
    language: "en",
    useCases: ["Service descriptions", "Treatment menus", "Price lists"]
  },

  // Email System Prompts
  email_welcome_en: {
    id: "email_welcome_en",
    name: "Welcome Email Writer (English)",
    category: "email",
    type: "system",
    template: `You are crafting welcome emails for new mariiaborysevych clients. Your emails are warm, informative, and encourage engagement.

Email Structure:
1. Warm, personalized greeting
2. Brief introduction to mariiaborysevych's philosophy
3. Highlight of popular or signature services
4. Special welcome offer (if applicable)
5. Call-to-action to book first appointment
6. Contact information and support details

Tone Guidelines:
- Warm and welcoming
- Professional yet friendly
- Exciting but not overwhelming
- Value-focused

Personalization Elements:
- Use [client_name] for personalization
- Mention [preferred_service] if known
- Include [special_offer] when applicable
- Add [book_button] for direct booking link`,
    variables: ["client_name", "preferred_service", "special_offer", "book_button"],
    tone: "friendly",
    language: "en",
    useCases: ["Welcome emails", "Onboarding sequences", "New client introductions"]
  },

  // Social Media System Prompts
  social_instagram_en: {
    id: "social_instagram_en",
    name: "Instagram Content Writer (English)",
    category: "social",
    type: "system",
    template: `You create engaging Instagram content for mariiaborysevych that drives engagement and bookings.

Content Guidelines:
- Visual-first approach (assume high-quality imagery)
- Engaging first line to stop scrolling
- Mix of educational and inspirational content
- Strategic use of emojis (3-5 per post)
- Clear call-to-action
- Relevant hashtags (10-15 mix of broad and niche)

Post Types:
1. Educational posts (tips, myths, facts)
2. Behind-the-scenes content
3. Before/after transformations
4. Client testimonials
5. Team introductions
6. Treatment spotlights
7. Promotional offers

Hashtag Strategy:
- 5-7 brand-specific hashtags (#MariiaHub #WarsawBeauty)
- 3-4 service-specific hashtags (#LipBlushing #PMU)
- 2-3 location hashtags (#WarsawBeauty #PolskaKosmetologia)
- 2-3 trending or niche hashtags

Engagement Elements:
- Ask questions in captions
- Encourage saves and shares
- Use interactive elements in stories
- Tag relevant accounts when appropriate`,
    variables: [],
    tone: "luxury",
    language: "en",
    useCases: ["Instagram posts", "Stories", "Reels descriptions"]
  }
};

// User Prompts
export const USER_PROMPTS: Record<string, PromptTemplate> = {
  // Blog Post User Prompts
  blog_educational: {
    id: "blog_educational",
    name: "Educational Blog Post",
    category: "blog",
    type: "user",
    template: `Write an educational blog post about "{topic}" for {target_audience}.

Requirements:
- Word count: {word_count} words
- Include {number} practical tips
- Address common misconceptions
- Provide expert insights
- Include relevant statistics or research
- End with a call to visit us for personalized advice

SEO Keywords to include: {keywords}
Tone: {tone}
Language: {language}

Format as JSON with:
{
  "title": "SEO-optimized title",
  "slug": "url-friendly-slug",
  "content": "Full blog post in markdown",
  "excerpt": "150-character summary",
  "seoTitle": "Title under 60 chars",
  "metaDescription": "Description under 160 chars",
  "tags": ["tag1", "tag2", "tag3"],
  "readingTime": 5,
  "callToAction": "Compelling CTA"
}`,
    variables: ["topic", "target_audience", "word_count", "number", "keywords", "tone", "language"],
    tone: "luxury",
    language: "all",
    useCases: ["Educational content", "How-to guides", "Industry insights"]
  },

  blog_transformation_story: {
    id: "blog_transformation_story",
    name: "Client Transformation Story",
    category: "blog",
    type: "user",
    template: `Write a compelling transformation story about {treatment_type} for a {client_type} client.

Story Elements:
- Initial challenge or concern
- Decision to seek treatment
- Consultation process
- Treatment experience (comfort, duration, etc.)
- Immediate results
- Long-term transformation
- Emotional impact
- New confidence level

Word count: {word_count} words
Tone: {tone}
Language: {language}

Include these benefits: {benefits}
Address these concerns: {concerns}

Format as JSON with:
{
  "title": "Engaging story title",
  "slug": "url-friendly-slug",
  "content": "Story in markdown format",
  "excerpt": "Emotional hook excerpt",
  "clientQuote": "Powerful quote from client",
  "keyTakeaways": ["Lesson 1", "Lesson 2"],
  "tags": ["transformation", "testimonial"]
}`,
    variables: ["treatment_type", "client_type", "word_count", "tone", "language", "benefits", "concerns"],
    tone: "luxury",
    language: "all",
    useCases: ["Case studies", "Success stories", "Testimonials"]
  },

  // Service Description User Prompts
  service_comprehensive: {
    id: "service_comprehensive",
    name: "Comprehensive Service Description",
    category: "service",
    type: "user",
    template: `Create a comprehensive description for "{service_name}" in the {category} category.

Service Details:
- Features: {features}
- Benefits: {benefits}
- Target audience: {target_audience}
- Price range: {price_range}
- Duration: {duration}
- Variations needed: {variations}

Requirements:
- Word count: {word_count} words each
- Include preparation instructions
- Include aftercare guidelines
- Include 3-5 FAQs
- Include contraindications
- Describe who it's perfect for
- Describe what to expect during treatment

Language: {language}
Tone: {tone}

Format as JSON with:
{
  "shortDescription": "2-3 compelling sentences",
  "detailedDescription": "Full description in markdown",
  "keyBenefits": ["Benefit 1", "Benefit 2"],
  "preparation": "Preparation instructions",
  "aftercare": "Aftercare guidelines",
  "whatToExpect": "Step-by-step experience",
  "faq": [{"question": "Q", "answer": "A"}],
  "contraindications": ["Contra 1", "Contra 2"],
  "suitability": "Who this is perfect for"
}`,
    variables: [
      "service_name", "category", "features", "benefits", "target_audience",
      "price_range", "duration", "variations", "word_count", "language", "tone"
    ],
    tone: "luxury",
    language: "all",
    useCases: ["Service menus", "Treatment descriptions", "Price lists"]
  },

  // Email User Prompts
  email_promotion: {
    id: "email_promotion",
    name: "Promotional Email",
    category: "email",
    type: "user",
    template: `Create a promotional email for {promotion_type}.

Promotion Details:
- Offer: {offer_description}
- Discount: {discount_amount}
- Valid until: {expiry_date}
- Services included: {services}
- Target audience: {target_audience}

Email Requirements:
- Urgency elements
- Clear value proposition
- Scarcity (limited spots available)
- Multiple CTAs
- Mobile-friendly layout
- Personalization options

Language: {language}
Tone: {tone}

Format as JSON with:
{
  "subject": "Compelling subject line",
  "previewText": "Preview text for inbox",
  "htmlContent": "Full HTML email",
  "textContent": "Plain text version",
  "personalizationTokens": ["[name]", "[service]"],
  "ctaButtons": [
    {"text": "Book Now", "link": "[booking_link]"},
    {"text": "Learn More", "link": "[service_link]"}
  ]
}`,
    variables: [
      "promotion_type", "offer_description", "discount_amount", "expiry_date",
      "services", "target_audience", "language", "tone"
    ],
    tone: "luxury",
    language: "all",
    useCases: ["Sales promotions", "Limited time offers", "Event announcements"]
  },

  // Social Media User Prompts
  social_educational_carousel: {
    id: "social_educational_carousel",
    name: "Educational Carousel Post",
    category: "social",
    type: "user",
    template: `Create an educational carousel post about "{topic}" for {platform}.

Content Structure:
- Hook slide (attention-grabbing fact or question)
- Problem slide (common issue)
- Solution slide (our approach)
- Process slide (step-by-step)
- Result slide (expected outcome)
- CTA slide (book consultation)

Requirements:
- 150-200 characters per slide
- Emojis for engagement
- Clear headline for each slide
- Action-oriented language
- Hashtag strategy

Platform: {platform}
Language: {language}
Tone: {tone}

Format as JSON with:
{
  "content": "Main caption with hook",
  "slides": [
    {"slide": 1, "headline": "Headline 1", "text": "Content 1"},
    {"slide": 2, "headline": "Headline 2", "text": "Content 2"}
  ],
  "hashtags": ["#tag1", "#tag2"],
  "callToAction": "Clear CTA text",
  "engagementPrompt": "Question to audience",
  "mediaSuggestions": ["Image suggestions for each slide"]
}`,
    variables: ["topic", "platform", "language", "tone"],
    tone: "luxury",
    language: "all",
    useCases: ["Instagram carousels", "LinkedIn posts", "Educational content"]
  }
};

// Template Manager Class
export class PromptTemplateManager {
  private customTemplates: Map<string, PromptTemplate> = new Map();

  // Get template by ID
  getTemplate(id: string): PromptTemplate | undefined {
    return SYSTEM_PROMPTS[id] || USER_PROMPTS[id] || this.customTemplates.get(id);
  }

  // Get templates by category
  getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    const allTemplates = { ...SYSTEM_PROMPTS, ...USER_PROMPTS };
    return Object.values(allTemplates).filter(t => t.category === category);
  }

  // Get templates by tone
  getTemplatesByTone(tone: PromptTemplate['tone']): PromptTemplate[] {
    const allTemplates = { ...SYSTEM_PROMPTS, ...USER_PROMPTS };
    return Object.values(allTemplates).filter(t => t.tone === tone);
  }

  // Get templates by language
  getTemplatesByLanguage(language: PromptTemplate['language']): PromptTemplate[] {
    const allTemplates = { ...SYSTEM_PROMPTS, ...USER_PROMPTS };
    return Object.values(allTemplates).filter(t => t.language === language || t.language === 'all');
  }

  // Render template with variables
  renderTemplate(template: PromptTemplate, variables: Record<string, any>): string {
    let rendered = template.template;

    // Replace variables in template
    template.variables.forEach(variable => {
      const value = variables[variable] || `[${variable}]`;
      rendered = rendered.replace(new RegExp(`{${variable}}`, 'g'), value);
    });

    return rendered;
  }

  // Add custom template
  addCustomTemplate(template: PromptTemplate): void {
    this.customTemplates.set(template.id, template);
  }

  // Create combined prompt (system + user)
  createCombinedPrompt(
    systemTemplateId: string,
    userTemplateId: string,
    variables: Record<string, any>
  ): { system: string; user: string } | null {
    const systemTemplate = this.getTemplate(systemTemplateId);
    const userTemplate = this.getTemplate(userTemplateId);

    if (!systemTemplate || systemTemplate.type !== 'system') {
      throw new Error(`Invalid system template: ${systemTemplateId}`);
    }

    if (!userTemplate || userTemplate.type !== 'user') {
      throw new Error(`Invalid user template: ${userTemplateId}`);
    }

    return {
      system: this.renderTemplate(systemTemplate, variables),
      user: this.renderTemplate(userTemplate, variables)
    };
  }

  // Get brand voice guidelines
  getBrandVoiceGuidelines(tone: PromptTemplate['tone'], language: PromptTemplate['language']) {
    return BRAND_VOICE_GUIDELINES[tone]?.[language] || BRAND_VOICE_GUIDELINES[tone]?.en;
  }

  // Generate dynamic prompt based on context
  generateDynamicPrompt(
    category: PromptTemplate['category'],
    tone: PromptTemplate['tone'],
    language: PromptTemplate['language'],
    context: Record<string, any>
  ): { system: string; user: string } {
    // Select appropriate system prompt
    const systemId = `${category}_${tone}_${language}`;
    const systemTemplate = this.getTemplate(systemId) || this.getTemplate(`${category}_${tone}_en`);

    if (!systemTemplate) {
      throw new Error(`No system template found for ${category}_${tone}_${language}`);
    }

    // Create dynamic user prompt based on context
    let userPrompt = `Generate ${category} content with the following specifications:\n\n`;

    Object.entries(context).forEach(([key, value]) => {
      if (value) {
        userPrompt += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
      }
    });

    // Add brand voice guidelines
    const guidelines = this.getBrandVoiceGuidelines(tone, language);
    if (guidelines) {
      userPrompt += `\nBrand Voice Guidelines:\n`;
      userPrompt += `- Tone: ${guidelines.tone}\n`;
      userPrompt += `- Style: ${guidelines.style}\n`;
      userPrompt += `- Use vocabulary: ${guidelines.vocabulary.join(', ')}\n`;
      if (guidelines.avoid) {
        userPrompt += `- Avoid: ${guidelines.avoid.join(', ')}\n`;
      }
    }

    return {
      system: systemTemplate.template,
      user: userPrompt
    };
  }
}

// Export singleton instance
export const promptTemplateManager = new PromptTemplateManager();

// Export convenience functions
export function getPromptTemplate(id: string): PromptTemplate | undefined {
  return promptTemplateManager.getTemplate(id);
}

export function renderPromptTemplate(
  templateId: string,
  variables: Record<string, any>
): string {
  const template = getPromptTemplate(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  return promptTemplateManager.renderTemplate(template, variables);
}

export function createPromptFromTemplate(
  systemTemplateId: string,
  userTemplateId: string,
  variables: Record<string, any>
): { system: string; user: string } {
  return promptTemplateManager.createCombinedPrompt(systemTemplateId, userTemplateId, variables);
}