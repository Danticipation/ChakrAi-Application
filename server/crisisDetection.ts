import OpenAI from "openai";
import { retryOpenAIRequest } from "./openaiRetry.js";

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

export interface CrisisAnalysis {
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  immediateActions: string[];
  emergencyContacts: string[];
  supportMessage: string;
  requiresCheckIn: boolean;
  confidenceScore: number; // 0.0 to 1.0
  analysisReason: string;
}

export interface SafetyCheckIn {
  userId: number;
  triggerMessage: string;
  riskLevel: string;
  timestamp: Date;
  checkInRequired: boolean;
  responseReceived: boolean;
  followUpScheduled?: Date;
}

// Advanced crisis indicators for detection
const CRISIS_INDICATORS = {
  suicidal: [
    'want to die', 'kill myself', 'end it all', 'not worth living', 'better off dead',
    'suicide', 'suicidal', 'hanging myself', 'overdose', 'jump off', 'can\'t go on',
    'no point living', 'tired of being alive', 'wish I was dead', 'ending my life'
  ],
  selfHarm: [
    'cut myself', 'hurt myself', 'self harm', 'cutting', 'burning myself',
    'punish myself', 'deserve pain', 'blade', 'razor', 'self-injury'
  ],
  severeDepression: [
    'hopeless', 'worthless', 'nothing matters', 'can\'t handle', 'giving up',
    'no future', 'empty inside', 'numb', 'pointless', 'burden to everyone',
    'complete failure', 'lost everything', 'can\'t cope', 'falling apart'
  ],
  isolation: [
    'no one cares', 'all alone', 'nobody understands', 'isolated', 'abandoned',
    'no friends', 'no family', 'completely alone', 'no support', 'everyone left'
  ],
  substance: [
    'drinking to forget', 'drug to numb', 'alcohol problem', 'addiction',
    'overdosing', 'pills to escape', 'substance abuse', 'getting high to cope'
  ]
};

export async function analyzeCrisisRisk(
  message: string,
  conversationHistory: string[],
  userContext: any = {}
): Promise<CrisisAnalysis> {
  
  // Quick pattern matching for immediate high-risk indicators
  const immediateRisk = detectImmediateRisk(message);
  if (immediateRisk.riskLevel === 'critical') {
    return {
      riskLevel: immediateRisk.riskLevel,
      indicators: immediateRisk.indicators || [],
      immediateActions: getImmediateActions(immediateRisk.riskLevel),
      emergencyContacts: getEmergencyContacts(immediateRisk.riskLevel),
      supportMessage: generateSupportMessage(immediateRisk),
      requiresCheckIn: true,
      confidenceScore: immediateRisk.confidenceScore || 0.9,
      analysisReason: immediateRisk.analysisReason || 'Critical risk detected'
    };
  }

  try {
    // Advanced NLP analysis using OpenAI
    const analysis = await retryOpenAIRequest(async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a crisis detection expert specializing in mental health risk assessment. Analyze the message and conversation context for:

1. Suicidal ideation (direct or indirect)
2. Self-harm intentions
3. Severe depression indicators
4. Substance abuse as coping mechanism
5. Complete social isolation
6. Immediate danger to self or others

Provide analysis in JSON format:
{
  "riskLevel": "none|low|medium|high|critical",
  "indicators": ["specific indicators found"],
  "confidenceScore": 0.0-1.0,
  "analysisReason": "explanation of assessment",
  "requiresCheckIn": boolean,
  "immediateIntervention": boolean
}

Risk Levels:
- none: No concerning indicators
- low: Mild stress/sadness, normal coping
- medium: Moderate distress, some concerning language
- high: Clear distress signals, potential self-harm risk
- critical: Immediate suicide risk, self-harm statements, crisis language`
          },
          {
            role: "user",
            content: `Current message: "${message}"

Recent conversation context:
${conversationHistory.slice(-3).join('\n')}

User context: ${JSON.stringify(userContext)}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1 // Low temperature for consistent crisis detection
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    });

    // Combine AI analysis with pattern matching
    const combinedAnalysis = combineAnalyses(immediateRisk, analysis);
    
    return {
      riskLevel: combinedAnalysis.riskLevel,
      indicators: combinedAnalysis.indicators,
      immediateActions: getImmediateActions(combinedAnalysis.riskLevel),
      emergencyContacts: getEmergencyContacts(combinedAnalysis.riskLevel),
      supportMessage: generateSupportMessage(combinedAnalysis),
      requiresCheckIn: combinedAnalysis.requiresCheckIn || combinedAnalysis.riskLevel === 'high' || combinedAnalysis.riskLevel === 'critical',
      confidenceScore: combinedAnalysis.confidenceScore,
      analysisReason: combinedAnalysis.analysisReason
    };

  } catch (error) {
    console.error('Crisis analysis error:', error);
    
    // Fallback to pattern matching if AI analysis fails
    return {
      ...immediateRisk,
      immediateActions: getImmediateActions(immediateRisk.riskLevel),
      emergencyContacts: getEmergencyContacts(immediateRisk.riskLevel),
      supportMessage: generateSupportMessage(immediateRisk),
      requiresCheckIn: immediateRisk.riskLevel !== 'none' && immediateRisk.riskLevel !== 'low'
    };
  }
}

