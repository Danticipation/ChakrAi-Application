import { openai } from './openaiRetry';
import * as schema from '../shared/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

// Interface definitions for enhanced gamification
export interface WellnessPointsBalance {
  userId: number;
  totalPoints: number;
  lifetimePoints: number;
  pointsSpent: number;
  currentLevel: number;
  pointsToNextLevel: number;
  levelProgress: number; // 0.0-1.0
}

export interface RewardsPurchase {
  userId: number;
  rewardId: number;
  pointsCost: number;
  category: string;
  therapeuticValue: string;
}

export interface CommunityChallenge {
  id: number;
  name: string;
  description: string;
  challengeType: string;
  duration: number;
  startDate: Date;
  endDate: Date;
  targetGoal: number;
  pointsReward: number;
  badgeReward?: string;
  participantCount: number;
  completionRate: number;
  therapeuticFocus: string;
  dailyPrompts: any[];
  isActive: boolean;
  isFeatured: boolean;
}

export interface ChallengeProgress {
  challengeId: number;
  userId: number;
  currentProgress: number;
  completedDays: number;
  isCompleted: boolean;
  pointsEarned: number;
  motivationalMessage: string;
  nextPrompt?: string;
}

export interface EmotionalAchievementTrigger {
  userId: number;
  achievementId: string;
  triggerContext: any;
  emotionalState: any;
  progressSnapshot: any;
  confidenceScore: number;
}

export interface TherapeuticReward {
  id: number;
  name: string;
  description: string;
  category: 'avatar' | 'theme' | 'premium_content' | 'virtual_item' | 'therapeutic_tool';
  pointsCost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  therapeuticValue: string;
  isAvailable: boolean;
  unlockRequirement?: any;
}

// Wellness Points Management System
export async function getWellnessPointsBalance(userId: number, storage: any): Promise<WellnessPointsBalance> {
  try {
    let points = await storage.getUserWellnessPoints(userId);
    
    if (!points) {
      // Initialize wellness points for new user
      points = await storage.createUserWellnessPoints({
        userId,
        totalPoints: 0,
        lifetimePoints: 0,
        pointsSpent: 0,
        currentLevel: 1,
        pointsToNextLevel: 100,
        lastActivity: new Date()
      });
    }

    // Calculate level progress
    const levelProgress = Math.max(0, (100 - points.pointsToNextLevel) / 100);

    return {
      userId: points.userId,
      totalPoints: points.totalPoints,
      lifetimePoints: points.lifetimePoints,
      pointsSpent: points.pointsSpent,
      currentLevel: points.currentLevel,
      pointsToNextLevel: points.pointsToNextLevel,
      levelProgress
    };
  } catch (error) {
    console.error('Error getting wellness points balance:', error);
    // Return default balance for new users
    return {
      userId,
      totalPoints: 0,
      lifetimePoints: 0,
      pointsSpent: 0,
      currentLevel: 1,
      pointsToNextLevel: 100,
      levelProgress: 0
    };
  }
}

export async function awardWellnessPoints(
  userId: number, 
  points: number, 
  source: string, 
  sourceId: number | null, 
  description: string,
  storage: any
): Promise<WellnessPointsBalance> {
  try {
    const currentBalance = await getWellnessPointsBalance(userId, storage);
    const newTotalPoints = currentBalance.totalPoints + points;
    const newLifetimePoints = currentBalance.lifetimePoints + points;
    
    // Calculate level progression
    let newLevel = currentBalance.currentLevel;
    let pointsToNextLevel = currentBalance.pointsToNextLevel - points;
    
    // Check for level up
    while (pointsToNextLevel <= 0 && newLevel < 100) {
      newLevel++;
      pointsToNextLevel += calculatePointsRequiredForLevel(newLevel);
    }

    // Update wellness points
    await storage.updateUserWellnessPoints(userId, {
      totalPoints: newTotalPoints,
      lifetimePoints: newLifetimePoints,
      currentLevel: newLevel,
      pointsToNextLevel,
      lastActivity: new Date()
    });

    // Record points history
    await storage.createPointsHistory({
      userId,
      pointsChange: points,
      source,
      sourceId,
      description,
      balanceBefore: currentBalance.totalPoints,
      balanceAfter: newTotalPoints
    });

    // Check for level-up achievement
    if (newLevel > currentBalance.currentLevel) {
      await triggerLevelUpCelebration(userId, newLevel, storage);
    }

    return await getWellnessPointsBalance(userId, storage);
  } catch (error) {
    console.error('Error awarding wellness points:', error);
    return await getWellnessPointsBalance(userId, storage);
  }
}

