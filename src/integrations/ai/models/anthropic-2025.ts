import { Anthropic } from '@anthropic-ai/sdk';

// Latest Anthropic Models 2025
export interface ClaudeModelConfig {
  model: string;
  maxTokens: number;
  supportsVision: boolean;
  supportsToolUse: boolean;
  supportsCodeExecution: boolean;
  contextWindow: number;
  reasoningCapability: 'basic' | 'intermediate' | 'advanced' | 'expert';
}

// Claude 4 Models (Released early 2025)
export const CLAUDE4_MODELS: Record<string, ClaudeModelConfig> = {
  'claude-4-opus': {
    model: 'claude-4-opus-2025',
    maxTokens: 4096,
    supportsVision: true,
    supportsToolUse: true,
    supportsCodeExecution: true,
    contextWindow: 200000,
    reasoningCapability: 'expert',
  },
  'claude-4-sonnet': {
    model: 'claude-4-sonnet-2025',
    maxTokens: 4096,
    supportsVision: true,
    supportsToolUse: true,
    supportsCodeExecution: true,
    contextWindow: 200000,
    reasoningCapability: 'advanced',
  },
  'claude-4-haiku': {
    model: 'claude-4-haiku-2025',
    maxTokens: 4096,
    supportsVision: true,
    supportsToolUse: true,
    supportsCodeExecution: false,
    contextWindow: 100000,
    reasoningCapability: 'intermediate',
  },
  'claude-4-code': {
    model: 'claude-4-code-2025',
    maxTokens: 8192,
    supportsVision: false,
    supportsToolUse: true,
    supportsCodeExecution: true,
    contextWindow: 200000,
    reasoningCapability: 'expert',
  },
};

// Claude 4 Opus Class - Most capable model
export class Claude4Opus {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      defaultHeaders: {
        'anthropic-version': '2025-01-01',
      },
    });
  }

  async generateResponse(
    messages: Array<{ role: 'user' | 'assistant'; content: string | Array<any> }>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      system?: string;
      tools?: any[];
      thinking?: boolean;
    }
  ) {
    const response = await this.client.messages.create({
      model: 'claude-4-opus-2025',
      messages,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
      system: options?.system,
      tools: options?.tools,
      thinking: options?.thinking || false,
    });

    return response;
  }

  async complexReasoning(
    problem: string,
    context?: string,
    options?: {
      showSteps?: boolean;
      confidenceLevel?: boolean;
      alternativeSolutions?: boolean;
    }
  ) {
    const systemPrompt = `You are Claude 4 Opus with expert reasoning capabilities.
    ${options?.showSteps ? 'Always show your step-by-step reasoning process.' : ''}
    ${options?.confidenceLevel ? 'Provide confidence levels for your conclusions.' : ''}
    ${options?.alternativeSolutions ? 'Consider multiple approaches and alternatives.' : ''}

    Analyze problems thoroughly before responding.`;

    const messages: any[] = [
      { role: 'user', content: context ? `${context}\n\n${problem}` : problem }
    ];

    return this.generateResponse(messages, {
      system: systemPrompt,
      temperature: 0.2,
      thinking: true,
      maxTokens: 8192,
    });
  }

  async analyzeImage(
    imageUrl: string,
    prompt: string,
    options?: {
      detail?: 'low' | 'high';
      extractText?: boolean;
      analyzeEmotions?: boolean;
    }
  ) {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image',
            source: {
              type: 'url',
              url: imageUrl,
            },
          },
        ],
      },
    ];

    return this.generateResponse(messages);
  }

  async writeCode(
    requirements: string,
    language: string,
    options?: {
      includeTests?: boolean;
      includeComments?: boolean;
      optimizationLevel?: 'basic' | 'optimized' | 'enterprise';
    }
    ) {
    const systemPrompt = `You are an expert ${language} programmer.
    Write clean, efficient, and well-documented code.
    ${options?.includeTests ? 'Include comprehensive unit tests.' : ''}
    ${options?.includeComments ? 'Add detailed comments explaining complex logic.' : ''}
    Optimization level: ${options?.optimizationLevel || 'basic'}`;

    const messages = [
      {
        role: 'user',
        content: `Write ${language} code for: ${requirements}`,
      },
    ];

    return this.generateResponse(messages, {
      system: systemPrompt,
      temperature: 0.1,
      maxTokens: 8192,
    });
  }

  async creativeWriting(
    prompt: string,
    style: 'novel' | 'poetry' | 'screenplay' | 'article' | 'marketing',
    options?: {
      length?: 'short' | 'medium' | 'long';
      tone?: string;
      audience?: string;
    }
  ) {
    const systemPrompt = `You are a creative writer specializing in ${style}.
    Write engaging, original content that captivates the reader.
    Length: ${options?.length || 'medium'}
    Tone: ${options?.tone || 'professional'}
    Audience: ${options?.audience || 'general'}`;

    const messages = [
      {
        role: 'user',
        content: `Write a ${style}: ${prompt}`,
      },
    ];

    return this.generateResponse(messages, {
      system: systemPrompt,
      temperature: 0.8,
      maxTokens: 4096,
    });
  }
}

