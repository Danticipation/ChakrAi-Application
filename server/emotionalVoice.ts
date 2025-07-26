import { ElevenLabs } from 'elevenlabs';

// Advanced emotional voice system for contextual voice modulation
export interface EmotionalVoiceProfile {
  baseVoiceId: string;
  emotionalSettings: {
    stability: number;    // 0.0-1.0 (lower = more emotional variation)
    similarityBoost: number; // 0.0-1.0 (higher = more consistent)
    style: number;       // 0.0-1.0 (higher = more expressive)
    useSpeakerBoost: boolean;
  };
  contextualAdjustments: {
    comforting: { stability: number; style: number; };
    energizing: { stability: number; style: number; };
    calming: { stability: number; style: number; };
    supportive: { stability: number; style: number; };
    crisis: { stability: number; style: number; };
  };
}

// Voice profiles with emotional responsiveness
export const emotionalVoiceProfiles: Record<string, EmotionalVoiceProfile> = {
  james: {
    baseVoiceId: 'TxGEqnHWrfWFTfGW9XjX', // Josh voice ID from ElevenLabs
    emotionalSettings: {
      stability: 0.5,
      similarityBoost: 0.8,
      style: 0.6,
      useSpeakerBoost: true
    },
    contextualAdjustments: {
      comforting: { stability: 0.8, style: 0.4 },
      energizing: { stability: 0.3, style: 0.9 },
      calming: { stability: 0.9, style: 0.2 },
      supportive: { stability: 0.6, style: 0.5 },
      crisis: { stability: 0.9, style: 0.3 }
    }
  },
  brian: {
    baseVoiceId: 'ErXwobaYiN019PkySvjV', // Antoni voice ID
    emotionalSettings: {
      stability: 0.6,
      similarityBoost: 0.7,
      style: 0.5,
      useSpeakerBoost: true
    },
    contextualAdjustments: {
      comforting: { stability: 0.7, style: 0.3 },
      energizing: { stability: 0.4, style: 0.8 },
      calming: { stability: 0.8, style: 0.2 },
      supportive: { stability: 0.5, style: 0.6 },
      crisis: { stability: 0.8, style: 0.2 }
    }
  },
  alexandra: {
    baseVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella voice ID
    emotionalSettings: {
      stability: 0.7,
      similarityBoost: 0.8,
      style: 0.4,
      useSpeakerBoost: true
    },
    contextualAdjustments: {
      comforting: { stability: 0.9, style: 0.3 },
      energizing: { stability: 0.4, style: 0.7 },
      calming: { stability: 0.9, style: 0.1 },
      supportive: { stability: 0.7, style: 0.4 },
      crisis: { stability: 0.9, style: 0.2 }
    }
  },
  carla: {
    baseVoiceId: 'XrExE9yKIg1WjnnlVkGX', // Freya voice ID
    emotionalSettings: {
      stability: 0.5,
      similarityBoost: 0.9,
      style: 0.7,
      useSpeakerBoost: true
    },
    contextualAdjustments: {
      comforting: { stability: 0.8, style: 0.5 },
      energizing: { stability: 0.2, style: 0.9 },
      calming: { stability: 0.9, style: 0.3 },
      supportive: { stability: 0.6, style: 0.6 },
      crisis: { stability: 0.8, style: 0.4 }
    }
  }
};

export type EmotionalContext = 'comforting' | 'energizing' | 'calming' | 'supportive' | 'crisis' | 'neutral';

export interface VoiceGenerationOptions {
  text: string;
  voiceProfile: string;
  emotionalContext: EmotionalContext;
  intensity?: number; // 0.0-1.0 multiplier for emotional adjustment
}

