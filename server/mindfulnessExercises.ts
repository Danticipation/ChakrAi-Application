// Interactive breathing and mindfulness exercises for emotional stress
export interface MindfulnessExercise {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  type: 'breathing' | 'mindfulness' | 'grounding' | 'visualization';
  triggerConditions: {
    emotionalStates: string[];
    riskLevels: string[];
    stressIndicators: string[];
  };
  audioScript: string;
  voiceInstructions: string[];
  breathingPattern?: {
    inhaleSeconds: number;
    holdSeconds: number;
    exhaleSeconds: number;
    cycles: number;
  };
  guidedSteps: Array<{
    step: number;
    instruction: string;
    duration: number; // seconds
    audioText: string;
  }>;
}

// Comprehensive mindfulness exercise library
export const mindfulnessExercises: MindfulnessExercise[] = [
  {
    id: 'box-breathing',
    name: '4-4-4-4 Box Breathing',
    description: 'A calming breathing technique to reduce anxiety and stress',
    duration: 5,
    type: 'breathing',
    triggerConditions: {
      emotionalStates: ['anxious', 'stressed', 'panic', 'overwhelmed'],
      riskLevels: ['medium', 'high'],
      stressIndicators: ['rapid breathing', 'tension', 'racing thoughts']
    },
    audioScript: "Let's practice box breathing together. This technique will help calm your nervous system and bring you back to center.",
    voiceInstructions: [
      "Find a comfortable position and close your eyes if you feel safe doing so",
      "We'll breathe in a square pattern - 4 counts in, 4 counts hold, 4 counts out, 4 counts hold",
      "Follow my voice and let your breath become steady and calm"
    ],
    breathingPattern: {
      inhaleSeconds: 4,
      holdSeconds: 4,
      exhaleSeconds: 4,
      cycles: 8
    },
    guidedSteps: [
      {
        step: 1,
        instruction: "Preparation and settling",
        duration: 30,
        audioText: "Take a moment to settle into your space. Feel your body supported and know that you're safe. We're going to practice box breathing together, a powerful technique to calm your mind and body."
      },
      {
        step: 2,
        instruction: "Begin breathing pattern",
        duration: 240,
        audioText: "Now, breathe in slowly through your nose for 4 counts... 1, 2, 3, 4. Hold your breath gently for 4 counts... 1, 2, 3, 4. Now exhale slowly through your mouth for 4 counts... 1, 2, 3, 4. Hold empty for 4 counts... 1, 2, 3, 4. Beautiful. Let's continue this pattern together."
      },
      {
        step: 3,
        instruction: "Closing and integration",
        duration: 30,
        audioText: "Wonderful work. Take a moment to notice how your body feels now. Your nervous system is calming, your mind is clearer. Remember, you can return to this breath anytime you need to find your center."
      }
    ]
  },
  {
    id: 'progressive-relaxation',
    name: 'Progressive Muscle Relaxation',
    description: 'Release physical tension and calm the mind through systematic muscle relaxation',
    duration: 10,
    type: 'mindfulness',
    triggerConditions: {
      emotionalStates: ['tense', 'stressed', 'angry', 'frustrated'],
      riskLevels: ['low', 'medium'],
      stressIndicators: ['muscle tension', 'headache', 'clenched jaw']
    },
    audioScript: "We'll practice progressive muscle relaxation to release tension from your body and calm your mind.",
    voiceInstructions: [
      "Find a comfortable position where you can relax completely",
      "We'll tense and then relax each muscle group, starting from your toes",
      "Notice the contrast between tension and relaxation"
    ],
    guidedSteps: [
      {
        step: 1,
        instruction: "Preparation",
        duration: 60,
        audioText: "Get comfortable and close your eyes. Take three deep breaths with me. We're going to systematically tense and release each part of your body, helping you discover deep relaxation."
      },
      {
        step: 2,
        instruction: "Feet and legs",
        duration: 120,
        audioText: "Start by curling your toes tightly... hold for 5 seconds... and release. Feel the tension melt away. Now tense your calf muscles... hold... and release. Tense your thigh muscles... hold... and release. Notice how relaxed your legs feel now."
      },
      {
        step: 3,
        instruction: "Core and arms",
        duration: 120,
        audioText: "Tense your stomach muscles... hold... and release. Make fists with your hands... hold... and release. Tense your arms... hold... and release. Feel the warmth and relaxation flowing through your arms."
      },
      {
        step: 4,
        instruction: "Shoulders and face",
        duration: 120,
        audioText: "Raise your shoulders to your ears... hold... and release. Scrunch your face muscles... hold... and release. Feel all the tension leaving your face, your jaw dropping slightly, completely relaxed."
      },
      {
        step: 5,
        instruction: "Full body integration",
        duration: 180,
        audioText: "Now scan your entire body from head to toe. Notice the deep relaxation you've created. If you find any remaining tension, just breathe into that area and let it go. You are completely relaxed, completely at peace."
      }
    ]
  },
  {
    id: '5-4-3-2-1-grounding',
    name: '5-4-3-2-1 Grounding Technique',
    description: 'Use your senses to ground yourself in the present moment',
    duration: 8,
    type: 'grounding',
    triggerConditions: {
      emotionalStates: ['panic', 'dissociation', 'overwhelmed', 'anxious'],
      riskLevels: ['high', 'critical'],
      stressIndicators: ['feeling disconnected', 'racing thoughts', 'panic symptoms']
    },
    audioScript: "Let's use the 5-4-3-2-1 grounding technique to bring you back to the present moment using your senses.",
    voiceInstructions: [
      "We'll use your five senses to anchor you in the present",
      "Take your time with each step - there's no rush",
      "You are safe and grounded in this moment"
    ],
    guidedSteps: [
      {
        step: 1,
        instruction: "Introduction and centering",
        duration: 45,
        audioText: "Right now, in this moment, you are safe. We're going to use your senses to bring you fully into the present. Take a deep breath with me and know that you're exactly where you need to be."
      },
      {
        step: 2,
        instruction: "5 things you can see",
        duration: 90,
        audioText: "Look around you and name 5 things you can see. Take your time. Maybe a wall, a chair, your hands, a window, a book. Really look at each item, notice its colors, shapes, textures. You're here, you're present, you're safe."
      },
      {
        step: 3,
        instruction: "4 things you can touch",
        duration: 75,
        audioText: "Now notice 4 things you can touch or feel. Maybe the texture of your clothes, the temperature of the air, the surface you're sitting on, your hair. Really feel these sensations grounding you in your body."
      },
      {
        step: 4,
        instruction: "3 things you can hear",
        duration: 60,
        audioText: "Listen carefully and identify 3 sounds around you. Perhaps my voice, sounds from outside, the hum of electronics, your own breathing. Let these sounds anchor you in this moment."
      },
      {
        step: 5,
        instruction: "2 things you can smell",
        duration: 45,
        audioText: "Take a gentle breath in and notice 2 things you can smell. Maybe the air in your room, a subtle scent, or just the neutral smell of breathing. Connect with this sense."
      },
      {
        step: 6,
        instruction: "1 thing you can taste",
        duration: 30,
        audioText: "Finally, notice 1 thing you can taste. Maybe the taste in your mouth, or take a sip of water if you have some nearby. You are fully present now."
      },
      {
        step: 7,
        instruction: "Integration and closing",
        duration: 45,
        audioText: "Beautiful. You've used all your senses to ground yourself in this moment. You are here, you are safe, you are present. Remember this feeling - you can return to it anytime by using your senses."
      }
    ]
  },
  {
    id: 'loving-kindness',
    name: 'Loving-Kindness Meditation',
    description: 'Cultivate self-compassion and emotional healing through loving-kindness',
    duration: 12,
    type: 'mindfulness',
    triggerConditions: {
      emotionalStates: ['sad', 'lonely', 'self-critical', 'depressed'],
      riskLevels: ['low', 'medium'],
      stressIndicators: ['negative self-talk', 'isolation', 'hopelessness']
    },
    audioScript: "We'll practice loving-kindness meditation to cultivate compassion for yourself and heal emotional pain.",
    voiceInstructions: [
      "This practice helps develop self-compassion and emotional healing",
      "We'll start with yourself and then extend loving wishes to others",
      "If emotions arise, just let them be present with kindness"
    ],
    guidedSteps: [
      {
        step: 1,
        instruction: "Centering and intention",
        duration: 90,
        audioText: "Find a comfortable position and place one hand on your heart. Feel the warmth and rhythm of your heartbeat. Today we're going to practice loving-kindness, starting with the most important person - you."
      },
      {
        step: 2,
        instruction: "Loving-kindness for self",
        duration: 180,
        audioText: "With your hand on your heart, silently repeat these phrases: 'May I be happy. May I be healthy. May I be at peace. May I be free from suffering.' Feel these wishes settling into your heart. You deserve love, especially from yourself."
      },
      {
        step: 3,
        instruction: "Loving-kindness for loved ones",
        duration: 150,
        audioText: "Now bring to mind someone you care about. Send them these loving wishes: 'May you be happy. May you be healthy. May you be at peace. May you be free from suffering.' Feel your heart opening with love."
      },
      {
        step: 4,
        instruction: "Loving-kindness for neutral people",
        duration: 120,
        audioText: "Think of someone neutral - maybe a cashier or neighbor. Send them love: 'May you be happy. May you be healthy. May you be at peace. May you be free from suffering.' All beings deserve happiness."
      },
      {
        step: 5,
        instruction: "Loving-kindness for difficult people",
        duration: 120,
        audioText: "If you feel ready, think of someone you have difficulty with. This is challenging but healing: 'May you be happy. May you be healthy. May you be at peace. May you be free from suffering.' This frees your heart."
      },
      {
        step: 6,
        instruction: "Universal loving-kindness",
        duration: 90,
        audioText: "Finally, extend these wishes to all beings everywhere: 'May all beings be happy. May all beings be healthy. May all beings be at peace. May all beings be free from suffering.' Feel connected to all life."
      },
      {
        step: 7,
        instruction: "Return to self",
        duration: 90,
        audioText: "Return your hand to your heart. You have just practiced one of the most healing activities possible - opening your heart. Remember, you always deserve your own love and kindness."
      }
    ]
  },
  {
    id: 'body-scan',
    name: 'Mindful Body Scan',
    description: 'Develop body awareness and release tension through mindful scanning',
    duration: 15,
    type: 'mindfulness',
    triggerConditions: {
      emotionalStates: ['disconnected', 'numb', 'stressed', 'tense'],
      riskLevels: ['low', 'medium'],
      stressIndicators: ['body tension', 'disconnection', 'chronic stress']
    },
    audioScript: "We'll practice a mindful body scan to reconnect with your body and release held tension.",
    voiceInstructions: [
      "This practice helps you reconnect with your body with kindness",
      "Simply notice without trying to change anything",
      "If you notice tension, just breathe into that area"
    ],
    guidedSteps: [
      {
        step: 1,
        instruction: "Preparation and settling",
        duration: 120,
        audioText: "Lie down or sit comfortably and close your eyes. Take three deep breaths. We're going to travel through your body with kind attention, like greeting an old friend you haven't seen in a while."
      },
      {
        step: 2,
        instruction: "Feet and legs",
        duration: 180,
        audioText: "Start by noticing your toes. Send them some appreciation - they carry you through life. Move your attention to your feet, your ankles, your calves. Just noticing, just breathing. Move up to your knees, your thighs. Thank your legs for their strength."
      },
      {
        step: 3,
        instruction: "Pelvis and lower back",
        duration: 120,
        audioText: "Bring attention to your pelvis, your lower back. This is your foundation, your core. Breathe into this area. If there's tension, just notice it with kindness. You don't need to fix anything, just witness."
      },
      {
        step: 4,
        instruction: "Abdomen and chest",
        duration: 150,
        audioText: "Notice your belly rising and falling with breath. Your stomach, your ribs, your heart. Feel gratitude for your heart - it's been beating for you since before you were born. Your lungs, breathing life into you."
      },
      {
        step: 5,
        instruction: "Arms and hands",
        duration: 120,
        audioText: "Move attention to your shoulders - they carry so much. Let them soften. Down your arms to your elbows, your wrists, your hands. Your hands that create, that comfort, that connect you to the world."
      },
      {
        step: 6,
        instruction: "Neck and head",
        duration: 150,
        audioText: "Your neck, working so hard to support your head. Your jaw - let it soften. Your eyes, your ears, your mind. Send appreciation to your whole head, the home of your thoughts and dreams."
      },
      {
        step: 7,
        instruction: "Whole body integration",
        duration: 180,
        audioText: "Now sense your body as a whole. This amazing vessel that carries you through life. Feel gratitude for all it does. You and your body are partners in this journey. Rest in this connection, this wholeness, this peace."
      }
    ]
  }
];