function detectImmediateRisk(message: string): CrisisAnalysis {
  const lowerMessage = message.toLowerCase();
  const indicators: string[] = [];
  let riskLevel: CrisisAnalysis['riskLevel'] = 'none';
  let confidenceScore = 0;

  // Check for suicidal ideation (highest priority)
  for (const indicator of CRISIS_INDICATORS.suicidal) {
    if (lowerMessage.includes(indicator)) {
      indicators.push(`Suicidal language: "${indicator}"`);
      riskLevel = 'critical';
      confidenceScore = Math.max(confidenceScore, 0.9);
    }
  }

  // Check for self-harm
  for (const indicator of CRISIS_INDICATORS.selfHarm) {
    if (lowerMessage.includes(indicator)) {
      indicators.push(`Self-harm indication: "${indicator}"`);
      riskLevel = riskLevel === 'critical' ? 'critical' : 'high';
      confidenceScore = Math.max(confidenceScore, 0.8);
    }
  }

  // Check for severe depression
  let depressionCount = 0;
  for (const indicator of CRISIS_INDICATORS.severeDepression) {
    if (lowerMessage.includes(indicator)) {
      indicators.push(`Depression indicator: "${indicator}"`);
      depressionCount++;
    }
  }

  if (depressionCount >= 3) {
    riskLevel = riskLevel === 'none' ? 'high' : riskLevel;
    confidenceScore = Math.max(confidenceScore, 0.7);
  } else if (depressionCount >= 1) {
    riskLevel = riskLevel === 'none' ? 'medium' : riskLevel;
    confidenceScore = Math.max(confidenceScore, 0.5);
  }

  // Check for isolation and substance abuse
  for (const indicator of CRISIS_INDICATORS.isolation) {
    if (lowerMessage.includes(indicator)) {
      indicators.push(`Isolation indicator: "${indicator}"`);
      riskLevel = riskLevel === 'none' ? 'medium' : riskLevel;
      confidenceScore = Math.max(confidenceScore, 0.4);
    }
  }

  for (const indicator of CRISIS_INDICATORS.substance) {
    if (lowerMessage.includes(indicator)) {
      indicators.push(`Substance abuse: "${indicator}"`);
      riskLevel = riskLevel === 'none' ? 'medium' : riskLevel;
      confidenceScore = Math.max(confidenceScore, 0.6);
    }
  }

  return {
    riskLevel,
    indicators,
    immediateActions: getImmediateActions(riskLevel),
    emergencyContacts: getEmergencyContacts(riskLevel),
    supportMessage: generateSupportMessage({ riskLevel, indicators }),
    requiresCheckIn: riskLevel === 'high' || riskLevel === 'critical',
    confidenceScore,
    analysisReason: indicators.length > 0 ? 
      `Pattern matching detected ${indicators.length} crisis indicators` : 
      'No immediate crisis indicators detected'
  };
}

function combineAnalyses(patternAnalysis: Partial<CrisisAnalysis>, aiAnalysis: any): any {
  // Take the higher risk level between pattern matching and AI analysis
  const riskLevels = ['none', 'low', 'medium', 'high', 'critical'];
  const patternRiskIndex = riskLevels.indexOf(patternAnalysis.riskLevel || 'none');
  const aiRiskIndex = riskLevels.indexOf(aiAnalysis.riskLevel || 'none');
  
  const finalRiskLevel = riskLevels[Math.max(patternRiskIndex, aiRiskIndex)];
  
  return {
    riskLevel: finalRiskLevel,
    indicators: [...(patternAnalysis.indicators || []), ...(aiAnalysis.indicators || [])],
    confidenceScore: Math.max(patternAnalysis.confidenceScore || 0, aiAnalysis.confidenceScore || 0),
    analysisReason: `Combined analysis: ${patternAnalysis.analysisReason} | AI: ${aiAnalysis.analysisReason}`,
    requiresCheckIn: aiAnalysis.requiresCheckIn || finalRiskLevel === 'high' || finalRiskLevel === 'critical'
  };
}

