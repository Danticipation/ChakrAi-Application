import OpenAI from 'openai';
import type { 
  TherapeuticAgent, 
  AgentSession, 
  AgentHandoff, 
  AgentInsight,
  InsertAgentSession,
  InsertAgentHandoff,
  InsertAgentInsight,
  InsertAgentMetric
} from '../shared/agentSchema.js';

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

// Default Therapeutic Agents Configuration
export const defaultAgents: Omit<TherapeuticAgent, 'id' | 'createdAt'>[] = [
  {
    name: 'Mindset Coach',
    type: 'cbt',
    description: 'Cognitive wellness coach focused on identifying and reframing thought patterns',
    systemPrompt: `You are a mindset coaching AI assistant focused on cognitive wellness techniques. Your expertise is in:

1. IDENTIFYING COGNITIVE DISTORTIONS:
- All-or-nothing thinking
- Mental filtering
- Discounting the positive
- Jumping to conclusions
- Magnification/minimization
- Emotional reasoning
- Should statements
- Labeling
- Personalization

2. THOUGHT RESTRUCTURING:
- Help users examine evidence for/against thoughts
- Guide development of balanced, realistic alternatives
- Teach thought-challenging techniques
- Provide CBT worksheets and exercises

3. BEHAVIORAL INTERVENTIONS:
- Activity scheduling
- Behavioral experiments
- Exposure therapy planning
- Problem-solving techniques

Always maintain a gentle, collaborative approach. Ask permission before deep dives into sensitive topics. Focus on empowerment and skill-building. Remember you are providing wellness coaching, not therapy.`,
    specializations: ['cognitive_distortions', 'thought_restructuring', 'behavioral_activation', 'exposure_therapy'],
    isActive: true,
  },
  {
    name: 'Mindfulness Guide',
    type: 'mindfulness',
    description: 'Meditation and mindfulness specialist for stress reduction and present-moment awareness',
    systemPrompt: `You are a mindfulness wellness guide AI assistant. Your expertise includes:

1. MEDITATION GUIDANCE:
- Breathing techniques (4-7-8, box breathing, natural breath awareness)
- Body scan meditations
- Loving-kindness meditation
- Walking meditation
- Mindful movement

2. MINDFULNESS PRACTICES:
- Present-moment awareness exercises
- Mindful eating, walking, listening
- STOP technique (Stop, Take a breath, Observe, Proceed)
- 5-4-3-2-1 grounding technique

3. STRESS REDUCTION:
- Progressive muscle relaxation
- Mindfulness-based stress reduction (MBSR) techniques
- Emotional regulation through mindfulness
- Sleep meditation and relaxation

4. SESSION LOGGING:
- Track meditation duration and frequency
- Note stress levels before/after sessions
- Monitor progress in mindfulness skills
- Identify optimal practice times

Speak in a calm, centered tone. Offer gentle guidance without judgment. Always check in on the user's comfort level during exercises. Remember you are providing wellness coaching, not therapy.`,
    specializations: ['meditation', 'stress_reduction', 'breath_work', 'body_awareness', 'emotional_regulation'],
    isActive: true,
  },
  {
    name: 'Self-Compassion Coach',
    type: 'self_compassion',
    description: 'Specialist in developing self-kindness and reframing negative self-talk',
    systemPrompt: `You are a self-compassion wellness coaching AI assistant based on Kristin Neff's research. Your focus areas:

1. SELF-KINDNESS:
- Identifying harsh self-criticism
- Developing kind, supportive inner voice
- Self-soothing techniques
- Treating oneself as a good friend would

2. COMMON HUMANITY:
- Recognizing that struggle is universal
- Connecting personal difficulties to shared human experience
- Reducing isolation and shame
- Finding connection in vulnerability

3. MINDFUL AWARENESS:
- Observing difficult emotions without over-identification
- Neither suppressing nor exaggerating feelings
- Present-moment awareness of suffering
- Balanced perspective on difficulties

4. REFRAMING TECHNIQUES:
- Transform self-critical thoughts into self-compassionate responses
- Practice self-compassion breaks
- Develop personal self-compassion phrases
- Write self-compassionate letters

Use a warm, nurturing tone. Model self-compassion in your responses. Help users recognize their inner critic and develop a kinder internal dialogue. Remember you are providing wellness coaching, not therapy.`,
    specializations: ['self_criticism_reframing', 'emotional_self_care', 'shame_resilience', 'inner_voice_work'],
    isActive: true,
  },
  {
    name: 'Calm & Focus Guide',
    type: 'anxiety',
    description: 'Wellness coach specializing in stress management and calming techniques',
    systemPrompt: `You are a stress and anxiety wellness coaching AI assistant. Your expertise covers:

1. ANXIETY UNDERSTANDING:
- Identify anxiety triggers and patterns
- Explain fight/flight/freeze responses
- Distinguish between different anxiety disorders
- Psychoeducation about anxiety physiology

2. COPING STRATEGIES:
- Grounding techniques (5-4-3-2-1, cold water, progressive relaxation)
- Breathing exercises for panic attacks
- Cognitive strategies for worry spirals
- Distraction and self-soothing techniques

3. EXPOSURE THERAPY:
- Gradual exposure planning
- Hierarchy development
- In-vivo and imaginal exposure
- Safety behavior identification and reduction

4. PANIC MANAGEMENT:
- Panic attack response protocols
- Creating safety plans
- Managing anticipatory anxiety
- Building confidence in coping abilities

Maintain a calm, reassuring presence. Validate feelings while building confidence in coping skills. Always prioritize safety and recommend professional help for severe symptoms. Remember you are providing wellness coaching, not therapy.`,
    specializations: ['panic_attacks', 'social_anxiety', 'generalized_anxiety', 'phobias', 'exposure_therapy'],
    isActive: true,
  }
];

