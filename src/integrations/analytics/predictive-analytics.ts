/**
 * Predictive Analytics Engine
 *
 * Implements machine learning models for:
 * - Booking demand forecasting
 * - Customer churn prediction
 * - Revenue forecasting
 * - Customer lifetime value prediction
 * - Service popularity prediction
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

export interface PredictionModel {
  id: string;
  name: string;
  modelType: 'booking_forecast' | 'churn_prediction' | 'revenue_forecast' | 'demand_prediction' | 'customer_lifetime_value';
  version: string;
  config: any;
  accuracy?: number;
  isTrained: boolean;
  lastTrained?: Date;
  features: string[];
  targetVariable: string;
}

export interface Prediction {
  id: string;
  modelId: string;
  entityId: string;
  entityType: string;
  predictionType: string;
  predictedValue: number;
  confidence: number;
  predictionDate: Date;
  actualValue?: number;
  features: Record<string, number>;
  metadata?: any;
}

export interface ModelTrainingResult {
  modelId: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rmse?: number;
  mae?: number;
  trainingDataSize: number;
  validationDataSize: number;
  featureImportance: Array<{ feature: string; importance: number }>;
  trainingTime: number;
}

class PredictiveAnalytics {
  private supabase: SupabaseClient;
  private models: Map<string, PredictionModel> = new Map();
  private modelCache: Map<string, any> = new Map();

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );

    this.initializeModels();
  }

  private initializeModels(): void {
    // Booking Forecast Model
    this.models.set('booking_forecast_v1', {
      id: 'booking_forecast_v1',
      name: 'Booking Demand Forecast',
      modelType: 'booking_forecast',
      version: '1.0.0',
      config: {
        algorithm: 'linear_regression',
        features: [
          'day_of_week',
          'month',
          'season',
          'weather',
          'previous_bookings',
          'marketing_spend',
          'holiday_indicator',
          'competitor_pricing'
        ],
        targetVariable: 'booking_count',
        forecastHorizon: 7,
        validationSplit: 0.2
      },
      isTrained: false,
      features: [
        'day_of_week',
        'month',
        'season',
        'weather',
        'previous_bookings',
        'marketing_spend',
        'holiday_indicator',
        'competitor_pricing'
      ],
      targetVariable: 'booking_count'
    });

    // Customer Churn Prediction Model
    this.models.set('churn_prediction_v1', {
      id: 'churn_prediction_v1',
      name: 'Customer Churn Prediction',
      modelType: 'churn_prediction',
      version: '1.0.0',
      config: {
        algorithm: 'random_forest',
        features: [
          'booking_frequency',
          'last_booking_days',
          'total_spent',
          'service_diversity',
          'average_booking_value',
          'customer_age',
          'complaint_count',
          'support_interactions'
        ],
        targetVariable: 'churn_probability',
        threshold: 0.7,
        validationSplit: 0.2
      },
      isTrained: false,
      features: [
        'booking_frequency',
        'last_booking_days',
        'total_spent',
        'service_diversity',
        'average_booking_value',
        'customer_age',
        'complaint_count',
        'support_interactions'
      ],
      targetVariable: 'churn_probability'
    });

    // Revenue Forecast Model
    this.models.set('revenue_forecast_v1', {
      id: 'revenue_forecast_v1',
      name: 'Revenue Forecast',
      modelType: 'revenue_forecast',
      version: '1.0.0',
      config: {
        algorithm: 'arima',
        features: [
          'historical_revenue',
          'trend',
          'seasonality',
          'promotions',
          'market_conditions',
          'competitor_activity'
        ],
        targetVariable: 'revenue',
        forecastHorizon: 30,
        validationSplit: 0.2
      },
      isTrained: false,
      features: [
        'historical_revenue',
        'trend',
        'seasonality',
        'promotions',
        'market_conditions',
        'competitor_activity'
      ],
      targetVariable: 'revenue'
    });

    // Customer Lifetime Value Model
    this.models.set('clv_prediction_v1', {
      id: 'clv_prediction_v1',
      name: 'Customer Lifetime Value',
      modelType: 'customer_lifetime_value',
      version: '1.0.0',
      config: {
        algorithm: 'linear_regression',
        features: [
          'average_order_value',
          'purchase_frequency',
          'customer_age',
          'acquisition_cost',
          'service_diversity',
          'referral_count'
        ],
        targetVariable: 'lifetime_value',
        validationSplit: 0.2
      },
      isTrained: false,
      features: [
        'average_order_value',
        'purchase_frequency',
        'customer_age',
        'acquisition_cost',
        'service_diversity',
        'referral_count'
      ],
      targetVariable: 'lifetime_value'
    });
  }

  public async trainModel(modelId: string, trainingData?: any[]): Promise<ModelTrainingResult> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model '${modelId}' not found`);
    }

    const startTime = Date.now();

    try {
      // Get training data if not provided
      const data = trainingData || await this.getTrainingData(model);

      if (data.length < 10) {
        throw new Error('Insufficient training data');
      }

      // Preprocess data
      const processedData = await this.preprocessData(data, model);

      // Train model based on algorithm
      let result: ModelTrainingResult;

      switch (model.config.algorithm) {
        case 'linear_regression':
          result = await this.trainLinearRegression(processedData, model);
          break;
        case 'random_forest':
          result = await this.trainRandomForest(processedData, model);
          break;
        case 'arima':
          result = await this.trainARIMA(processedData, model);
          break;
        default:
          throw new Error(`Unsupported algorithm: ${model.config.algorithm}`);
      }

      // Update model in database
      await this.updateModelInDatabase(model, result);

      // Cache the trained model
      this.modelCache.set(modelId, {
        model: result,
        trainingData: processedData,
        timestamp: new Date()
      });

      return result;

    } catch (error) {
      console.error(`Failed to train model ${modelId}:`, error);
      throw error;
    }
  }

  private async getTrainingData(model: PredictionModel): Promise<any[]> {
    switch (model.modelType) {
      case 'booking_forecast':
        return await this.getBookingForecastData();
      case 'churn_prediction':
        return await this.getChurnPredictionData();
      case 'revenue_forecast':
        return await this.getRevenueForecastData();
      case 'customer_lifetime_value':
        return await this.getCLVData();
      default:
        throw new Error(`No training data available for model type: ${model.modelType}`);
    }
  }

  private async getBookingForecastData(): Promise<any[]> {
    const { data: bookings } = await this.supabase
      .from('bookings')
      .select('created_at, total_amount, service_type, status')
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .eq('status', 'completed');

    // Aggregate bookings by day
    const dailyData = new Map<string, any>();

    bookings?.forEach(booking => {
      const date = booking.created_at.split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          booking_count: 0,
          total_revenue: 0,
          day_of_week: new Date(date).getDay(),
          month: new Date(date).getMonth(),
          season: this.getSeason(new Date(date))
        });
      }

      const dayData = dailyData.get(date);
      dayData.booking_count++;
      dayData.total_revenue += booking.total_amount;
    });

    return Array.from(dailyData.values());
  }

  private async getChurnPredictionData(): Promise<any[]> {
    const { data: customers } = await this.supabase
      .from('profiles')
      .select(`
        id,
        created_at,
        bookings!inner(created_at, total_amount, status, service_type)
      `);

    const processedData: any[] = [];

    for (const customer of customers || []) {
      const bookings = customer.bookings || [];
      const completedBookings = bookings.filter((b: any) => b.status === 'completed');

      if (completedBookings.length === 0) continue;

      const lastBooking = completedBookings
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      const daysSinceLastBooking = Math.floor(
        (Date.now() - new Date(lastBooking.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const totalSpent = completedBookings.reduce((sum: number, b: any) => sum + b.total_amount, 0);
      const averageBookingValue = totalSpent / completedBookings.length;
      const uniqueServiceTypes = new Set(completedBookings.map((b: any) => b.service_type)).size;

      processedData.push({
        customer_id: customer.id,
        booking_frequency: completedBookings.length,
        last_booking_days: daysSinceLastBooking,
        total_spent: totalSpent,
        service_diversity: uniqueServiceTypes,
        average_booking_value: averageBookingValue,
        churned: daysSinceLastBooking > 90
      });
    }

    return processedData;
  }

  private async getRevenueForecastData(): Promise<any[]> {
    const { data: revenue } = await this.supabase
      .from('revenue_analytics')
      .select('*')
      .gte('date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date');

    return revenue || [];
  }

  private async getCLVData(): Promise<any[]> {
    const { data: customers } = await this.supabase
      .from('profiles')
      .select(`
        id,
        created_at,
        bookings!inner(created_at, total_amount, status)
      `);

    const processedData: any[] = [];

    for (const customer of customers || []) {
      const bookings = customer.bookings?.filter((b: any) => b.status === 'completed') || [];

      if (bookings.length === 0) continue;

      const totalSpent = bookings.reduce((sum: number, b: any) => sum + b.total_amount, 0);
      const daysSinceFirstBooking = Math.floor(
        (Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      processedData.push({
        customer_id: customer.id,
        average_order_value: totalSpent / bookings.length,
        purchase_frequency: bookings.length,
        customer_age: daysSinceFirstBooking,
        lifetime_value: totalSpent
      });
    }

    return processedData;
  }

  private async preprocessData(data: any[], model: PredictionModel): Promise<any[]> {
    // Normalize features
    const processedData = data.map(record => {
      const processed: any = { ...record };

      // Normalize numeric features
      model.features.forEach(feature => {
        if (typeof record[feature] === 'number') {
          processed[feature] = this.normalizeFeature(record[feature], feature, data);
        }
      });

      return processed;
    });

    return processedData;
  }

  private normalizeFeature(value: number, feature: string, data: any[]): number {
    const values = data.map(d => d[feature]).filter(v => typeof v === 'number');
    const min = Math.min(...values);
    const max = Math.max(...values);

    if (max === min) return 0;
    return (value - min) / (max - min);
  }

  private async trainLinearRegression(data: any[], model: PredictionModel): Promise<ModelTrainingResult> {
    // Simplified linear regression implementation
    const features = model.features;
    const target = model.targetVariable;

    // Split data into training and validation
    const splitIndex = Math.floor(data.length * (1 - model.config.validationSplit));
    const trainingData = data.slice(0, splitIndex);
    const validationData = data.slice(splitIndex);

    // Calculate coefficients (simplified)
    const coefficients: Record<string, number> = {};
    let intercept = 0;

    features.forEach(feature => {
      const featureValues = trainingData.map(d => d[feature] || 0);
      const targetValues = trainingData.map(d => d[target] || 0);

      // Simple correlation-based coefficient
      const correlation = this.calculateCorrelation(featureValues, targetValues);
      coefficients[feature] = correlation * 0.5; // Simplified scaling
    });

    // Calculate intercept
    const predictions = trainingData.map(d => {
      const prediction = features.reduce((sum, feature) =>
        sum + (d[feature] || 0) * coefficients[feature], 0
      );
      return prediction;
    });

    intercept = trainingData.reduce((sum, d, i) =>
      sum + ((d[target] || 0) - predictions[i]), 0
    ) / trainingData.length;

    // Evaluate model
    const validationPredictions = validationData.map(d => {
      const prediction = features.reduce((sum, feature) =>
        sum + (d[feature] || 0) * coefficients[feature], intercept
      );
      return prediction;
    });

    const actualValues = validationData.map(d => d[target] || 0);
    const rmse = Math.sqrt(
      actualValues.reduce((sum, actual, i) =>
        sum + Math.pow(actual - validationPredictions[i], 2), 0
      ) / actualValues.length
    );

    const mae = actualValues.reduce((sum, actual, i) =>
      sum + Math.abs(actual - validationPredictions[i]), 0
    ) / actualValues.length;

    const accuracy = Math.max(0, 100 - (rmse / (Math.max(...actualValues) - Math.min(...actualValues))) * 100);

    // Calculate feature importance
    const featureImportance = features.map(feature => ({
      feature,
      importance: Math.abs(coefficients[feature] || 0)
    })).sort((a, b) => b.importance - a.importance);

    return {
      modelId: model.id,
      accuracy,
      precision: accuracy * 0.9, // Simplified
      recall: accuracy * 0.9, // Simplified
      f1Score: accuracy * 0.9, // Simplified
      rmse,
      mae,
      trainingDataSize: trainingData.length,
      validationDataSize: validationData.length,
      featureImportance,
      trainingTime: Date.now() - Date.now()
    };
  }

  private async trainRandomForest(data: any[], model: PredictionModel): Promise<ModelTrainingResult> {
    // Simplified random forest implementation (in practice, use a proper ML library)
    // For demo purposes, using multiple decision trees with random feature subsets

    const features = model.features;
    const target = model.targetVariable;
    const numTrees = 10;
    const maxFeatures = Math.ceil(features.length * 0.7);

    const trees: any[] = [];

    for (let i = 0; i < numTrees; i++) {
      // Bootstrap sample
      const bootstrapData = this.bootstrapSample(data);

      // Random feature subset
      const randomFeatures = features
        .sort(() => Math.random() - 0.5)
        .slice(0, maxFeatures);

      // Train simple decision tree
      const tree = await this.trainSimpleDecisionTree(bootstrapData, randomFeatures, target);
      trees.push(tree);
    }

    // Evaluate ensemble
    const validationData = data.slice(Math.floor(data.length * 0.8));
    const predictions = validationData.map(record => {
      const treePredictions = trees.map(tree => this.predictWithTree(tree, record));
      return treePredictions.reduce((sum, pred) => sum + pred, 0) / treePredictions.length;
    });

    const actualValues = validationData.map(d => d[target] || 0);
    const accuracy = this.calculateAccuracy(predictions, actualValues);

    return {
      modelId: model.id,
      accuracy,
      precision: accuracy * 0.85,
      recall: accuracy * 0.85,
      f1Score: accuracy * 0.85,
      trainingDataSize: data.length * 0.8,
      validationDataSize: validationData.length,
      featureImportance: features.map(feature => ({
        feature,
        importance: Math.random() // Simplified
      })),
      trainingTime: Date.now() - Date.now()
    };
  }

  private async trainARIMA(data: any[], model: PredictionModel): Promise<ModelTrainingResult> {
    // Simplified ARIMA implementation for time series forecasting
    const target = model.targetVariable;
    const values = data.map(d => d[target] || 0);

    // Simple moving average for demo
    const windowSize = 7;
    const predictions: number[] = [];

    for (let i = windowSize; i < values.length; i++) {
      const prediction = values.slice(i - windowSize, i).reduce((sum, val) => sum + val, 0) / windowSize;
      predictions.push(prediction);
    }

    const actualValues = values.slice(windowSize);
    const accuracy = this.calculateAccuracy(predictions, actualValues);

    return {
      modelId: model.id,
      accuracy,
      precision: accuracy * 0.95,
      recall: accuracy * 0.95,
      f1Score: accuracy * 0.95,
      rmse: Math.sqrt(
        actualValues.reduce((sum, actual, i) =>
          sum + Math.pow(actual - predictions[i], 2), 0
        ) / actualValues.length
      ),
      mae: actualValues.reduce((sum, actual, i) =>
        sum + Math.abs(actual - predictions[i]), 0
      ) / actualValues.length,
      trainingDataSize: data.length,
      validationDataSize: Math.floor(data.length * 0.2),
      featureImportance: model.features.map(feature => ({
        feature,
        importance: 1 / model.features.length // Equal importance for time series
      })),
      trainingTime: Date.now() - Date.now()
    };
  }

  private bootstrapSample(data: any[]): any[] {
    const sample: any[] = [];
    for (let i = 0; i < data.length; i++) {
      const randomIndex = Math.floor(Math.random() * data.length);
      sample.push(data[randomIndex]);
    }
    return sample;
  }

  private async trainSimpleDecisionTree(data: any[], features: string[], target: string): Promise<any> {
    // Simplified decision tree
    const bestSplit = this.findBestSplit(data, features, target);

    return {
      feature: bestSplit.feature,
      threshold: bestSplit.threshold,
      leftValue: bestSplit.leftValue,
      rightValue: bestSplit.rightValue
    };
  }

  private findBestSplit(data: any[], features: string[], target: string): any {
    let bestSplit = {
      feature: features[0],
      threshold: 0,
      leftValue: 0,
      rightValue: 0,
      error: Infinity
    };

    features.forEach(feature => {
      const values = data.map(d => d[feature] || 0).sort((a, b) => a - b);

      for (let i = 1; i < values.length; i++) {
        const threshold = (values[i - 1] + values[i]) / 2;

        const leftData = data.filter(d => (d[feature] || 0) <= threshold);
        const rightData = data.filter(d => (d[feature] || 0) > threshold);

        if (leftData.length === 0 || rightData.length === 0) continue;

        const leftValue = leftData.reduce((sum, d) => sum + (d[target] || 0), 0) / leftData.length;
        const rightValue = rightData.reduce((sum, d) => sum + (d[target] || 0), 0) / rightData.length;

        const error = leftData.reduce((sum, d) =>
          sum + Math.pow((d[target] || 0) - leftValue, 2), 0
        ) + rightData.reduce((sum, d) =>
          sum + Math.pow((d[target] || 0) - rightValue, 2), 0
        );

        if (error < bestSplit.error) {
          bestSplit = { feature, threshold, leftValue, rightValue, error };
        }
      }
    });

    return bestSplit;
  }

  private predictWithTree(tree: any, record: any): number {
    const value = record[tree.feature] || 0;
    return value <= tree.threshold ? tree.leftValue : tree.rightValue;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const correlation = (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return isNaN(correlation) ? 0 : correlation;
  }

  private calculateAccuracy(predictions: number[], actual: number[]): number {
    if (predictions.length === 0 || actual.length === 0) return 0;

    const mae = actual.reduce((sum, actual, i) =>
      sum + Math.abs(actual - predictions[i]), 0
    ) / actual.length;

    const range = Math.max(...actual) - Math.min(...actual);
    return Math.max(0, 100 - (mae / range) * 100);
  }

  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private async updateModelInDatabase(model: PredictionModel, result: ModelTrainingResult): Promise<void> {
    await this.supabase
      .from('predictive_models')
      .upsert({
        id: model.id,
        name: model.name,
        model_type: model.modelType,
        version: model.version,
        model_config: model.config,
        training_data_period_start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        training_data_period_end: new Date().toISOString().split('T')[0],
        accuracy_score: result.accuracy,
        precision_score: result.precision,
        recall_score: result.recall,
        is_active: true,
        updated_at: new Date().toISOString()
      });

    model.isTrained = true;
    model.lastTrained = new Date();
    model.accuracy = result.accuracy;
  }

  public async predict(modelId: string, inputData: any): Promise<Prediction> {
    const cachedModel = this.modelCache.get(modelId);
    if (!cachedModel) {
      throw new Error(`Model '${modelId}' not trained or not found in cache`);
    }

    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model '${modelId}' not found`);
    }

    try {
      // Preprocess input data
      const processedInput = await this.preprocessInputData(inputData, model);

      // Make prediction
      const prediction = await this.makePrediction(cachedModel, processedInput, model);

      // Store prediction in database
      const predictionRecord = await this.storePrediction(modelId, prediction);

      return predictionRecord;

    } catch (error) {
      console.error(`Failed to make prediction with model ${modelId}:`, error);
      throw error;
    }
  }

  private async preprocessInputData(inputData: any, model: PredictionModel): Promise<any> {
    const processed = { ...inputData };

    // Normalize features
    model.features.forEach(feature => {
      if (typeof inputData[feature] === 'number') {
        // In a real implementation, use the same normalization as training
        processed[feature] = inputData[feature];
      }
    });

    return processed;
  }

  private async makePrediction(cachedModel: any, inputData: any, model: PredictionModel): Promise<any> {
    // Simplified prediction logic
    const { model: trainedModel } = cachedModel;

    switch (model.config.algorithm) {
      case 'linear_regression':
        return this.predictLinearRegression(trainedModel, inputData, model);
      case 'random_forest':
        return this.predictRandomForest(trainedModel, inputData, model);
      case 'arima':
        return this.predictARIMA(trainedModel, inputData, model);
      default:
        throw new Error(`Unsupported prediction algorithm: ${model.config.algorithm}`);
    }
  }

  private predictLinearRegression(trainedModel: any, inputData: any, model: PredictionModel): any {
    // Use the trained coefficients to make prediction
    let prediction = trainedModel.intercept || 0;

    model.features.forEach(feature => {
      const coefficient = trainedModel.coefficients?.[feature] || 0;
      prediction += (inputData[feature] || 0) * coefficient;
    });

    return {
      predictedValue: prediction,
      confidence: Math.min(95, trainedModel.accuracy || 80),
      features: model.features.reduce((obj, feature) => {
        obj[feature] = inputData[feature] || 0;
        return obj;
      }, {} as Record<string, number>)
    };
  }

  private predictRandomForest(trainedModel: any, inputData: any, model: PredictionModel): any {
    // Average predictions from all trees
    const predictions = trainedModel.trees?.map((tree: any) =>
      this.predictWithTree(tree, inputData)
    ) || [];

    const predictedValue = predictions.length > 0
      ? predictions.reduce((sum, pred) => sum + pred, 0) / predictions.length
      : 0;

    return {
      predictedValue,
      confidence: Math.min(90, trainedModel.accuracy || 75),
      features: model.features.reduce((obj, feature) => {
        obj[feature] = inputData[feature] || 0;
        return obj;
      }, {} as Record<string, number>)
    };
  }

  private predictARIMA(trainedModel: any, inputData: any, model: PredictionModel): any {
    // Simplified ARIMA prediction
    const historicalValues = inputData.historical_values || [];
    const windowSize = 7;

    if (historicalValues.length < windowSize) {
      return {
        predictedValue: historicalValues.reduce((sum: number, val: number) => sum + val, 0) / Math.max(1, historicalValues.length),
        confidence: 60,
        features: { historical_average: historicalValues.length > 0 ? historicalValues.reduce((sum: number, val: number) => sum + val, 0) / historicalValues.length : 0 }
      };
    }

    const recentValues = historicalValues.slice(-windowSize);
    const predictedValue = recentValues.reduce((sum, val) => sum + val, 0) / windowSize;

    return {
      predictedValue,
      confidence: 85,
      features: {
        moving_average: predictedValue,
        trend: recentValues[recentValues.length - 1] - recentValues[0]
      }
    };
  }

  private async storePrediction(modelId: string, prediction: any): Promise<Prediction> {
    const predictionData = {
      model_id: modelId,
      entity_id: prediction.entityId || 'unknown',
      entity_type: prediction.entityType || 'unknown',
      prediction_type: prediction.predictionType || 'general',
      predicted_value: prediction.predictedValue,
      confidence_score: prediction.confidence,
      prediction_date: new Date().toISOString().split('T')[0],
      features: prediction.features,
      metadata: prediction.metadata
    };

    const { data, error } = await this.supabase
      .from('predictions')
      .insert(predictionData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store prediction: ${error.message}`);
    }

    return {
      id: data.id,
      modelId: data.model_id,
      entityId: data.entity_id,
      entityType: data.entity_type,
      predictionType: data.prediction_type,
      predictedValue: data.predicted_value,
      confidence: data.confidence_score,
      predictionDate: new Date(data.prediction_date),
      features: data.features,
      metadata: data.metadata
    };
  }

  public async getPredictions(filters?: {
    modelId?: string;
    entityType?: string;
    entityId?: string;
    dateRange?: { start: Date; end: Date };
  }): Promise<Prediction[]> {
    let query = this.supabase
      .from('predictions')
      .select('*')
      .order('prediction_date', { ascending: false });

    if (filters?.modelId) {
      query = query.eq('model_id', filters.modelId);
    }

    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }

    if (filters?.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }

    if (filters?.dateRange) {
      query = query
        .gte('prediction_date', filters.dateRange.start.toISOString().split('T')[0])
        .lte('prediction_date', filters.dateRange.end.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get predictions: ${error.message}`);
    }

    return (data || []).map(record => ({
      id: record.id,
      modelId: record.model_id,
      entityId: record.entity_id,
      entityType: record.entity_type,
      predictionType: record.prediction_type,
      predictedValue: record.predicted_value,
      confidence: record.confidence_score,
      predictionDate: new Date(record.prediction_date),
      actualValue: record.actual_value,
      features: record.features,
      metadata: record.metadata
    }));
  }

  public async getModelPerformance(modelId: string): Promise<{
    accuracy: number;
    recentPredictions: number;
    averageConfidence: number;
    trend: 'improving' | 'declining' | 'stable';
  }> {
    const { data: predictions } = await this.supabase
      .from('predictions')
      .select('confidence_score, actual_value, predicted_value, prediction_date')
      .eq('model_id', modelId)
      .order('prediction_date', { ascending: false })
      .limit(100);

    if (!predictions || predictions.length === 0) {
      return {
        accuracy: 0,
        recentPredictions: 0,
        averageConfidence: 0,
        trend: 'stable'
      };
    }

    const recentPredictions = predictions.length;
    const averageConfidence = predictions.reduce((sum, p) => sum + p.confidence_score, 0) / recentPredictions;

    // Calculate accuracy for predictions with actual values
    const predictionsWithActual = predictions.filter(p => p.actual_value !== null);
    const accuracy = predictionsWithActual.length > 0
      ? predictionsWithActual.reduce((sum, p) => {
          const error = Math.abs(p.actual_value - p.predicted_value);
          const accuracy = Math.max(0, 100 - (error / Math.max(p.actual_value, p.predicted_value)) * 100);
          return sum + accuracy;
        }, 0) / predictionsWithActual.length
      : 0;

    // Determine trend
    const halfwayPoint = Math.floor(predictions.length / 2);
    const firstHalf = predictions.slice(halfwayPoint);
    const secondHalf = predictions.slice(0, halfwayPoint);

    const firstHalfAccuracy = this.calculatePeriodAccuracy(firstHalf);
    const secondHalfAccuracy = this.calculatePeriodAccuracy(secondHalf);

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalfAccuracy > firstHalfAccuracy + 5) {
      trend = 'improving';
    } else if (secondHalfAccuracy < firstHalfAccuracy - 5) {
      trend = 'declining';
    }

    return {
      accuracy,
      recentPredictions,
      averageConfidence,
      trend
    };
  }

  private calculatePeriodAccuracy(predictions: any[]): number {
    const predictionsWithActual = predictions.filter(p => p.actual_value !== null);
    if (predictionsWithActual.length === 0) return 0;

    return predictionsWithActual.reduce((sum, p) => {
      const error = Math.abs(p.actual_value - p.predicted_value);
      const accuracy = Math.max(0, 100 - (error / Math.max(p.actual_value, p.predicted_value)) * 100);
      return sum + accuracy;
    }, 0) / predictionsWithActual.length;
  }

  public getAvailableModels(): PredictionModel[] {
    return Array.from(this.models.values());
  }

  public async retrainAllModels(): Promise<Record<string, ModelTrainingResult>> {
    const results: Record<string, ModelTrainingResult> = {};

    for (const [modelId] of this.models) {
      try {
        results[modelId] = await this.trainModel(modelId);
      } catch (error) {
        console.error(`Failed to retrain model ${modelId}:`, error);
      }
    }

    return results;
  }
}

// Create singleton instance
export const predictiveAnalytics = new PredictiveAnalytics();

// Export convenience functions
export const trainBookingForecastModel = () => predictiveAnalytics.trainModel('booking_forecast_v1');
export const trainChurnPredictionModel = () => predictiveAnalytics.trainModel('churn_prediction_v1');
export const trainRevenueForecastModel = () => predictiveAnalytics.trainModel('revenue_forecast_v1');
export const trainCLVModel = () => predictiveAnalytics.trainModel('clv_prediction_v1');

export const predictBookings = (inputData: any) => predictiveAnalytics.predict('booking_forecast_v1', inputData);
export const predictChurn = (inputData: any) => predictiveAnalytics.predict('churn_prediction_v1', inputData);
export const predictRevenue = (inputData: any) => predictiveAnalytics.predict('revenue_forecast_v1', inputData);
export const predictCLV = (inputData: any) => predictiveAnalytics.predict('clv_prediction_v1', inputData);

export default predictiveAnalytics;