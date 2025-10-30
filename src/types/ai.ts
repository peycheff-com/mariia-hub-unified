/**
 * AI Types and Interfaces for Mariia Hub Platform
 */

export interface BaseModelConfig {
  id: string;
  name: string;
  version: string;
  type: MLModelType;
  status: ModelStatus;
}

export type MLModelType =
  | 'demand_forecasting'
  | 'sentiment_analysis'
  | 'recommendation'
  | 'anomaly_detection'
  | 'computer_vision'
  | 'predictive_maintenance'
  | 'pricing_optimization';

export type ModelStatus =
  | 'training'
  | 'trained'
  | 'deployed'
  | 'failed'
  | 'deprecated'
  | 'retraining';

export interface DemandForecast {
  id: string;
  modelId: string;
  serviceId: string;
  predictions: Array<{
    timestamp: Date;
    predictedValue: number;
    confidence: number;
  }>;
  generatedAt: Date;
}

export interface SentimentAnalysis {
  id: string;
  text: string;
  sentiment: {
    class: 'positive' | 'neutral' | 'negative';
    score: number;
    confidence: number;
  };
  processedAt: Date;
}

export interface Recommendation {
  id: string;
  userId: string;
  serviceIds: string[];
  score: number;
  explanation: string;
  generatedAt: Date;
}

export interface Anomaly {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  description: string;
  timestamp: Date;
}

export interface InferenceRequest {
  modelId: string;
  input: any;
  options?: {
    timeout?: number;
    returnExplanations?: boolean;
  };
}

export interface InferenceResponse {
  id: string;
  modelId: string;
  output: any;
  confidence: number;
  processingTime: number;
  timestamp: Date;
}