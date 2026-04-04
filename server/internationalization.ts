// Multi-language support and internationalization system
import OpenAI from 'openai';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  voiceSupport: boolean;
  completeness: number; // 0-100% translation completeness
}

export const supportedLanguages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', voiceSupport: true, completeness: 100 },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', voiceSupport: true, completeness: 95 },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', voiceSupport: true, completeness: 90 },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', voiceSupport: true, completeness: 85 },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', voiceSupport: true, completeness: 80 },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr', voiceSupport: true, completeness: 75 },
  { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', voiceSupport: true, completeness: 70 },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', voiceSupport: true, completeness: 65 },
  { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr', voiceSupport: true, completeness: 60 },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', voiceSupport: false, completeness: 55 },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', voiceSupport: false, completeness: 50 },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr', voiceSupport: false, completeness: 45 }
];

// Therapeutic translations for key mental health terms
export const therapeuticTranslations = {
  en: {
    // Core therapeutic terms
    'anxiety': 'anxiety',
    'depression': 'depression',
    'stress': 'stress',
    'mindfulness': 'mindfulness',
    'meditation': 'meditation',
    'breathing_exercise': 'breathing exercise',
    'mood_tracking': 'mood tracking',
    'journal_entry': 'journal entry',
    'wellness_goal': 'wellness goal',
    'therapeutic_session': 'therapeutic session',
    'crisis_support': 'crisis support',
    'emotional_regulation': 'emotional regulation',
    'coping_strategies': 'coping strategies',
    'self_care': 'self-care',
    'mental_health': 'mental health',
    
    // Interface elements
    'chat_with_ai': 'Chat with AI Companion',
    'daily_reflection': 'Daily Reflection',
    'mood_check_in': 'Mood Check-in',
    'progress_tracking': 'Progress Tracking',
    'voice_interaction': 'Voice Interaction',
    'emergency_resources': 'Emergency Resources',
    'settings': 'Settings',
    'accessibility': 'Accessibility',
    'language_selection': 'Language Selection',
    
    // Therapeutic prompts
    'how_are_you_feeling': 'How are you feeling today?',
    'describe_your_mood': 'Can you describe your current mood?',
    'what_brought_you_here': 'What brought you to TraI today?',
    'breathing_exercise_prompt': 'Let\'s try a breathing exercise together',
    'mindfulness_moment': 'Take a mindful moment with me',
    'journal_prompt': 'What would you like to reflect on today?',
    'crisis_check': 'I\'m here to support you. Are you in immediate crisis?',
    'progress_celebration': 'Let\'s celebrate your progress today',
    'goal_setting': 'What wellness goals would you like to work on?',
    'emotional_validation': 'Your feelings are valid and important'
  },
  es: {
    // Core therapeutic terms
    'anxiety': 'ansiedad',
    'depression': 'depresión',
    'stress': 'estrés',
    'mindfulness': 'atención plena',
    'meditation': 'meditación',
    'breathing_exercise': 'ejercicio de respiración',
    'mood_tracking': 'seguimiento del estado de ánimo',
    'journal_entry': 'entrada de diario',
    'wellness_goal': 'objetivo de bienestar',
    'therapeutic_session': 'sesión terapéutica',
    'crisis_support': 'apoyo en crisis',
    'emotional_regulation': 'regulación emocional',
    'coping_strategies': 'estrategias de afrontamiento',
    'self_care': 'autocuidado',
    'mental_health': 'salud mental',
    
    // Interface elements
    'chat_with_ai': 'Conversar con Compañero IA',
    'daily_reflection': 'Reflexión Diaria',
    'mood_check_in': 'Registro de Estado de Ánimo',
    'progress_tracking': 'Seguimiento de Progreso',
    'voice_interaction': 'Interacción por Voz',
    'emergency_resources': 'Recursos de Emergencia',
    'settings': 'Configuración',
    'accessibility': 'Accesibilidad',
    'language_selection': 'Selección de Idioma',
    
    // Therapeutic prompts
    'how_are_you_feeling': '¿Cómo te sientes hoy?',
    'describe_your_mood': '¿Puedes describir tu estado de ánimo actual?',
    'what_brought_you_here': '¿Qué te trajo a TraI hoy?',
    'breathing_exercise_prompt': 'Hagamos un ejercicio de respiración juntos',
    'mindfulness_moment': 'Tomémonos un momento consciente conmigo',
    'journal_prompt': '¿Sobre qué te gustaría reflexionar hoy?',
    'crisis_check': 'Estoy aquí para apoyarte. ¿Estás en crisis inmediata?',
    'progress_celebration': 'Celebremos tu progreso de hoy',
    'goal_setting': '¿En qué objetivos de bienestar te gustaría trabajar?',
    'emotional_validation': 'Tus sentimientos son válidos e importantes'
  },
  fr: {
    // Core therapeutic terms
    'anxiety': 'anxiété',
    'depression': 'dépression',
    'stress': 'stress',
    'mindfulness': 'pleine conscience',
    'meditation': 'méditation',
    'breathing_exercise': 'exercice de respiration',
    'mood_tracking': 'suivi de l\'humeur',
    'journal_entry': 'entrée de journal',
    'wellness_goal': 'objectif de bien-être',
    'therapeutic_session': 'séance thérapeutique',
    'crisis_support': 'soutien en crise',
    'emotional_regulation': 'régulation émotionnelle',
    'coping_strategies': 'stratégies d\'adaptation',
    'self_care': 'soin de soi',
    'mental_health': 'santé mentale',
    
    // Interface elements
    'chat_with_ai': 'Discuter avec l\'IA Compagnon',
    'daily_reflection': 'Réflexion Quotidienne',
    'mood_check_in': 'Vérification de l\'Humeur',
    'progress_tracking': 'Suivi des Progrès',
    'voice_interaction': 'Interaction Vocale',
    'emergency_resources': 'Ressources d\'Urgence',
    'settings': 'Paramètres',
    'accessibility': 'Accessibilité',
    'language_selection': 'Sélection de Langue',
    
    // Therapeutic prompts
    'how_are_you_feeling': 'Comment vous sentez-vous aujourd\'hui?',
    'describe_your_mood': 'Pouvez-vous décrire votre humeur actuelle?',
    'what_brought_you_here': 'Qu\'est-ce qui vous a amené à TraI aujourd\'hui?',
    'breathing_exercise_prompt': 'Faisons un exercice de respiration ensemble',
    'mindfulness_moment': 'Prenons un moment de pleine conscience avec moi',
    'journal_prompt': 'Sur quoi aimeriez-vous réfléchir aujourd\'hui?',
    'crisis_check': 'Je suis là pour vous soutenir. Êtes-vous en crise immédiate?',
    'progress_celebration': 'Célébrons vos progrès d\'aujourd\'hui',
    'goal_setting': 'Sur quels objectifs de bien-être aimeriez-vous travailler?',
    'emotional_validation': 'Vos sentiments sont valides et importants'
  }
};

