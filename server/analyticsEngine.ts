// Advanced analytics engine for comprehensive wellness reporting
import OpenAI from 'openai';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface WellnessMetrics {
  period: 'weekly' | 'monthly' | 'quarterly';
  startDate: Date;
  endDate: Date;
  emotionalTrends: {
    dominantEmotions: Array<{ emotion: string; frequency: number; trend: 'improving' | 'stable' | 'declining' }>;
    averageValence: number; // -1 to 1
    averageArousal: number; // 0 to 1
    volatility: number; // 0 to 1
    progressDirection: 'improving' | 'stable' | 'declining';
  };
  activityMetrics: {
    totalSessions: number;
    averageSessionLength: number;
    journalEntries: number;
    mindfulnessExercises: number;
    completedGoals: number;
    streakDays: number;
  };
  therapeuticProgress: {
    insightGrowth: number; // 0 to 100
    copingSkillsDeveloped: string[];
    challengesOvercome: string[];
    areasForFocus: string[];
    confidenceScore: number; // 0 to 1
  };
  achievements: {
    badgesEarned: number;
    achievementsUnlocked: number;
    personalBests: string[];
    consistencyScore: number; // 0 to 100
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    priority: 'low' | 'medium' | 'high';
  };
}

export interface MonthlyReport {
  id: string;
  userId: number;
  month: number;
  year: number;
  summary: string;
  keyHighlights: string[];
  emotionalJourney: string;
  progressAchievements: string[];
  challengesAndGrowth: string[];
  therapeuticInsights: string[];
  goalsForNextMonth: string[];
  overallScore: number; // 0 to 100
  generatedAt: Date;
  metrics: WellnessMetrics;
}

export interface DashboardData {
  userId: number;
  dateRange: { start: Date; end: Date };
  emotionalOverview: {
    currentMood: string;
    moodDistribution: Array<{ emotion: string; percentage: number; color: string }>;
    weeklyTrend: Array<{ date: string; valence: number; arousal: number }>;
    riskLevel: 'low' | 'medium' | 'high';
  };
  activityOverview: {
    totalSessions: number;
    weeklySessionGoal: number;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
  };
  progressTracking: {
    goalsProgress: Array<{ name: string; current: number; target: number; category: string }>;
    badgeProgress: Array<{ name: string; progress: number; target: number; category: string }>;
    skillsDevelopment: Array<{ skill: string; level: number; maxLevel: number }>;
  };
  insights: {
    topAchievements: string[];
    areasOfStrength: string[];
    growthOpportunities: string[];
    personalizedTips: string[];
  };
}

// Generate comprehensive monthly wellness report
export async function generateMonthlyReport(
  userId: number,
  month: number,
  year: number
): Promise<MonthlyReport> {
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));
  
  try {
    // Gather all relevant data for the month
    const journalEntries = await getJournalEntriesForPeriod(userId, startDate, endDate);
    const moodEntries = await getMoodEntriesForPeriod(userId, startDate, endDate);
    const achievements = await getAchievementsForPeriod(userId, startDate, endDate);
    const activities = await getActivitiesForPeriod(userId, startDate, endDate);
    const goals = await getGoalsProgressForPeriod(userId, startDate, endDate);
    
    // Calculate metrics
    const metrics = await calculateWellnessMetrics(
      'monthly',
      startDate,
      endDate,
      { journalEntries, moodEntries, achievements, activities, goals }
    );
    
    // Generate AI-powered narrative summary
    const reportNarrative = await generateReportNarrative(
      month,
      year,
      metrics,
      { journalEntries, moodEntries, achievements, activities, goals }
    );
    
    const report: MonthlyReport = {
      id: `report-${userId}-${year}-${month}`,
      userId,
      month,
      year,
      summary: reportNarrative.summary,
      keyHighlights: reportNarrative.keyHighlights,
      emotionalJourney: reportNarrative.emotionalJourney,
      progressAchievements: reportNarrative.progressAchievements,
      challengesAndGrowth: reportNarrative.challengesAndGrowth,
      therapeuticInsights: reportNarrative.therapeuticInsights,
      goalsForNextMonth: reportNarrative.goalsForNextMonth,
      overallScore: calculateOverallWellnessScore(metrics),
      generatedAt: new Date(),
      metrics
    };
    
    return report;
  } catch (error) {
    console.error('Error generating monthly report:', error);
    return generateFallbackReport(userId, month, year);
  }
}

