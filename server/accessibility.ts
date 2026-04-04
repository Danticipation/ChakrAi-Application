// Comprehensive accessibility features for TraI mental health application
import OpenAI from 'openai';

export interface AccessibilitySettings {
  userId: number;
  visualImpairment: {
    enabled: boolean;
    screenReaderSupport: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    colorBlindnessType: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
    voiceDescriptions: boolean;
    hapticFeedback: boolean;
  };
  hearingImpairment: {
    enabled: boolean;
    closedCaptions: boolean;
    visualAlerts: boolean;
    signLanguageSupport: boolean;
    transcriptionEnabled: boolean;
    vibrationAlerts: boolean;
  };
  motorImpairment: {
    enabled: boolean;
    voiceNavigation: boolean;
    eyeTracking: boolean;
    switchControl: boolean;
    dwellTime: number; // milliseconds
    largerTouchTargets: boolean;
    oneHandedMode: boolean;
  };
  cognitiveSupport: {
    enabled: boolean;
    simplifiedInterface: boolean;
    reducedAnimations: boolean;
    clearLanguage: boolean;
    memoryAids: boolean;
    focusAssistance: boolean;
    timeoutExtensions: boolean;
  };
  language: string;
  speechRate: number; // 0.5 to 2.0
  preferredInteractionMode: 'voice' | 'text' | 'gesture' | 'mixed';
}

