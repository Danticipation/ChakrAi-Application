import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Heart, Users, Target, Coffee, Settings, Sparkles, Brain, Activity, Clock, Home, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { getCurrentUserId } from '../utils/userSession';

interface QuestionCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  questions: Question[];
}

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'text' | 'scale' | 'yes_no';
  options?: string[];
  required?: boolean;
}

interface UserAnswer {
  questionId: string;
  answer: string | number;
  categoryId: string;
  answeredAt: Date;
}

const questionCategories: QuestionCategory[] = [
  {
    id: 'personality',
    name: 'Personality & Lifestyle',
    icon: Heart,
    description: 'Help me understand who you are and what makes you tick',
    questions: [
      {
        id: 'p1',
        text: 'If your friends had to describe you in 3 words, what would they say?',
        type: 'text'
      },
      {
        id: 'p2',
        text: 'Are you more of a morning person, a night owl, or neither?',
        type: 'multiple_choice',
        options: ['Morning person', 'Night owl', 'Neither - somewhere in between', 'Depends on the day']
      },
      {
        id: 'p3',
        text: "What's your go-to comfort food on a rough day?",
        type: 'text'
      },
      {
        id: 'p4',
        text: "What's one hobby or activity that instantly makes you lose track of time?",
        type: 'text'
      },
      {
        id: 'p5',
        text: 'Would you say you recharge more around people or alone?',
        type: 'multiple_choice',
        options: ['Around people (extroverted)', 'Alone (introverted)', 'Balanced mix of both', 'Depends on my mood']
      },
      {
        id: 'p6',
        text: "When you're stressed, what's your first instinct?",
        type: 'multiple_choice',
        options: ['Move/exercise', 'Talk to someone', 'Shut down/withdraw', 'Distract myself', 'Problem-solve immediately']
      },
      {
        id: 'p7',
        text: "What's your biggest strength that you're proud of?",
        type: 'text'
      },
      {
        id: 'p8',
        text: 'How do you typically make big decisions?',
        type: 'multiple_choice',
        options: ['Go with my gut feeling', 'Make pros and cons lists', 'Talk it through with others', 'Research extensively', 'Sleep on it']
      },
      {
        id: 'p9',
        text: 'What kind of environment helps you think best?',
        type: 'multiple_choice',
        options: ['Quiet and calm', 'Slightly busy/background noise', 'Music playing', 'Outside in nature', 'Organized and clean']
      },
      {
        id: 'p10',
        text: 'Do you prefer routine or spontaneity?',
        type: 'multiple_choice',
        options: ['Love routine and structure', 'Prefer some routine with flexibility', 'Like a mix of both', 'Prefer spontaneity', 'Completely spontaneous']
      },
      {
        id: 'p11',
        text: 'How do you celebrate your wins, big or small?',
        type: 'text'
      },
      {
        id: 'p12',
        text: 'What motivates you most in life?',
        type: 'multiple_choice',
        options: ['Personal growth', 'Helping others', 'Achievement/success', 'Connection/relationships', 'Financial security', 'Creative expression']
      },
      {
        id: 'p13',
        text: 'When learning something new, how do you prefer to approach it?',
        type: 'multiple_choice',
        options: ['Jump in and figure it out', 'Study theory first', 'Learn from others/mentorship', 'Practice with guidance', 'Online courses/videos']
      },
      {
        id: 'p14',
        text: "What's something you've always wanted to try but haven't yet?",
        type: 'text'
      },
      {
        id: 'p15',
        text: 'How important is it for you to have control over your environment and schedule?',
        type: 'scale',
        options: ['1 - Not important', '2', '3', '4', '5 - Very important']
      }
    ]
  },
  {
    id: 'emotional_awareness',
    name: 'Emotional Awareness & Coping',
    icon: Heart,
    description: 'Share how you understand and manage your emotions',
    questions: [
      {
        id: 'e1',
        text: 'How do you typically know when you\'re feeling stressed?',
        type: 'multiple_choice',
        options: ['Physical symptoms (tension, headaches)', 'Emotional changes (irritability, sadness)', 'Behavioral changes (isolation, eating)', 'Cognitive changes (racing thoughts)', 'I don\'t always notice']
      },
      {
        id: 'e2',
        text: 'What emotion do you feel most comfortable expressing?',
        type: 'multiple_choice',
        options: ['Happiness/joy', 'Anger', 'Sadness', 'Fear/anxiety', 'Love/affection', 'I struggle with all emotions']
      },
      {
        id: 'e3',
        text: 'When you\'re overwhelmed, what helps you feel grounded?',
        type: 'text'
      },
      {
        id: 'e4',
        text: 'How do you typically process difficult emotions?',
        type: 'multiple_choice',
        options: ['Talk about them with others', 'Write/journal about them', 'Physical activity', 'Creative expression', 'Distraction/avoidance', 'Meditation/mindfulness']
      },
      {
        id: 'e5',
        text: 'What triggers your strongest emotional reactions?',
        type: 'multiple_choice',
        options: ['Criticism or rejection', 'Feeling misunderstood', 'Injustice or unfairness', 'Loss of control', 'Conflict with others', 'Uncertainty about the future']
      },
      {
        id: 'e6',
        text: 'How comfortable are you with crying or showing vulnerability?',
        type: 'scale',
        options: ['1 - Very uncomfortable', '2', '3', '4', '5 - Very comfortable']
      },
      {
        id: 'e7',
        text: 'What does self-compassion mean to you?',
        type: 'text'
      },
      {
        id: 'e8',
        text: 'When you make a mistake, what\'s your inner voice like?',
        type: 'multiple_choice',
        options: ['Very critical and harsh', 'Somewhat critical', 'Balanced - acknowledges mistakes but supportive', 'Generally understanding', 'Very forgiving and kind']
      },
      {
        id: 'e9',
        text: 'How do you handle disappointment?',
        type: 'multiple_choice',
        options: ['Allow myself to feel sad for a while', 'Try to find the lesson or positive', 'Distract myself with activities', 'Talk to someone about it', 'Move on quickly']
      },
      {
        id: 'e10',
        text: 'What emotion do you struggle with most?',
        type: 'multiple_choice',
        options: ['Anxiety', 'Sadness/Depression', 'Anger', 'Loneliness', 'Overwhelm', 'Fear', 'Guilt/Shame', 'All emotions feel difficult']
      },
      {
        id: 'e11',
        text: 'How do you know when you need to take a mental health break?',
        type: 'text'
      },
      {
        id: 'e12',
        text: 'What helps you bounce back from setbacks?',
        type: 'multiple_choice',
        options: ['Self-compassion and patience', 'Support from others', 'Focusing on lessons learned', 'Getting back into routine', 'Taking action on solutions']
      },
      {
        id: 'e13',
        text: 'How do you handle overwhelming emotions?',
        type: 'multiple_choice',
        options: ['Take deep breaths/meditation', 'Call someone I trust', 'Write in a journal', 'Go for a walk', 'Use grounding techniques', 'Wait for them to pass']
      },
      {
        id: 'e14',
        text: 'What would help you feel more emotionally balanced?',
        type: 'text'
      },
      {
        id: 'e15',
        text: 'How often do you check in with your emotional state?',
        type: 'multiple_choice',
        options: ['Multiple times daily', 'Daily', 'Few times a week', 'Weekly', 'Rarely', 'Never - I don\'t think about it']
      }
    ]
  },
  {
    id: 'relationships',
    name: 'Relationships & Support',
    icon: Users,
    description: 'Tell me about your connections and support systems',
    questions: [
      {
        id: 'r1',
        text: 'Who in your life do you feel the safest opening up to?',
        type: 'text'
      },
      {
        id: 'r2',
        text: 'Do you currently have people who support your mental wellness journey?',
        type: 'yes_no'
      },
      {
        id: 'r3',
        text: 'What\'s your love language for receiving support?',
        type: 'multiple_choice',
        options: ['Words of affirmation', 'Quality time', 'Physical touch', 'Acts of service', 'Thoughtful gifts']
      },
      {
        id: 'r4',
        text: 'Are you more likely to vent or to seek solutions when you talk to someone?',
        type: 'multiple_choice',
        options: ['Just want to vent and be heard', 'Seeking practical solutions', 'Both - depends on my mood', 'Neither - I rarely share problems']
      },
      {
        id: 'r5',
        text: 'How do you prefer to show care for others?',
        type: 'multiple_choice',
        options: ['Listening and emotional support', 'Practical help and actions', 'Spending quality time', 'Giving thoughtful gifts', 'Physical affection']
      },
      {
        id: 'r6',
        text: 'How comfortable are you with conflict in relationships?',
        type: 'multiple_choice',
        options: ['Very uncomfortable - avoid it', 'Somewhat uncomfortable but will address it', 'Neutral - depends on the issue', 'Comfortable addressing conflicts', 'Actually prefer to address issues directly']
      },
      {
        id: 'r7',
        text: 'What makes you feel most connected to others?',
        type: 'multiple_choice',
        options: ['Deep conversations', 'Shared activities', 'Physical presence', 'Shared humor/laughter', 'Working toward common goals']
      },
      {
        id: 'r8',
        text: 'How do you typically respond when someone is upset with you?',
        type: 'multiple_choice',
        options: ['Apologize immediately', 'Try to understand their perspective', 'Get defensive', 'Give them space first', 'Want to fix it right away']
      },
      {
        id: 'r9',
        text: 'What kind of boundaries do you struggle with most?',
        type: 'multiple_choice',
        options: ['Saying no to requests', 'Limiting time with draining people', 'Not overcommitting myself', 'Protecting my energy', 'Setting emotional boundaries']
      },
      {
        id: 'r10',
        text: 'How do you handle loneliness?',
        type: 'multiple_choice',
        options: ['Reach out to friends/family', 'Engage in solo activities I enjoy', 'Use social media or online communities', 'Focus on self-care', 'Sometimes just sit with the feeling']
      },
      {
        id: 'r11',
        text: 'What role does family play in your life currently?',
        type: 'multiple_choice',
        options: ['Very close and supportive', 'Close but complicated', 'Somewhat distant', 'Strained or difficult', 'Minimal contact', 'Prefer not to share']
      },
      {
        id: 'r12',
        text: 'How do you know when a relationship is healthy for you?',
        type: 'text'
      },
      {
        id: 'r13',
        text: 'What do you need most in your relationships right now?',
        type: 'multiple_choice',
        options: ['More emotional support', 'Better communication', 'More fun and lightness', 'Deeper connections', 'Healthy boundaries', 'More understanding']
      },
      {
        id: 'r14',
        text: 'How do you prefer to receive feedback from people you care about?',
        type: 'multiple_choice',
        options: ['Gently and with care', 'Direct but supportive', 'In private conversations', 'With specific examples', 'Only when I ask for it']
      },
      {
        id: 'r15',
        text: 'What makes you feel most appreciated in relationships?',
        type: 'text'
      }
    ]
  },
  {
    id: 'goals',
    name: 'Goals, Dreams & Values',
    icon: Target,
    description: 'Share what drives you and what you\'re working toward',
    questions: [
      {
        id: 'g1',
        text: 'What\'s one goal (big or small) you\'re working toward right now?',
        type: 'text'
      },
      {
        id: 'g2',
        text: 'What\'s a value or belief that\'s very important to you?',
        type: 'text'
      },
      {
        id: 'g3',
        text: 'If nothing was holding you back, what\'s a life change you\'d make today?',
        type: 'text'
      },
      {
        id: 'g4',
        text: 'Are you more future-focused, present-focused, or reflective of the past?',
        type: 'multiple_choice',
        options: ['Future-focused (planning ahead)', 'Present-focused (living in the moment)', 'Past-reflective (learning from history)', 'Balanced across all timeframes']
      },
      {
        id: 'g5',
        text: 'Do you prefer clear plans or going with the flow?',
        type: 'multiple_choice',
        options: ['Clear plans and structure', 'Going with the flow', 'Mix of both', 'Depends on the situation']
      },
      {
        id: 'g6',
        text: 'What does success mean to you personally?',
        type: 'text'
      },
      {
        id: 'g7',
        text: 'What\'s something you\'re proud of accomplishing recently?',
        type: 'text'
      },
      {
        id: 'g8',
        text: 'How do you stay motivated when working toward long-term goals?',
        type: 'multiple_choice',
        options: ['Break them into smaller steps', 'Visual reminders', 'Accountability partners', 'Reward systems', 'Regular progress reviews', 'I struggle with long-term motivation']
      },
      {
        id: 'g9',
        text: 'What\'s your biggest fear about pursuing your dreams?',
        type: 'multiple_choice',
        options: ['Fear of failure', 'Fear of success', 'Fear of judgment', 'Financial insecurity', 'Disappointing others', 'Not being good enough']
      },
      {
        id: 'g10',
        text: 'How important is it for your work to align with your values?',
        type: 'scale',
        options: ['1 - Not important', '2', '3', '4', '5 - Extremely important']
      },
      {
        id: 'g11',
        text: 'What legacy do you want to leave behind?',
        type: 'text'
      },
      {
        id: 'g12',
        text: 'How do you define a life well-lived?',
        type: 'text'
      },
      {
        id: 'g13',
        text: 'What\'s one skill you\'d love to master?',
        type: 'text'
      },
      {
        id: 'g14',
        text: 'How do you handle setbacks in pursuing your goals?',
        type: 'multiple_choice',
        options: ['Reassess and adjust the plan', 'Take a break then try again', 'Seek support from others', 'Push through with determination', 'Sometimes give up', 'Learn from the experience']
      },
      {
        id: 'g15',
        text: 'What motivates you to keep growing as a person?',
        type: 'text'
      }
    ]
  },
  {
    id: 'fun',
    name: 'Personal Preferences & Fun',
    icon: Coffee,
    description: 'Fun questions to help me understand your style and preferences',
    questions: [
      {
        id: 'f1',
        text: 'Coffee, tea, energy drinksâ€”or none?',
        type: 'multiple_choice',
        options: ['Coffee lover', 'Tea enthusiast', 'Energy drinks', 'Water/other beverages', 'All of the above']
      },
      {
        id: 'f2',
        text: 'Where do you feel most at peace?',
        type: 'multiple_choice',
        options: ['Mountains', 'Beaches', 'Cities', 'Forests', 'At home', 'Somewhere else']
      },
      {
        id: 'f3',
        text: 'On a lazy day, would you rather...',
        type: 'multiple_choice',
        options: ['Binge a TV series', 'Read a book', 'Play games', 'Be creative/artistic', 'Hang out with friends']
      },
      {
        id: 'f4',
        text: 'If you could instantly master any skill, what would it be?',
        type: 'text'
      },
      {
        id: 'f5',
        text: 'What song or artist do you play when you need to get in a good mood?',
        type: 'text'
      },
      {
        id: 'f6',
        text: 'Are you more of a dog person, cat person, or neither?',
        type: 'multiple_choice',
        options: ['Definitely a dog person', 'Definitely a cat person', 'I love both equally', 'Neither - prefer other pets', 'Not really an animal person']
      },
      {
        id: 'f7',
        text: 'What\'s your ideal way to spend a free evening?',
        type: 'multiple_choice',
        options: ['Quiet night at home', 'Out with friends', 'Trying something new', 'Being creative', 'Learning something', 'Physical activity']
      },
      {
        id: 'f8',
        text: 'What type of weather makes you happiest?',
        type: 'multiple_choice',
        options: ['Sunny and warm', 'Cool and crisp', 'Rainy and cozy', 'Snowy and peaceful', 'Stormy and dramatic']
      },
      {
        id: 'f9',
        text: 'If you could have dinner with anyone (living or dead), who would it be?',
        type: 'text'
      },
      {
        id: 'f10',
        text: 'What\'s your favorite way to treat yourself?',
        type: 'text'
      },
      {
        id: 'f11',
        text: 'Are you more of a planner or a spontaneous person when it comes to travel?',
        type: 'multiple_choice',
        options: ['Detailed planner', 'Some planning, some spontaneity', 'Mostly spontaneous', 'Completely wing it', 'I don\'t travel much']
      },
      {
        id: 'f12',
        text: 'What\'s something that always makes you laugh?',
        type: 'text'
      },
      {
        id: 'f13',
        text: 'If you had unlimited resources, what would you do for fun?',
        type: 'text'
      },
      {
        id: 'f14',
        text: 'What\'s your favorite season and why?',
        type: 'text'
      },
      {
        id: 'f15',
        text: 'What small thing brings you disproportionate joy?',
        type: 'text'
      }
    ]
  },
  {
    id: 'ai_preferences',
    name: 'AI Therapy Preferences',
    icon: Settings,
    description: 'Help me tailor my therapeutic style to what works best for you',
    questions: [
      {
        id: 'ai1',
        text: 'Would you like me to challenge your thinking sometimes or focus more on support?',
        type: 'multiple_choice',
        options: ['More challenging/thought-provoking', 'More supportive/validating', 'Balanced mix', 'Depends on the topic']
      },
      {
        id: 'ai2',
        text: 'Do you prefer gentle encouragement or tough love?',
        type: 'multiple_choice',
        options: ['Gentle encouragement', 'Tough love approach', 'Balanced approach', 'Varies with my mood']
      },
      {
        id: 'ai3',
        text: 'How often would you like check-ins from me?',
        type: 'multiple_choice',
        options: ['Daily gentle reminders', 'Weekly check-ins', 'Only when I start sessions', 'No scheduled check-ins']
      },
      {
        id: 'ai4',
        text: 'Should I reflect your feelings back to you often, or mostly listen?',
        type: 'multiple_choice',
        options: ['Reflect feelings often', 'Mostly listen', 'Ask clarifying questions', 'Mix of all approaches']
      },
      {
        id: 'ai5',
        text: 'Do you want me to ask follow-up questions about your answers, or keep it light?',
        type: 'multiple_choice',
        options: ['Deep dive with follow-ups', 'Keep conversations light', 'Depends on the topic', 'Let me guide the depth']
      },
      {
        id: 'ai6',
        text: 'How should I respond when you\'re having a really difficult day?',
        type: 'multiple_choice',
        options: ['Provide comfort and validation', 'Offer practical coping strategies', 'Ask what you need in the moment', 'Share gentle perspective', 'Just listen without trying to fix']
      },
      {
        id: 'ai7',
        text: 'What tone works best for you when receiving feedback?',
        type: 'multiple_choice',
        options: ['Warm and encouraging', 'Direct but kind', 'Casual and friendly', 'Professional but caring', 'Depends on the situation']
      },
      {
        id: 'ai8',
        text: 'How much do you want me to remember from our previous conversations?',
        type: 'multiple_choice',
        options: ['Everything - build on our history', 'Key themes and patterns', 'Recent conversations only', 'Let me bring up what\'s relevant', 'Start fresh each time']
      },
      {
        id: 'ai9',
        text: 'When you share something vulnerable, how should I respond?',
        type: 'multiple_choice',
        options: ['Acknowledge the courage it took', 'Normalize the experience', 'Ask gentle follow-up questions', 'Offer validation and support', 'Let me choose the response']
      },
      {
        id: 'ai10',
        text: 'What\'s most important to you in our therapeutic relationship?',
        type: 'multiple_choice',
        options: ['Feeling understood', 'Getting practical advice', 'Having a judgment-free space', 'Gaining new perspectives', 'Feeling supported and validated']
      },
      {
        id: 'ai11',
        text: 'How direct should I be if I notice concerning patterns?',
        type: 'multiple_choice',
        options: ['Very direct - call it out clearly', 'Gentle but clear', 'Ask questions to help me see it', 'Subtle hints and suggestions', 'Let me discover it naturally']
      },
      {
        id: 'ai12',
        text: 'What type of language resonates most with you?',
        type: 'multiple_choice',
        options: ['Warm and nurturing', 'Clear and straightforward', 'Thoughtful and reflective', 'Casual and conversational', 'Professional but personable']
      },
      {
        id: 'ai13',
        text: 'How should I handle it if you seem stuck or resistant?',
        type: 'multiple_choice',
        options: ['Gently explore the resistance', 'Respect the boundary and change topics', 'Offer different approaches', 'Ask what you need', 'Point out the pattern directly']
      },
      {
        id: 'ai14',
        text: 'What\'s your preferred pace for our conversations?',
        type: 'multiple_choice',
        options: ['Slow and reflective', 'Steady and consistent', 'Dynamic - varies by topic', 'Quick and efficient', 'Let the conversation flow naturally']
      },
      {
        id: 'ai15',
        text: 'What would make you feel most supported by me as your AI companion?',
        type: 'text'
      }
    ]
  },
  {
    id: 'mental_health',
    name: 'Mental Health & History',
    icon: Brain,
    description: 'Help me understand your mental health background and needs',
    questions: [
      {
        id: 'mh1',
        text: 'Have you ever worked with a therapist or counselor before?',
        type: 'multiple_choice',
        options: ['Yes, currently', 'Yes, in the past', 'No, but interested', 'No, and not interested', 'Unsure']
      },
      {
        id: 'mh2',
        text: 'How comfortable are you discussing mental health topics?',
        type: 'multiple_choice',
        options: ['Very comfortable', 'Somewhat comfortable', 'Neutral', 'Somewhat uncomfortable', 'Very uncomfortable']
      },
      {
        id: 'mh3',
        text: 'Do you have any diagnosed mental health conditions?',
        type: 'multiple_choice',
        options: ['Yes, and I manage them actively', 'Yes, but I don\'t actively treat them', 'Self-diagnosed but not professionally', 'No', 'Prefer not to say']
      },
      {
        id: 'mh4',
        text: 'What mental health areas are you most interested in working on?',
        type: 'multiple_choice',
        options: ['Anxiety management', 'Depression/mood', 'Stress management', 'Self-esteem', 'Relationships', 'Life transitions', 'Trauma', 'General wellness', 'Not sure']
      },
      {
        id: 'mh5',
        text: 'How often do you experience anxiety or worry?',
        type: 'multiple_choice',
        options: ['Daily', 'Several times a week', 'Weekly', 'Monthly', 'Rarely', 'Never']
      },
      {
        id: 'mh6',
        text: 'What helps you feel more grounded when overwhelmed?',
        type: 'text'
      },
      {
        id: 'mh7',
        text: 'How do you typically cope with difficult emotions?',
        type: 'multiple_choice',
        options: ['Talk to others', 'Keep to myself', 'Engage in activities', 'Avoid thinking about them', 'Use healthy coping strategies', 'Use unhealthy coping strategies']
      },
      {
        id: 'mh8',
        text: 'Have you ever experienced panic attacks?',
        type: 'multiple_choice',
        options: ['Yes, frequently', 'Yes, occasionally', 'Yes, rarely', 'No', 'Not sure']
      },
      {
        id: 'mh9',
        text: 'How would you describe your overall mental health currently?',
        type: 'multiple_choice',
        options: ['Excellent', 'Good', 'Fair', 'Poor', 'Very poor']
      },
      {
        id: 'mh10',
        text: 'Do you take any medications for mental health?',
        type: 'multiple_choice',
        options: ['Yes, and they help', 'Yes, but effectiveness varies', 'Yes, but they don\'t help much', 'No, but I\'ve considered it', 'No, and not interested']
      },
      {
        id: 'mh11',
        text: 'What stigmas around mental health concern you most?',
        type: 'text'
      },
      {
        id: 'mh12',
        text: 'How important is mental health in your overall well-being?',
        type: 'multiple_choice',
        options: ['Extremely important', 'Very important', 'Somewhat important', 'Not very important', 'Not important at all']
      },
      {
        id: 'mh13',
        text: 'What would make you more likely to seek mental health support?',
        type: 'multiple_choice',
        options: ['Lower cost', 'Less stigma', 'More accessibility', 'Better understanding from others', 'Nothing - I\'m already open to it', 'I\'m not interested']
      },
      {
        id: 'mh14',
        text: 'How do you prefer to learn about mental health topics?',
        type: 'multiple_choice',
        options: ['Reading articles/books', 'Talking with professionals', 'Peer support groups', 'Online resources', 'Apps and digital tools', 'I prefer not to learn about them']
      },
      {
        id: 'mh15',
        text: 'What mental health goal would be most meaningful to achieve?',
        type: 'text'
      }
    ]
  },
  {
    id: 'physical_health',
    name: 'Physical Health & Wellness',
    icon: Activity,
    description: 'Tell me about your physical health and wellness practices',
    questions: [
      {
        id: 'ph1',
        text: 'How would you rate your overall physical health?',
        type: 'multiple_choice',
        options: ['Excellent', 'Good', 'Fair', 'Poor', 'Very poor']
      },
      {
        id: 'ph2',
        text: 'How often do you exercise or engage in physical activity?',
        type: 'multiple_choice',
        options: ['Daily', 'Several times a week', 'Weekly', 'Monthly', 'Rarely', 'Never']
      },
      {
        id: 'ph3',
        text: 'What type of physical activity do you enjoy most?',
        type: 'multiple_choice',
        options: ['Walking/hiking', 'Running', 'Weight training', 'Yoga/stretching', 'Sports', 'Swimming', 'Dancing', 'I don\'t enjoy exercise']
      },
      {
        id: 'ph4',
        text: 'How many hours of sleep do you typically get per night?',
        type: 'multiple_choice',
        options: ['Less than 5', '5-6', '6-7', '7-8', '8-9', 'More than 9']
      },
      {
        id: 'ph5',
        text: 'How would you describe your sleep quality?',
        type: 'multiple_choice',
        options: ['Excellent - wake up refreshed', 'Good - usually feel rested', 'Fair - sometimes tired', 'Poor - often tired', 'Very poor - always exhausted']
      },
      {
        id: 'ph6',
        text: 'What affects your sleep most negatively?',
        type: 'multiple_choice',
        options: ['Stress/anxiety', 'Screen time', 'Caffeine', 'Physical discomfort', 'Environment (noise, light)', 'Irregular schedule', 'Nothing specific']
      },
      {
        id: 'ph7',
        text: 'How often do you eat fruits and vegetables?',
        type: 'multiple_choice',
        options: ['Every meal', 'Daily', 'Several times a week', 'Weekly', 'Rarely', 'Never']
      },
      {
        id: 'ph8',
        text: 'Do you have any chronic health conditions?',
        type: 'multiple_choice',
        options: ['Yes, multiple', 'Yes, one', 'No', 'Prefer not to say']
      },
      {
        id: 'ph9',
        text: 'How often do you see healthcare providers for checkups?',
        type: 'multiple_choice',
        options: ['Annually', 'Every 2-3 years', 'Only when sick', 'Rarely', 'Never']
      },
      {
        id: 'ph10',
        text: 'What wellness practices are most important to you?',
        type: 'multiple_choice',
        options: ['Regular exercise', 'Healthy eating', 'Adequate sleep', 'Stress management', 'Preventive healthcare', 'Mental health care', 'Social connections']
      },
      {
        id: 'ph11',
        text: 'How does your physical health affect your mental health?',
        type: 'multiple_choice',
        options: ['Significantly - they\'re very connected', 'Somewhat connected', 'Minimally connected', 'Not connected', 'I\'m not sure']
      },
      {
        id: 'ph12',
        text: 'What physical health goal would you most like to achieve?',
        type: 'text'
      },
      {
        id: 'ph13',
        text: 'How much water do you typically drink per day?',
        type: 'multiple_choice',
        options: ['Less than 2 glasses', '2-4 glasses', '4-6 glasses', '6-8 glasses', 'More than 8 glasses']
      },
      {
        id: 'ph14',
        text: 'What prevents you from being as healthy as you\'d like?',
        type: 'multiple_choice',
        options: ['Time constraints', 'Financial limitations', 'Lack of motivation', 'Health conditions', 'Knowledge gaps', 'Social barriers', 'Nothing specific']
      },
      {
        id: 'ph15',
        text: 'How do you manage physical pain or discomfort?',
        type: 'text'
      }
    ]
  },
  {
    id: 'daily_life',
    name: 'Daily Life & Routines',
    icon: Clock,
    description: 'Share about your daily patterns and lifestyle habits',
    questions: [
      {
        id: 'dl1',
        text: 'What does a typical morning routine look like for you?',
        type: 'text'
      },
      {
        id: 'dl2',
        text: 'How structured vs. flexible is your daily schedule?',
        type: 'multiple_choice',
        options: ['Very structured - same routine daily', 'Somewhat structured with flexibility', 'Loosely structured', 'Mostly flexible', 'Completely unstructured']
      },
      {
        id: 'dl3',
        text: 'What time do you typically go to bed?',
        type: 'multiple_choice',
        options: ['Before 9 PM', '9-10 PM', '10-11 PM', '11 PM-12 AM', '12-1 AM', 'After 1 AM', 'Very inconsistent']
      },
      {
        id: 'dl4',
        text: 'How often do you eat meals at regular times?',
        type: 'multiple_choice',
        options: ['Always - very consistent', 'Usually consistent', 'Somewhat consistent', 'Often irregular', 'Very irregular', 'I don\'t really eat regular meals']
      },
      {
        id: 'dl5',
        text: 'What part of your day feels most productive?',
        type: 'multiple_choice',
        options: ['Early morning', 'Mid-morning', 'Afternoon', 'Early evening', 'Late evening/night', 'It varies']
      },
      {
        id: 'dl6',
        text: 'How do you typically unwind at the end of the day?',
        type: 'multiple_choice',
        options: ['Watch TV/streaming', 'Read', 'Scroll on phone/social media', 'Talk with family/friends', 'Take a bath/shower', 'Listen to music/podcasts', 'Other activities']
      },
      {
        id: 'dl7',
        text: 'What household tasks do you find most challenging?',
        type: 'multiple_choice',
        options: ['Cleaning/organizing', 'Cooking/meal prep', 'Laundry', 'Financial management', 'Home maintenance', 'All of them', 'None - I manage well']
      },
      {
        id: 'dl8',
        text: 'How much time do you spend on screens daily (outside of work)?',
        type: 'multiple_choice',
        options: ['Less than 1 hour', '1-2 hours', '2-4 hours', '4-6 hours', '6-8 hours', 'More than 8 hours']
      },
      {
        id: 'dl9',
        text: 'What does your living environment look like most of the time?',
        type: 'multiple_choice',
        options: ['Very organized and clean', 'Mostly organized', 'Lived-in but not messy', 'Somewhat cluttered', 'Very cluttered/messy']
      },
      {
        id: 'dl10',
        text: 'How often do you spend time in nature?',
        type: 'multiple_choice',
        options: ['Daily', 'Several times a week', 'Weekly', 'Monthly', 'Rarely', 'Never']
      },
      {
        id: 'dl11',
        text: 'What daily habit would you most like to develop?',
        type: 'text'
      },
      {
        id: 'dl12',
        text: 'How do you handle transitions between activities?',
        type: 'multiple_choice',
        options: ['Need time to mentally prepare', 'Adjust quickly', 'Prefer gradual transitions', 'Like clear breaks between tasks', 'Transitions are difficult for me']
      },
      {
        id: 'dl13',
        text: 'What\'s your biggest daily life stressor?',
        type: 'multiple_choice',
        options: ['Time management', 'Financial pressures', 'Work demands', 'Family responsibilities', 'Health concerns', 'Social obligations', 'Technology/overwhelm']
      },
      {
        id: 'dl14',
        text: 'How often do you engage in hobbies or personal interests?',
        type: 'multiple_choice',
        options: ['Daily', 'Several times a week', 'Weekly', 'Monthly', 'Rarely', 'I don\'t have time for hobbies']
      },
      {
        id: 'dl15',
        text: 'What would make your daily life feel more balanced?',
        type: 'text'
      }
    ]
  },
  {
    id: 'work_life',
    name: 'Work & Life Balance',
    icon: Home,
    description: 'Share about your work, career, and work-life balance',
    questions: [
      {
        id: 'wl1',
        text: 'What is your current work/life situation?',
        type: 'multiple_choice',
        options: ['Full-time employed', 'Part-time employed', 'Self-employed/freelance', 'Student', 'Unemployed', 'Retired', 'Stay-at-home parent', 'Other']
      },
      {
        id: 'wl2',
        text: 'How satisfied are you with your current work situation?',
        type: 'scale',
        options: ['1 - Very dissatisfied', '2', '3', '4', '5 - Very satisfied']
      },
      {
        id: 'wl3',
        text: 'How would you describe your work-life balance?',
        type: 'multiple_choice',
        options: ['Work dominates my life', 'Work takes too much time', 'Fairly balanced', 'Life gets more time than work', 'I control the balance well']
      },
      {
        id: 'wl4',
        text: 'What stresses you most about work/career?',
        type: 'multiple_choice',
        options: ['Workload/pressure', 'Difficult relationships', 'Lack of purpose/meaning', 'Financial concerns', 'Career uncertainty', 'Work environment', 'Nothing significant']
      },
      {
        id: 'wl5',
        text: 'How many hours do you typically work per week?',
        type: 'multiple_choice',
        options: ['Less than 20', '20-30', '30-40', '40-50', '50-60', '60+', 'Varies greatly']
      },
      {
        id: 'wl6',
        text: 'What motivates you most in your work?',
        type: 'multiple_choice',
        options: ['Financial security', 'Personal fulfillment', 'Helping others', 'Learning and growth', 'Recognition', 'Creative expression', 'Making a difference']
      },
      {
        id: 'wl7',
        text: 'How do you handle work-related stress?',
        type: 'multiple_choice',
        options: ['Take breaks during the day', 'Exercise or physical activity', 'Talk to colleagues/friends', 'Compartmentalize work and home', 'I struggle with work stress', 'Mindfulness/meditation']
      },
      {
        id: 'wl8',
        text: 'What would your ideal work environment look like?',
        type: 'text'
      },
      {
        id: 'wl9',
        text: 'Do you feel valued and appreciated at work?',
        type: 'multiple_choice',
        options: ['Yes, very much', 'Somewhat', 'Not really', 'Not at all', 'Not applicable']
      },
      {
        id: 'wl10',
        text: 'How often do you think about changing careers?',
        type: 'multiple_choice',
        options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Constantly planning a change']
      },
      {
        id: 'wl11',
        text: 'What skills would you like to develop professionally?',
        type: 'text'
      },
      {
        id: 'wl12',
        text: 'How do you prefer to receive feedback at work?',
        type: 'multiple_choice',
        options: ['Regular formal reviews', 'Ongoing informal feedback', 'Written feedback', 'Face-to-face discussions', 'I prefer minimal feedback']
      },
      {
        id: 'wl13',
        text: 'What role does money play in your job satisfaction?',
        type: 'multiple_choice',
        options: ['Primary motivator', 'Important but not everything', 'Somewhat important', 'Not very important', 'I value other things more']
      },
      {
        id: 'wl14',
        text: 'How do you separate work from personal time?',
        type: 'multiple_choice',
        options: ['Clear boundaries - no work at home', 'Some overlap but mostly separate', 'Significant overlap', 'Work bleeds into personal time', 'I work from home so boundaries blur']
      },
      {
        id: 'wl15',
        text: 'What would make you feel more fulfilled in your career?',
        type: 'text'
      }
    ]
  }
];

