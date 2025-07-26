import { storage } from './storage';
import { openai, retryOpenAIRequest } from './openaiRetry';
import { MoodEntry } from '@shared/schema';

interface CorrelationData {
  healthMetrics: any[]; // Health metrics would be defined when integrating with health data sources
  moodEntries: MoodEntry[];
  timeframe: 'daily' | 'weekly' | 'monthly';
}

interface CorrelationResult {
  emotional_metric: string;
  physical_metric: string;
  correlation_score: number;
  confidence: number;
  insights: string[];
  recommendations: string[];
}

// Calculate correlation between physical health metrics and emotional states
export async function analyzeHealthCorrelations(
  userId: number,
  timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'
): Promise<CorrelationResult[]> {
  try {
    console.log(`Analyzing health correlations for user ${userId} over ${timeframe} timeframe`);

    // Get recent health metrics and mood data
    const healthMetrics = await storage.getHealthMetrics(userId, undefined, 100);
    const moodEntries = await storage.getMoodEntries(userId, 100);

    if (healthMetrics.length === 0 || moodEntries.length === 0) {
      console.log('Insufficient data for correlation analysis');
      return [];
    }

    // Group data by timeframe for analysis
    const correlationData = groupDataByTimeframe(healthMetrics, moodEntries, timeframe);
    
    // Analyze correlations using AI
    const correlations = await analyzeCorrelationsWithAI(correlationData, timeframe);
    
    // Save correlation results to database
    for (const correlation of correlations) {
      await storage.createHealthCorrelation({
        userId,
        emotionalMetric: correlation.emotional_metric,
        physicalMetric: correlation.physical_metric,
        correlationScore: correlation.correlation_score,
        confidence: correlation.confidence,
        timeframe,
        insights: correlation.insights,
        recommendations: correlation.recommendations
      });
    }

    return correlations;
  } catch (error) {
    console.error('Error analyzing health correlations:', error);
    return [];
  }
}

function groupDataByTimeframe(
  healthMetrics: HealthMetric[],
  moodEntries: MoodEntry[],
  timeframe: 'daily' | 'weekly' | 'monthly'
): CorrelationData {
  const cutoffDate = new Date();
  
  switch (timeframe) {
    case 'daily':
      cutoffDate.setDate(cutoffDate.getDate() - 7); // Last 7 days
      break;
    case 'weekly':
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Last 30 days
      break;
    case 'monthly':
      cutoffDate.setDate(cutoffDate.getDate() - 90); // Last 90 days
      break;
  }

  const filteredHealthMetrics = healthMetrics.filter(
    metric => new Date(metric.timestamp) >= cutoffDate
  );
  
  const filteredMoodEntries = moodEntries.filter(
    entry => new Date(entry.createdAt || '') >= cutoffDate
  );

  return {
    healthMetrics: filteredHealthMetrics,
    moodEntries: filteredMoodEntries,
    timeframe
  };
}

async function analyzeCorrelationsWithAI(
  data: CorrelationData,
  timeframe: string
): Promise<CorrelationResult[]> {
  const prompt = `
Analyze the correlation between physical health metrics and emotional states for therapeutic insights.

HEALTH METRICS DATA:
${JSON.stringify(data.healthMetrics.map(m => ({
  type: m.metricType,
  value: m.value,
  unit: m.unit,
  timestamp: m.timestamp,
  confidence: m.confidence
})), null, 2)}

MOOD/EMOTIONAL DATA:
${JSON.stringify(data.moodEntries.map(m => ({
  mood: m.mood,
  intensity: m.intensity,
  notes: m.notes,
  timestamp: m.createdAt
})), null, 2)}

ANALYSIS REQUIREMENTS:
1. Calculate correlation scores (-1.0 to 1.0) between physical metrics and emotional states
2. Identify meaningful patterns in the ${timeframe} timeframe
3. Generate therapeutic insights about mind-body connections
4. Provide actionable recommendations for wellness improvement
5. Focus on clinically relevant correlations (>0.3 or <-0.3)

Return a JSON array of correlation results with this exact format:
[
  {
    "emotional_metric": "mood_anxiety",
    "physical_metric": "heart_rate",
    "correlation_score": 0.65,
    "confidence": 0.85,
    "insights": [
      "Higher heart rate measurements correlate with increased anxiety levels",
      "Morning heart rate spikes often precede anxious mood entries"
    ],
    "recommendations": [
      "Consider heart rate monitoring as an early anxiety indicator",
      "Practice deep breathing when heart rate exceeds normal range"
    ]
  }
]

Focus on these physical metrics when available: heart_rate, sleep_quality, steps, stress_level, activity_minutes
Focus on these emotional metrics: mood (anxiety, depression, stress), intensity levels, emotional patterns

Only include correlations with confidence >0.6 and correlation_score magnitude >0.3.
Limit to 5 most significant correlations.
`;

  try {
    const response = await retryOpenAIRequest(() => 
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a health analytics AI specializing in mind-body correlation analysis for therapeutic applications. Provide precise, evidence-based insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3
      })
    );

    const correlations = JSON.parse(response.choices[0]?.message?.content || '[]');
    
    // Validate and sanitize the response
    return correlations.filter((corr: any) => 
      corr.emotional_metric && 
      corr.physical_metric && 
      typeof corr.correlation_score === 'number' &&
      typeof corr.confidence === 'number' &&
      Array.isArray(corr.insights) &&
      Array.isArray(corr.recommendations)
    );
  } catch (error) {
    console.error('Error analyzing correlations with AI:', error);
    return [];
  }
}