// Exercise selection based on emotional state and context
export function selectMindfulnessExercise(
  emotionalState: string,
  riskLevel: string,
  stressIndicators: string[] = [],
  preferredDuration?: number
): MindfulnessExercise | null {
  
  // Filter exercises by emotional state and risk level
  const suitableExercises = mindfulnessExercises.filter(exercise => {
    const matchesEmotion = exercise.triggerConditions.emotionalStates.includes(emotionalState.toLowerCase());
    const matchesRisk = exercise.triggerConditions.riskLevels.includes(riskLevel.toLowerCase());
    const matchesStress = stressIndicators.some(indicator => 
      exercise.triggerConditions.stressIndicators.some(trigger => 
        trigger.toLowerCase().includes(indicator.toLowerCase())
      )
    );
    
    return matchesEmotion || matchesRisk || matchesStress;
  });
  
  if (suitableExercises.length === 0) {
    // Default to box breathing for general stress
    return mindfulnessExercises.find(ex => ex.id === 'box-breathing') ?? null;
  }
  
  // If duration preference is specified, prioritize exercises within that range
  if (preferredDuration) {
    const durationMatches = suitableExercises.filter(ex => 
      Math.abs(ex.duration - preferredDuration) <= 3
    );
    if (durationMatches.length > 0) {
      return durationMatches[0] ?? null;
    }
  }
  
  // For high/critical risk, prioritize grounding techniques
  if (['high', 'critical'].includes(riskLevel.toLowerCase())) {
    const groundingExercise = suitableExercises.find(ex => ex.type === 'grounding');
    if (groundingExercise) return groundingExercise;
  }
  
  // For anxiety/panic, prioritize breathing exercises
  if (['anxious', 'panic', 'overwhelmed'].includes(emotionalState.toLowerCase())) {
    const breathingExercise = suitableExercises.find(ex => ex.type === 'breathing');
    if (breathingExercise) return breathingExercise;
  }
  
  // Return the first suitable exercise
  return suitableExercises[0] ?? null;
}

