// Centralized Voice Mapping - Single Source of Truth for TrAI Voice System
// This file ensures consistency across all voice-related components

export interface VoiceConfig {
  id: string;
  name: string;
  description: string;
  gender: 'Male' | 'Female';
  accent: string;
  characteristics: string[];
  default?: boolean;
}

// Complete 8-voice system with correct ElevenLabs IDs
export const VOICE_CONFIGS: VoiceConfig[] = [
  // Original voices (4)
  {
    id: 'EkK5I93UQWFDigLMpZcX',
    name: 'James',
    description: 'Professional and calming',
    gender: 'Male',
    accent: 'American',
    characteristics: ['professional', 'calming', 'therapeutic'],
    default: true
  },
  {
    id: 'nPczCjzI2devNBz1zQrb',
    name: 'Brian',
    description: 'Deep and resonant',
    gender: 'Male',
    accent: 'American',
    characteristics: ['deep', 'resonant', 'grounding']
  },
  {
    id: 'kdmDKE6EkgrWrrykO9Qt',
    name: 'Alexandra',
    description: 'Clear and articulate',
    gender: 'Female',
    accent: 'American',
    characteristics: ['clear', 'articulate', 'professional']
  },
  {
    id: 'l32B8XDoylOsZKiSdfhE',
    name: 'Carla',
    description: 'Warm and empathetic',
    gender: 'Female',
    accent: 'American',
    characteristics: ['warm', 'empathetic', 'caring']
  },
  // New voices added (4) - Updated with working ElevenLabs voice IDs
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Hope',
    description: 'Warm and encouraging',
    gender: 'Female',
    accent: 'American',
    characteristics: ['warm', 'encouraging', 'uplifting']
  },
  {
    id: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    description: 'Gentle and empathetic',
    gender: 'Female',
    accent: 'American',
    characteristics: ['gentle', 'empathetic', 'soothing']
  },
  {
    id: 'Yko7PKHZNXotIFUBG7I9',
    name: 'Bronson',
    description: 'Confident and reassuring',
    gender: 'Male',
    accent: 'American',
    characteristics: ['confident', 'reassuring', 'supportive']
  },
  {
    id: 'y3kKRaK2dnn3OgKDBckk',
    name: 'Marcus',
    description: 'Smooth and supportive',
    gender: 'Male',
    accent: 'American',
    characteristics: ['smooth', 'supportive', 'understanding']
  }
];

// Frontend-to-ElevenLabs ID mapping
export const VOICE_MAPPING: Record<string, string> = {
  james: 'EkK5I93UQWFDigLMpZcX',
  brian: 'nPczCjzI2devNBz1zQrb',
  alexandra: 'kdmDKE6EkgrWrrykO9Qt',
  carla: 'l32B8XDoylOsZKiSdfhE',
  hope: 'iCrDUkL56s3C8sCRl7wb',
  charlotte: 'XB0fDUnXU5powFXDhCwa',
  bronson: 'Yko7PKHZNXotIFUBG7I9',
  marcus: 'y3kKRaK2dnn3OgKDBckk'
};

// Helper functions
export function getVoiceId(voiceName: string): string {
  const normalizedName = voiceName.toLowerCase();
  return VOICE_MAPPING[normalizedName] || VOICE_MAPPING['james']!;
}

export function getVoiceConfig(voiceName: string): VoiceConfig | undefined {
  const normalizedName = voiceName.toLowerCase();
  return VOICE_CONFIGS.find(config => config.name.toLowerCase() === normalizedName);
}

export function getDefaultVoice(): VoiceConfig {
  return VOICE_CONFIGS.find(config => config.default) || VOICE_CONFIGS[0]!;
}

export function getAllVoiceNames(): string[] {
  return VOICE_CONFIGS.map(config => config.name);
}

export function getMaleVoices(): VoiceConfig[] {
  return VOICE_CONFIGS.filter(config => config.gender === 'Male');
}

export function getFemaleVoices(): VoiceConfig[] {
  return VOICE_CONFIGS.filter(config => config.gender === 'Female');
}

// Verify all voice IDs are present
export function validateVoiceSystem(): boolean {
  const expectedCount = 8;
  const actualCount = VOICE_CONFIGS.length;
  const hasDefault = VOICE_CONFIGS.some(config => config.default);
  
  console.log(`Voice system validation: ${actualCount}/${expectedCount} voices configured, default voice: ${hasDefault}`);
  
  return actualCount === expectedCount && hasDefault;
}