export class TherapeuticAgentSystem {
  private agents: Map<string, TherapeuticAgent> = new Map();
  private activeSessions: Map<number, AgentSession> = new Map();

  constructor() {
    // Initialize with default agents
    defaultAgents.forEach((agent, index) => {
      this.agents.set(agent.type, { ...agent, id: index + 1, createdAt: new Date() });
    });
  }

  // Analyze user message to determine if agent handoff is needed
  async analyzeForHandoff(userId: number, message: string, conversationHistory: any[]): Promise<{
    shouldHandoff: boolean;
    recommendedAgent?: string;
    confidence: number;
    reason?: string;
    handoffMessage?: string;
  }> {
    try {
      const analysisPrompt = `Analyze this user message and conversation context to determine if specialized therapeutic agent support would be beneficial.

User Message: "${message}"

Recent Context: ${JSON.stringify(conversationHistory.slice(-3))}

Available Specialized Agents:
1. CBT Coach - Cognitive distortions, negative thought patterns, catastrophizing
2. Mindfulness Guide - Stress, anxiety, need for grounding, meditation requests
3. Self-Compassion Coach - Self-criticism, shame, harsh inner dialogue
4. Anxiety Specialist - Panic, worry spirals, phobias, exposure needs

Respond with JSON only:
{
  "shouldHandoff": boolean,
  "recommendedAgent": "cbt|mindfulness|self_compassion|anxiety" or null,
  "confidence": 0.0-1.0,
  "reason": "brief explanation",
  "handoffMessage": "user-friendly transition message" or null
}

Look for clear indicators like:
- Cognitive distortions → CBT Coach
- Stress/anxiety/need to calm down → Mindfulness Guide  
- Self-criticism/shame → Self-Compassion Coach
- Panic/intense anxiety → Anxiety Specialist

Only recommend handoff if there's clear benefit (confidence > 0.7).`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: analysisPrompt }],
        max_tokens: 300,
        temperature: 0.3,
      });

      const rawContent = response.choices[0]?.message?.content || '{}';
      // Strip markdown code blocks if present
      const cleanContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(cleanContent);
      return {
        shouldHandoff: analysis.shouldHandoff || false,
        recommendedAgent: analysis.recommendedAgent,
        confidence: analysis.confidence || 0,
        reason: analysis.reason,
        handoffMessage: analysis.handoffMessage,
      };
    } catch (error) {
      console.error('Agent handoff analysis error:', error);
      return { shouldHandoff: false, confidence: 0 };
    }
  }

  // Create handoff offer message
  createHandoffOffer(agentType: string, reason: string): string {
    const agent = this.agents.get(agentType);
    if (!agent) return '';

    const offers = {
      cbt: `I notice you might be dealing with some challenging thought patterns. Would you like to explore this with our **CBT Coach**? They specialize in helping identify and work through cognitive distortions and negative thinking cycles.`,
      mindfulness: `It sounds like you could benefit from some grounding and stress relief techniques. Would you like to work with our **Mindfulness Guide**? They can walk you through breathing exercises and meditation practices.`,
      self_compassion: `I hear some self-critical thoughts in what you're sharing. Our **Self-Compassion Coach** specializes in helping transform harsh inner dialogue into supportive self-talk. Would you like to connect with them?`,
      anxiety: `It seems like anxiety might be playing a big role here. Our **Anxiety Specialist** has specific techniques for managing worry, panic, and anxious thoughts. Would you like their support?`
    };

    return offers[agentType as keyof typeof offers] || `Would you like to work with our ${agent.name}? They specialize in ${agent.description.toLowerCase()}.`;
  }

  // Start agent session
  async startAgentSession(userId: number, agentType: string, objective: string): Promise<AgentSession> {
    const agent = this.agents.get(agentType);
    if (!agent) throw new Error(`Agent type ${agentType} not found`);

    const session: AgentSession = {
      id: Date.now(), // In real implementation, this would be generated by database
      userId,
      agentId: agent.id,
      sessionType: agentType,
      objective,
      status: 'active',
      conversationHistory: [],
      insights: {},
      recommendations: {},
      transferReason: null,
      completionNotes: null,
      createdAt: new Date(),
      completedAt: null,
    };

    this.activeSessions.set(userId, session);
    return session;
  }

  // Generate agent response
  async generateAgentResponse(userId: number, message: string): Promise<{
    response: string;
    insights?: AgentInsight[];
    shouldTransferBack?: boolean;
    transferReason?: string;
  }> {
    const session = this.activeSessions.get(userId);
    if (!session) throw new Error('No active agent session');

    const agent = this.agents.get(session.sessionType);
    if (!agent) throw new Error('Agent not found');

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: agent.systemPrompt },
          { role: 'system', content: `Session Objective: ${session.objective}` },
          ...(session.conversationHistory as any[] || []),
          { role: 'user', content: message }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const agentResponse = response.choices[0]?.message?.content || '';
      
      // Update session history
      const updatedHistory = [
        ...(session.conversationHistory as any[] || []),
        { role: 'user', content: message },
        { role: 'assistant', content: agentResponse }
      ];
      
      session.conversationHistory = updatedHistory;

      // Generate insights if applicable
      const insights = await this.generateInsights(userId, session.sessionType, message, agentResponse);

      // Check if session objective is complete or should transfer back
      const shouldComplete = await this.checkSessionCompletion(session, message, agentResponse);

      return {
        response: agentResponse,
        insights,
        shouldTransferBack: shouldComplete.shouldTransfer,
        transferReason: shouldComplete.reason || '',
      };
    } catch (error) {
      console.error('Agent response generation error:', error);
      throw error;
    }
  }

  // Generate insights from agent interaction
  private async generateInsights(userId: number, agentType: string, userMessage: string, agentResponse: string): Promise<AgentInsight[]> {
    try {
      const insightPrompt = `Based on this therapeutic interaction, identify key insights:

Agent Type: ${agentType}
User Message: "${userMessage}"
Agent Response: "${agentResponse}"

Generate up to 3 specific, actionable insights. Respond with JSON array:
[
  {
    "insightType": "cognitive_distortion|mindfulness_progress|self_compassion_breakthrough|anxiety_trigger|coping_strategy",
    "insight": "specific insight about user's pattern or progress",
    "confidence": 1-10,
    "actionable": true/false,
    "followUpRequired": true/false
  }
]

Focus on meaningful therapeutic insights, not generic observations.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: insightPrompt }],
        max_tokens: 400,
        temperature: 0.3,
      });

      const insights = JSON.parse(response.choices[0]?.message?.content || '[]');
      return insights.map((insight: any) => ({
        id: Date.now() + Math.random(),
        userId,
        agentType,
        sessionId: null,
        insightType: insight.insightType,
        insight: insight.insight,
        confidence: insight.confidence,
        actionable: insight.actionable,
        followUpRequired: insight.followUpRequired,
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error('Insight generation error:', error);
      return [];
    }
  }

  // Check if session should be completed or transferred back
  private async checkSessionCompletion(session: AgentSession, userMessage: string, agentResponse: string): Promise<{
    shouldTransfer: boolean;
    reason?: string;
  }> {
    try {
      const completionPrompt = `Analyze if this therapeutic agent session should be completed or transferred back to the main bot:

Session Objective: ${session.objective}
Recent Exchange:
User: "${userMessage}"
Agent: "${agentResponse}"

Conversation Length: ${(session.conversationHistory as any[])?.length || 0} exchanges

Respond with JSON:
{
  "shouldTransfer": boolean,
  "reason": "objective_completed|user_needs_different_support|session_too_long|natural_ending"
}

Transfer back if:
- Session objective appears achieved
- User needs support outside agent's specialty
- Session has gone on for 15+ exchanges
- Natural conversation ending reached`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: completionPrompt }],
        max_tokens: 150,
        temperature: 0.3,
      });

      const rawContent = response.choices[0]?.message?.content || '{}';
      // Strip markdown code blocks if present
      const cleanContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(cleanContent);
      return {
        shouldTransfer: analysis.shouldTransfer || false,
        reason: analysis.reason,
      };
    } catch (error) {
      console.error('Session completion check error:', error);
      return { shouldTransfer: false };
    }
  }

  // Complete agent session
  completeSession(userId: number, completionNotes?: string): void {
    const session = this.activeSessions.get(userId);
    if (session) {
      session.status = 'completed';
      session.completedAt = new Date();
      session.completionNotes = completionNotes || null;
      this.activeSessions.delete(userId);
    }
  }

  // Get active session
  getActiveSession(userId: number): AgentSession | null {
    return this.activeSessions.get(userId) || null;
  }

  // Get available agents
  getAvailableAgents(): TherapeuticAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.isActive);
  }
}

export const agentSystem = new TherapeuticAgentSystem();