// AI-powered translation for dynamic content
export async function translateTherapeuticMessage(
  message: string,
  targetLanguage: string,
  context: 'therapeutic' | 'casual' | 'crisis' | 'supportive' = 'therapeutic'
): Promise<string> {
  if (targetLanguage === 'en') {
    return message;
  }

  try {
    const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY']! });

    const contextInstructions = {
      therapeutic: 'This is therapeutic mental health content. Maintain professional, supportive, and culturally sensitive tone.',
      casual: 'This is casual conversation in a mental health app. Keep it warm and friendly.',
      crisis: 'This is crisis intervention content. Prioritize clarity, safety, and immediate support.',
      supportive: 'This is supportive encouragement. Focus on hope, validation, and positive reinforcement.'
    };

    const culturalNotes: Record<string, string> = {
      es: 'Consider Latin American and Spanish cultural approaches to mental health. Use formal "usted" for therapeutic contexts.',
      fr: 'Consider French cultural attitudes toward mental health and well-being. Maintain appropriate formality.',
      de: 'Consider German cultural directness while maintaining therapeutic sensitivity.',
      pt: 'Consider Brazilian and Portuguese cultural warmth in therapeutic communication.',
      it: 'Consider Italian cultural expressiveness while maintaining professional therapeutic tone.',
      zh: 'Consider Chinese cultural concepts of mental harmony and face-saving in therapeutic contexts.',
      ja: 'Consider Japanese cultural concepts of emotional restraint and harmony in therapeutic settings.',
      ko: 'Consider Korean cultural respect levels and mental health stigma sensitivity.',
      ar: 'Consider Arabic cultural and religious sensitivity around mental health topics.',
      hi: 'Consider Indian cultural and spiritual approaches to mental wellness.',
      ru: 'Consider Russian cultural stoicism while maintaining therapeutic warmth.'
    };

    const prompt = `Translate the following therapeutic message to ${targetLanguage}.

Context: ${contextInstructions[context]}
Cultural Notes: ${culturalNotes[targetLanguage] || 'Maintain therapeutic sensitivity and cultural awareness.'}

Original message: "${message}"

Requirements:
1. Maintain therapeutic accuracy and tone
2. Use culturally appropriate mental health terminology
3. Preserve emotional nuance and supportive intent
4. Use proper formal/informal register for therapeutic context
5. Ensure clinical concepts are accurately translated

Translation:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert medical and therapeutic translator specializing in mental health content. Provide accurate, culturally sensitive translations that maintain therapeutic value."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    return response.choices[0]?.message?.content?.trim() || message;
  } catch (error) {
    console.error('Translation error:', error);
    return message; // Fallback to original message
  }
}

// Get therapeutic term translation
export function getTherapeuticTerm(key: string, language: string): string {
  const translations = therapeuticTranslations[language as keyof typeof therapeuticTranslations];
  if (!translations) {
    return therapeuticTranslations.en[key as keyof typeof therapeuticTranslations.en] || key;
  }
  return translations[key as keyof typeof translations] || key;
}

// Voice synthesis language mapping for ElevenLabs
export const voiceLanguageMapping = {
  en: { voiceId: 'james', language: 'en' },
  es: { voiceId: 'spanish-voice', language: 'es' },
  fr: { voiceId: 'french-voice', language: 'fr' },
  de: { voiceId: 'german-voice', language: 'de' },
  pt: { voiceId: 'portuguese-voice', language: 'pt' },
  it: { voiceId: 'italian-voice', language: 'it' },
  zh: { voiceId: 'chinese-voice', language: 'zh' },
  ja: { voiceId: 'japanese-voice', language: 'ja' },
  ko: { voiceId: 'korean-voice', language: 'ko' }
};

// Generate multilingual voice response
export async function generateMultilingualVoice(
  text: string,
  language: string,
  emotionalContext: string = 'supportive'
): Promise<Buffer | null> {
  const languageConfig = voiceLanguageMapping[language as keyof typeof voiceLanguageMapping];
  
  if (!languageConfig) {
    console.log(`Voice synthesis not supported for language: ${language}`);
    return null;
  }

  try {
    // First translate if needed
    const translatedText = await translateTherapeuticMessage(text, language, 'therapeutic');
    
    // Generate voice using ElevenLabs with language-specific voice
    const { generateEmotionalVoice } = await import('./emotionalVoice.js');
    
    const voiceBuffer = await generateEmotionalVoice({
      text: translatedText,
      voiceProfile: languageConfig.voiceId,
      emotionalContext: emotionalContext as any
    });

    return voiceBuffer;
  } catch (error) {
    console.error(`Error generating multilingual voice for ${language}:`, error);
    return null;
  }
}

// Language detection for user input
export async function detectLanguage(text: string): Promise<string> {
  if (!text || text.trim().length < 10) {
    return 'en'; // Default to English for short texts
  }

  try {
    const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY']! });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Detect the language of the given text. Respond with only the ISO 639-1 language code (e.g., 'en', 'es', 'fr'). If uncertain, respond with 'en'."
        },
        {
          role: "user",
          content: `Detect language: "${text}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 10
    });

    const detectedLanguage = response.choices[0]?.message?.content?.trim().toLowerCase() || 'en';
    
    // Validate against supported languages
    const supportedCodes = supportedLanguages.map(lang => lang.code);
    return supportedCodes.includes(detectedLanguage) ? detectedLanguage : 'en';
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en';
  }
}