// Check if mindfulness intervention should be triggered
export function shouldTriggerMindfulness(
  emotionalState: string,
  riskLevel: string,
  stressIndicators: string[] = [],
  recentMessages: string[] = []
): boolean {
  
  // Always trigger for high/critical risk levels
  if (['high', 'critical'].includes(riskLevel.toLowerCase())) {
    return true;
  }
  
  // Trigger for specific emotional states
  const triggerEmotions = ['panic', 'overwhelmed', 'crisis', 'anxious', 'stressed'];
  if (triggerEmotions.includes(emotionalState.toLowerCase())) {
    return true;
  }
  
  // Trigger based on stress indicators
  const criticalStressIndicators = ['panic symptoms', 'racing thoughts', 'rapid breathing', 'feeling disconnected'];
  if (stressIndicators.some(indicator => 
    criticalStressIndicators.some(critical => 
      critical.toLowerCase().includes(indicator.toLowerCase())
    )
  )) {
    return true;
  }
  
  // Check recent messages for stress patterns
  const recentText = recentMessages.join(' ').toLowerCase();
  const stressKeywords = ['can\'t breathe', 'overwhelmed', 'panic', 'help', 'stressed', 'anxious'];
  const stressCount = stressKeywords.filter(keyword => recentText.includes(keyword)).length;
  
  return stressCount >= 2; // Trigger if multiple stress keywords found
}