function calculatePointsRequiredForLevel(level: number): number {
  // Progressive point requirements: 100, 150, 200, 250, etc.
  return 100 + (level - 1) * 50;
}

async function triggerLevelUpCelebration(userId: number, newLevel: number, storage: any) {
  try {
    // Award level-up achievement
    await unlockEmotionalAchievement(userId, `level_${newLevel}`, {
      level: newLevel,
      celebration: true,
      levelUpMessage: `Congratulations! You've reached Level ${newLevel} in your wellness journey!`
    }, storage);
  } catch (error) {
    console.error('Error triggering level-up celebration:', error);
  }
}

// Therapeutic Rewards Shop System
export async function getAvailableRewards(userId: number, storage: any): Promise<TherapeuticReward[]> {
  try {
    const userBalance = await getWellnessPointsBalance(userId, storage);
    const allRewards = await storage.getRewardsShop();
    
    return allRewards
      .filter((reward: any) => reward.isAvailable)
      .map((reward: any) => ({
        ...reward,
        canAfford: userBalance.totalPoints >= reward.pointsCost,
        isUnlocked: checkUnlockRequirement(reward.unlockRequirement, userBalance)
      }))
      .sort((a: any, b: any) => {
        // Sort by affordability, then by rarity, then by cost
        if (a.canAfford !== b.canAfford) return b.canAfford ? 1 : -1;
        const rarityOrder: { [key: string]: number } = { legendary: 4, epic: 3, rare: 2, common: 1 };
        if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        }
        return a.pointsCost - b.pointsCost;
      });
  } catch (error) {
    console.error('Error getting available rewards:', error);
    return [];
  }
}

function checkUnlockRequirement(requirement: any, userBalance: WellnessPointsBalance): boolean {
  if (!requirement) return true;
  
  if (requirement.minLevel && userBalance.currentLevel < requirement.minLevel) {
    return false;
  }
  
  if (requirement.minLifetimePoints && userBalance.lifetimePoints < requirement.minLifetimePoints) {
    return false;
  }
  
  return true;
}

export async function purchaseReward(
  userId: number, 
  rewardId: number, 
  storage: any
): Promise<{ success: boolean; message: string; newBalance?: WellnessPointsBalance }> {
  try {
    const userBalance = await getWellnessPointsBalance(userId, storage);
    const reward = await storage.getRewardById(rewardId);
    
    if (!reward) {
      return { success: false, message: 'Reward not found' };
    }
    
    if (!reward.isAvailable) {
      return { success: false, message: 'Reward is no longer available' };
    }
    
    if (userBalance.totalPoints < reward.pointsCost) {
      return { success: false, message: 'Insufficient wellness points' };
    }
    
    if (!checkUnlockRequirement(reward.unlockRequirement, userBalance)) {
      return { success: false, message: 'Unlock requirements not met' };
    }
    
    // Deduct points
    const newTotalPoints = userBalance.totalPoints - reward.pointsCost;
    const newPointsSpent = userBalance.pointsSpent + reward.pointsCost;
    
    await storage.updateUserWellnessPoints(userId, {
      totalPoints: newTotalPoints,
      pointsSpent: newPointsSpent,
      lastActivity: new Date()
    });
    
    // Record purchase
    await storage.createUserReward({
      userId,
      rewardId,
      pointsSpent: reward.pointsCost,
      isActive: true,
      isEquipped: reward.category === 'avatar' || reward.category === 'theme'
    });
    
    // Record points history
    await storage.createPointsHistory({
      userId,
      pointsChange: -reward.pointsCost,
      source: 'purchase',
      sourceId: rewardId,
      description: `Purchased: ${reward.name}`,
      balanceBefore: userBalance.totalPoints,
      balanceAfter: newTotalPoints
    });
    
    // Update reward purchase count
    await storage.updateRewardPurchaseCount(rewardId);
    
    const newBalance = await getWellnessPointsBalance(userId, storage);
    
    return {
      success: true,
      message: `Successfully purchased ${reward.name}!`,
      newBalance
    };
  } catch (error) {
    console.error('Error purchasing reward:', error);
    return { success: false, message: 'Failed to purchase reward' };
  }
}

