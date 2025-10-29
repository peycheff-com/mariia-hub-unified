import { supabase } from '@/integrations/supabase/client';

import { getEnhancedAIService } from '../core/AIService';
import { GeminiVectorStore } from '../models/google-2025';

// Types
interface Document {
  id: string;
  content: string;
  metadata: {
    title: string;
    source: string;
    category: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    author?: string;
    language?: string;
  };
  embedding?: number[];
}

interface RetrievalResult {
  document: Document;
  score: number;
  relevance: 'high' | 'medium' | 'low';
}

interface RAGConfig {
  embeddingModel: 'openai' | 'google' | 'anthropic';
  similarityThreshold: number;
  maxRetrievedDocuments: number;
  includeMetadata: boolean;
  rerankResults: boolean;
}

interface RAGResponse {
  answer: string;
  sources: Array<{
    documentId: string;
    title: string;
    snippet: string;
    relevance: number;
  }>;
  confidence: number;
  usedContext: boolean;
}

// RAG Engine Implementation
export class RAGEngine {
  private config: RAGConfig;
  private vectorStore: GeminiVectorStore;
  private aiService = getEnhancedAIService();

  constructor(config: Partial<RAGConfig> = {}) {
    this.config = {
      embeddingModel: 'google',
      similarityThreshold: 0.7,
      maxRetrievedDocuments: 5,
      includeMetadata: true,
      rerankResults: true,
      ...config,
    };

    this.vectorStore = new GeminiVectorStore(import.meta.env.VITE_GOOGLE_AI_API_KEY || '');
  }

  // Add documents to the knowledge base
  async addDocuments(documents: Omit<Document, 'embedding'>[]): Promise<void> {
    const documentsWithEmbeddings: Document[] = [];

    for (const doc of documents) {
      // Generate embedding
      const embedding = await this.vectorStore.createEmbedding(doc.content);

      const documentWithEmbedding: Document = {
        ...doc,
        embedding,
      };

      documentsWithEmbeddings.push(documentWithEmbedding);

      // Store in database
      await supabase
        .from('rag_documents')
        .insert({
          id: doc.id,
          content: doc.content,
          metadata: doc.metadata,
          embedding: embedding,
          created_at: new Date().toISOString(),
        });
    }

    console.log(`Added ${documents.length} documents to knowledge base`);
  }

  // Search for relevant documents
  async retrieveDocuments(
    query: string,
    filters?: {
      category?: string;
      tags?: string[];
      dateRange?: { start: string; end: string };
      source?: string;
    }
  ): Promise<RetrievalResult[]> {
    // Get all documents from database (with filters if provided)
    let queryBuilder = supabase.from('rag_documents').select('*');

    if (filters?.category) {
      queryBuilder = queryBuilder.eq('metadata->>category', filters.category);
    }

    if (filters?.source) {
      queryBuilder = queryBuilder.eq('metadata->>source', filters.source);
    }

    if (filters?.dateRange) {
      queryBuilder = queryBuilder
        .gte('metadata->>createdAt', filters.dateRange.start)
        .lte('metadata->>createdAt', filters.dateRange.end);
    }

    const { data: documents, error } = await queryBuilder;

    if (error || !documents) {
      console.error('Error retrieving documents:', error);
      return [];
    }

    // Convert to Document format
    const docs: Document[] = documents.map(doc => ({
      id: doc.id,
      content: doc.content,
      metadata: doc.metadata,
      embedding: doc.embedding,
    }));

    // Filter by tags if specified
    let filteredDocs = docs;
    if (filters?.tags && filters.tags.length > 0) {
      filteredDocs = docs.filter(doc =>
        filters.tags!.some(tag => doc.metadata.tags.includes(tag))
      );
    }

    // Search for similar documents
    const similarDocs = await this.vectorStore.searchSimilarDocuments(
      query,
      filteredDocs,
      this.config.maxRetrievedDocuments
    );

    // Convert to RetrievalResult format
    const results: RetrievalResult[] = similarDocs.map(doc => ({
      document: doc,
      score: doc.similarity,
      relevance: doc.similarity > 0.9 ? 'high' : doc.similarity > 0.7 ? 'medium' : 'low',
    })).filter(result => result.score >= this.config.similarityThreshold);

    // Rerank results if enabled
    if (this.config.rerankResults && results.length > 1) {
      return await this.rerankResults(query, results);
    }

    return results;
  }