// Analyze message content to determine emotional context
export function detectEmotionalContext(message: string, userEmotion?: string): EmotionalContext {
  const lowerMessage = message.toLowerCase();
  
  // Crisis indicators
  const crisisKeywords = ['crisis', 'emergency', 'help', 'suicide', 'harm', 'danger', 'panic', 'overwhelmed'];
  if (crisisKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'crisis';
  }
  
  // Calming indicators
  const calmingKeywords = ['anxious', 'stressed', 'worried', 'nervous', 'upset', 'angry', 'frustrated'];
  if (calmingKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'calming';
  }
  
  // Comforting indicators
  const comfortingKeywords = ['sad', 'lonely', 'hurt', 'pain', 'loss', 'grief', 'cry', 'depressed'];
  if (comfortingKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'comforting';
  }
  
  // Energizing indicators
  const energizingKeywords = ['goal', 'motivation', 'achieve', 'success', 'progress', 'excited', 'happy'];
  if (energizingKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'energizing';
  }
  
  // Use user emotion if available
  if (userEmotion) {
    const emotion = userEmotion.toLowerCase();
    if (['sad', 'grief', 'lonely'].includes(emotion)) return 'comforting';
    if (['anxious', 'stressed', 'angry'].includes(emotion)) return 'calming';
    if (['happy', 'excited', 'motivated'].includes(emotion)) return 'energizing';
    if (['crisis', 'panic'].includes(emotion)) return 'crisis';
  }
  
  return 'supportive'; // Default supportive context
}

// Generate emotionally responsive voice
export async function generateEmotionalVoice(options: VoiceGenerationOptions): Promise<Buffer> {
  const { text, voiceProfile, emotionalContext, intensity = 1.0 } = options;
  
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }
  
  const profile = emotionalVoiceProfiles[voiceProfile];
  if (!profile) {
    throw new Error(`Voice profile ${voiceProfile} not found`);
  }
  
  // Calculate emotional adjustments
  const baseSettings = profile.emotionalSettings;
  const contextAdjustments = emotionalContext !== 'neutral' 
    ? profile.contextualAdjustments[emotionalContext]
    : { stability: baseSettings.stability, style: baseSettings.style };
  
  // Apply intensity multiplier to emotional adjustments
  const adjustedStability = baseSettings.stability + 
    (contextAdjustments.stability - baseSettings.stability) * intensity;
  const adjustedStyle = baseSettings.style + 
    (contextAdjustments.style - baseSettings.style) * intensity;
  
  // Ensure values stay within valid range
  const finalStability = Math.max(0, Math.min(1, adjustedStability));
  const finalStyle = Math.max(0, Math.min(1, adjustedStyle));
  
  try {
    const client = new ElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY!
    });
    
    const audioStream = await client.textToSpeech.convert({
      voice_id: profile.baseVoiceId,
      text: text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: finalStability,
        similarity_boost: baseSettings.similarityBoost,
        style: finalStyle,
        use_speaker_boost: baseSettings.useSpeakerBoost
      }
    });
    
    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream) {
      chunks.push(new Uint8Array(chunk));
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('ElevenLabs API error:', error);
    throw new Error('Failed to generate emotional voice');
  }
}

// Generate contextual response with appropriate emotional tone
export function generateEmotionalResponse(
  originalResponse: string, 
  emotionalContext: EmotionalContext,
  intensity: number = 1.0
): string {
  const contextualPrefixes = {
    comforting: [
      "I understand how difficult this must be for you. ",
      "I can hear the pain in your words. ",
      "It's completely natural to feel this way. ",
      "You're being so brave by sharing this. "
    ],
    calming: [
      "Let's take this one step at a time. ",
      "I want you to know you're safe here. ",
      "Take a deep breath with me. ",
      "It's okay to feel overwhelmed. "
    ],
    energizing: [
      "I can sense your determination! ",
      "That's such a positive step forward! ",
      "Your enthusiasm is wonderful to hear. ",
      "You're making incredible progress! "
    ],
    supportive: [
      "I'm here with you through this. ",
      "You don't have to face this alone. ",
      "I believe in your strength. ",
      "Thank you for trusting me with this. "
    ],
    crisis: [
      "I want you to know that I'm here for you right now. ",
      "Your safety is the most important thing. ",
      "You've taken a brave step by reaching out. ",
      "Let's focus on getting you the support you need. "
    ],
    neutral: [""]
  };
  
  if (emotionalContext === 'neutral' || intensity < 0.3) {
    return originalResponse;
  }
  
  const prefixes = contextualPrefixes[emotionalContext];
  const selectedPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  return selectedPrefix + originalResponse;
}