// Claude 4 Sonnet Class - Balanced performance and speed
export class Claude4Sonnet {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      defaultHeaders: {
        'anthropic-version': '2025-01-01',
      },
    });
  }

  async generateResponse(
    messages: Array<{ role: 'user' | 'assistant'; content: string | Array<any> }>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      system?: string;
      tools?: any[];
    }
  ) {
    const response = await this.client.messages.create({
      model: 'claude-4-sonnet-2025',
      messages,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
      system: options?.system,
      tools: options?.tools,
    });

    return response;
  }

  async businessAnalysis(
    data: any,
    objective: string,
    options?: {
      includeCharts?: boolean;
      includeRecommendations?: boolean;
      format?: 'report' | 'summary' | 'presentation';
    }
  ) {
    const systemPrompt = `You are a business analyst with expertise in data analysis and strategic planning.
    Analyze the provided data and provide actionable insights.
    ${options?.includeCharts ? 'Suggest appropriate visualizations for the data.' : ''}
    ${options?.includeRecommendations ? 'Provide specific, actionable recommendations.' : ''}
    Format: ${options?.format || 'report'}`;

    const messages = [
      {
        role: 'user',
        content: `Analyze this business data for ${objective}:\n\n${JSON.stringify(data, null, 2)}`,
      },
    ];

    return this.generateResponse(messages, {
      system: systemPrompt,
      temperature: 0.3,
      maxTokens: 4096,
    });
  }

  async customerSupport(
    query: string,
    customerHistory?: any,
    options?: {
      empathy?: boolean;
      solutions?: boolean;
      followUp?: boolean;
    }
  ) {
    const systemPrompt = `You are a helpful customer support agent.
    Provide clear, accurate, and empathetic responses.
    ${options?.empathy ? 'Show understanding and empathy for the customer situation.' : ''}
    ${options?.solutions ? 'Always offer practical solutions or next steps.' : ''}
    ${options?.followUp ? 'Include follow-up questions to ensure resolution.' : ''}`;

    const context = customerHistory
      ? `Customer History:\n${JSON.stringify(customerHistory, null, 2)}\n\n`
      : '';

    const messages = [
      {
        role: 'user',
        content: `${context}Customer Query: ${query}`,
      },
    ];

    return this.generateResponse(messages, {
      system: systemPrompt,
      temperature: 0.5,
      maxTokens: 2048,
    });
  }

  async contentCreation(
    topic: string,
    platform: 'blog' | 'social' | 'email' | 'website',
    options?: {
      seoOptimized?: boolean;
      callToAction?: boolean;
      wordCount?: number;
    }
  ) {
    const systemPrompt = `You are a content creator specializing in ${platform} content.
    Create engaging, valuable content that resonates with the target audience.
    ${options?.seoOptimized ? 'Optimize for SEO with relevant keywords and structure.' : ''}
    ${options?.callToAction ? 'Include a clear call to action.' : ''}
    Word count: ${options?.wordCount || 500}`;

    const messages = [
      {
        role: 'user',
        content: `Create ${platform} content about: ${topic}`,
      },
    ];

    return this.generateResponse(messages, {
      system: systemPrompt,
      temperature: 0.7,
      maxTokens: options?.wordCount * 2 || 1000,
    });
  }
}

// Claude 4 Haiku Class - Fast and efficient
export class Claude4Haiku {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      defaultHeaders: {
        'anthropic-version': '2025-01-01',
      },
    });
  }

  async quickResponse(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ) {
    const response = await this.client.messages.create({
      model: 'claude-4-haiku-2025',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
    });

    return response;
  }

  async summarize(
    text: string,
    length: 'brief' | 'medium' | 'detailed' = 'medium'
  ) {
    const prompts = {
      brief: 'Summarize this in 1-2 sentences:',
      medium: 'Summarize this in a paragraph:',
      detailed: 'Provide a comprehensive summary:',
    };

    return this.quickResponse(`${prompts[length]}\n\n${text}`);
  }

  async classify(
    content: string,
    categories: string[]
  ): Promise<{ category: string; confidence: number }> {
    const prompt = `Classify this content into one of: ${categories.join(', ')}\n\nContent: ${content}\n\nRespond with JSON: {"category": "chosen", "confidence": 0.95}`;

    const response = await this.quickResponse(prompt, { temperature: 0.1 });
    return JSON.parse(response.content[0].text);
  }

  async extract(
    text: string,
    information: string[]
  ): Promise<Record<string, any>> {
    const prompt = `Extract this information from the text: ${information.join(', ')}\n\nText: ${text}\n\nRespond with JSON keys matching the requested information.`;

    const response = await this.quickResponse(prompt, { temperature: 0.1 });
    return JSON.parse(response.content[0].text);
  }

  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ) {
    const source = sourceLanguage ? ` from ${sourceLanguage}` : '';
    const prompt = `Translate this text${source} to ${targetLanguage}:\n\n${text}`;

    return this.quickResponse(prompt, { temperature: 0.2 });
  }
}