// Community Challenges System
export async function getActiveChallenges(storage: any): Promise<CommunityChallenge[]> {
  try {
    const now = new Date();
    const challenges = await storage.getActiveCommunityChallenge(now);
    
    return challenges.map((challenge: any) => ({
      ...challenge,
      daysRemaining: Math.ceil((challenge.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      isJoinable: challenge.endDate > now
    }));
  } catch (error) {
    console.error('Error getting active challenges:', error);
    return [];
  }
}

export async function joinChallenge(
  userId: number, 
  challengeId: number, 
  storage: any
): Promise<{ success: boolean; message: string; challenge?: CommunityChallenge }> {
  try {
    const challenge = await storage.getCommunityChallenge(challengeId);
    if (!challenge) {
      return { success: false, message: 'Challenge not found' };
    }
    
    if (!challenge.isActive || challenge.endDate < new Date()) {
      return { success: false, message: 'Challenge is no longer active' };
    }
    
    // Check if user already joined
    const existingParticipation = await storage.getChallengeParticipant(challengeId, userId);
    if (existingParticipation) {
      return { success: false, message: 'You have already joined this challenge' };
    }
    
    // Join challenge
    await storage.createChallengeParticipant({
      challengeId,
      userId,
      currentProgress: 0,
      completedDays: 0,
      isCompleted: false,
      pointsEarned: 0,
      motivationalMessage: generateMotivationalMessage(challenge.challengeType),
      isActive: true
    });
    
    // Update participant count
    await storage.updateChallengeParticipantCount(challengeId, challenge.participantCount + 1);
    
    // Award joining points
    await awardWellnessPoints(
      userId, 
      10, 
      'challenge', 
      challengeId, 
      `Joined challenge: ${challenge.name}`,
      storage
    );
    
    return {
      success: true,
      message: `Successfully joined ${challenge.name}!`,
      challenge
    };
  } catch (error) {
    console.error('Error joining challenge:', error);
    return { success: false, message: 'Failed to join challenge' };
  }
}

function generateMotivationalMessage(challengeType: string): string {
  const messages = {
    gratitude: "Every moment of gratitude brightens your path to wellness. You've got this! 🌟",
    mindfulness: "Each mindful breath brings you closer to inner peace. Stay present and strong! 🧘",
    journaling: "Your thoughts and feelings matter. Writing them down is a powerful step toward healing! ✍️",
    mood_tracking: "Awareness is the first step to positive change. You're building valuable self-knowledge! 📊",
    social_connection: "Connection heals hearts. Every interaction is building your support network! 🤝",
    self_care: "Taking care of yourself isn't selfish—it's essential. You deserve this kindness! 💙",
    resilience: "You're stronger than you know. Every challenge you face is building your resilience! 💪"
  };
  return messages[challengeType as keyof typeof messages] || "You're on an amazing journey of growth and healing!";
}

export async function updateChallengeProgress(
  userId: number, 
  challengeId: number, 
  activityResponse: string,
  emotionalState: string,
  storage: any
): Promise<{ success: boolean; message: string; progress?: ChallengeProgress }> {
  try {
    const participant = await storage.getChallengeParticipant(challengeId, userId);
    if (!participant) {
      return { success: false, message: 'You are not participating in this challenge' };
    }
    
    const challenge = await storage.getCommunityChallenge(challengeId);
    if (!challenge) {
      return { success: false, message: 'Challenge not found' };
    }
    
    const today = new Date();
    const activityDay = participant.completedDays + 1;
    
    // Record daily activity
    await storage.createChallengeActivity({
      challengeId,
      userId,
      activityDay,
      activityDate: today,
      prompt: challenge.dailyPrompts[activityDay - 1]?.prompt || 'Complete today\'s activity',
      userResponse: activityResponse,
      emotionalState,
      reflectionNotes: '',
      isCompleted: true,
      completedAt: today,
      pointsEarned: 5
    });
    
    // Update participant progress
    const newCompletedDays = participant.completedDays + 1;
    const newProgress = Math.min(100, (newCompletedDays / challenge.targetGoal) * 100);
    const isCompleted = newCompletedDays >= challenge.targetGoal;
    
    await storage.updateChallengeParticipantProgress(challengeId, userId, {
      currentProgress: newProgress,
      completedDays: newCompletedDays,
      isCompleted,
      completedAt: isCompleted ? today : null,
      pointsEarned: participant.pointsEarned + 5
    });
    
    // Award daily points
    await awardWellnessPoints(
      userId,
      5,
      'challenge',
      challengeId,
      `Day ${activityDay} of ${challenge.name}`,
      storage
    );
    
    // Check for completion
    if (isCompleted) {
      await awardWellnessPoints(
        userId,
        challenge.pointsReward,
        'challenge',
        challengeId,
        `Completed challenge: ${challenge.name}`,
        storage
      );
      
      if (challenge.badgeReward) {
        await unlockEmotionalAchievement(userId, challenge.badgeReward, {
          challengeId,
          challengeName: challenge.name,
          completionDate: today
        }, storage);
      }
    }
    
    const updatedProgress = await storage.getChallengeParticipant(challengeId, userId);
    
    return {
      success: true,
      message: isCompleted ? 
        `Congratulations! You've completed ${challenge.name}!` :
        `Great job! Day ${activityDay} completed.`,
      progress: updatedProgress
    };
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return { success: false, message: 'Failed to update progress' };
  }
}

// Dynamic Emotional Achievements System
export async function analyzeEmotionalBreakthroughs(
  userId: number,
  conversationData: any,
  emotionalData: any,
  storage: any
): Promise<string[]> {
  try {
    const recentAchievements = await storage.getUserEmotionalAchievements(userId, 7); // Last 7 days
    const availableAchievements = await storage.getEmotionalAchievements();
    
    const analysisPrompt = `
Analyze this user's therapeutic conversation and emotional data for potential emotional achievements:

Conversation Context: ${JSON.stringify(conversationData)}
Emotional State: ${JSON.stringify(emotionalData)}
Recent Achievements: ${recentAchievements.map((a: any) => a.achievementId).join(', ')}

Available Achievement Categories:
- resilience: Bouncing back from difficult emotions
- emotional_breakthrough: Major insights or emotional releases
- self_awareness: Gaining understanding of patterns/triggers
- mindfulness: Present-moment awareness and acceptance
- social_connection: Reaching out for support or helping others
- coping_skills: Using healthy coping mechanisms
- progress_milestone: Consistent improvement over time

For each potential achievement, provide:
1. Achievement category
2. Confidence score (0.0-1.0)
3. Specific evidence from the conversation
4. Therapeutic significance

Return JSON array of potential achievements.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: analysisPrompt }],
      temperature: 0.3,
      max_tokens: 1000
    });

    const potentialAchievements = JSON.parse(response.choices[0].message.content || '[]');
    const unlockedAchievements: string[] = [];

    for (const achievement of potentialAchievements) {
      if (achievement.confidence >= 0.7) {
        const wasUnlocked = await unlockEmotionalAchievement(
          userId,
          achievement.achievementId,
          {
            conversationContext: conversationData,
            emotionalState: emotionalData,
            evidence: achievement.evidence,
            confidence: achievement.confidence
          },
          storage
        );
        
        if (wasUnlocked) {
          unlockedAchievements.push(achievement.achievementId);
        }
      }
    }

    return unlockedAchievements;
  } catch (error) {
    console.error('Error analyzing emotional breakthroughs:', error);
    return [];
  }
}

export async function unlockEmotionalAchievement(
  userId: number,
  achievementId: string,
  triggerContext: any,
  storage: any
): Promise<boolean> {
  try {
    // Check if already unlocked
    const existingAchievement = await storage.getUserEmotionalAchievement(userId, achievementId);
    if (existingAchievement) {
      return false;
    }

    const achievement = await storage.getEmotionalAchievement(achievementId);
    if (!achievement) {
      console.warn(`Achievement ${achievementId} not found`);
      return false;
    }

    // Unlock achievement
    await storage.createUserEmotionalAchievement({
      userId,
      achievementId,
      triggerContext,
      emotionalState: triggerContext.emotionalState || {},
      progressSnapshot: triggerContext.progressSnapshot || {},
      confidenceScore: triggerContext.confidence || 1.0,
      pointsEarned: achievement.pointsReward || 0,
      isViewed: false
    });

    // Award points
    if (achievement.pointsReward > 0) {
      await awardWellnessPoints(
        userId,
        achievement.pointsReward,
        'achievement',
        null,
        `Unlocked: ${achievement.name}`,
        storage
      );
    }

    return true;
  } catch (error) {
    console.error('Error unlocking emotional achievement:', error);
    return false;
  }
}

// Generate therapeutic challenges
export async function generateWeeklyChallenges(storage: any): Promise<CommunityChallenge[]> {
  try {
    const challengePrompt = `
Generate 3-4 mental wellness community challenges for the upcoming week. Each challenge should:

1. Focus on a specific therapeutic area (gratitude, mindfulness, journaling, etc.)
2. Have 7 daily prompts/activities
3. Be evidence-based and clinically sound
4. Encourage community engagement and accountability
5. Support various mental health goals

For each challenge, provide:
- Name (inspiring but professional)
- Description (2-3 sentences)
- Challenge type
- Therapeutic focus and benefits
- 7 daily prompts with specific activities
- Appropriate point rewards
- Target completion metrics

Return JSON array of challenges.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: challengePrompt }],
      temperature: 0.7,
      max_tokens: 2000
    });

    const generatedChallenges = JSON.parse(response.choices[0].message.content || '[]');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Start tomorrow
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7); // 7 days duration

    const challenges: CommunityChallenge[] = [];

    for (const challenge of generatedChallenges) {
      const newChallenge = await storage.createCommunityChallenge({
        name: challenge.name,
        description: challenge.description,
        challengeType: challenge.challengeType,
        duration: 7,
        startDate,
        endDate,
        targetGoal: 7,
        pointsReward: challenge.pointsReward || 50,
        badgeReward: challenge.badgeReward,
        participantCount: 0,
        completionRate: 0,
        isActive: true,
        isFeatured: challenge.isFeatured || false,
        therapeuticFocus: challenge.therapeuticFocus,
        dailyPrompts: challenge.dailyPrompts
      });

      challenges.push(newChallenge);
    }

    return challenges;
  } catch (error) {
    console.error('Error generating weekly challenges:', error);
    return [];
  }
}

