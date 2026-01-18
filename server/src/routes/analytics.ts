import { Router } from 'express';
import { requireUserId } from '../lib/auth.js';
import { storage } from '../storage.js';
import { auditMiddleware } from '../middleware/auditLogger.js';

const router = Router();

// Dashboard analytics endpoint
router.post('/dashboard', requireUserId, auditMiddleware('dashboard', 'read'), async (req, res) => {
  try {
    const userId = req.userId!;
    const { dateRange } = req.body;

    // Fetch comprehensive dashboard data
    const [
      journalEntries,
      moodEntries,
      messages,
      milestones
    ] = await Promise.all([
      storage.getJournalEntries(userId, 100),
      storage.getMoodEntries(userId),
      storage.getUserMessages(userId, 100),
      storage.getLearningMilestones(userId)
    ]);

    // Calculate emotional overview
    const moodDistribution = calculateMoodDistribution(moodEntries);
    const weeklyTrend = calculateWeeklyTrend(moodEntries);
    const currentMood = moodEntries.length > 0 ? moodEntries[0].mood : 'neutral';
    
    // Calculate activity overview
    const totalSessions = messages.filter(m => !m.isBot).length;
    const currentStreak = calculateStreak(journalEntries);
    const longestStreak = currentStreak; // Simplified
    const completionRate = calculateCompletionRate(milestones);

    // Calculate progress tracking
    const goalsProgress = await calculateGoalsProgress(userId, milestones);
    const skillsDevelopment = calculateSkillsDevelopment(journalEntries, moodEntries, messages);
    const badgeProgress = calculateBadgeProgress(totalSessions, journalEntries.length, currentStreak);

    // Generate insights
    const insights = generateInsights(journalEntries, moodEntries, messages, milestones);

    const dashboardData = {
      id: `dashboard_${userId}_${Date.now()}`,
      userId,
      dateRange: dateRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      emotionalOverview: {
        id: `emotional_${userId}`,
        currentMood,
        moodDistribution,
        weeklyTrend,
        riskLevel: calculateRiskLevel(moodEntries)
      },
      activityOverview: {
        id: `activity_${userId}`,
        totalSessions,
        weeklySessionGoal: 10,
        currentStreak,
        longestStreak,
        completionRate
      },
      progressTracking: {
        id: `progress_${userId}`,
        goalsProgress,
        badgeProgress,
        skillsDevelopment
      },
      insights: {
        id: `insights_${userId}`,
        topAchievements: insights.achievements,
        areasOfStrength: insights.strengths,
        growthOpportunities: insights.opportunities,
        personalizedTips: insights.tips
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load dashboard data'
    });
  }
});

// Helper functions
function calculateMoodDistribution(moodEntries: any[]) {
  const distribution: any = {};
  moodEntries.forEach(entry => {
    distribution[entry.mood] = (distribution[entry.mood] || 0) + 1;
  });

  const total = moodEntries.length || 1;
  const colors: any = {
    happy: '#10b981',
    good: '#3b82f6',
    neutral: '#f59e0b',
    sad: '#ef4444',
    anxious: '#8b5cf6'
  };

  return Object.entries(distribution).map(([emotion, count], index) => ({
    id: `mood_${emotion}_${index}`,
    emotion,
    percentage: Math.round(((count as number) / total) * 100),
    color: colors[emotion] || '#6b7280'
  }));
}

function calculateWeeklyTrend(moodEntries: any[]) {
  const last7Days = moodEntries.slice(0, 7).reverse();
  
  return last7Days.map((entry, index) => ({
    id: `trend_${index}`,
    date: entry.createdAt || entry.date,
    valence: getMoodValence(entry.mood),
    arousal: entry.intensity || 5
  }));
}

function getMoodValence(mood: string): number {
  const valenceMap: any = {
    happy: 0.8,
    excited: 0.9,
    good: 0.5,
    neutral: 0,
    sad: -0.5,
    anxious: -0.3,
    angry: -0.7
  };
  return valenceMap[mood] || 0;
}