function getImmediateActions(riskLevel: CrisisAnalysis['riskLevel']): string[] {
  switch (riskLevel) {
    case 'critical':
      return [
        "Contact emergency services immediately (911)",
        "Go to the nearest emergency room",
        "Call National Suicide Prevention Lifeline: 988",
        "Reach out to a trusted friend or family member immediately",
        "Remove any means of self-harm from your environment"
      ];
    case 'high':
      return [
        "Contact a mental health professional today",
        "Call National Suicide Prevention Lifeline: 988",
        "Reach out to someone you trust",
        "Consider going to an emergency room if feelings worsen",
        "Create a safety plan with specific coping strategies"
      ];
    case 'medium':
      return [
        "Schedule an appointment with a mental health professional",
        "Talk to someone you trust about how you're feeling",
        "Practice grounding techniques and self-care",
        "Consider calling a mental health helpline",
        "Avoid isolation - stay connected with supportive people"
      ];
    case 'low':
      return [
        "Practice self-care and stress management techniques",
        "Maintain regular sleep and exercise routines",
        "Stay connected with supportive friends and family",
        "Consider journaling or mindfulness practices"
      ];
    default:
      return [];
  }
}

function getEmergencyContacts(riskLevel: CrisisAnalysis['riskLevel']): string[] {
  const contacts = [];
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
    contacts.push(
      "Emergency Services: 911",
      "National Suicide Prevention Lifeline: 988",
      "Crisis Text Line: Text HOME to 741741",
      "SAMHSA National Helpline: 1-800-662-4357"
    );
  }
  
  if (riskLevel === 'medium' || riskLevel === 'high' || riskLevel === 'critical') {
    contacts.push(
      "National Alliance on Mental Illness (NAMI): 1-800-950-NAMI (6264)",
      "Mental Health America Crisis Resources: mhanational.org/find-support-groups"
    );
  }
  
  return contacts;
}

function generateSupportMessage(analysis: any): string {
  switch (analysis.riskLevel) {
    case 'critical':
      return "I'm very concerned about your safety right now. Your life has value and there are people who want to help. Please reach out to emergency services or a crisis helpline immediately. You don't have to go through this alone.";
    
    case 'high':
      return "I can tell you're going through an incredibly difficult time. These feelings are overwhelming, but they can change with proper support. Please consider reaching out to a mental health professional or crisis helpline today.";
    
    case 'medium':
      return "It sounds like you're dealing with some challenging emotions. These feelings are valid, and seeking support can make a real difference. Consider talking to someone you trust or a mental health professional.";
    
    case 'low':
      return "I hear that you're going through a tough time. Remember that it's normal to have difficult periods, and taking care of your mental health is important.";
    
    default:
      return "Thank you for sharing your thoughts with me. I'm here to support you in your wellness journey.";
  }
}

export async function scheduleFollowUpCheckIn(
  userId: number,
  riskLevel: string,
  triggerMessage: string
): Promise<SafetyCheckIn> {
  
  const checkIn: SafetyCheckIn = {
    userId,
    triggerMessage: triggerMessage.substring(0, 500),
    riskLevel,
    timestamp: new Date(),
    checkInRequired: true,
    responseReceived: false
  };

  // Schedule follow-up based on risk level
  if (riskLevel === 'critical') {
    checkIn.followUpScheduled = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  } else if (riskLevel === 'high') {
    checkIn.followUpScheduled = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours
  } else if (riskLevel === 'medium') {
    checkIn.followUpScheduled = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }

  return checkIn;
}

export function generateCheckInMessage(riskLevel: string, timeElapsed: number): string {
  const hours = Math.floor(timeElapsed / (1000 * 60 * 60));
  
  if (riskLevel === 'critical') {
    return `Hi, I wanted to check in with you after our earlier conversation. It's been ${hours} hours, and I'm concerned about your wellbeing. How are you feeling right now? Are you in a safe place?`;
  } else if (riskLevel === 'high') {
    return `I wanted to follow up on our conversation from earlier today. You were going through a difficult time, and I want to make sure you're okay. How are you feeling now?`;
  } else {
    return `I hope you're doing better since we last talked. I wanted to check in and see how you're managing. Remember, it's okay to reach out for support when you need it.`;
  }
}