export default function VoluntaryQuestionDeck() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedCategoryName, setCompletedCategoryName] = useState('');

  useEffect(() => {
    console.log('VoluntaryQuestionDeck component mounted');
    
    const initializeUser = async () => {
      try {
        const currentUserId = await getCurrentUserId();
        console.log('VoluntaryQuestionDeck: Got user ID:', currentUserId);
        setUserId(currentUserId);
        
        // Load existing answers
        if (currentUserId) {
          loadExistingAnswers(currentUserId);
        }
      } catch (error) {
        console.error('VoluntaryQuestionDeck: Error initializing user:', error);
      }
    };
    
    initializeUser();
  }, []);

  const loadExistingAnswers = async (userId: number) => {
    try {
      console.log('VoluntaryQuestionDeck: Loading existing answers for user:', userId);
      setLoading(true);
      const response = await axios.get(`/api/voluntary-questions/${userId}`);
      console.log('VoluntaryQuestionDeck: API response:', response.data);
      const existingAnswers = response.data.answers || [];
      
      const answersMap: Record<string, UserAnswer> = {};
      const answeredSet = new Set<string>();
      
      existingAnswers.forEach((answer: UserAnswer) => {
        answersMap[answer.questionId] = answer;
        answeredSet.add(answer.questionId);
      });
      
      setAnswers(answersMap);
      setAnsweredQuestions(answeredSet);
      console.log('VoluntaryQuestionDeck: Loaded answers:', answersMap);
    } catch (error) {
      console.error('VoluntaryQuestionDeck: Failed to load existing answers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (questionId: string, answer: string | number, categoryId: string) => {
    if (!userId) return;

    const userAnswer: UserAnswer = {
      questionId,
      answer,
      categoryId,
      answeredAt: new Date()
    };

    setAnswers(prev => ({
      ...prev,
      [questionId]: userAnswer
    }));

    setAnsweredQuestions(prev => new Set(Array.from(prev).concat(questionId)));

    // Auto-save answer
    try {
      setSaving(true);
      await axios.post('/api/voluntary-questions', {
        userId,
        questionId,
        answer,
        categoryId
      });
    } catch (error) {
      console.error('Failed to save answer:', error);
    } finally {
      setSaving(false);
    }
  };

  const getProgressForCategory = (categoryId: string) => {
    const category = questionCategories.find(c => c.id === categoryId);
    if (!category) return 0;
    
    const answeredInCategory = category.questions.filter(q => answeredQuestions.has(q.id)).length;
    return (answeredInCategory / category.questions.length) * 100;
  };

  const getTotalProgress = () => {
    const totalQuestions = questionCategories.reduce((sum, cat) => sum + cat.questions.length, 0);
    return (answeredQuestions.size / totalQuestions) * 100;
  };

  const currentCategory = questionCategories.find(c => c.id === activeCategory);
  const currentQuestion = currentCategory?.questions[currentQuestionIndex];

  console.log('VoluntaryQuestionDeck: Rendering with state:', {
    activeCategory,
    loading,
    userId,
    answeredQuestions: answeredQuestions.size,
    totalQuestions: questionCategories.reduce((sum, cat) => sum + cat.questions.length, 0)
  });

  if (loading) {
    return (
      <div className="min-h-screen theme-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="theme-text">Loading your question deck...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!activeCategory) {
    return (
      <div className="w-full h-full theme-background p-2 md:p-4 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-4 md:mb-8">
            <div className="flex items-center justify-center mb-2 md:mb-4">
              <Sparkles className="mr-2 md:mr-3 theme-text" size={24} />
              <h1 className="text-xl md:text-3xl font-bold theme-text font-serif">Question Deck</h1>
            </div>
            <p className="theme-text-secondary text-sm md:text-lg leading-relaxed max-w-2xl mx-auto px-2">
              These optional questions help me understand you better so I can provide more personalized support. 
              <strong className="theme-text">Click any category below to start answering questions!</strong><br/>
              Answer what you want, when you want - there's no pressure!
            </p>
            
            {/* Overall Progress */}
            <div className="mt-3 md:mt-6 max-w-md mx-auto px-2">
              <div className="flex justify-between items-center mb-2">
                <span className="theme-text text-xs md:text-sm">Overall Progress</span>
                <span className="theme-text text-xs md:text-sm">{answeredQuestions.size} questions answered</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 md:h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-2 md:h-3 rounded-full transition-all duration-300"
                  style={{ width: `${getTotalProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 px-2">
            {questionCategories.map((category) => {
              const IconComponent = category.icon;
              const progress = getProgressForCategory(category.id);
              const answeredCount = category.questions.filter(q => answeredQuestions.has(q.id)).length;
              
              return (
                <div
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className="theme-card rounded-xl p-3 md:p-6 border border-[var(--theme-accent)]/30 shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300 group"
                >
                  <div className="flex items-center mb-2 md:mb-4">
                    <IconComponent className="mr-2 md:mr-3 theme-accent" size={20} />
                    <h3 className="text-sm md:text-xl font-semibold theme-text">{category.name}</h3>
                  </div>
                  
                  <p className="theme-text-secondary text-xs md:text-sm leading-relaxed mb-2 md:mb-4">
                    {category.description}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mb-2 md:mb-4">
                    <div className="flex justify-between items-center mb-1 md:mb-2">
                      <span className="theme-text text-xs">Progress</span>
                      <span className="theme-text text-xs">{answeredCount}/{category.questions.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 md:h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-1 md:h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="theme-accent text-xs md:text-sm group-hover:underline font-semibold">
                      {progress === 100 ? 'âœ“ Review Answers' : 'â†’ Click to Start Questions'}
                    </span>
                    <ChevronRight className="theme-accent group-hover:translate-x-1 transition-transform duration-300" size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => setActiveCategory(null)}
            className="flex items-center theme-accent text-sm font-semibold hover:underline"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to Categories
          </button>
          {saving && (
            <div className="ml-auto flex items-center theme-text text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              Saving...
            </div>
          )}
        </div>

        {currentCategory && (
          <div className="theme-card rounded-xl p-6 shadow-lg">
            {/* Category Header */}
            <div className="flex items-center mb-6">
              <currentCategory.icon className="mr-3 theme-accent" size={24} />
              <div>
                <h2 className="text-2xl font-bold theme-text">{currentCategory.name}</h2>
                <p className="theme-text-secondary">{currentCategory.description}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="theme-text text-sm">Question {currentQuestionIndex + 1} of {currentCategory.questions.length}</span>
                <span className="theme-text text-sm">{Math.round(getProgressForCategory(activeCategory))}% complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / currentCategory.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question */}
            {currentQuestion && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold theme-text mb-4">{currentQuestion.text}</h3>
                
                {/* Answer Input */}
                <div className="space-y-3">
                  {currentQuestion.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {currentQuestion.options?.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswer(currentQuestion.id, option, activeCategory)}
                          className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                            answers[currentQuestion.id]?.answer === option
                              ? 'border-blue-500 bg-blue-50 theme-accent'
                              : 'border-gray-200 hover:border-blue-300 theme-text'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'text' && (
                    <textarea
                      className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none theme-text"
                      rows={4}
                      placeholder="Share your thoughts..."
                      value={(answers[currentQuestion.id]?.answer as string) || ''}
                      onChange={(e) => handleAnswer(currentQuestion.id, e.target.value, activeCategory)}
                    />
                  )}

                  {currentQuestion.type === 'scale' && (
                    <div className="space-y-2">
                      {currentQuestion.options?.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswer(currentQuestion.id, index + 1, activeCategory)}
                          className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                            answers[currentQuestion.id]?.answer === (index + 1)
                              ? 'border-blue-500 bg-blue-50 theme-accent'
                              : 'border-gray-200 hover:border-blue-300 theme-text'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'yes_no' && (
                    <div className="flex space-x-4">
                      {['Yes', 'No'].map((option) => (
                        <button
                          key={option}
                          onClick={() => handleAnswer(currentQuestion.id, option, activeCategory)}
                          className={`flex-1 p-3 rounded-lg border transition-all duration-200 ${
                            answers[currentQuestion.id]?.answer === option
                              ? 'border-blue-500 bg-blue-50 theme-accent'
                              : 'border-gray-200 hover:border-blue-300 theme-text'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center px-4 py-2 theme-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={16} className="mr-1" />
                Previous
              </button>

              <div className="flex space-x-2">
                {currentCategory?.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentQuestionIndex
                        ? 'bg-blue-500 scale-125'
                        : answeredQuestions.has(currentCategory?.questions[index]?.id || '')
                        ? 'bg-green-400'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

{currentQuestionIndex === (currentCategory?.questions.length || 0) - 1 ? (
                <button
                  onClick={() => {
                    setCompletedCategoryName(currentCategory?.name || '');
                    setShowCompletionModal(true);
                  }}
                  className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold shadow-lg"
                >
                  âœ“ Complete Category
                  <ChevronRight size={16} className="ml-1" />
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex(Math.min((currentCategory?.questions.length || 0) - 1, currentQuestionIndex + 1))}
                  className="flex items-center px-4 py-2 theme-secondary rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Completion Modal */}
        {showCompletionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">ðŸŽ‰ Category Complete!</h3>
                  <p className="text-gray-600 mb-6">
                    Great job! You've completed all questions in the <strong>{completedCategoryName}</strong> category. 
                    Your answers have been automatically saved and will help me provide better personalized support.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowCompletionModal(false);
                      setActiveCategory(null);
                    }}
                    className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                  >
                    Continue to Question Categories
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowCompletionModal(false);
                      // Stay in the same category to review answers
                    }}
                    className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Review My Answers
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