function calculateStreak(journalEntries: any[]): number {
  if (journalEntries.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    
    const hasEntry = journalEntries.some(entry => {
      const entryDate = new Date(entry.createdAt);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === checkDate.getTime();
    });
    
    if (hasEntry) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  
  return streak;
}

function calculateCompletionRate(milestones: any[]): number {
  if (milestones.length === 0) return 0;
  const completed = milestones.filter(m => m.isCompleted).length;
  return Math.round((completed / milestones.length) * 100);
}

async function calculateGoalsProgress(userId: number, milestones: any[]) {
  return milestones.slice(0, 5).map((milestone, index) => ({
    id: `goal_${milestone.id || index}`,
    name: milestone.title || `Goal ${index + 1}`,
    current: milestone.progress || 0,
    target: milestone.target || 100,
    category: milestone.category || 'wellness'
  }));
}

function calculateSkillsDevelopment(journals: any[], moods: any[], messages: any[]) {
  return [
    {
      id: 'skill_journaling',
      skill: 'Journaling',
      level: Math.min(10, Math.floor(journals.length / 5)),
      maxLevel: 10
    },
    {
      id: 'skill_emotional_awareness',
      skill: 'Emotional Awareness',
      level: Math.min(10, Math.floor(moods.length / 3)),
      maxLevel: 10
    },
    {
      id: 'skill_self_reflection',
      skill: 'Self Reflection',
      level: Math.min(10, Math.floor(messages.filter(m => !m.isBot).length / 10)),
      maxLevel: 10
    }
  ];
}

function calculateBadgeProgress(sessions: number, journals: number, streak: number) {
  return [
    {
      id: 'badge_conversationalist',
      name: 'Conversationalist',
      progress: Math.min(100, (sessions / 50) * 100),
      target: 50,
      category: 'engagement'
    },
    {
      id: 'badge_writer',
      name: 'Dedicated Writer',
      progress: Math.min(100, (journals / 30) * 100),
      target: 30,
      category: 'journaling'
    },
    {
      id: 'badge_consistent',
      name: 'Consistency Master',
      progress: Math.min(100, (streak / 30) * 100),
      target: 30,
      category: 'habits'
    }
  ];
}

function calculateRiskLevel(moodEntries: any[]): 'low' | 'medium' | 'high' {
  if (moodEntries.length === 0) return 'low';
  
  const recent = moodEntries.slice(0, 7);
  const negativeCount = recent.filter(m => 
    m.mood === 'sad' || m.mood === 'anxious' || m.mood === 'angry'
  ).length;
  
  if (negativeCount >= 5) return 'high';
  if (negativeCount >= 3) return 'medium';
  return 'low';
}

function generateInsights(journals: any[], moods: any[], messages: any[], milestones: any[]) {
  const achievements = [];
  const strengths = [];
  const opportunities = [];
  const tips = [];

  // Achievements
  if (journals.length > 10) {
    achievements.push({
      id: 'achievement_journaling',
      text: `Completed ${journals.length} journal entries`
    });
  }
  if (moods.length > 20) {
    achievements.push({
      id: 'achievement_mood_tracking',
      text: `Tracked mood ${moods.length} times`
    });
  }
  if (messages.filter(m => !m.isBot).length > 15) {
    achievements.push({
      id: 'achievement_engaged',
      text: 'Highly engaged with AI therapy sessions'
    });
  }

  // Strengths
  if (journals.length > 5) {
    strengths.push({
      id: 'strength_reflection',
      text: 'Strong commitment to self-reflection'
    });
  }
  if (moods.length > 10) {
    strengths.push({
      id: 'strength_awareness',
      text: 'Excellent emotional self-awareness'
    });
  }

  // Opportunities
  if (journals.length < 5) {
    opportunities.push({
      id: 'opportunity_journaling',
      text: 'Increase journaling frequency for better insights'
    });
  }
  if (moods.length < 10) {
    opportunities.push({
      id: 'opportunity_mood',
      text: 'Track mood more regularly to identify patterns'
    });
  }

  // Tips
  tips.push(
    { id: 'tip_1', text: 'Journal daily for 10 minutes to build consistency' },
    { id: 'tip_2', text: 'Track mood at the same time each day' },
    { id: 'tip_3', text: 'Review your progress weekly to stay motivated' }
  );

  return { achievements, strengths, opportunities, tips };
}

export default router;