// Get user's preferred language from profile or detect from recent messages
export async function getUserLanguagePreference(userId: number): Promise<string> {
  try {
    // This would integrate with user storage to get saved language preference
    // For now, return default
    return 'en';
  } catch (error) {
    console.error('Error getting user language preference:', error);
    return 'en';
  }
}

// Cultural adaptation for therapeutic approaches
export function getCulturalTherapeuticApproach(language: string): {
  communicationStyle: string;
  culturalConsiderations: string[];
  preferredTerminology: string[];
} {
  const approaches = {
    en: {
      communicationStyle: 'Direct but warm, professional therapeutic communication',
      culturalConsiderations: ['Individual autonomy', 'Self-advocacy', 'Personal boundaries'],
      preferredTerminology: ['Mental health', 'Therapy', 'Wellness', 'Self-care']
    },
    es: {
      communicationStyle: 'Warm, family-oriented, formal respect with therapeutic professionalism',
      culturalConsiderations: ['Family involvement', 'Religious/spiritual elements', 'Community support', 'Respect for elders'],
      preferredTerminology: ['Bienestar', 'Apoyo emocional', 'Salud mental', 'Cuidado personal']
    },
    fr: {
      communicationStyle: 'Intellectual approach, formal yet empathetic, emphasizing reasoning',
      culturalConsiderations: ['Privacy importance', 'Philosophical reflection', 'Intellectual understanding'],
      preferredTerminology: ['Bien-être', 'Équilibre mental', 'Soutien psychologique', 'Développement personnel']
    },
    de: {
      communicationStyle: 'Direct, structured, goal-oriented with clear therapeutic boundaries',
      culturalConsiderations: ['Efficiency and structure', 'Privacy and discretion', 'Problem-solving focus'],
      preferredTerminology: ['Psychische Gesundheit', 'Wohlbefinden', 'Selbstfürsorge', 'Emotionale Balance']
    },
    zh: {
      communicationStyle: 'Indirect, harmony-focused, face-saving with gentle guidance',
      culturalConsiderations: ['Family harmony', 'Face-saving', 'Holistic wellness', 'Balance concepts'],
      preferredTerminology: ['心理健康', '心理平衡', '身心wellness', '情感支持']
    },
    ja: {
      communicationStyle: 'Highly respectful, indirect, group harmony with individual support',
      culturalConsiderations: ['Group harmony', 'Emotional restraint', 'Respect hierarchies', 'Subtle communication'],
      preferredTerminology: ['心の健康', 'メンタルヘルス', '心のケア', '精神的な支援']
    }
  };

  return approaches[language as keyof typeof approaches] || approaches.en;
}