// Generate wellness insights based on correlation patterns
export async function generateWellnessInsights(userId: number): Promise<string[]> {
  try {
    const correlations = await storage.getHealthCorrelations(userId);
    
    if (correlations.length === 0) {
      return [
        "Connect a wearable device to discover insights about your mind-body wellness patterns",
        "Health data correlations will help personalize your therapeutic recommendations"
      ];
    }

    const insights: string[] = [];
    
    // Extract insights from stored correlations
    correlations.forEach(correlation => {
      if (correlation.insights && correlation.insights.length > 0) {
        insights.push(...correlation.insights.slice(0, 2)); // Top 2 insights per correlation
      }
    });

    // Add general wellness insights
    const strongCorrelations = correlations.filter(c => Math.abs(c.correlationScore) > 0.5);
    if (strongCorrelations.length > 0) {
      insights.push("Your health data shows clear mind-body connections that can guide your wellness journey");
    }

    return insights.slice(0, 5); // Return top 5 insights
  } catch (error) {
    console.error('Error generating wellness insights:', error);
    return [];
  }
}

// Process health data from wearable devices
export function processHealthData(rawData: any, deviceType: string): HealthMetric[] {
  const processedMetrics: any[] = [];

  try {
    switch (deviceType) {
      case 'apple_watch':
        return processAppleWatchData(rawData);
      case 'pixel_watch':
        return processPixelWatchData(rawData);
      case 'fitbit':
        return processFitbitData(rawData);
      case 'garmin':
        return processGarminData(rawData);
      case 'samsung_health':
        return processSamsungHealthData(rawData);
      default:
        return processGenericHealthData(rawData);
    }
  } catch (error) {
    console.error(`Error processing ${deviceType} data:`, error);
    return [];
  }
}

function processAppleWatchData(data: any): HealthMetric[] {
  const metrics: any[] = [];
  
  // Process heart rate data
  if (data.heartRate) {
    data.heartRate.forEach((hr: any) => {
      metrics.push({
        metricType: 'heart_rate',
        value: hr.value,
        unit: 'bpm',
        timestamp: new Date(hr.date),
        metadata: { source: 'apple_watch', context: hr.context },
        confidence: 0.95
      });
    });
  }

  // Process sleep data
  if (data.sleep) {
    data.sleep.forEach((sleep: any) => {
      metrics.push({
        metricType: 'sleep_duration',
        value: sleep.hours,
        unit: 'hours',
        timestamp: new Date(sleep.date),
        metadata: { 
          source: 'apple_watch', 
          quality: sleep.quality,
          stages: sleep.stages 
        },
        confidence: 0.9
      });
    });
  }

  // Process activity data
  if (data.activity) {
    metrics.push({
      metricType: 'steps',
      value: data.activity.steps,
      unit: 'count',
      timestamp: new Date(data.activity.date),
      metadata: { source: 'apple_watch' },
      confidence: 0.95
    });
  }

  return metrics;
}

