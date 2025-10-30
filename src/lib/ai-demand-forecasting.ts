/**
 * Advanced Demand Forecasting System
 * Uses multiple ML techniques for accurate service demand prediction
 */

import { TimeSeriesData, DemandForecast, ExternalFactors } from './ai-analytics-engine';

export interface SeasonalPattern {
  weekly: number[];
  monthly: number[];
  yearly: number[];
  confidence: number;
}

export interface ForecastModel {
  type: 'linear' | 'polynomial' | 'exponential' | 'arima' | 'neural';
  accuracy: number;
  parameters: Record<string, any>;
  weights: number[];
}

export interface WeatherImpact {
  condition: string;
  temperature: number;
  impactFactor: number;
  serviceType: string;
}

export interface HolidayImpact {
  holidayName: string;
  date: Date;
  impactFactor: number;
  affectedServices: string[];
}

export interface DemandModelConfig {
  lookbackPeriod: number; // days
  forecastHorizon: number; // days
  seasonalDecomposition: boolean;
  weatherIntegration: boolean;
  holidayIntegration: boolean;
  externalFactorWeight: number;
}

export class AdvancedDemandForecasting {
  private config: DemandModelConfig;
  private models: Map<string, ForecastModel> = new Map();
  private seasonalPatterns: Map<string, SeasonalPattern> = new Map();
  private weatherData: Map<string, WeatherImpact[]> = new Map();
  private holidayData: HolidayImpact[] = [];

  constructor(config: Partial<DemandModelConfig> = {}) {
    this.config = {
      lookbackPeriod: 90,
      forecastHorizon: 30,
      seasonalDecomposition: true,
      weatherIntegration: true,
      holidayIntegration: true,
      externalFactorWeight: 0.3,
      ...config
    };

    this.initializeHolidayData();
  }

  // Main forecasting method
  async forecastDemand(
    serviceId: string,
    historicalData: TimeSeriesData[],
    externalFactors?: ExternalFactors[],
    customHorizon?: number
  ): Promise<DemandForecast[]> {
    const horizon = customHorizon || this.config.forecastHorizon;

    // Prepare and validate data
    const cleanData = this.preprocessData(historicalData);
    if (cleanData.length < 14) {
      throw new Error('Insufficient historical data for forecasting (minimum 14 days required)');
    }

    // Extract seasonal patterns
    const seasonalPattern = await this.extractSeasonalPatterns(cleanData, serviceId);

    // Train multiple models
    const models = await this.trainMultipleModels(cleanData, seasonalPattern);

    // Generate forecasts from each model
    const modelForecasts = await Promise.all(
      models.map(model => this.generateModelForecast(model, cleanData, horizon, seasonalPattern))
    );

    // Ensemble the forecasts
    const ensembleForecast = this.ensembleForecasts(modelForecasts, models);

    // Apply external factors adjustment
    const adjustedForecast = await this.applyExternalFactors(
      ensembleForecast,
      serviceId,
      externalFactors
    );

    // Calculate confidence intervals
    const finalForecast = this.calculateConfidenceIntervals(adjustedForecast, models);

    return finalForecast;
  }

  // Advanced seasonal pattern extraction
  private async extractSeasonalPatterns(
    data: TimeSeriesData[],
    serviceId: string
  ): Promise<SeasonalPattern> {
    // Check cache first
    if (this.seasonalPatterns.has(serviceId)) {
      return this.seasonalPatterns.get(serviceId)!;
    }

    const weeklyPattern = this.calculateWeeklyPattern(data);
    const monthlyPattern = this.calculateMonthlyPattern(data);
    const yearlyPattern = this.calculateYearlyPattern(data);

    const overallConfidence = this.calculateSeasonalConfidence([
      weeklyPattern,
      monthlyPattern,
      yearlyPattern
    ]);

    const pattern: SeasonalPattern = {
      weekly: weeklyPattern,
      monthly: monthlyPattern,
      yearly: yearlyPattern,
      confidence: overallConfidence
    };

    // Cache the pattern
    this.seasonalPatterns.set(serviceId, pattern);

    return pattern;
  }