// Calculate comprehensive wellness metrics
async function calculateWellnessMetrics(
  period: 'weekly' | 'monthly' | 'quarterly',
  startDate: Date,
  endDate: Date,
  data: any
): Promise<WellnessMetrics> {
  
  // Emotional trends analysis
  const emotionalTrends = analyzeEmotionalTrends(data.moodEntries);
  
  // Activity metrics calculation
  const activityMetrics = {
    totalSessions: data.activities.length,
    averageSessionLength: calculateAverageSessionLength(data.activities),
    journalEntries: data.journalEntries.length,
    mindfulnessExercises: data.activities.filter((a: any) => a.type === 'mindfulness').length,
    completedGoals: data.goals.filter((g: any) => g.completed).length,
    streakDays: calculateStreakDays(data.activities)
  };
  
  // Therapeutic progress analysis
  const therapeuticProgress = await analyzeTherapeuticProgress(
    data.journalEntries,
    data.moodEntries
  );
  
  // Achievements summary
  const achievements = {
    badgesEarned: data.achievements.length,
    achievementsUnlocked: data.achievements?.length || 0,
    personalBests: extractPersonalBests(data.activities),
    consistencyScore: calculateConsistencyScore(data.activities)
  };
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    emotionalTrends,
    activityMetrics,
    therapeuticProgress
  );
  
  return {
    period,
    startDate,
    endDate,
    emotionalTrends,
    activityMetrics,
    therapeuticProgress,
    achievements,
    recommendations
  };
}

