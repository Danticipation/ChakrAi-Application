import { storage } from './storage';
import { UserAchievement, WellnessStreak, DailyActivity } from '@shared/schema';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'engagement' | 'milestone' | 'wellness' | 'achievement';
  requirement: {
    type: 'streak' | 'count' | 'milestone' | 'consistency';
    target: number;
    activity?: string;
    timeframe?: string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

export const ACHIEVEMENT_BADGES: Badge[] = [
  // Daily Engagement Badges
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first daily check-in',
    icon: '👣',
    category: 'engagement',
    requirement: { type: 'count', target: 1, activity: 'daily_checkin' },
    rarity: 'common',
    points: 10
  },
  {
    id: 'daily_warrior',
    name: 'Daily Warrior',
    description: 'Maintain a 7-day check-in streak',
    icon: '⚔️',
    category: 'engagement',
    requirement: { type: 'streak', target: 7, activity: 'daily_checkin' },
    rarity: 'rare',
    points: 50
  },
  {
    id: 'consistency_champion',
    name: 'Consistency Champion',
    description: 'Check in daily for 30 consecutive days',
    icon: '🏆',
    category: 'achievement',
    requirement: { type: 'streak', target: 30, activity: 'daily_checkin' },
    rarity: 'epic',
    points: 200
  },
  {
    id: 'wellness_master',
    name: 'Wellness Master',
    description: 'Maintain a 100-day wellness streak',
    icon: '🌟',
    category: 'achievement',
    requirement: { type: 'streak', target: 100, activity: 'daily_checkin' },
    rarity: 'legendary',
    points: 500
  },

  // Journaling Badges
  {
    id: 'storyteller',
    name: 'Storyteller',
    description: 'Write your first journal entry',
    icon: '📝',
    category: 'engagement',
    requirement: { type: 'count', target: 1, activity: 'journal_entry' },
    rarity: 'common',
    points: 15
  },
  {
    id: 'reflection_seeker',
    name: 'Reflection Seeker',
    description: 'Write 10 journal entries',
    icon: '🪞',
    category: 'milestone',
    requirement: { type: 'count', target: 10, activity: 'journal_entry' },
    rarity: 'rare',
    points: 75
  },
  {
    id: 'wisdom_keeper',
    name: 'Wisdom Keeper',
    description: 'Write 50 journal entries',
    icon: '📚',
    category: 'achievement',
    requirement: { type: 'count', target: 50, activity: 'journal_entry' },
    rarity: 'epic',
    points: 300
  },
  {
    id: 'daily_scribe',
    name: 'Daily Scribe',
    description: 'Journal for 14 consecutive days',
    icon: '✍️',
    category: 'wellness',
    requirement: { type: 'streak', target: 14, activity: 'journal_entry' },
    rarity: 'rare',
    points: 100
  },

  // Mood Tracking Badges
  {
    id: 'emotion_explorer',
    name: 'Emotion Explorer',
    description: 'Track your mood for the first time',
    icon: '🎭',
    category: 'engagement',
    requirement: { type: 'count', target: 1, activity: 'mood_tracking' },
    rarity: 'common',
    points: 10
  },
  {
    id: 'mood_detective',
    name: 'Mood Detective',
    description: 'Track mood for 21 consecutive days',
    icon: '🔍',
    category: 'wellness',
    requirement: { type: 'streak', target: 21, activity: 'mood_tracking' },
    rarity: 'epic',
    points: 150
  },
  {
    id: 'emotional_intelligence',
    name: 'Emotional Intelligence',
    description: 'Track 100 mood entries',
    icon: '🧠',
    category: 'achievement',
    requirement: { type: 'count', target: 100, activity: 'mood_tracking' },
    rarity: 'legendary',
    points: 400
  },

  // Chat & Connection Badges
  {
    id: 'conversation_starter',
    name: 'Conversation Starter',
    description: 'Have your first chat session',
    icon: '💬',
    category: 'engagement',
    requirement: { type: 'count', target: 1, activity: 'chat_session' },
    rarity: 'common',
    points: 10
  },
  {
    id: 'deep_thinker',
    name: 'Deep Thinker',
    description: 'Complete 25 meaningful conversations',
    icon: '🤔',
    category: 'milestone',
    requirement: { type: 'count', target: 25, activity: 'chat_session' },
    rarity: 'rare',
    points: 125
  },
  {
    id: 'connection_builder',
    name: 'Connection Builder',
    description: 'Chat for 7 consecutive days',
    icon: '🤝',
    category: 'wellness',
    requirement: { type: 'streak', target: 7, activity: 'chat_session' },
    rarity: 'rare',
    points: 60
  },

  // Goal Achievement Badges
  {
    id: 'goal_setter',
    name: 'Goal Setter',
    description: 'Set your first wellness goal',
    icon: '🎯',
    category: 'engagement',
    requirement: { type: 'count', target: 1, activity: 'goal_progress' },
    rarity: 'common',
    points: 20
  },
  {
    id: 'progress_maker',
    name: 'Progress Maker',
    description: 'Make progress on goals for 10 days',
    icon: '📈',
    category: 'milestone',
    requirement: { type: 'streak', target: 10, activity: 'goal_progress' },
    rarity: 'rare',
    points: 80
  },
  {
    id: 'achievement_master',
    name: 'Achievement Master',
    description: 'Consistently work on goals for 30 days',
    icon: '🎖️',
    category: 'achievement',
    requirement: { type: 'streak', target: 30, activity: 'goal_progress' },
    rarity: 'epic',
    points: 250
  },

  // Special Wellness Badges
  {
    id: 'mindfulness_pioneer',
    name: 'Mindfulness Pioneer',
    description: 'Complete all daily activities in one day',
    icon: '🧘',
    category: 'wellness',
    requirement: { type: 'milestone', target: 1, activity: 'perfect_day' },
    rarity: 'rare',
    points: 100
  },
  {
    id: 'wellness_advocate',
    name: 'Wellness Advocate',
    description: 'Complete all activities for 7 consecutive days',
    icon: '🌱',
    category: 'achievement',
    requirement: { type: 'streak', target: 7, activity: 'perfect_day' },
    rarity: 'epic',
    points: 350
  },
  {
    id: 'transformation_catalyst',
    name: 'Transformation Catalyst',
    description: 'Complete a full month of comprehensive wellness',
    icon: '🦋',
    category: 'achievement',
    requirement: { type: 'streak', target: 30, activity: 'perfect_day' },
    rarity: 'legendary',
    points: 1000
  }
];