// Initialize default emotional achievements
export async function initializeEmotionalAchievements(storage: any): Promise<void> {
  const defaultAchievements = [
    {
      achievementId: 'first_breakthrough',
      name: 'First Breakthrough',
      description: 'Had your first major emotional insight or breakthrough',
      category: 'emotional_breakthrough',
      triggerCondition: { type: 'first_breakthrough', confidence: 0.8 },
      difficultyLevel: 'beginner',
      rarity: 'common',
      pointsReward: 50,
      badgeIcon: '🌟',
      badgeColor: '#FFD700',
      therapeuticSignificance: 'Emotional breakthroughs mark important moments of self-discovery and healing',
      unlockMessage: 'You\'ve had your first major emotional breakthrough!',
      celebrationMessage: 'This moment of insight is a significant step in your healing journey!'
    },
    {
      achievementId: 'resilience_warrior',
      name: 'Resilience Warrior',
      description: 'Demonstrated remarkable resilience in facing emotional challenges',
      category: 'resilience',
      triggerCondition: { type: 'resilience_display', confidence: 0.8 },
      difficultyLevel: 'intermediate',
      rarity: 'rare',
      pointsReward: 75,
      badgeIcon: '🛡️',
      badgeColor: '#8B4513',
      therapeuticSignificance: 'Resilience is a core therapeutic skill that builds emotional strength',
      unlockMessage: 'Your resilience in tough times shows incredible strength!',
      celebrationMessage: 'You\'re building the emotional resilience that will serve you throughout life!'
    },
    {
      achievementId: 'mindful_moment',
      name: 'Mindful Presence',
      description: 'Showed excellent mindfulness and present-moment awareness',
      category: 'mindfulness',
      triggerCondition: { type: 'mindfulness_practice', confidence: 0.7 },
      difficultyLevel: 'beginner',
      rarity: 'common',
      pointsReward: 25,
      badgeIcon: '🧘',
      badgeColor: '#98FB98',
      therapeuticSignificance: 'Mindfulness reduces anxiety and enhances emotional regulation',
      unlockMessage: 'Beautiful mindful awareness!',
      celebrationMessage: 'Your presence and awareness in this moment is healing!'
    },
    {
      achievementId: 'connection_builder',
      name: 'Connection Builder',
      description: 'Reached out for support or offered help to others',
      category: 'social_connection',
      triggerCondition: { type: 'social_connection', confidence: 0.8 },
      difficultyLevel: 'intermediate',
      rarity: 'rare',
      pointsReward: 60,
      badgeIcon: '🤝',
      badgeColor: '#ADD8E6',
      therapeuticSignificance: 'Social connections are vital for mental health and recovery',
      unlockMessage: 'Your effort to connect and support others is beautiful!',
      celebrationMessage: 'Building connections strengthens both you and your community!'
    },
    {
      achievementId: 'pattern_spotter',
      name: 'Pattern Spotter',
      description: 'Recognized important emotional or behavioral patterns',
      category: 'self_awareness',
      triggerCondition: { type: 'pattern_recognition', confidence: 0.8 },
      difficultyLevel: 'advanced',
      rarity: 'epic',
      pointsReward: 100,
      badgeIcon: '🔍',
      badgeColor: '#9370DB',
      therapeuticSignificance: 'Self-awareness through pattern recognition is key to lasting change',
      unlockMessage: 'Excellent pattern recognition!',
      celebrationMessage: 'Seeing your patterns clearly is a powerful tool for growth!'
    }
  ];

  try {
    for (const achievement of defaultAchievements) {
      await storage.createEmotionalAchievement(achievement);
    }
    console.log('Default emotional achievements initialized');
  } catch (error) {
    console.error('Error initializing emotional achievements:', error);
  }
}

