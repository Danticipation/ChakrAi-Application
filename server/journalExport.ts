import type { JournalEntry, JournalAnalytics } from "../shared/schema.js"; // Changed .ts to .js
import { format } from "date-fns";

export interface ExportOptions {
  format: 'pdf' | 'json' | 'csv';
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeAnalytics: boolean;
  recipientType: 'therapist' | 'self' | 'medical_professional';
}

export interface TherapistReport {
  patientSummary: {
    totalEntries: number;
    dateRange: string;
    averageSentiment: number;
    emotionalTrends: string[];
    concernAreas: string[];
    progressIndicators: string[];
  };
  keyInsights: string[];
  recommendedInterventions: string[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    indicators: string[];
    recommendations: string[];
  };
  therapeuticGoals: string[];
  entries: Array<{
    date: string;
    excerpt: string;
    sentiment: number;
    keyThemes: string[];
    clinicalNotes: string;
  }>;
}

export function generateTherapistReport(
  entries: JournalEntry[],
  analytics: JournalAnalytics[]
): TherapistReport {
  const totalEntries = entries.length;
  const dateRange = entries.length > 0 
    ? `${format(new Date(entries[entries.length - 1]?.createdAt || new Date()), 'MMM dd, yyyy')} - ${format(new Date(entries[0]?.createdAt || new Date()), 'MMM dd, yyyy')}`
    : 'No entries';

  // Calculate average sentiment
  const sentiments = analytics.map(a => Number(a.sentimentScore) || 0);
  const averageSentiment = sentiments.length > 0 
    ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length 
    : 0;

  // Extract themes from analytics data
  const allThemes = analytics.flatMap(a => a.themes || []);
  const themeFrequency = allThemes.reduce((acc, theme) => {
    acc[theme] = (acc[theme] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const emotionalTrends = Object.entries(themeFrequency)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([theme]) => theme);

  // Use recommendations as concern/progress areas since they're available in the schema
  const concernAreas = Array.from(new Set(analytics.flatMap(a => a.recommendations || [])));
  const progressIndicators = Array.from(new Set(analytics.flatMap(a => a.themes || [])));

  // Generate key insights
  const keyInsights = generateClinicalInsights(entries, analytics);

  // Risk assessment
  const riskAssessment = assessOverallRisk(analytics);

  // Therapeutic goals
  const therapeuticGoals = generateTherapeuticGoals(analytics, emotionalTrends);

  // Format entries for therapist review
  const formattedEntries = entries.slice(0, 10).map((entry, index) => {
    const analytic = analytics.find(a => a.entryId === entry.id);
    return {
      date: format(new Date(entry.createdAt || new Date()), 'MMM dd, yyyy'),
      excerpt: entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : ''),
      sentiment: Number(analytic?.sentimentScore) || 0,
      keyThemes: analytic?.themes || [],
      clinicalNotes: analytic?.insights || 'No clinical analysis available'
    };
  });

  return {
    patientSummary: {
      totalEntries,
      dateRange,
      averageSentiment,
      emotionalTrends,
      concernAreas,
      progressIndicators
    },
    keyInsights,
    recommendedInterventions: generateInterventionRecommendations(analytics),
    riskAssessment,
    therapeuticGoals,
    entries: formattedEntries
  };
}

function generateClinicalInsights(
  entries: JournalEntry[],
  analytics: JournalAnalytics[]
): string[] {
  const insights: string[] = [];

  // Consistency insights
  if (entries.length >= 7) {
    insights.push(`Patient demonstrates consistent journaling practice with ${entries.length} entries, indicating engagement with therapeutic process.`);
  }

  // Emotional progression
  const recentAnalytics = analytics.slice(0, 5);
  const olderAnalytics = analytics.slice(-5);
  
  if (recentAnalytics.length > 0 && olderAnalytics.length > 0) {
    const recentAvgSentiment = recentAnalytics.reduce((sum, a) => sum + (Number(a.sentimentScore) || 0), 0) / recentAnalytics.length;
    const olderAvgSentiment = olderAnalytics.reduce((sum, a) => sum + (Number(a.sentimentScore) || 0), 0) / olderAnalytics.length;
    
    if (recentAvgSentiment > olderAvgSentiment + 0.1) {
      insights.push('Recent entries show improvement in emotional tone compared to earlier entries.');
    } else if (recentAvgSentiment < olderAvgSentiment - 0.1) {
      insights.push('Recent entries indicate declining emotional state requiring clinical attention.');
    }
  }

  // Therapeutic recommendations analysis
  const recommendations = Array.from(new Set(analytics.flatMap(a => a.recommendations || [])));
  if (recommendations.length > 3) {
    insights.push(`Patient shows engagement with therapeutic recommendations: ${recommendations.slice(0, 3).join(', ')}.`);
  }

  return insights;
}

function assessOverallRisk(analytics: JournalAnalytics[]): {
  level: 'low' | 'medium' | 'high';
  indicators: string[];
  recommendations: string[];
} {
  const concernAreas = analytics.flatMap(a => a.recommendations || []);
  const lowSentimentEntries = analytics.filter(a => (Number(a.sentimentScore) || 0) < -0.5).length;
  const highIntensityEntries = analytics.filter(a => (a.emotionalIntensity || 0) > 80).length;

  let level: 'low' | 'medium' | 'high' = 'low';
  const indicators: string[] = [];
  const recommendations: string[] = [];

  if (concernAreas.length > 5) {
    indicators.push('Multiple concern areas identified across entries');
    level = 'medium';
  }

  if (lowSentimentEntries > analytics.length * 0.4) {
    indicators.push('Persistent negative sentiment patterns');
    level = 'medium';
  }

  if (highIntensityEntries > analytics.length * 0.3) {
    indicators.push('Frequent high emotional intensity episodes');
    if (level === 'medium') level = 'high';
  }

  // Generate recommendations based on risk level
  switch (level) {
    case 'low':
      recommendations.push('Continue current therapeutic approach');
      recommendations.push('Regular monitoring through journaling');
      break;
    case 'medium':
      recommendations.push('Increase session frequency');
      recommendations.push('Implement targeted coping strategies');
      recommendations.push('Consider additional therapeutic modalities');
      break;
    case 'high':
      recommendations.push('Immediate clinical attention recommended');
      recommendations.push('Consider crisis intervention protocols');
      recommendations.push('Evaluate medication management needs');
      break;
  }

  return { level, indicators, recommendations };
}

function generateInterventionRecommendations(analytics: JournalAnalytics[]): string[] {
  const recommendations: string[] = [];
  
  // Extract common themes for targeted interventions
  const allThemes = analytics.flatMap(a => a.themes || []);
  const themeFrequency = allThemes.reduce((acc, theme) => {
    acc[theme] = (acc[theme] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topThemes = Object.entries(themeFrequency)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3);

  topThemes.forEach(([theme, frequency]) => {
    if (theme.includes('anxiety')) {
      recommendations.push('Consider anxiety-focused CBT techniques');
    } else if (theme.includes('depression')) {
      recommendations.push('Implement depression-specific interventions');
    } else if (theme.includes('stress')) {
      recommendations.push('Stress management and relaxation techniques');
    }
  });

  // General recommendations based on patterns
  const avgSentiment = analytics.reduce((sum, a) => sum + (Number(a.sentimentScore) || 0), 0) / analytics.length;
  if (avgSentiment < -0.3) {
    recommendations.push('Focus on mood stabilization techniques');
  }

  return recommendations;
}

function generateTherapeuticGoals(analytics: JournalAnalytics[], trends: string[]): string[] {
  const goals: string[] = [];

  // Goal based on emotional trends
  if (trends.includes('anxiety')) {
    goals.push('Develop anxiety management skills and coping strategies');
  }
  if (trends.includes('depression')) {
    goals.push('Improve mood regulation and behavioral activation');
  }
  if (trends.includes('stress')) {
    goals.push('Enhance stress resilience and work-life balance');
  }

  // General therapeutic goals
  goals.push('Increase emotional awareness and regulation skills');
  goals.push('Develop healthy coping mechanisms for challenging situations');
  goals.push('Improve self-reflection and insight through continued journaling');

  return goals;
}

export function generatePersonalInsightsSummary(
  entries: JournalEntry[],
  analytics: JournalAnalytics[]
): {
  overview: string;
  emotionalJourney: string[];
  patterns: string[];
  growth: string[];
  recommendations: string[];
} {
  const totalEntries = entries.length;
  const dateSpan = entries.length > 0 
    ? Math.ceil((new Date(entries[0]?.createdAt || new Date()).getTime() - new Date(entries[entries.length - 1]?.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const avgSentiment = analytics.length > 0
    ? analytics.reduce((sum, a) => sum + (Number(a.sentimentScore) || 0), 0) / analytics.length
    : 0;

  const overview = `Your journaling journey spans ${totalEntries} entries over ${dateSpan} days. Your average emotional tone is ${avgSentiment > 0 ? 'positive' : avgSentiment < 0 ? 'challenging' : 'neutral'}.`;

  const emotionalThemes = analytics.flatMap(a => a.themes || []);
  const themeSet = Array.from(new Set(emotionalThemes));

  return {
    overview,
    emotionalJourney: [
      `Started journaling ${dateSpan} days ago`,
      `Completed ${totalEntries} reflective entries`,
      `Primary emotional themes: ${themeSet.slice(0, 3).join(', ')}`
    ],
    patterns: [
      `Most active journaling periods show ${avgSentiment > 0 ? 'positive' : 'reflective'} emotional processing`,
      `Consistent engagement with self-reflection and emotional awareness`
    ],
    growth: [
      'Developing emotional vocabulary through regular expression',
      'Building self-awareness through consistent practice'
    ],
    recommendations: [
      'Continue regular journaling practice',
      'Consider exploring specific emotional themes in more depth',
      'Share insights with mental health professional if desired'
    ]
  };
}

export function calculateJournalMetrics(entry: JournalEntry): {
  wordCount: number;
  readingTime: number;
  complexity: number;
} {
  const words = entry.content.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const readingTime = Math.ceil(wordCount / 200);
  
  const sentences = entry.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = wordCount / Math.max(sentences.length, 1);
  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
  const complexity = Math.min(100, (avgWordsPerSentence * 2) + (uniqueWords / wordCount * 100));
  
  return {
    wordCount,
    readingTime,
    complexity: Math.round(complexity)
  };
}