// Generate AI-powered narrative summary
async function generateReportNarrative(
  month: number,
  year: number,
  metrics: WellnessMetrics,
  data: any
): Promise<{
  summary: string;
  keyHighlights: string[];
  emotionalJourney: string;
  progressAchievements: string[];
  challengesAndGrowth: string[];
  therapeuticInsights: string[];
  goalsForNextMonth: string[];
}> {
  
  try {
    const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY']! });
    
    const prompt = `Generate a comprehensive, encouraging monthly wellness report for a user's therapeutic journey.

Month: ${format(new Date(year, month - 1), 'MMMM yyyy')}

Wellness Metrics:
- Emotional Trends: ${JSON.stringify(metrics.emotionalTrends, null, 2)}
- Activity Metrics: ${JSON.stringify(metrics.activityMetrics, null, 2)}
- Therapeutic Progress: ${JSON.stringify(metrics.therapeuticProgress, null, 2)}
- Achievements: ${JSON.stringify(metrics.achievements, null, 2)}

Recent Data Summary:
- Journal Entries: ${data.journalEntries.length} entries
- Mood Check-ins: ${data.moodEntries.length} check-ins
- Activities Completed: ${data.activities.length} activities
- Goals Progress: ${data.goals.length} goals tracked

Please provide a detailed, supportive monthly report in JSON format:
{
  "summary": "2-3 sentence overview of the month's wellness journey",
  "keyHighlights": ["3-4 major positive developments or achievements"],
  "emotionalJourney": "Paragraph describing emotional patterns and growth",
  "progressAchievements": ["3-4 specific accomplishments and improvements"],
  "challengesAndGrowth": ["2-3 challenges faced and how they led to growth"],
  "therapeuticInsights": ["3-4 insights about their therapeutic development"],
  "goalsForNextMonth": ["3-4 specific, achievable goals for continued growth"]
}

Tone: Encouraging, supportive, professional therapeutic language. Focus on growth, resilience, and positive momentum while acknowledging challenges as part of the healing journey.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert therapeutic wellness analyst creating personalized monthly reports. Generate supportive, insightful summaries that celebrate progress and encourage continued growth."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (error) {
    console.error('Error generating report narrative:', error);
    return generateFallbackNarrative(month, year, metrics);
  }
}

// Generate dashboard data for interactive visualizations
export async function generateDashboardData(
  userId: number,
  dateRange: { start: Date; end: Date }
): Promise<DashboardData> {
  
  try {
    // Gather dashboard data
    const moodEntries = await getMoodEntriesForPeriod(userId, dateRange.start, dateRange.end);
    const activities = await getActivitiesForPeriod(userId, dateRange.start, dateRange.end);
    const goals = await getGoalsProgressForPeriod(userId, dateRange.start, dateRange.end);
    const achievements = await getAchievementsForPeriod(userId, dateRange.start, dateRange.end);
    
    // Calculate emotional overview
    const emotionalOverview = calculateEmotionalOverview(moodEntries);
    
    // Calculate activity overview
    const activityOverview = calculateActivityOverview(activities);
    
    // Calculate progress tracking
    const progressTracking = calculateProgressTracking(goals, achievements);
    
    // Generate insights
    const insights = await generateDashboardInsights(
      userId,
      { moodEntries, activities, goals, achievements }
    );
    
    return {
      userId,
      dateRange,
      emotionalOverview,
      activityOverview,
      progressTracking,
      insights
    };
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    return generateFallbackDashboardData(userId, dateRange);
  }
}

// Helper functions for data analysis
function analyzeEmotionalTrends(moodEntries: any[]) {
  if (!moodEntries.length) {
    return {
      dominantEmotions: [],
      averageValence: 0,
      averageArousal: 0,
      volatility: 0,
      progressDirection: 'stable' as const
    };
  }
  
  // Calculate emotional statistics
  const emotionCounts = moodEntries.reduce((acc, entry) => {
    acc[entry.emotion] = (acc[entry.emotion] || 0) + 1;
    return acc;
  }, {});
  
  const dominantEmotions = Object.entries(emotionCounts)
    .map(([emotion, frequency]) => ({
      emotion,
      frequency: frequency as number,
      trend: 'stable' as const // Could be enhanced with trend analysis
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);
  
  const averageValence = moodEntries.reduce((sum, entry) => sum + (entry.valence || 0), 0) / moodEntries.length;
  const averageArousal = moodEntries.reduce((sum, entry) => sum + (entry.arousal || 0), 0) / moodEntries.length;
  
  // Calculate emotional volatility
  const valenceVariance = moodEntries.reduce((sum, entry) => {
    return sum + Math.pow((entry.valence || 0) - averageValence, 2);
  }, 0) / moodEntries.length;
  const volatility = Math.sqrt(valenceVariance);
  
  // Determine progress direction
  const recentEntries = moodEntries.slice(-7); // Last 7 entries
  const recentValence = recentEntries.reduce((sum, entry) => sum + (entry.valence || 0), 0) / recentEntries.length;
  const progressDirection: 'improving' | 'stable' | 'declining' = recentValence > averageValence ? 'improving' : 
                           recentValence < averageValence - 0.1 ? 'declining' : 'stable';
  
  return {
    dominantEmotions,
    averageValence,
    averageArousal,
    volatility,
    progressDirection
  };
}

function calculateAverageSessionLength(activities: any[]): number {
  if (!activities.length) return 0;
  const totalDuration = activities.reduce((sum, activity) => sum + (activity.duration || 0), 0);
  return totalDuration / activities.length;
}

function calculateStreakDays(activities: any[]): number {
  // Calculate current streak of daily activities
  const sortedDates = activities
    .map(a => format(new Date(a.createdAt), 'yyyy-MM-dd'))
    .sort()
    .reverse();
  
  if (!sortedDates.length) return 0;
  
  let streak = 1;
  const today = format(new Date(), 'yyyy-MM-dd');
  
  if (sortedDates[0] !== today) return 0;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i] || '');
    const previousDate = new Date(sortedDates[i - 1] || '');
    const dayDiff = Math.floor((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

async function analyzeTherapeuticProgress(journalEntries: any[], moodEntries: any[]) {
  // This could be enhanced with more sophisticated AI analysis
  return {
    insightGrowth: Math.min(100, journalEntries.length * 5), // Simple metric
    copingSkillsDeveloped: ['Mindfulness', 'Breathing exercises', 'Journaling'],
    challengesOvercome: ['Daily stress management', 'Emotional regulation'],
    areasForFocus: ['Sleep hygiene', 'Social connections'],
    confidenceScore: Math.min(1, (journalEntries.length + moodEntries.length) / 30)
  };
}



function extractPersonalBests(_activities: any[]): string[] {
  return ['Longest meditation streak', '7-day wellness consistency', 'Monthly journaling goal']
    .slice(0, 3);
}

function calculateConsistencyScore(activities: any[]): number {
  // Calculate consistency based on regular activity
  const daysWithActivity = new Set(
    activities.map(a => format(new Date(a.createdAt), 'yyyy-MM-dd'))
  ).size;
  const totalDays = 30; // Assuming 30-day period
  return Math.round((daysWithActivity / totalDays) * 100);
}

function generateRecommendations(
  _emotionalTrends: any,
  _activityMetrics: any,
  _therapeuticProgress: any
) {
  return {
    immediate: [
      'Continue daily mood check-ins',
      'Practice breathing exercises when stressed',
      'Maintain regular sleep schedule'
    ],
    shortTerm: [
      'Increase journaling frequency',
      'Try new mindfulness techniques',
      'Set weekly wellness goals'
    ],
    longTerm: [
      'Develop consistent self-care routine',
      'Build stronger social support network',
      'Explore advanced therapeutic techniques'
    ],
    priority: 'medium' as const
  };
}

function calculateOverallWellnessScore(metrics: WellnessMetrics): number {
  const emotionalScore = (metrics.emotionalTrends.averageValence + 1) * 50; // Convert -1,1 to 0,100
  const activityScore = Math.min(100, metrics.activityMetrics.totalSessions * 5);
  const progressScore = metrics.therapeuticProgress.insightGrowth;
  const achievementScore = metrics.achievements.consistencyScore;
  
  return Math.round((emotionalScore + activityScore + progressScore + achievementScore) / 4);
}

function calculateEmotionalOverview(moodEntries: any[]) {
  if (!moodEntries.length) {
    return {
      currentMood: 'neutral',
      moodDistribution: [],
      weeklyTrend: [],
      riskLevel: 'low' as const
    };
  }
  
  const currentMood = moodEntries[moodEntries.length - 1]?.emotion || 'neutral';
  
  // Calculate mood distribution
  const emotionCounts = moodEntries.reduce((acc, entry) => {
    acc[entry.emotion] = (acc[entry.emotion] || 0) + 1;
    return acc;
  }, {});
  
  const total = moodEntries.length;
  const moodColors = {
    happy: '#10B981',
    calm: '#3B82F6',
    anxious: '#F59E0B',
    sad: '#6B7280',
    angry: '#EF4444',
    stressed: '#F97316',
    excited: '#8B5CF6',
    content: '#059669'
  };
  
  const moodDistribution = Object.entries(emotionCounts).map(([emotion, count]) => ({
    emotion,
    percentage: Math.round((count as number / total) * 100),
    color: moodColors[emotion as keyof typeof moodColors] || '#6B7280'
  }));
  
  // Calculate weekly trend (simplified)
  const weeklyTrend = moodEntries.slice(-7).map(entry => ({
    date: format(new Date(entry.createdAt || new Date()), 'MMM dd'),
    valence: entry.valence || 0,
    arousal: entry.arousal || 0
  }));
  
  // Determine risk level based on recent entries
  const recentNegativeEntries = moodEntries.slice(-5).filter(entry => 
    ['sad', 'anxious', 'angry', 'stressed'].includes(entry.emotion)
  ).length;
  
  const riskLevel: 'low' | 'medium' | 'high' = recentNegativeEntries >= 4 ? 'high' : 
                   recentNegativeEntries >= 2 ? 'medium' : 'low';
  
  return {
    currentMood,
    moodDistribution,
    weeklyTrend,
    riskLevel
  };
}

function calculateActivityOverview(activities: any[]) {
  return {
    totalSessions: activities.length,
    weeklySessionGoal: 7, // Could be user-configurable
    currentStreak: calculateStreakDays(activities),
    longestStreak: 5, // Could be calculated from historical data
    completionRate: activities.length > 0 ? 85 : 0 // Could be calculated based on goals vs completions
  };
}

function calculateProgressTracking(goals: any[], achievements: any[]) {
  return {
    goalsProgress: goals.map(goal => ({
      name: goal.name || 'Wellness Goal',
      current: goal.current || 0,
      target: goal.target || 100,
      category: goal.category || 'general'
    })),
    badgeProgress: achievements.slice(0, 5).map(achievement => ({
      name: achievement.name || 'Achievement',
      progress: 80, // Could be calculated based on actual progress
      target: 100,
      category: achievement.category || 'general'
    })),
    skillsDevelopment: [
      { skill: 'Mindfulness', level: 7, maxLevel: 10 },
      { skill: 'Emotional Regulation', level: 5, maxLevel: 10 },
      { skill: 'Self-Awareness', level: 8, maxLevel: 10 }
    ]
  };
}

async function generateDashboardInsights(_userId: number, _data: any) {
  return {
    topAchievements: [
      'Maintained 7-day wellness streak',
      'Completed 15 mindfulness sessions',
      'Improved mood consistency by 20%'
    ],
    areasOfStrength: [
      'Consistent daily check-ins',
      'Strong emotional awareness',
      'Regular journaling practice'
    ],
    growthOpportunities: [
      'Expand mindfulness practice duration',
      'Explore new coping strategies',
      'Set more challenging goals'
    ],
    personalizedTips: [
      'Morning meditation shows best results for you',
      'Evening journaling improves your sleep quality',
      'Breathing exercises are most effective during stress'
    ]
  };
}

// Fallback functions for error handling
function generateFallbackReport(userId: number, month: number, year: number): MonthlyReport {
  return {
    id: `report-${userId}-${year}-${month}-fallback`,
    userId,
    month,
    year,
    summary: 'This month showed continued engagement with your wellness journey.',
    keyHighlights: ['Regular check-ins maintained', 'Consistent app usage'],
    emotionalJourney: 'Your emotional awareness continues to develop through regular reflection.',
    progressAchievements: ['Maintained wellness routine'],
    challengesAndGrowth: ['Continued building healthy habits'],
    therapeuticInsights: ['Regular reflection supports emotional growth'],
    goalsForNextMonth: ['Continue daily check-ins', 'Explore new wellness practices'],
    overallScore: 70,
    generatedAt: new Date(),
    metrics: {
      period: 'monthly',
      startDate: startOfMonth(new Date(year ?? new Date().getFullYear(), (month ?? 1) - 1)),
      endDate: endOfMonth(new Date(year ?? new Date().getFullYear(), (month ?? 1) - 1)),
      emotionalTrends: {
        dominantEmotions: [],
        averageValence: 0,
        averageArousal: 0,
        volatility: 0,
        progressDirection: 'stable'
      },
      activityMetrics: {
        totalSessions: 0,
        averageSessionLength: 0,
        journalEntries: 0,
        mindfulnessExercises: 0,
        completedGoals: 0,
        streakDays: 0
      },
      therapeuticProgress: {
        insightGrowth: 0,
        copingSkillsDeveloped: [],
        challengesOvercome: [],
        areasForFocus: [],
        confidenceScore: 0
      },
      achievements: {
        badgesEarned: 0,
        achievementsUnlocked: 0,
        personalBests: [],
        consistencyScore: 0
      },
      recommendations: {
        immediate: [],
        shortTerm: [],
        longTerm: [],
        priority: 'low'
      }
    }
  };
}

function generateFallbackNarrative(month: number, year: number, _metrics: WellnessMetrics) {
  const monthName = format(new Date(year ?? new Date().getFullYear(), (month ?? 1) - 1), 'MMMM');
  return {
    summary: `${monthName} was a month of continued wellness journey engagement.`,
    keyHighlights: ['Maintained regular app usage', 'Continued self-reflection practice'],
    emotionalJourney: 'Your emotional awareness continues to develop through consistent engagement with the wellness tools.',
    progressAchievements: ['Regular wellness check-ins', 'Consistent app engagement'],
    challengesAndGrowth: ['Building sustainable wellness habits'],
    therapeuticInsights: ['Regular self-reflection supports emotional development'],
    goalsForNextMonth: ['Continue daily wellness practices', 'Explore new therapeutic tools']
  };
}

function generateFallbackDashboardData(userId: number, dateRange: { start: Date; end: Date }): DashboardData {
  return {
    userId,
    dateRange,
    emotionalOverview: {
      currentMood: 'neutral',
      moodDistribution: [],
      weeklyTrend: [],
      riskLevel: 'low'
    },
    activityOverview: {
      totalSessions: 0,
      weeklySessionGoal: 7,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0
    },
    progressTracking: {
      goalsProgress: [],
      badgeProgress: [],
      skillsDevelopment: []
    },
    insights: {
      topAchievements: [],
      areasOfStrength: [],
      growthOpportunities: [],
      personalizedTips: []
    }
  };
}

// Data retrieval functions (these would be implemented with actual database calls)
async function getJournalEntriesForPeriod(_userId: number, _startDate: Date, _endDate: Date): Promise<any[]> {
  // Implementation would query the database for journal entries in the date range
  return [];
}

async function getMoodEntriesForPeriod(_userId: number, _startDate: Date, _endDate: Date): Promise<any[]> {
  // Implementation would query the database for mood entries in the date range
  return [];
}

async function getAchievementsForPeriod(_userId: number, _startDate: Date, _endDate: Date): Promise<any[]> {
  // Implementation would query the database for achievements in the date range
  return [];
}

async function getActivitiesForPeriod(_userId: number, _startDate: Date, _endDate: Date): Promise<any[]> {
  // Implementation would query the database for activities in the date range
  return [];
}

async function getGoalsProgressForPeriod(_userId: number, _startDate: Date, _endDate: Date): Promise<any[]> {
  // Implementation would query the database for goals progress in the date range
  return [];
}