// Generate contextual mindfulness response
export function generateMindfulnessInvitation(
  exercise: MindfulnessExercise,
  emotionalContext: string
): string {
  const invitations = {
    crisis: `I can sense you're going through a really difficult time right now. I have a ${exercise.name} exercise that can help ground you and bring you back to safety. Would you like to try it with me? It only takes ${exercise.duration} minutes and can really help when things feel overwhelming.`,
    
    panic: `It sounds like you're feeling really overwhelmed right now. I'd like to guide you through a ${exercise.name} exercise that can help calm your nervous system. It's ${exercise.duration} minutes of gentle guidance that can help you feel more centered. Would you like to try it?`,
    
    anxious: `I can hear the anxiety in your message. Sometimes our minds race ahead of us, but we can always come back to the present moment. I have a wonderful ${exercise.name} exercise that takes just ${exercise.duration} minutes. Would you like me to guide you through it?`,
    
    stressed: `You sound like you're carrying a lot of stress right now. Your mind and body could probably use some relief. I'd love to guide you through a ${exercise.name} exercise - it's ${exercise.duration} minutes of gentle care for yourself. What do you think?`,
    
    sad: `I can feel the heaviness in your words. Sometimes when we're hurting, the kindest thing we can do is give ourselves some gentle attention. I have a ${exercise.name} practice that might bring you some comfort. It's ${exercise.duration} minutes of self-compassion. Would you like to try it together?`,
    
    default: `Based on what you've shared, I think a ${exercise.name} exercise might be really helpful right now. It's a ${exercise.duration}-minute practice that could help you feel more centered and peaceful. Would you like me to guide you through it?`
  };
  
  const contextKey = emotionalContext.toLowerCase() as keyof typeof invitations;
  return invitations[contextKey] || invitations.default;
}