export async function trackActivity(userId: number, activityType: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Update daily activity tracking
  await (storage as any).updateDailyActivity?.(userId, today, activityType);

  // Update wellness streaks
  await updateWellnessStreak(userId, activityType);

  // Check for new achievements
  await checkAchievements(userId);
}

async function updateWellnessStreak(userId: number, activityType: string): Promise<void> {
  const streak = await (storage as any).getWellnessStreak?.(userId, activityType);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (!streak) {
    // Create new streak
    await (storage as any).createWellnessStreak?.({
      userId,
      streakType: activityType as any,
      currentStreak: 1,
      longestStreak: 1,
      lastActivity: today
    });
    return;
  }

  const lastActivityDate = new Date(streak.lastActivity || 0);
  lastActivityDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);

  if (lastActivityDate.getTime() === today.getTime()) {
    // Already tracked today
    return;
  }

  let newCurrentStreak = 1;
  if (lastActivityDate.getTime() === yesterday.getTime()) {
    // Consecutive day
    newCurrentStreak = streak.currentStreak + 1;
  }

  const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

  await (storage as any).updateWellnessStreak?.(streak.id, {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastActivity: today
  });
}

// Simple hash function to convert string badge ID to number
function hashBadgeId(badgeId: string): number {
  let hash = 0;
  for (let i = 0; i < badgeId.length; i++) {
    const char = badgeId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

async function checkAchievements(userId: number): Promise<UserAchievement[]> {
  const newAchievements: UserAchievement[] = [];
  const userAchievements = await (storage as any).getUserAchievements?.(userId) || [];
  const earnedBadgeIds = userAchievements.map((a: any) => a.achievementId);

  for (const badge of ACHIEVEMENT_BADGES) {
    const badgeIdHash = hashBadgeId(badge.id);
    if (earnedBadgeIds.includes(badgeIdHash)) {
      continue; // Already earned
    }

    const meetsRequirement = await checkBadgeRequirement(userId, badge);
    if (meetsRequirement) {
      const achievement = await (storage as any).createUserAchievement?.({
        userId,
        achievementId: badgeIdHash,
        progress: badge.requirement.target
      });
      newAchievements.push(achievement);
    }
  }

  return newAchievements;
}

async function checkBadgeRequirement(userId: number, badge: Badge): Promise<boolean> {
  const { requirement } = badge;

  switch (requirement.type) {
    case 'streak': {
      if (!requirement.activity) return false;
      const streak = await (storage as any).getWellnessStreak?.(userId, requirement.activity);
      if (requirement.activity === 'perfect_day') {
        const perfectDayStreak = await calculatePerfectDayStreak(userId);
        return perfectDayStreak >= requirement.target;
      }
      return streak ? streak.currentStreak >= requirement.target : false;
    }

    case 'count': {
      if (!requirement.activity) return false;
      const count = await getActivityCount(userId, requirement.activity);
      return count >= requirement.target;
    }

    case 'milestone': {
      if (requirement.activity === 'perfect_day') {
        const perfectDays = await calculatePerfectDays(userId);
        return perfectDays >= requirement.target;
      }
      return false;
    }

    default:
      return false;
  }
}

async function getActivityCount(userId: number, activityType: string): Promise<number> {
  switch (activityType) {
    case 'daily_checkin':
      return await (storage as any).getDailyCheckinCount?.(userId) || 0;
    case 'journal_entry':
      return await (storage as any).getJournalEntryCount?.(userId) || 0;
    case 'mood_tracking':
      return await (storage as any).getMoodEntryCount?.(userId) || 0;
    case 'chat_session':
      return await (storage as any).getChatSessionCount?.(userId) || 0;
    case 'goal_progress':
      return await (storage as any).getGoalProgressCount?.(userId) || 0;
    default:
      return 0;
  }
}

async function calculatePerfectDays(userId: number): Promise<number> {
  const activities = await (storage as any).getDailyActivitiesHistory?.(userId) || [];
  return activities.filter((day: any) => 
    day.checkedIn && day.journalEntry && day.moodTracked && 
    day.chatSession && day.goalProgress
  ).length;
}

async function calculatePerfectDayStreak(userId: number): Promise<number> {
  const activities = await (storage as any).getDailyActivitiesHistory?.(userId, 100) || []; // Check last 100 days
  let streak = 0;
  
  for (let i = activities.length - 1; i >= 0; i--) {
    const day = activities[i];
    if (day.checkedIn && day.journalEntry && day.moodTracked && 
        day.chatSession && day.goalProgress) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

export function getBadgeById(badgeId: string): Badge | undefined {
  return ACHIEVEMENT_BADGES.find(badge => badge.id === badgeId);
}

export function calculateUserLevel(totalPoints: number): number {
  // Level progression: 100 points per level initially, increasing by 50 each level
  let level = 1;
  let requiredPoints = 0;
  let pointsPerLevel = 100;
  
  while (requiredPoints + pointsPerLevel <= totalPoints) {
    requiredPoints += pointsPerLevel;
    level++;
    pointsPerLevel += 50;
  }
  
  return level;
}

export function getPointsToNextLevel(totalPoints: number): { current: number; next: number; remaining: number } {
  const currentLevel = calculateUserLevel(totalPoints);
  let pointsForCurrentLevel = 0;
  let pointsPerLevel = 100;
  
  for (let i = 1; i < currentLevel; i++) {
    pointsForCurrentLevel += pointsPerLevel;
    pointsPerLevel += 50;
  }
  
  const pointsForNextLevel = pointsForCurrentLevel + pointsPerLevel;
  
  return {
    current: totalPoints - pointsForCurrentLevel,
    next: pointsPerLevel,
    remaining: pointsForNextLevel - totalPoints
  };
}