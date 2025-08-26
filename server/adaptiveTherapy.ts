// AI-Driven Adaptive Therapeutic Plans System
import OpenAI from 'openai';

export interface TherapeuticPlan {
  id: string;
  userId: number;
  planType: 'daily' | 'weekly' | 'monthly' | 'crisis_intervention';
  generatedAt: Date;
  validUntil: Date;
  adaptationLevel: number; // 0.0-1.0 how much to adapt from baseline
  therapeuticGoals: TherapeuticGoal[];
  dailyActivities: DailyActivity[];
  weeklyMilestones: WeeklyMilestone[];
  progressMetrics: ProgressMetric[];
  adaptationTriggers: AdaptationTrigger[];
  confidenceScore: number; // 0.0-1.0 AI confidence in plan effectiveness
}

export interface TherapeuticGoal {
  id: string;
  category: 'emotional_regulation' | 'anxiety_management' | 'depression_support' | 'stress_reduction' | 'mindfulness' | 'social_connection' | 'self_care' | 'crisis_prevention';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  targetCompletion: Date;
  measurableOutcomes: string[];
  adaptiveStrategies: string[];
  progressIndicators: string[];
}

export interface DailyActivity {
  id: string;
  type: 'mindfulness' | 'cbt_exercise' | 'journaling' | 'breathing' | 'physical_activity' | 'social_interaction' | 'self_reflection' | 'crisis_check';
  title: string;
  description: string;
  estimatedDuration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  emotionalFocus: string[];
  instructions: string[];
  adaptationNotes: string;
  scheduledTime?: string; // "morning", "afternoon", "evening", or specific time
  personalizedReason: string;
}

export interface WeeklyMilestone {
  id: string;
  week: number;
  goalTitle: string;
  description: string;
  successCriteria: string[];
  rewardType: 'badge' | 'celebration' | 'next_level_unlock' | 'therapist_recognition';
  adaptationPoints: number; // Points earned for plan adaptation
}

export interface ProgressMetric {
  category: string;
  baseline: number;
  currentValue: number;
  targetValue: number;
  trend: 'improving' | 'stable' | 'declining';
  confidenceLevel: number;
  lastUpdated: Date;
}

export interface AdaptationTrigger {
  type: 'emotional_spike' | 'plateau' | 'regression' | 'breakthrough' | 'external_stressor' | 'goal_achievement';
  threshold: number;
  responseAction: 'increase_intensity' | 'reduce_intensity' | 'change_focus' | 'add_support' | 'celebrate_progress';
  description: string;
}

export interface CarePlanAnalytics {
  userId: number;
  timeframe: { start: Date; end: Date };
  emotionalPatterns: {
    dominantMoods: Array<{ mood: string; frequency: number; trend: string }>;
    volatilityScore: number;
    stabilityPeriods: Array<{ start: Date; end: Date; avgMood: number }>;
    triggerEvents: Array<{ date: Date; trigger: string; impact: number }>;
  };
  engagementMetrics: {
    activitiesCompleted: number;
    adherenceRate: number;
    preferredActivityTypes: string[];
    dropOffPoints: string[];
    peakEngagementTimes: string[];
  };
  therapeuticProgress: {
    goalCompletionRate: number;
    skillsDeveloped: string[];
    challengesOvercome: string[];
    areasNeedingFocus: string[];
    resilienceScore: number;
  };
  adaptationHistory: {
    planChanges: number;
    reasonsForChange: string[];
    adaptationEffectiveness: number;
    userSatisfaction: number;
  };
}