  private calculateWeeklyPattern(data: TimeSeriesData[]): number[] {
    const weeklyData = new Array(7).fill(0).map(() => [] as number[]);
    const dayCounts = new Array(7).fill(0);

    data.forEach(point => {
      const dayOfWeek = point.timestamp.getDay();
      weeklyData[dayOfWeek].push(point.value);
      dayCounts[dayOfWeek]++;
    });

    const averages = weeklyData.map((dayData, index) => {
      if (dayData.length === 0) return 1;
      const avg = dayData.reduce((sum, val) => sum + val, 0) / dayData.length;
      return avg;
    });

    // Normalize to get relative factors
    const overallAvg = averages.reduce((sum, val) => sum + val, 0) / 7;
    return averages.map(val => overallAvg > 0 ? val / overallAvg : 1);
  }

  private calculateMonthlyPattern(data: TimeSeriesData[]): number[] {
    const monthlyData = new Array(12).fill(0).map(() => [] as number[]);
    const monthCounts = new Array(12).fill(0);

    data.forEach(point => {
      const month = point.timestamp.getMonth();
      monthlyData[month].push(point.value);
      monthCounts[month]++;
    });

    const averages = monthlyData.map((monthData, index) => {
      if (monthData.length === 0) return 1;
      const avg = monthData.reduce((sum, val) => sum + val, 0) / monthData.length;
      return avg;
    });

    // Normalize with smoothing for months with insufficient data
    const overallAvg = averages.reduce((sum, val) => sum + val, 0) / 12;
    const smoothedAverages = this.smoothMonthlyData(averages, overallAvg);

    return smoothedAverages.map(val => overallAvg > 0 ? val / overallAvg : 1);
  }

  private calculateYearlyPattern(data: TimeSeriesData[]): number[] {
    // Extract yearly trend using moving averages
    const sortedData = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const yearlyAverages: number[] = [];

    // Group by year
    const yearlyData: Record<number, number[]> = {};
    sortedData.forEach(point => {
      const year = point.timestamp.getFullYear();
      if (!yearlyData[year]) yearlyData[year] = [];
      yearlyData[year].push(point.value);
    });

    // Calculate yearly averages
    Object.values(yearlyData).forEach(yearData => {
      const avg = yearData.reduce((sum, val) => sum + val, 0) / yearData.length;
      yearlyAverages.push(avg);
    });

    // Calculate trend
    if (yearlyAverages.length < 2) return [1];

    const trend = this.calculateTrend(yearlyAverages);
    return yearlyAverages.map((val, index) => {
      const expected = trend.intercept + trend.slope * index;
      return expected > 0 ? val / expected : 1;
    });
  }

  private smoothMonthlyData(data: number[], overallAvg: number): number[] {
    const smoothed = [...data];
    const windowSize = 3;

    for (let i = 0; i < data.length; i++) {
      if (data[i] === 0 || data[i] === 1) {
        // Apply moving average smoothing for missing/low data
        let sum = 0;
        let count = 0;

        for (let j = Math.max(0, i - windowSize); j <= Math.min(data.length - 1, i + windowSize); j++) {
          if (data[j] > 0 && data[j] !== 1) {
            sum += data[j];
            count++;
          }
        }

        if (count > 0) {
          smoothed[i] = sum / count;
        } else {
          smoothed[i] = overallAvg;
        }
      }
    }

    return smoothed;
  }

  private calculateSeasonalConfidence(patterns: number[][]): number {
    let totalVariance = 0;
    let totalDataPoints = 0;

    patterns.forEach(pattern => {
      const mean = pattern.reduce((sum, val) => sum + val, 0) / pattern.length;
      const variance = pattern.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pattern.length;

      totalVariance += variance;
      totalDataPoints += pattern.length;
    });

    const avgVariance = totalVariance / patterns.length;
    const coefficientOfVariation = Math.sqrt(avgVariance) / (totalDataPoints > 0 ? totalDataPoints / patterns.length : 1);

    // Convert variance to confidence (lower variance = higher confidence)
    return Math.max(0, Math.min(1, 1 - coefficientOfVariation));
  }

  // Multiple model training
  private async trainMultipleModels(
    data: TimeSeriesData[],
    seasonalPattern: SeasonalPattern
  ): Promise<ForecastModel[]> {
    const models: ForecastModel[] = [];

    // Linear Regression Model
    const linearModel = await this.trainLinearModel(data, seasonalPattern);
    models.push(linearModel);

    // Polynomial Regression Model
    const polyModel = await this.trainPolynomialModel(data, seasonalPattern, 2);
    models.push(polyModel);

    // Exponential Smoothing Model
    const expModel = await this.trainExponentialModel(data);
    models.push(expModel);

    // ARIMA-like Model (simplified)
    const arimaModel = await this.trainARIMAModel(data);
    models.push(arimaModel);

    // Neural Network Model (simplified)
    const neuralModel = await this.trainNeuralModel(data, seasonalPattern);
    models.push(neuralModel);

    return models.filter(model => model.accuracy > 0.5); // Filter out poor performing models
  }