// Emergency resources by language/region
export const emergencyResources = {
  en: {
    crisis_hotline: '988 (US) - Suicide & Crisis Lifeline',
    text_support: 'Text HOME to 741741 - Crisis Text Line',
    emergency: '911 - Emergency Services',
    international: '116 123 - Samaritans (International)'
  },
  es: {
    crisis_hotline: '988 (US Spanish) - Línea de Vida de Prevención del Suicidio',
    text_support: 'Texto HOLA al 741741 - Línea de Texto de Crisis',
    emergency: '911 - Servicios de Emergencia',
    international: '+34 717 003 717 - Teléfono de la Esperanza (España)'
  },
  fr: {
    crisis_hotline: '3114 (France) - Numéro national de prévention du suicide',
    text_support: 'SOS Amitié - 09 72 39 40 50',
    emergency: '15 - SAMU (France)',
    international: '+32 2 649 95 55 - Centre de Prévention du Suicide (Belgique)'
  },
  de: {
    crisis_hotline: '0800 111 0 111 - Telefonseelsorge (Deutschland)',
    text_support: 'NummerGegenKummer - 116 111',
    emergency: '112 - Notruf (Deutschland)',
    international: '+43 142 - Telefonseelsorge (Österreich)'
  }
};

export function getEmergencyResources(language: string) {
  return emergencyResources[language as keyof typeof emergencyResources] || emergencyResources.en;
}