// Generate comprehensive therapeutic plan using AI analysis
export async function generateAdaptiveTherapeuticPlan(
  userId: number,
  planType: 'daily' | 'weekly' | 'monthly' = 'weekly',
  analytics?: CarePlanAnalytics
): Promise<TherapeuticPlan> {
  try {
    const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY']! });

    // Gather user data for analysis
    const userAnalytics = analytics || await analyzeUserTherapeuticNeeds(userId);
    
    const prompt = `Generate a comprehensive adaptive therapeutic plan for a mental health user based on their analytics and progress data.

User Analytics:
${JSON.stringify(userAnalytics, null, 2)}

Plan Type: ${planType}
Current Date: ${new Date().toISOString()}

Requirements:
1. Create evidence-based therapeutic goals targeting the user's specific needs
2. Design daily activities that adapt to emotional patterns and engagement preferences
3. Set progressive weekly milestones that build therapeutic skills
4. Include adaptation triggers for dynamic plan adjustment
5. Ensure cultural sensitivity and personalization
6. Focus on measurable outcomes and progress tracking
7. Balance challenge with achievability to maintain motivation
8. Include crisis prevention strategies based on identified risk patterns

Therapeutic Approaches to Consider:
- Cognitive Behavioral Therapy (CBT) techniques
- Mindfulness-Based Stress Reduction (MBSR)
- Dialectical Behavior Therapy (DBT) skills
- Acceptance and Commitment Therapy (ACT) principles
- Trauma-informed care approaches
- Positive psychology interventions
- Behavioral activation strategies

Provide a JSON response with the complete therapeutic plan structure including goals, activities, milestones, and adaptation triggers.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert clinical psychologist and therapeutic plan designer specializing in adaptive AI-driven mental health interventions. Create personalized, evidence-based therapeutic plans that adapt to user needs and progress."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 3000
    });

    const planData = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    // Construct the therapeutic plan
    const therapeuticPlan: TherapeuticPlan = {
      id: `plan-${userId}-${Date.now()}`,
      userId,
      planType,
      generatedAt: new Date(),
      validUntil: getValidUntilDate(planType),
      adaptationLevel: calculateAdaptationLevel(userAnalytics),
      therapeuticGoals: planData.therapeuticGoals || generateDefaultGoals(userAnalytics),
      dailyActivities: planData.dailyActivities || generateDefaultActivities(userAnalytics),
      weeklyMilestones: planData.weeklyMilestones || generateDefaultMilestones(),
      progressMetrics: planData.progressMetrics || generateProgressMetrics(userAnalytics),
      adaptationTriggers: planData.adaptationTriggers || generateAdaptationTriggers(),
      confidenceScore: planData.confidenceScore || 0.8
    };

    return therapeuticPlan;
  } catch (error) {
    console.error('Error generating adaptive therapeutic plan:', error);
    return generateFallbackPlan(userId, planType);
  }
}

// Analyze user's therapeutic needs from historical data
export async function analyzeUserTherapeuticNeeds(userId: number): Promise<CarePlanAnalytics> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Last 30 days

    // In a real implementation, this would query actual user data
    // For now, providing structured analytics based on typical patterns
    
    const analytics: CarePlanAnalytics = {
      userId,
      timeframe: { start: startDate, end: endDate },
      emotionalPatterns: {
        dominantMoods: [
          { mood: 'anxious', frequency: 0.35, trend: 'stable' },
          { mood: 'stressed', frequency: 0.25, trend: 'improving' },
          { mood: 'hopeful', frequency: 0.20, trend: 'improving' },
          { mood: 'overwhelmed', frequency: 0.20, trend: 'declining' }
        ],
        volatilityScore: 0.6,
        stabilityPeriods: [
          { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date(), avgMood: 6.2 }
        ],
        triggerEvents: [
          { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), trigger: 'work_deadline', impact: 0.7 },
          { date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), trigger: 'social_conflict', impact: 0.5 }
        ]
      },
      engagementMetrics: {
        activitiesCompleted: 18,
        adherenceRate: 0.75,
        preferredActivityTypes: ['mindfulness', 'journaling', 'breathing'],
        dropOffPoints: ['morning_meditation', 'evening_reflection'],
        peakEngagementTimes: ['afternoon', 'early_evening']
      },
      therapeuticProgress: {
        goalCompletionRate: 0.65,
        skillsDeveloped: ['breathing_techniques', 'thought_challenging', 'emotion_labeling'],
        challengesOvercome: ['panic_management', 'social_anxiety_coping'],
        areasNeedingFocus: ['stress_management', 'sleep_hygiene', 'boundary_setting'],
        resilienceScore: 7.2
      },
      adaptationHistory: {
        planChanges: 3,
        reasonsForChange: ['increased_stress', 'goal_achievement', 'preference_update'],
        adaptationEffectiveness: 0.82,
        userSatisfaction: 8.1
      }
    };

    return analytics;
  } catch (error) {
    console.error('Error analyzing user therapeutic needs:', error);
    return generateDefaultAnalytics(userId);
  }
}

// Adapt existing plan based on real-time progress and feedback
export async function adaptTherapeuticPlan(
  currentPlan: TherapeuticPlan,
  triggerType: AdaptationTrigger['type'],
  userFeedback?: any
): Promise<TherapeuticPlan> {
  try {
    const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY']! });

    const prompt = `Adapt an existing therapeutic plan based on user progress and trigger events.

Current Plan:
${JSON.stringify(currentPlan, null, 2)}

Adaptation Trigger: ${triggerType}
User Feedback: ${JSON.stringify(userFeedback || {}, null, 2)}

Requirements:
1. Maintain therapeutic continuity while addressing the trigger
2. Adjust activity difficulty and frequency based on user capacity
3. Modify goals if needed based on progress or setbacks
4. Update adaptation triggers for future responsiveness
5. Preserve successful elements of the current plan
6. Ensure adapted plan remains evidence-based and achievable

Adaptation Guidelines:
- emotional_spike: Increase grounding and crisis prevention activities
- plateau: Introduce new challenges and variety
- regression: Reduce intensity and add more support
- breakthrough: Celebrate and build on success
- external_stressor: Add specific coping strategies
- goal_achievement: Set new progressive goals

Provide the adapted therapeutic plan as JSON.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert adaptive therapy specialist. Modify therapeutic plans based on user progress, setbacks, and changing needs while maintaining therapeutic effectiveness."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 2500
    });

    const adaptedPlanData = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    const adaptedPlan: TherapeuticPlan = {
      ...currentPlan,
      id: `adapted-${currentPlan.id}-${Date.now()}`,
      generatedAt: new Date(),
      adaptationLevel: Math.min(currentPlan.adaptationLevel + 0.1, 1.0),
      therapeuticGoals: adaptedPlanData.therapeuticGoals || currentPlan.therapeuticGoals,
      dailyActivities: adaptedPlanData.dailyActivities || currentPlan.dailyActivities,
      weeklyMilestones: adaptedPlanData.weeklyMilestones || currentPlan.weeklyMilestones,
      progressMetrics: updateProgressMetrics(currentPlan.progressMetrics),
      adaptationTriggers: adaptedPlanData.adaptationTriggers || currentPlan.adaptationTriggers,
      confidenceScore: adaptedPlanData.confidenceScore || Math.max(currentPlan.confidenceScore - 0.1, 0.5)
    };

    return adaptedPlan;
  } catch (error) {
    console.error('Error adapting therapeutic plan:', error);
    return currentPlan; // Return unchanged plan if adaptation fails
  }
}