// Claude 4 Code - Specialized for programming
export class Claude4Code {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      defaultHeaders: {
        'anthropic-version': '2025-01-01',
      },
    });
  }

  async generateCode(
    prompt: string,
    language: string,
    options?: {
      framework?: string;
      includeTests?: boolean;
      documentation?: boolean;
      errorHandling?: boolean;
    }
  ) {
    const systemPrompt = `You are an expert ${language} developer.
    Generate clean, efficient, and maintainable code.
    Framework: ${options?.framework || 'none'}
    ${options?.includeTests ? 'Include comprehensive unit tests.' : ''}
    ${options?.documentation ? 'Add detailed documentation.' : ''}
    ${options?.errorHandling ? 'Include proper error handling.' : ''}`;

    const response = await this.client.messages.create({
      model: 'claude-4-code-2025',
      messages: [{ role: 'user', content: `Generate ${language} code: ${prompt}` }],
      max_tokens: 8192,
      temperature: 0.1,
      system: systemPrompt,
      tools: [{ type: 'code_execution' }],
    });

    return response;
  }

  async debugCode(
    code: string,
    error: string,
    language: string
  ) {
    const prompt = `Debug this ${language} code that's producing an error:\n\nCode:\n${code}\n\nError:\n${error}\n\nIdentify the issue and provide the fix.`;

    const response = await this.client.messages.create({
      model: 'claude-4-code-2025',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
      temperature: 0.1,
      tools: [{ type: 'code_execution' }],
    });

    return response;
  }

  async refactorCode(
    code: string,
    improvements: string[]
  ) {
    const prompt = `Refactor this code to improve: ${improvements.join(', ')}\n\nCode:\n${code}\n\nProvide the refactored version with explanations of changes.`;

    const response = await this.client.messages.create({
      model: 'claude-4-code-2025',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8192,
      temperature: 0.2,
    });

    return response;
  }

  async codeReview(
    code: string,
    language: string,
    checklist?: string[]
  ) {
    const defaultChecklist = [
      'Code quality and readability',
      'Performance optimization',
      'Security vulnerabilities',
      'Best practices adherence',
      'Error handling',
      'Testing coverage',
    ];

    const reviewChecklist = checklist || defaultChecklist;
    const prompt = `Review this ${language} code against these criteria:\n${reviewChecklist.join('\n')}\n\nCode:\n${code}\n\nProvide a detailed review with scores and suggestions.`;

    const response = await this.client.messages.create({
      model: 'claude-4-code-2025',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
      temperature: 0.2,
    });

    return response;
  }
}

// Constitutional AI Implementation
export class ConstitutionalAI {
  private client: Anthropic;
  private principles: string[];

  constructor(apiKey: string, principles?: string[]) {
    this.client = new Anthropic({ apiKey });
    this.principles = principles || [
      'Choose the response that is most helpful and honest',
      'Choose the response that is least likely to be harmful',
      'Choose the response that respects human autonomy and dignity',
      'Choose the response that is most consistent with ethical principles',
    ];
  }

  async constitutionalCritique(response: string, principle: string) {
    const prompt = `Please critique this response based on the following principle:\n\nPrinciple: ${principle}\n\nResponse: ${response}\n\nIdentify any violations or areas for improvement.`;

    const critique = await this.client.messages.create({
      model: 'claude-4-sonnet-2025',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    });

    return critique.content[0].text;
  }

  async constitutionalRevision(
    originalResponse: string,
    critique: string,
    principle: string
  ) {
    const prompt = `Please revise this response based on the critique and principle:\n\nPrinciple: ${principle}\n\nOriginal Response: ${originalResponse}\n\nCritique: ${critique}\n\nProvide an improved response that better adheres to the principle.`;

    const revision = await this.client.messages.create({
      model: 'claude-4-sonnet-2025',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    });

    return revision.content[0].text;
  }

  async applyConstitutionalAI(prompt: string): Promise<string> {
    // Generate initial response
    const initialResponse = await this.client.messages.create({
      model: 'claude-4-sonnet-2025',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    });

    let response = initialResponse.content[0].text;

    // Apply constitutional principles
    for (const principle of this.principles) {
      const critique = await this.constitutionalCritique(response, principle);
      if (critique.includes('violation') || critique.includes('improvement')) {
        response = await this.constitutionalRevision(response, critique, principle);
      }
    }

    return response;
  }
}