// Initialize default rewards shop items
export async function initializeRewardsShop(storage: any): Promise<void> {
  const defaultRewards = [
    {
      name: 'Calming Ocean Avatar',
      description: 'A peaceful ocean-themed avatar that promotes tranquility',
      category: 'avatar',
      pointsCost: 100,
      rarity: 'common',
      therapeuticValue: 'Visual representation of calm and serenity to support emotional regulation',
      isAvailable: true,
      previewImage: '/avatars/ocean_calm.png'
    },
    {
      name: 'Mindful Forest Theme',
      description: 'Transform your interface with soothing forest colors and sounds',
      category: 'theme',
      pointsCost: 200,
      rarity: 'rare',
      therapeuticValue: 'Nature-inspired themes reduce stress and promote mindful engagement',
      isAvailable: true,
      previewImage: '/themes/forest_mindful.png'
    },
    {
      name: 'Premium Guided Meditations',
      description: 'Access to 50+ exclusive guided meditation sessions',
      category: 'premium_content',
      pointsCost: 500,
      rarity: 'epic',
      therapeuticValue: 'Extended meditation library supports deeper mindfulness practice',
      isAvailable: true,
      unlockRequirement: { minLevel: 3 }
    },
    {
      name: 'Resilience Crystal',
      description: 'A virtual crystal that reminds you of your inner strength',
      category: 'virtual_item',
      pointsCost: 150,
      rarity: 'rare',
      therapeuticValue: 'Symbolic representation of personal resilience and growth',
      isAvailable: true,
      previewImage: '/items/resilience_crystal.png'
    },
    {
      name: 'Advanced Mood Tracker',
      description: 'Enhanced mood tracking with detailed analytics and insights',
      category: 'therapeutic_tool',
      pointsCost: 300,
      rarity: 'epic',
      therapeuticValue: 'Deeper emotional awareness through advanced tracking and analysis',
      isAvailable: true,
      unlockRequirement: { minLevel: 5, minLifetimePoints: 1000 }
    }
  ];

  try {
    for (const reward of defaultRewards) {
      await storage.createReward(reward);
    }
    console.log('Default rewards shop initialized');
  } catch (error) {
    console.error('Error initializing rewards shop:', error);
  }
}