function processFitbitData(data: any): HealthMetric[] {
  // Similar processing for Fitbit data structure
  const metrics: any[] = [];
  
  if (data.heartRate) {
    metrics.push({
      metricType: 'heart_rate',
      value: data.heartRate.averageHeartRate,
      unit: 'bpm',
      timestamp: new Date(data.heartRate.date),
      metadata: { source: 'fitbit', zones: data.heartRate.zones },
      confidence: 0.9
    });
  }

  return metrics;
}

function processPixelWatchData(data: any): HealthMetric[] {
  // Process Google Pixel Watch data structure
  const metrics: any[] = [];
  
  // Process heart rate data - Pixel Watch provides detailed heart rate monitoring
  if (data.heartRate) {
    data.heartRate.forEach((hr: any) => {
      metrics.push({
        metricType: 'heart_rate',
        value: hr.value || hr.beatsPerMinute,
        unit: 'bpm',
        timestamp: new Date(hr.timestamp || hr.time),
        metadata: { 
          source: 'pixel_watch', 
          accuracy: hr.accuracy,
          context: hr.context || 'continuous_monitoring'
        },
        confidence: 0.94
      });
    });
  }

  // Process sleep data - Pixel Watch sleep tracking
  if (data.sleep) {
    data.sleep.forEach((sleep: any) => {
      metrics.push({
        metricType: 'sleep_duration',
        value: sleep.totalSleepHours || sleep.duration,
        unit: 'hours',
        timestamp: new Date(sleep.date || sleep.sleepDate),
        metadata: { 
          source: 'pixel_watch', 
          deepSleep: sleep.deepSleepMinutes,
          lightSleep: sleep.lightSleepMinutes,
          remSleep: sleep.remSleepMinutes,
          awakeTime: sleep.awakeMinutes,
          sleepScore: sleep.sleepScore
        },
        confidence: 0.91
      });

      // Add sleep quality as separate metric
      if (sleep.sleepScore) {
        metrics.push({
          metricType: 'sleep_quality',
          value: sleep.sleepScore,
          unit: 'score',
          timestamp: new Date(sleep.date || sleep.sleepDate),
          metadata: { source: 'pixel_watch', maxScore: 100 },
          confidence: 0.89
        });
      }
    });
  }

  // Process step count and activity data
  if (data.steps) {
    metrics.push({
      metricType: 'steps',
      value: data.steps.count || data.steps.totalSteps,
      unit: 'count',
      timestamp: new Date(data.steps.date || data.steps.timestamp),
      metadata: { 
        source: 'pixel_watch',
        distance: data.steps.distance,
        activeMinutes: data.steps.activeMinutes
      },
      confidence: 0.96
    });
  }

  // Process stress levels if available
  if (data.stress) {
    data.stress.forEach((stress: any) => {
      metrics.push({
        metricType: 'stress_level',
        value: stress.level || stress.stressScore,
        unit: 'score',
        timestamp: new Date(stress.timestamp || stress.time),
        metadata: { 
          source: 'pixel_watch',
          stressType: stress.type,
          duration: stress.duration
        },
        confidence: 0.85
      });
    });
  }

  // Process active minutes and exercise data
  if (data.activity) {
    metrics.push({
      metricType: 'activity_minutes',
      value: data.activity.activeMinutes || data.activity.totalActiveMinutes,
      unit: 'minutes',
      timestamp: new Date(data.activity.date || data.activity.timestamp),
      metadata: { 
        source: 'pixel_watch',
        caloriesBurned: data.activity.calories,
        workoutType: data.activity.workoutType,
        intensity: data.activity.intensity
      },
      confidence: 0.92
    });
  }

  return metrics;
}

function processGarminData(data: any): HealthMetric[] {
  // Process Garmin-specific data structure
  return [];
}

function processSamsungHealthData(data: any): HealthMetric[] {
  // Process Samsung Health data structure
  return [];
}

function processGenericHealthData(data: any): HealthMetric[] {
  // Generic processor for unknown device types
  const metrics: any[] = [];
  
  // Try to extract common health metrics
  if (data.heartRate && typeof data.heartRate === 'number') {
    metrics.push({
      metricType: 'heart_rate',
      value: data.heartRate,
      unit: 'bpm',
      timestamp: new Date(data.timestamp || Date.now()),
      metadata: { source: 'generic' },
      confidence: 0.7
    });
  }

  return metrics;
}