  // Rerank results using cross-encoder or other methods
  private async rererankResults(
    query: string,
    results: RetrievalResult[]
  ): Promise<RetrievalResult[]> {
    // Use AI to rerank based on relevance to query
    const rerankPrompt = `Rerank these documents based on their relevance to the query: "${query}"

    Documents:
    ${results.map((result, index) =>
      `${index + 1}. ${result.document.metadata.title}\n   ${result.document.content.substring(0, 200)}...\n   Current score: ${result.score}`
    ).join('\n\n')}

    Respond with JSON array of document indices in order of relevance, most relevant first.
    Format: [3, 1, 4, 2]`;

    try {
      const aiResponse = await this.aiService.generateContent(rerankPrompt, {
        temperature: 0.1,
      });

      const rerankIndices = JSON.parse(aiResponse.content) as number[];

      // Reorder results based on AI reranking
      const rerankedResults: RetrievalResult[] = [];
      for (const index of rerankIndices) {
        if (index - 1 < results.length) {
          rerankedResults.push(results[index - 1]);
        }
      }

      // Add any remaining results that weren't reranked
      for (let i = 0; i < results.length; i++) {
        if (!rerankIndices.includes(i + 1)) {
          rerankedResults.push(results[i]);
        }
      }

      return rerankedResults;
    } catch (error) {
      console.error('Reranking failed:', error);
      return results; // Return original order if reranking fails
    }
  }