export interface VoiceDescription {
  elementType: 'button' | 'input' | 'image' | 'chart' | 'progress' | 'navigation' | 'content';
  description: string;
  context: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface ClosedCaption {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker: 'user' | 'ai' | 'system';
  emotionalTone: string;
  confidence: number;
}

// Generate voice descriptions for visual elements
export async function generateVoiceDescription(
  elementType: string,
  visualContent: string,
  context: string,
  userLanguage: string = 'en'
): Promise<VoiceDescription> {
  try {
    const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY']! });

    const prompt = `Generate a clear, concise voice description for a visually impaired user in a mental health therapy app.

Element Type: ${elementType}
Visual Content: ${visualContent}
Context: ${context}
Language: ${userLanguage}

Requirements:
1. Use therapeutic, supportive language
2. Describe function and current state clearly
3. Include actionable information if relevant
4. Keep description under 50 words
5. Consider mental health context sensitivity
6. Use ${userLanguage} language

Provide JSON response:
{
  "description": "Clear voice description",
  "actionable": true/false,
  "priority": "low/medium/high"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an accessibility expert specializing in mental health applications. Generate clear, supportive voice descriptions that help visually impaired users navigate therapeutic interfaces effectively."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    return {
      elementType: elementType as any,
      description: result.description || `${elementType} element`,
      context,
      actionable: result.actionable || false,
      priority: result.priority || 'medium'
    };
  } catch (error) {
    console.error('Error generating voice description:', error);
    return {
      elementType: elementType as any,
      description: `${elementType} element in ${context}`,
      context,
      actionable: false,
      priority: 'medium'
    };
  }
}

// Generate closed captions for audio content
export async function generateClosedCaptions(
  audioText: string,
  speaker: 'user' | 'ai' | 'system',
  emotionalContext: string,
  language: string = 'en'
): Promise<ClosedCaption[]> {
  try {
    const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY']! });

    const prompt = `Generate closed captions for therapeutic audio content in a mental health app.

Audio Text: "${audioText}"
Speaker: ${speaker}
Emotional Context: ${emotionalContext}
Language: ${language}

Requirements:
1. Break text into natural caption segments (max 40 characters per line)
2. Include emotional tone indicators where appropriate [calming], [supportive], [gentle]
3. Add timing estimates (start/end in seconds)
4. Preserve therapeutic meaning and tone
5. Include speaker identification when relevant
6. Consider hearing-impaired user experience

Provide JSON array of captions:
[
  {
    "startTime": 0,
    "endTime": 3,
    "text": "Caption text with [emotional tone]",
    "emotionalTone": "supportive",
    "confidence": 0.95
  }
]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an accessibility expert creating closed captions for mental health therapy content. Focus on clarity, emotional context, and therapeutic value."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"captions": []}');
    const captions = result.captions || [];
    
    return captions.map((caption: any, index: number) => ({
      id: `caption-${Date.now()}-${index}`,
      startTime: caption.startTime || 0,
      endTime: caption.endTime || 3,
      text: caption.text || audioText,
      speaker,
      emotionalTone: caption.emotionalTone || emotionalContext,
      confidence: caption.confidence || 0.8
    }));
  } catch (error) {
    console.error('Error generating closed captions:', error);
    // Fallback: simple segmentation
    const words = audioText.split(' ');
    const segments = [];
    let currentSegment = '';
    let startTime = 0;
    
    for (let i = 0; i < words.length; i++) {
      if (currentSegment.length + (words[i]?.length || 0) > 40) {
        segments.push({
          id: `caption-${Date.now()}-${segments.length}`,
          startTime,
          endTime: startTime + 3,
          text: currentSegment.trim(),
          speaker,
          emotionalTone: emotionalContext,
          confidence: 0.7
        });
        currentSegment = (words[i] || '') + ' ';
        startTime += 3;
      } else {
        currentSegment += (words[i] || '') + ' ';
      }
    }
    
    if (currentSegment?.trim()) {
      segments.push({
        id: `caption-${Date.now()}-${segments.length}`,
        startTime,
        endTime: startTime + 3,
        text: currentSegment.trim(),
        speaker,
        emotionalTone: emotionalContext,
        confidence: 0.7
      });
    }
    
    return segments;
  }
}

// Generate alternative text for emotional charts and progress visualizations
export async function generateChartAccessibilityDescription(
  chartType: 'mood_trend' | 'progress_bar' | 'pie_chart' | 'line_graph' | 'wellness_score',
  data: any,
  timeframe: string,
  language: string = 'en'
): Promise<string> {
  try {
    const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY']! });

    const prompt = `Generate an accessible description of a therapeutic data visualization for visually impaired users.

Chart Type: ${chartType}
Data: ${JSON.stringify(data)}
Timeframe: ${timeframe}
Language: ${language}

Requirements:
1. Describe key trends and patterns clearly
2. Include specific data points when relevant
3. Highlight therapeutic significance
4. Use encouraging, supportive language
5. Mention actionable insights
6. Keep under 150 words
7. Structure for screen reader navigation

Focus on what the data means for the user's wellness journey rather than just numbers.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are creating accessible descriptions of therapeutic data visualizations. Focus on meaningful insights that support mental health progress rather than technical chart details."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4
    });

    return response.choices[0]?.message?.content?.trim() || `${chartType} chart showing data for ${timeframe}`;
  } catch (error) {
    console.error('Error generating chart accessibility description:', error);
    return `${chartType} chart displaying your wellness data for ${timeframe}. Please use the data table view for detailed information.`;
  }
}

// Simplify language for cognitive accessibility
export async function simplifyTherapeuticLanguage(
  text: string,
  complexityLevel: 'high' | 'medium' | 'low',
  language: string = 'en'
): Promise<string> {
  if (complexityLevel === 'high') {
    return text; // No simplification needed
  }

  try {
    const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY']! });

    const prompt = `Simplify this therapeutic text for cognitive accessibility:

Original: "${text}"
Complexity Level: ${complexityLevel}
Language: ${language}

Requirements:
1. Use simple, clear language
2. Maintain therapeutic meaning
3. Break complex sentences into shorter ones
4. Use common vocabulary
5. Keep supportive tone`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You simplify therapeutic content for cognitive accessibility while preserving meaning and supportive tone."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3
    });

    return response.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error('Error simplifying language:', error);
    return text;
  }
}

// Generate haptic feedback patterns for emotional states
export interface HapticPattern {
  name: string;
  pattern: number[]; // Array of vibration durations and pauses in milliseconds
  description: string;
  emotionalContext: string;
}

export function generateHapticFeedback(emotionalState: string, intensity: number = 0.5): HapticPattern {
  const patterns = {
    calm: {
      name: 'Calm Breathing',
      pattern: [200, 100, 200, 100, 200], // Gentle, rhythmic
      description: 'Gentle, rhythmic vibration mimicking calm breathing',
      emotionalContext: 'calming'
    },
    anxious: {
      name: 'Grounding Pulse',
      pattern: [100, 50, 100, 50, 100, 200], // Quick grounding pattern
      description: 'Quick, grounding pulses to help with anxiety',
      emotionalContext: 'grounding'
    },
    stressed: {
      name: 'Stress Relief',
      pattern: [300, 150, 300, 150], // Slower, deeper vibrations
      description: 'Slower, deeper vibrations for stress relief',
      emotionalContext: 'stress_relief'
    },
    happy: {
      name: 'Celebration',
      pattern: [50, 25, 50, 25, 50, 25, 50], // Light, celebratory
      description: 'Light, celebratory pattern for positive emotions',
      emotionalContext: 'celebratory'
    },
    sad: {
      name: 'Comfort Embrace',
      pattern: [400, 200, 400], // Warm, embracing pattern
      description: 'Warm, embracing vibration for comfort',
      emotionalContext: 'comforting'
    },
    crisis: {
      name: 'Emergency Alert',
      pattern: [100, 50, 100, 50, 100, 50], // Clear alert pattern
      description: 'Clear, attention-getting pattern for crisis support',
      emotionalContext: 'alert'
    }
  };

  const basePattern = patterns[emotionalState as keyof typeof patterns] || patterns.calm;
  
  // Adjust intensity
  const adjustedPattern = {
    ...basePattern,
    pattern: basePattern.pattern.map(duration => Math.round(duration * intensity))
  };

  return adjustedPattern;
}

// Navigation assistance for motor impairments
export interface NavigationAssistance {
  element: string;
  voiceCommand: string;
  keyboardShortcut: string;
  gestureAlternative: string;
  description: string;
}

export function getNavigationAssistance(language: string = 'en'): NavigationAssistance[] {
  const commands = {
    en: [
      {
        element: 'Main Chat',
        voiceCommand: 'Go to chat',
        keyboardShortcut: 'Alt + C',
        gestureAlternative: 'Swipe right from left edge',
        description: 'Access the main therapeutic conversation'
      },
      {
        element: 'Mood Check-in',
        voiceCommand: 'Check mood',
        keyboardShortcut: 'Alt + M',
        gestureAlternative: 'Double tap with two fingers',
        description: 'Record your current emotional state'
      },
      {
        element: 'Emergency Help',
        voiceCommand: 'Emergency support',
        keyboardShortcut: 'Ctrl + Shift + E',
        gestureAlternative: 'Triple tap anywhere',
        description: 'Access immediate crisis support resources'
      },
      {
        element: 'Settings',
        voiceCommand: 'Open settings',
        keyboardShortcut: 'Alt + S',
        gestureAlternative: 'Swipe down from top',
        description: 'Adjust app preferences and accessibility options'
      },
      {
        element: 'Voice Mode',
        voiceCommand: 'Voice mode on',
        keyboardShortcut: 'Space bar',
        gestureAlternative: 'Long press center',
        description: 'Activate voice interaction mode'
      }
    ],
    es: [
      {
        element: 'Chat Principal',
        voiceCommand: 'Ir al chat',
        keyboardShortcut: 'Alt + C',
        gestureAlternative: 'Deslizar derecha desde borde izquierdo',
        description: 'Acceder a la conversación terapéutica principal'
      },
      {
        element: 'Registro de Ánimo',
        voiceCommand: 'Revisar ánimo',
        keyboardShortcut: 'Alt + M',
        gestureAlternative: 'Doble toque con dos dedos',
        description: 'Registrar tu estado emocional actual'
      }
    ]
  };

  return commands[language as keyof typeof commands] || commands.en;
}

// Color accessibility adjustments
export interface ColorAccessibilityScheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  warningColor: string;
  successColor: string;
  errorColor: string;
}

export function getColorAccessibilityScheme(
  colorBlindnessType: string,
  highContrast: boolean = false
): ColorAccessibilityScheme {
  const schemes = {
    none: {
      name: 'Standard Therapeutic',
      primaryColor: highContrast ? '#000080' : '#4A90E2',
      secondaryColor: highContrast ? '#000040' : '#7B68EE',
      backgroundColor: highContrast ? '#FFFFFF' : '#F8F9FA',
      textColor: highContrast ? '#000000' : '#2C3E50',
      accentColor: highContrast ? '#8B0000' : '#E74C3C',
      warningColor: highContrast ? '#FF4500' : '#F39C12',
      successColor: highContrast ? '#006400' : '#27AE60',
      errorColor: highContrast ? '#8B0000' : '#E74C3C'
    },
    protanopia: {
      name: 'Protanopia Friendly',
      primaryColor: '#4A90E2',
      secondaryColor: '#5D6D7E',
      backgroundColor: '#F8F9FA',
      textColor: '#2C3E50',
      accentColor: '#3498DB',
      warningColor: '#F4D03F',
      successColor: '#85C1E9',
      errorColor: '#5D6D7E'
    },
    deuteranopia: {
      name: 'Deuteranopia Friendly',
      primaryColor: '#3498DB',
      secondaryColor: '#8E44AD',
      backgroundColor: '#F8F9FA',
      textColor: '#2C3E50',
      accentColor: '#E67E22',
      warningColor: '#F7DC6F',
      successColor: '#85C1E9',
      errorColor: '#CB4335'
    },
    tritanopia: {
      name: 'Tritanopia Friendly',
      primaryColor: '#E74C3C',
      secondaryColor: '#C0392B',
      backgroundColor: '#F8F9FA',
      textColor: '#2C3E50',
      accentColor: '#8E44AD',
      warningColor: '#E67E22',
      successColor: '#27AE60',
      errorColor: '#CB4335'
    },
    achromatopsia: {
      name: 'Monochrome High Contrast',
      primaryColor: '#000000',
      secondaryColor: '#4A4A4A',
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
      accentColor: '#666666',
      warningColor: '#808080',
      successColor: '#333333',
      errorColor: '#1A1A1A'
    }
  };

  return schemes[colorBlindnessType as keyof typeof schemes] || schemes.none;
}

// Accessibility compliance checker
export interface AccessibilityIssue {
  severity: 'error' | 'warning' | 'info';
  type: 'contrast' | 'alt_text' | 'keyboard_nav' | 'screen_reader' | 'focus' | 'timing';
  element: string;
  description: string;
  suggestion: string;
  wcagGuideline: string;
}

export function checkAccessibilityCompliance(
  pageContent: any,
  settings: AccessibilitySettings
): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Example accessibility checks
  if (!pageContent.altTexts || pageContent.altTexts.length === 0) {
    issues.push({
      severity: 'error',
      type: 'alt_text',
      element: 'Images',
      description: 'Images without alternative text found',
      suggestion: 'Add descriptive alternative text for all images, especially emotional charts and progress indicators',
      wcagGuideline: 'WCAG 2.1 AA - 1.1.1 Non-text Content'
    });
  }

  if (settings.visualImpairment.enabled && !settings.visualImpairment.screenReaderSupport) {
    issues.push({
      severity: 'warning',
      type: 'screen_reader',
      element: 'Global',
      description: 'Screen reader support not fully enabled',
      suggestion: 'Enable comprehensive screen reader support for better navigation',
      wcagGuideline: 'WCAG 2.1 AA - 4.1.2 Name, Role, Value'
    });
  }

  return issues;
}