// Generate personalized CBT exercises based on user patterns
export async function generatePersonalizedCBTExercises(
  userId: number,
  emotionalPattern: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<DailyActivity[]> {
  try {
    const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY']! });

    const prompt = `Generate personalized CBT (Cognitive Behavioral Therapy) exercises for a user's specific emotional patterns.

User ID: ${userId}
Emotional Pattern: ${emotionalPattern}
Difficulty Level: ${difficulty}

Requirements:
1. Create 3-5 specific CBT exercises targeting the emotional pattern
2. Include clear, step-by-step instructions
3. Provide thought record templates where appropriate
4. Include behavioral experiments and homework
5. Ensure exercises are appropriate for the difficulty level
6. Add personalization based on the specific emotional pattern
7. Include measurable outcomes and progress indicators

CBT Techniques to Consider:
- Thought challenging and cognitive restructuring
- Behavioral activation and activity scheduling
- Exposure therapy principles (gradual)
- Problem-solving skills training
- Mindfulness-based cognitive approaches
- Relapse prevention strategies

Provide JSON array of CBT exercises with detailed instructions and therapeutic rationale.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a licensed CBT therapist specializing in personalized therapeutic interventions. Create evidence-based CBT exercises that are practical, engaging, and therapeutically effective."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const exerciseData = JSON.parse(response.choices[0]?.message?.content || '{}');
    return exerciseData.exercises || generateDefaultCBTExercises(emotionalPattern, difficulty);
  } catch (error) {
    console.error('Error generating personalized CBT exercises:', error);
    return generateDefaultCBTExercises(emotionalPattern, difficulty);
  }
}

// Monitor plan effectiveness and trigger adaptations
export async function monitorPlanEffectiveness(
  userId: number,
  planId: string
): Promise<{ shouldAdapt: boolean; reasons: string[]; suggestedChanges: string[] }> {
  try {
    // Analyze recent user data against plan expectations
    const recentAnalytics = await analyzeUserTherapeuticNeeds(userId);
    
    const reasons: string[] = [];
    const suggestedChanges: string[] = [];
    let shouldAdapt = false;

    // Check engagement metrics
    if (recentAnalytics.engagementMetrics.adherenceRate < 0.6) {
      shouldAdapt = true;
      reasons.push('Low adherence rate detected');
      suggestedChanges.push('Reduce activity complexity and frequency');
    }

    // Check emotional volatility
    if (recentAnalytics.emotionalPatterns.volatilityScore > 0.8) {
      shouldAdapt = true;
      reasons.push('High emotional volatility');
      suggestedChanges.push('Add more grounding and stabilization activities');
    }

    // Check progress stagnation
    if (recentAnalytics.therapeuticProgress.goalCompletionRate < 0.4) {
      shouldAdapt = true;
      reasons.push('Limited progress on therapeutic goals');
      suggestedChanges.push('Adjust goal difficulty and add intermediate milestones');
    }

    return { shouldAdapt, reasons, suggestedChanges };
  } catch (error) {
    console.error('Error monitoring plan effectiveness:', error);
    return { shouldAdapt: false, reasons: [], suggestedChanges: [] };
  }
}

// Helper functions
function getValidUntilDate(planType: string): Date {
  const now = new Date();
  switch (planType) {
    case 'daily': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
}

function calculateAdaptationLevel(analytics: CarePlanAnalytics): number {
  const factors = [
    analytics.emotionalPatterns.volatilityScore,
    1 - analytics.engagementMetrics.adherenceRate,
    analytics.adaptationHistory.adaptationEffectiveness
  ];
  return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
}

function updateProgressMetrics(currentMetrics: ProgressMetric[]): ProgressMetric[] {
  return currentMetrics.map(metric => ({
    ...metric,
    lastUpdated: new Date(),
    confidenceLevel: Math.min(metric.confidenceLevel + 0.05, 1.0)
  }));
}

function generateDefaultGoals(analytics: CarePlanAnalytics): TherapeuticGoal[] {
  return [
    {
      id: `goal-${Date.now()}-1`,
      category: 'emotional_regulation',
      title: 'Improve Emotional Awareness',
      description: 'Develop ability to identify and label emotions accurately',
      priority: 'high',
      targetCompletion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      measurableOutcomes: ['Daily emotion check-ins', 'Emotion labeling accuracy'],
      adaptiveStrategies: ['Mindfulness exercises', 'Emotion wheel practice'],
      progressIndicators: ['Frequency of emotion recognition', 'Complexity of emotional vocabulary']
    }
  ];
}

function generateDefaultActivities(analytics: CarePlanAnalytics): DailyActivity[] {
  return [
    {
      id: `activity-${Date.now()}-1`,
      type: 'mindfulness',
      title: 'Morning Mindfulness Check-in',
      description: 'Start your day with 5 minutes of mindful awareness',
      estimatedDuration: 5,
      difficulty: 'beginner',
      emotionalFocus: ['awareness', 'grounding'],
      instructions: [
        'Find a comfortable seated position',
        'Take three deep breaths',
        'Notice your current emotional state',
        'Set an intention for the day'
      ],
      adaptationNotes: 'Can extend to 10 minutes as comfort increases',
      scheduledTime: 'morning',
      personalizedReason: 'Based on your preference for morning activities'
    }
  ];
}

function generateDefaultMilestones(): WeeklyMilestone[] {
  return [
    {
      id: `milestone-${Date.now()}-1`,
      week: 1,
      goalTitle: 'Establish Daily Mindfulness Practice',
      description: 'Complete mindfulness exercises for 5 consecutive days',
      successCriteria: ['Complete 5 daily sessions', 'Show emotional awareness improvement'],
      rewardType: 'badge',
      adaptationPoints: 10
    }
  ];
}

function generateProgressMetrics(analytics: CarePlanAnalytics): ProgressMetric[] {
  return [
    {
      category: 'emotional_stability',
      baseline: analytics.emotionalPatterns.volatilityScore,
      currentValue: analytics.emotionalPatterns.volatilityScore,
      targetValue: Math.max(analytics.emotionalPatterns.volatilityScore - 0.2, 0.2),
      trend: 'stable',
      confidenceLevel: 0.7,
      lastUpdated: new Date()
    }
  ];
}

function generateAdaptationTriggers(): AdaptationTrigger[] {
  return [
    {
      type: 'emotional_spike',
      threshold: 0.8,
      responseAction: 'add_support',
      description: 'Add crisis support activities when emotional volatility exceeds threshold'
    }
  ];
}

function generateDefaultCBTExercises(pattern: string, difficulty: string): DailyActivity[] {
  return [
    {
      id: `cbt-${Date.now()}-1`,
      type: 'cbt_exercise',
      title: 'Thought Record Practice',
      description: 'Identify and challenge unhelpful thought patterns',
      estimatedDuration: 15,
      difficulty: difficulty as any,
      emotionalFocus: [pattern],
      instructions: [
        'Identify the triggering situation',
        'Notice automatic thoughts',
        'Examine evidence for and against the thought',
        'Develop a balanced perspective'
      ],
      adaptationNotes: 'Adjust complexity based on user progress',
      personalizedReason: `Targeting your ${pattern} patterns`
    }
  ];
}

function generateFallbackPlan(userId: number, planType: string): TherapeuticPlan {
  return {
    id: `fallback-${userId}-${Date.now()}`,
    userId,
    planType: planType as any,
    generatedAt: new Date(),
    validUntil: getValidUntilDate(planType),
    adaptationLevel: 0.5,
    therapeuticGoals: generateDefaultGoals({} as any),
    dailyActivities: generateDefaultActivities({} as any),
    weeklyMilestones: generateDefaultMilestones(),
    progressMetrics: [],
    adaptationTriggers: generateAdaptationTriggers(),
    confidenceScore: 0.6
  };
}

function generateDefaultAnalytics(userId: number): CarePlanAnalytics {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  return {
    userId,
    timeframe: { start: startDate, end: endDate },
    emotionalPatterns: {
      dominantMoods: [{ mood: 'neutral', frequency: 0.6, trend: 'stable' }],
      volatilityScore: 0.5,
      stabilityPeriods: [{ start: startDate, end: endDate, avgMood: 5.0 }],
      triggerEvents: []
    },
    engagementMetrics: {
      activitiesCompleted: 10,
      adherenceRate: 0.7,
      preferredActivityTypes: ['mindfulness'],
      dropOffPoints: [],
      peakEngagementTimes: ['afternoon']
    },
    therapeuticProgress: {
      goalCompletionRate: 0.5,
      skillsDeveloped: [],
      challengesOvercome: [],
      areasNeedingFocus: ['general_wellness'],
      resilienceScore: 6.0
    },
    adaptationHistory: {
      planChanges: 0,
      reasonsForChange: [],
      adaptationEffectiveness: 0.7,
      userSatisfaction: 7.0
    }
  };
}