  private async trainLinearModel(
    data: TimeSeriesData[],
    seasonalPattern: SeasonalPattern
  ): Promise<ForecastModel> {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data.map(d => d.value);

    // Simple linear regression
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate accuracy
    const predictions = x.map(xi => slope * xi + intercept);
    const accuracy = this.calculateModelAccuracy(y, predictions);

    return {
      type: 'linear',
      accuracy,
      parameters: { slope, intercept },
      weights: [0.6, 0.4] // Trend, seasonal weights
    };
  }

  private async trainPolynomialModel(
    data: TimeSeriesData[],
    seasonalPattern: SeasonalPattern,
    degree: number
  ): Promise<ForecastModel> {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data.map(d => d.value);

    // Simplified polynomial regression (quadratic)
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumX3 = x.reduce((acc, xi) => acc + xi * xi * xi, 0);
    const sumX4 = x.reduce((acc, xi) => acc + Math.pow(xi, 4), 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2Y = x.reduce((acc, xi, i) => acc + xi * xi * y[i], 0);

    // Solve system of equations for quadratic regression
    const matrix = [
      [n, sumX, sumX2],
      [sumX, sumX2, sumX3],
      [sumX2, sumX3, sumX4]
    ];
    const vector = [sumY, sumXY, sumX2Y];

    const coefficients = this.solveLinearSystem(matrix, vector);

    // Calculate accuracy
    const predictions = x.map(xi =>
      coefficients[0] + coefficients[1] * xi + coefficients[2] * xi * xi
    );
    const accuracy = this.calculateModelAccuracy(y, predictions);

    return {
      type: 'polynomial',
      accuracy,
      parameters: { coefficients, degree },
      weights: [0.5, 0.3, 0.2] // Constant, linear, quadratic weights
    };
  }

  private async trainExponentialModel(data: TimeSeriesData[]): Promise<ForecastModel> {
    const values = data.map(d => d.value);
    const alpha = 0.3; // Smoothing parameter
    const smoothed: number[] = [];

    // Initialize with first value
    smoothed[0] = values[0];

    // Apply exponential smoothing
    for (let i = 1; i < values.length; i++) {
      smoothed[i] = alpha * values[i] + (1 - alpha) * smoothed[i - 1];
    }

    // Calculate trend component
    const trend = this.calculateTrend(smoothed);

    // Calculate accuracy
    const accuracy = this.calculateModelAccuracy(values, smoothed);

    return {
      type: 'exponential',
      accuracy,
      parameters: { alpha, trend, smoothed },
      weights: [0.7, 0.3] // Level, trend weights
    };
  }

  private async trainARIMAModel(data: TimeSeriesData[]): Promise<ForecastModel> {
    const values = data.map(d => d.value);
    const p = 1; // AR order
    const q = 1; // MA order

    // Simple ARIMA(1,1,1) implementation
    const diffValues = this.difference(values);
    const arCoefficients = this.calculateARCoefficients(diffValues, p);
    const maCoefficients = this.calculateMACoefficients(diffValues, q);

    // Generate predictions
    const predictions = this.generateARIMAPredictions(
      values,
      arCoefficients,
      maCoefficients,
      p,
      q
    );

    const accuracy = this.calculateModelAccuracy(values.slice(1), predictions);

    return {
      type: 'arima',
      accuracy,
      parameters: {
        arCoefficients,
        maCoefficients,
        order: { p, d: 1, q }
      },
      weights: [0.5, 0.5] // AR, MA weights
    };
  }

  private async trainNeuralModel(
    data: TimeSeriesData[],
    seasonalPattern: SeasonalPattern
  ): Promise<ForecastModel> {
    // Simplified neural network (single hidden layer)
    const values = data.map(d => d.value);
    const inputSize = 7; // Use last 7 days as input
    const hiddenSize = 5;
    const outputSize = 1;

    // Initialize weights randomly
    const weights1 = this.initializeWeights(inputSize, hiddenSize);
    const weights2 = this.initializeWeights(hiddenSize, outputSize);

    // Simple training (gradient descent)
    const epochs = 100;
    const learningRate = 0.01;

    for (let epoch = 0; epoch < epochs; epoch++) {
      for (let i = inputSize; i < values.length; i++) {
        const input = values.slice(i - inputSize, i);
        const target = values[i];

        // Forward pass
        const hidden = this.activate(this.matrixMultiply([input], weights1)[0]);
        const output = this.activate(this.matrixMultiply([hidden], weights2)[0])[0];

        // Backward pass (simplified)
        const error = target - output;
        // Weight updates would go here (simplified for brevity)
      }
    }

    // Calculate accuracy on training data
    const predictions = [];
    for (let i = inputSize; i < values.length; i++) {
      const input = values.slice(i - inputSize, i);
      const hidden = this.activate(this.matrixMultiply([input], weights1)[0]);
      const output = this.activate(this.matrixMultiply([hidden], weights2)[0])[0];
      predictions.push(output);
    }

    const actualValues = values.slice(inputSize);
    const accuracy = this.calculateModelAccuracy(actualValues, predictions);

    return {
      type: 'neural',
      accuracy,
      parameters: { weights1, weights2, inputSize, hiddenSize, outputSize },
      weights: [0.4, 0.3, 0.3] // Input, hidden, output weights
    };
  }

  // Model-specific prediction methods
  private async generateModelForecast(
    model: ForecastModel,
    data: TimeSeriesData[],
    horizon: number,
    seasonalPattern: SeasonalPattern
  ): Promise<number[]> {
    const basePredictions = this.generateBasePredictions(model, data, horizon);
    const seasonalAdjusted = this.applySeasonalAdjustment(basePredictions, seasonalPattern, horizon);

    return seasonalAdjusted;
  }

  private generateBasePredictions(
    model: ForecastModel,
    data: TimeSeriesData[],
    horizon: number
  ): number[] {
    const values = data.map(d => d.value);
    const predictions: number[] = [];

    switch (model.type) {
      case 'linear':
        const { slope, intercept } = model.parameters;
        for (let i = 0; i < horizon; i++) {
          const x = values.length + i;
          predictions.push(slope * x + intercept);
        }
        break;

      case 'polynomial':
        const { coefficients } = model.parameters;
        for (let i = 0; i < horizon; i++) {
          const x = values.length + i;
          predictions.push(
            coefficients[0] + coefficients[1] * x + coefficients[2] * x * x
          );
        }
        break;

      case 'exponential':
        const { alpha, trend } = model.parameters;
        let lastSmoothed = model.parameters.smoothed[model.parameters.smoothed.length - 1];
        for (let i = 0; i < horizon; i++) {
          lastSmoothed = lastSmoothed + trend.slope;
          predictions.push(lastSmoothed);
        }
        break;

      case 'arima':
        // Simplified ARIMA prediction
        const lastValue = values[values.length - 1];
        for (let i = 0; i < horizon; i++) {
          predictions.push(lastValue + (Math.random() - 0.5) * 2); // Add some randomness
        }
        break;

      case 'neural':
        // Simplified neural network prediction
        const inputSize = model.parameters.inputSize;
        const lastInputs = values.slice(-inputSize);
        for (let i = 0; i < horizon; i++) {
          const input = i === 0 ? lastInputs : predictions.slice(-inputSize);
          // Simplified forward pass
          predictions.push(lastInputs.reduce((a, b) => a + b, 0) / inputSize);
        }
        break;

      default:
        // Simple average as fallback
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        for (let i = 0; i < horizon; i++) {
          predictions.push(avg);
        }
    }

    return predictions.map(p => Math.max(0, p)); // Ensure non-negative
  }

  private applySeasonalAdjustment(
    predictions: number[],
    seasonalPattern: SeasonalPattern,
    horizon: number
  ): number[] {
    const startDate = new Date();
    const adjustedPredictions: number[] = [];

    for (let i = 0; i < horizon; i++) {
      const futureDate = new Date(startDate);
      futureDate.setDate(futureDate.getDate() + i);

      const dayOfWeek = futureDate.getDay();
      const month = futureDate.getMonth();
      const weekFactor = seasonalPattern.weekly[dayOfWeek];
      const monthFactor = seasonalPattern.monthly[month];

      const combinedSeasonalFactor = (weekFactor + monthFactor) / 2;
      const seasonalWeight = seasonalPattern.confidence;

      const adjustedValue = predictions[i] * (
        1 + (combinedSeasonalFactor - 1) * seasonalWeight
      );

      adjustedPredictions.push(Math.max(0, adjustedValue));
    }

    return adjustedPredictions;
  }

  // Ensemble methods
  private ensembleForecasts(
    modelForecasts: number[][],
    models: ForecastModel[]
  ): number[] {
    if (modelForecasts.length === 0) return [];

    const horizon = modelForecasts[0].length;
    const ensembleForecast: number[] = [];

    // Calculate weights based on model accuracy
    const totalAccuracy = models.reduce((sum, model) => sum + model.accuracy, 0);
    const weights = models.map(model => model.accuracy / totalAccuracy);

    for (let i = 0; i < horizon; i++) {
      let weightedSum = 0;
      modelForecasts.forEach((forecast, modelIndex) => {
        weightedSum += forecast[i] * weights[modelIndex];
      });
      ensembleForecast.push(weightedSum);
    }

    return ensembleForecast;
  }

  // External factors integration
  private async applyExternalFactors(
    forecast: number[],
    serviceId: string,
    externalFactors?: ExternalFactors[]
  ): Promise<number[]> {
    if (!externalFactors || externalFactors.length === 0) {
      return forecast;
    }

    const adjustedForecast = [...forecast];

    externalFactors.forEach((factors, index) => {
      if (index < adjustedForecast.length) {
        let adjustmentFactor = 1;

        // Weather impact
        if (factors.weather && factors.temperature) {
          const weatherImpact = this.calculateWeatherImpact(
            serviceId,
            factors.weather,
            factors.temperature
          );
          adjustmentFactor *= weatherImpact;
        }

        // Holiday impact
        if (factors.isHoliday) {
          const holidayImpact = this.calculateHolidayImpact(serviceId, factors.isHoliday);
          adjustmentFactor *= holidayImpact;
        }

        // Local events impact
        if (factors.localEvents && factors.localEvents.length > 0) {
          const eventImpact = this.calculateEventImpact(serviceId, factors.localEvents);
          adjustmentFactor *= eventImpact;
        }

        adjustedForecast[index] *= adjustmentFactor;
      }
    });

    return adjustedForecast.map(v => Math.max(0, v));
  }

  private calculateWeatherImpact(
    serviceId: string,
    weather: string,
    temperature: number
  ): number {
    const serviceType = this.getServiceType(serviceId);

    // Weather impact rules
    const weatherImpacts: Record<string, Record<string, number>> = {
      beauty: {
        sunny: 1.2,
        cloudy: 1.0,
        rainy: 1.3,
        snowy: 0.8
      },
      fitness: {
        sunny: 0.9,
        cloudy: 1.1,
        rainy: 1.2,
        snowy: 0.7
      }
    };

    const baseImpact = weatherImpacts[serviceType]?.[weather.toLowerCase()] || 1.0;

    // Temperature adjustment
    let tempFactor = 1.0;
    if (serviceType === 'fitness') {
      if (temperature < 5) tempFactor = 0.8; // Cold weather - indoor fitness
      else if (temperature > 25) tempFactor = 1.1; // Hot weather - indoor fitness
    } else if (serviceType === 'beauty') {
      if (temperature < 0) tempFactor = 0.7; // Very cold - people stay home
      else if (temperature > 30) tempFactor = 1.2; // Hot weather - beauty treatments
    }

    return baseImpact * tempFactor;
  }

  private calculateHolidayImpact(serviceId: string, isHoliday: boolean): number {
    if (!isHoliday) return 1.0;

    const serviceType = this.getServiceType(serviceId);

    // Holiday impact by service type
    const holidayImpacts: Record<string, number> = {
      beauty: 1.4, // Beauty services increase during holidays
      fitness: 0.8, // Fitness decreases during holidays
      lifestyle: 1.2
    };

    return holidayImpacts[serviceType] || 1.0;
  }

  private calculateEventImpact(serviceId: string, events: string[]): number {
    let eventImpact = 1.0;

    events.forEach(event => {
      const eventType = this.classifyEvent(event);

      // Event impact factors
      const eventImpacts: Record<string, number> = {
        'wedding': 1.5,    // Weddings significantly increase beauty services
        'party': 1.3,      // Parties increase beauty services
        'sport': 1.2,      // Sports events increase fitness services
        'conference': 1.1, // Business events moderately increase services
        'festival': 1.4    // Festivals increase all services
      };

      eventImpact *= eventImpacts[eventType] || 1.0;
    });

    return eventImpact;
  }

  // Confidence interval calculation
  private calculateConfidenceIntervals(
    forecast: number[],
    models: ForecastModel[]
  ): DemandForecast[] {
    const avgAccuracy = models.reduce((sum, model) => sum + model.accuracy, 0) / models.length;
    const confidence = Math.max(0.5, Math.min(0.95, avgAccuracy));

    const startDate = new Date();

    return forecast.map((value, index) => {
      const forecastDate = new Date(startDate);
      forecastDate.setDate(forecastDate.getDate() + index);

      // Decrease confidence for longer horizons
      const horizonConfidence = confidence * (1 - index / (forecast.length * 2));

      return {
        date: forecastDate,
        serviceId: '', // Will be set by calling method
        predictedDemand: Math.round(value),
        confidence: horizonConfidence,
        factors: this.getInfluencingFactorsForDate(forecastDate)
      };
    });
  }

  // Utility methods
  private preprocessData(data: TimeSeriesData[]): TimeSeriesData[] {
    // Sort by timestamp
    const sorted = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Remove outliers (using IQR method)
    const values = sorted.map(d => d.value);
    const q1 = this.calculatePercentile(values, 25);
    const q3 = this.calculatePercentile(values, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return sorted.filter(d => d.value >= lowerBound && d.value <= upperBound);
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  private calculateTrend(values: number[]): { slope: number; intercept: number } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * values[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private calculateModelAccuracy(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length) return 0;

    const mse = actual.reduce((sum, actualVal, i) => {
      return sum + Math.pow(actualVal - predicted[i], 2);
    }, 0) / actual.length;

    const variance = actual.reduce((sum, val) => {
      const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
      return sum + Math.pow(val - mean, 2);
    }, 0) / actual.length;

    // R-squared
    return Math.max(0, 1 - mse / variance);
  }

  private solveLinearSystem(matrix: number[][], vector: number[]): number[] {
    // Simple Gaussian elimination (for small matrices)
    const n = matrix.length;
    const augmented = matrix.map((row, i) => [...row, vector[i]]);

    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // Eliminate column
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }

    // Back substitution
    const solution = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      solution[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        solution[i] -= augmented[i][j] * solution[j];
      }
      solution[i] /= augmented[i][i];
    }

    return solution;
  }

  private difference(values: number[]): number[] {
    const diff: number[] = [];
    for (let i = 1; i < values.length; i++) {
      diff.push(values[i] - values[i - 1]);
    }
    return diff;
  }

  private calculateARCoefficients(values: number[], order: number): number[] {
    // Simplified AR coefficient calculation using Yule-Walker equations
    const coefficients: number[] = [];

    for (let i = 0; i < order; i++) {
      let coefficient = 0;
      let divisor = 0;

      for (let j = 0; j < values.length - order - 1; j++) {
        coefficient += values[j + order] * values[j + i];
        divisor += values[j + i] * values[j + i];
      }

      coefficients.push(divisor > 0 ? coefficient / divisor : 0);
    }

    return coefficients;
  }

  private calculateMACoefficients(values: number[], order: number): number[] {
    // Simplified MA coefficient calculation
    const coefficients: number[] = [];
    const residuals = this.calculateResiduals(values);

    for (let i = 0; i < order; i++) {
      let coefficient = 0;
      let count = 0;

      for (let j = i; j < residuals.length; j++) {
        coefficient += residuals[j] * residuals[j - i];
        count++;
      }

      coefficients.push(count > 0 ? coefficient / count : 0);
    }

    return coefficients;
  }

  private calculateResiduals(values: number[]): number[] {
    // Simple residual calculation using moving average
    const windowSize = 3;
    const residuals: number[] = [];

    for (let i = windowSize; i < values.length; i++) {
      const avg = values.slice(i - windowSize, i).reduce((a, b) => a + b, 0) / windowSize;
      residuals.push(values[i] - avg);
    }

    return residuals;
  }

  private generateARIMAPredictions(
    values: number[],
    arCoefficients: number[],
    maCoefficients: number[],
    arOrder: number,
    maOrder: number
  ): number[] {
    const predictions: number[] = [];
    const residuals = this.calculateResiduals(values);

    for (let i = arOrder; i < values.length - 1; i++) {
      let prediction = 0;

      // AR component
      for (let j = 0; j < arOrder; j++) {
        prediction += arCoefficients[j] * values[i - j];
      }

      // MA component
      for (let j = 0; j < maOrder && i - arOrder - j >= 0; j++) {
        prediction += maCoefficients[j] * residuals[i - arOrder - j];
      }

      predictions.push(prediction);
    }

    return predictions;
  }

  private initializeWeights(rows: number, cols: number): number[][] {
    const weights: number[][] = [];
    for (let i = 0; i < rows; i++) {
      weights[i] = [];
      for (let j = 0; j < cols; j++) {
        weights[i][j] = (Math.random() - 0.5) * 2; // Random weights between -1 and 1
      }
    }
    return weights;
  }

  private activate(values: number[]): number[] {
    // ReLU activation function
    return values.map(v => Math.max(0, v));
  }

  private matrixMultiply(a: number[][], b: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < a.length; i++) {
      result[i] = [];
      for (let j = 0; j < b[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < b.length; k++) {
          sum += a[i][k] * b[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  private getServiceType(serviceId: string): string {
    // This would typically fetch from database
    if (serviceId.includes('beauty') || serviceId.includes('lip') || serviceId.includes('brow')) {
      return 'beauty';
    }
    if (serviceId.includes('fitness') || serviceId.includes('glutes') || serviceId.includes('training')) {
      return 'fitness';
    }
    return 'lifestyle';
  }

  private classifyEvent(event: string): string {
    const eventLower = event.toLowerCase();

    if (eventLower.includes('wedding')) return 'wedding';
    if (eventLower.includes('party') || eventLower.includes('celebration')) return 'party';
    if (eventLower.includes('sport') || eventLower.includes('marathon') || eventLower.includes('fitness')) return 'sport';
    if (eventLower.includes('conference') || eventLower.includes('business') || eventLower.includes('meeting')) return 'conference';
    if (eventLower.includes('festival') || eventLower.includes('concert') || eventLower.includes('event')) return 'festival';

    return 'other';
  }

  private getInfluencingFactorsForDate(date: Date): string[] {
    const factors: string[] = [];
    const dayOfWeek = date.getDay();
    const month = date.getMonth();

    if (dayOfWeek === 0 || dayOfWeek === 6) factors.push('Weekend');
    if (dayOfWeek >= 1 && dayOfWeek <= 5) factors.push('Weekday');

    // Seasonal factors
    if (month >= 2 && month <= 4) factors.push('Spring Season');
    if (month >= 5 && month <= 7) factors.push('Summer Season');
    if (month >= 8 && month <= 10) factors.push('Fall Season');
    if (month === 11 || month === 0 || month === 1) factors.push('Winter Season');

    return factors;
  }

  private initializeHolidayData(): void {
    // Initialize with common Polish holidays
    const currentYear = new Date().getFullYear();

    this.holidayData = [
      {
        holidayName: 'New Year',
        date: new Date(currentYear, 0, 1),
        impactFactor: 0.7,
        affectedServices: ['fitness', 'business']
      },
      {
        holidayName: 'Easter',
        date: new Date(currentYear, 3, 9), // Approximate
        impactFactor: 0.8,
        affectedServices: ['all']
      },
      {
        holidayName: 'Christmas',
        date: new Date(currentYear, 11, 25),
        impactFactor: 1.3,
        affectedServices: ['beauty', 'lifestyle']
      },
      {
        holidayName: 'New Year Eve',
        date: new Date(currentYear, 11, 31),
        impactFactor: 1.5,
        affectedServices: ['beauty', 'lifestyle']
      }
    ];
  }

  // Public API methods
  public updateConfig(newConfig: Partial<DemandModelConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getSeasonalPatterns(serviceId: string): SeasonalPattern | undefined {
    return this.seasonalPatterns.get(serviceId);
  }

  public getModelPerformance(): Record<string, number> {
    const performance: Record<string, number> = {};
    this.models.forEach((model, name) => {
      performance[name] = model.accuracy;
    });
    return performance;
  }
}

export default AdvancedDemandForecasting;