  // Generate answer using retrieved context
  async generateAnswer(
    query: string,
    options?: {
      context?: string;
      conversationHistory?: Array<{ role: string; content: string }>;
      temperature?: number;
      maxLength?: number;
      style?: 'professional' | 'friendly' | 'academic';
    }
  ): Promise<RAGResponse> {
    // Retrieve relevant documents
    const retrievedDocs = await this.retrieveDocuments(query);

    if (retrievedDocs.length === 0) {
      // Generate answer without context
      const answer = await this.aiService.generateContent(query, {
        temperature: options?.temperature || 0.7,
        maxLength: options?.maxLength,
      });

      return {
        answer: answer.content,
        sources: [],
        confidence: 0.5,
        usedContext: false,
      };
    }

    // Build context from retrieved documents
    const context = retrievedDocs
      .map(doc => `
        Document: ${doc.document.metadata.title}
        Source: ${doc.document.metadata.source}
        Content: ${doc.document.content}
        Relevance: ${doc.relevance} (${(doc.score * 100).toFixed(1)}%)
      `).join('\n\n');

    // Build prompt with context
    const systemPrompt = `You are an AI assistant with access to a knowledge base.
    Use the provided context to answer the user's question accurately.
    If the context doesn't contain enough information, say so clearly.
    Always cite your sources when using information from the context.
    ${options?.style ? `Use a ${options.style} tone.` : ''}

    Context:
    ${context}

    ${options?.context ? `Additional Context: ${options.context}` : ''}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ];

    // Add conversation history if provided
    if (options?.conversationHistory) {
      messages.splice(1, 0, ...options.conversationHistory);
    }

    // Generate answer
    const answer = await this.aiService.generateContent(
      messages.map(m => m.content).join('\n'),
      {
        temperature: options?.temperature || 0.5,
        maxLength: options?.maxLength,
      }
    );

    // Extract sources mentioned in answer (simplified)
    const sources = retrievedDocs.map(doc => ({
      documentId: doc.document.id,
      title: doc.document.metadata.title,
      snippet: doc.document.content.substring(0, 200) + '...',
      relevance: doc.score,
    }));

    // Calculate confidence based on source relevance
    const avgRelevance = retrievedDocs.reduce((sum, doc) => sum + doc.score, 0) / retrievedDocs.length;
    const confidence = Math.min(0.95, avgRelevance);

    return {
      answer: answer.content,
      sources,
      confidence,
      usedContext: true,
    };
  }

  // Update document
  async updateDocument(
    documentId: string,
    updates: {
      content?: string;
      metadata?: Partial<Document['metadata']>;
    }
  ): Promise<void> {
    // Get current document
    const { data: currentDoc } = await supabase
      .from('rag_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (!currentDoc) {
      throw new Error('Document not found');
    }

    // Prepare updates
    const updatedDoc = {
      ...currentDoc,
      content: updates.content || currentDoc.content,
      metadata: updates.metadata
        ? { ...currentDoc.metadata, ...updates.metadata, updatedAt: new Date().toISOString() }
        : currentDoc.metadata,
    };

    // Generate new embedding if content changed
    if (updates.content) {
      updatedDoc.embedding = await this.vectorStore.createEmbedding(updates.content);
    }

    // Update in database
    await supabase
      .from('rag_documents')
      .update({
        content: updatedDoc.content,
        metadata: updatedDoc.metadata,
        embedding: updatedDoc.embedding,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);
  }

  // Delete document
  async deleteDocument(documentId: string): Promise<void> {
    await supabase
      .from('rag_documents')
      .delete()
      .eq('id', documentId);
  }

  // Get statistics
  async getStatistics(): Promise<{
    totalDocuments: number;
    documentsByCategory: Record<string, number>;
    documentsBySource: Record<string, number>;
    averageEmbeddingSimilarity: number;
  }> {
    const { data: documents } = await supabase
      .from('rag_documents')
      .select('metadata');

    if (!documents) {
      return {
        totalDocuments: 0,
        documentsByCategory: {},
        documentsBySource: {},
        averageEmbeddingSimilarity: 0,
      };
    }

    const categoryCount: Record<string, number> = {};
    const sourceCount: Record<string, number> = {};

    documents.forEach(doc => {
      const category = doc.metadata.category;
      const source = doc.metadata.source;

      categoryCount[category] = (categoryCount[category] || 0) + 1;
      sourceCount[source] = (sourceCount[source] || 0) + 1;
    });

    return {
      totalDocuments: documents.length,
      documentsByCategory: categoryCount,
      documentsBySource: sourceCount,
      averageEmbeddingSimilarity: 0.75, // Would calculate actual average
    };
  }

  // Search by semantic similarity only
  async semanticSearch(
    query: string,
    threshold: number = 0.7
  ): Promise<Document[]> {
    const { data: documents } = await supabase
      .from('rag_documents')
      .select('*');

    if (!documents) return [];

    const docs: Document[] = documents.map(doc => ({
      id: doc.id,
      content: doc.content,
      metadata: doc.metadata,
      embedding: doc.embedding,
    }));

    const similarDocs = await this.vectorStore.searchSimilarDocuments(query, docs, 10);

    return similarDocs
      .filter(doc => doc.similarity >= threshold)
      .map(doc => doc.document);
  }
}

// Factory function
export function getRAGEngine(config?: Partial<RAGConfig>): RAGEngine {
  return new RAGEngine(config);
}

// Convenience functions
export async function addKnowledgeBase(documents: Omit<Document, 'embedding'>[]) {
  const rag = getRAGEngine();
  return rag.addDocuments(documents);
}

export async function queryKnowledgeBase(
  query: string,
  options?: {
    filters?: {
      category?: string;
      tags?: string[];
      source?: string;
    };
    conversationHistory?: Array<{ role: string; content: string }>;
  }
) {
  const rag = getRAGEngine();

  // First retrieve documents
  const documents = await rag.retrieveDocuments(query, options?.filters);

  // Then generate answer
  const answer = await rag.generateAnswer(query, {
    conversationHistory: options?.conversationHistory,
  });

  return {
    answer,
    documents,
    sources: answer.sources,
  };
}