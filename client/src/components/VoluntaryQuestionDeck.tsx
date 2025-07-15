import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Heart, Users, Target, Coffee, Settings, Sparkles, Save, RotateCcw, Brain, Activity, Clock, Home } from 'lucide-react';
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
        text: "What's something you'd like to change about yourself?",
        type: 'text'
      },
      {
        id: 'p9',
        text: 'How do you handle criticism?',
        type: 'multiple_choice',
        options: ['Take it to heart', 'Consider it objectively', 'Get defensive initially', 'Use it for growth', 'Depends on who it comes from']
      },
      {
        id: 'p10',
        text: 'What motivates you most in life?',
        type: 'multiple_choice',
        options: ['Personal achievement', 'Helping others', 'Learning and growth', 'Security and stability', 'Adventure and experiences']
      },
      {
        id: 'p11',
        text: 'How do you typically make important decisions?',
        type: 'multiple_choice',
        options: ['Analyze pros and cons logically', 'Go with my gut feeling', 'Seek advice from others', 'Sleep on it', 'Research extensively first']
      },
      {
        id: 'p12',
        text: 'What does success mean to you personally?',
        type: 'text'
      },
      {
        id: 'p13',
        text: 'How do you prefer to spend your free time?',
        type: 'multiple_choice',
        options: ['Relaxing at home', 'Socializing with friends', 'Pursuing hobbies', 'Learning something new', 'Being active/outdoors']
      },
      {
        id: 'p14',
        text: 'What role does spirituality or personal beliefs play in your life?',
        type: 'multiple_choice',
        options: ['Very important - guides my decisions', 'Somewhat important', 'Not very important', 'Still exploring/questioning', 'Prefer not to discuss']
      },
      {
        id: 'p15',
        text: 'How do you handle uncertainty or unexpected changes?',
        type: 'multiple_choice',
        options: ['Adapt quickly', 'Need time to process', 'Get anxious', 'See it as an opportunity', 'Prefer to have backup plans']
      }
    ]
  },
  {
    id: 'emotional',
    name: 'Emotional Awareness & Coping',
    icon: Heart,
    description: 'Share how you process emotions and what helps you feel better',
    questions: [
      {
        id: 'e1',
        text: 'How do you usually recognize when you\'re not doing well emotionally?',
        type: 'multiple_choice',
        options: ['Physical symptoms (headaches, tiredness)', 'Mood changes', 'Behavior changes', 'Others point it out', 'I struggle to notice']
      },
      {
        id: 'e2',
        text: "What's one thing that almost always helps when you're upset?",
        type: 'text'
      },
      {
        id: 'e3',
        text: 'Do you like when people check in with you, or do you prefer space?',
        type: 'multiple_choice',
        options: ['Love check-ins', 'Prefer space initially', 'Depends on the situation', 'Mixed - sometimes yes, sometimes no']
      },
      {
        id: 'e4',
        text: 'Do you process emotions more by thinking, talking, or feeling them out?',
        type: 'multiple_choice',
        options: ['Thinking through them analytically', 'Talking them out with others', 'Just feeling and experiencing them', 'Writing or creative expression']
      },
      {
        id: 'e5',
        text: "What's your relationship with change—exciting, scary, or both?",
        type: 'multiple_choice',
        options: ['Mostly exciting', 'Mostly scary', 'Both exciting and scary', 'Neutral - depends on the change']
      },
      {
        id: 'e6',
        text: 'When you feel anxious, what physical sensations do you notice?',
        type: 'multiple_choice',
        options: ['Rapid heartbeat', 'Tight chest or breathing changes', 'Stomach issues', 'Muscle tension', 'Sweating or trembling', 'None that I notice']
      },
      {
        id: 'e7',
        text: 'How do you typically express anger or frustration?',
        type: 'multiple_choice',
        options: ['Talk it out immediately', 'Need time to cool down first', 'Write about it', 'Physical activity', 'Tend to bottle it up', 'Depends on the situation']
      },
      {
        id: 'e8',
        text: 'What helps you feel most grounded during difficult times?',
        type: 'text'
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
        text: 'How comfortable are you with crying or showing vulnerability?',
        type: 'scale',
        options: ['1 - Very uncomfortable', '2', '3', '4', '5 - Very comfortable']
      },
      {
        id: 'e12',
        text: 'What triggers your stress most often?',
        type: 'multiple_choice',
        options: ['Work/school pressure', 'Relationship conflicts', 'Financial concerns', 'Health issues', 'Social situations', 'Uncertainty about the future']
      },
      {
        id: 'e13',
        text: 'How do you know when you need to take a mental health break?',
        type: 'text'
      },
      {
        id: 'e14',
        text: 'What helps you bounce back from setbacks?',
        type: 'multiple_choice',
        options: ['Self-compassion and patience', 'Support from others', 'Focusing on lessons learned', 'Getting back into routine', 'Taking action on solutions']
      },
      {
        id: 'e15',
        text: 'How do you handle overwhelming emotions?',
        type: 'multiple_choice',
        options: ['Take deep breaths/meditation', 'Call someone I trust', 'Write in a journal', 'Go for a walk', 'Use grounding techniques', 'Wait for them to pass']
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
        text: "What's your love language for receiving support?",
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
        text: "What's one goal (big or small) you're working toward right now?",
        type: 'text'
      },
      {
        id: 'g2',
        text: "What's a value or belief that's very important to you?",
        type: 'text'
      },
      {
        id: 'g3',
        text: "If nothing was holding you back, what's a life change you'd make today?",
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
      }
    ]
  },
  {
    id: 'fun',
    name: 'Personal Preferences',
    icon: Coffee,
    description: 'Fun questions to help me understand your style and preferences',
    questions: [
      {
        id: 'f1',
        text: 'Coffee, tea, energy drinks—or none?',
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
      }
    ]
  },
  {
    id: 'mental_health',
    name: 'Mental Health & History',
    icon: Brain,
    description: 'Help me understand your mental health background and current state',
    questions: [
      {
        id: 'mh1',
        text: 'Have you ever worked with a therapist, counselor, or mental health professional?',
        type: 'multiple_choice',
        options: ['Yes, currently', 'Yes, in the past', 'Never, but interested', 'Never, not interested', 'Prefer not to share']
      },
      {
        id: 'mh2',
        text: 'How would you rate your current mental health?',
        type: 'scale',
        options: ['1 - Struggling significantly', '2', '3', '4', '5 - Doing very well']
      },
      {
        id: 'mh3',
        text: 'What mental health challenges have you experienced? (Select all that apply)',
        type: 'multiple_choice',
        options: ['Anxiety', 'Depression', 'PTSD/Trauma', 'ADHD', 'Eating disorders', 'Substance use', 'Bipolar', 'OCD', 'None', 'Prefer not to share']
      },
      {
        id: 'mh4',
        text: 'Are you currently taking any medication for mental health?',
        type: 'multiple_choice',
        options: ['Yes, and it helps', 'Yes, but not sure if it helps', 'No, but considering it', 'No, prefer other approaches', 'Prefer not to share']
      },
      {
        id: 'mh5',
        text: 'What has been most helpful for your mental wellness so far?',
        type: 'text'
      },
      {
        id: 'mh6',
        text: 'How often do you experience anxiety or worry?',
        type: 'multiple_choice',
        options: ['Daily', 'Several times a week', 'Occasionally', 'Rarely', 'Never']
      },
      {
        id: 'mh7',
        text: 'How often do you feel sad or down?',
        type: 'multiple_choice',
        options: ['Daily', 'Several times a week', 'Occasionally', 'Rarely', 'Never']
      },
      {
        id: 'mh8',
        text: 'Do you have thoughts of self-harm or suicide?',
        type: 'multiple_choice',
        options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Prefer not to answer']
      },
      {
        id: 'mh9',
        text: 'What triggers your mental health struggles most?',
        type: 'multiple_choice',
        options: ['Stress', 'Relationship issues', 'Work/school', 'Health concerns', 'Financial pressure', 'Trauma memories', 'Seasonal changes', 'Unknown triggers']
      },
      {
        id: 'mh10',
        text: 'How do you typically cope with mental health challenges?',
        type: 'multiple_choice',
        options: ['Talk to someone', 'Self-care activities', 'Exercise', 'Medication', 'Avoid/isolate', 'Therapy techniques', 'Creative outlets']
      },
      {
        id: 'mh11',
        text: 'What would improve your mental health most right now?',
        type: 'text'
      },
      {
        id: 'mh12',
        text: 'How comfortable are you discussing mental health topics?',
        type: 'scale',
        options: ['1 - Very uncomfortable', '2', '3', '4', '5 - Very comfortable']
      },
      {
        id: 'mh13',
        text: 'Do you have family history of mental health conditions?',
        type: 'multiple_choice',
        options: ['Yes, and it affects me', 'Yes, but minimal impact', 'No family history', 'Unknown', 'Prefer not to share']
      },
      {
        id: 'mh14',
        text: 'What mental health stigma have you experienced?',
        type: 'multiple_choice',
        options: ['From family', 'From friends', 'At work/school', 'Self-stigma', 'Healthcare settings', 'None', 'Prefer not to share']
      },
      {
        id: 'mh15',
        text: 'How important is mental health in your daily life priorities?',
        type: 'scale',
        options: ['1 - Not a priority', '2', '3', '4', '5 - Top priority']
      }
    ]
  },
  {
    id: 'physical_health',
    name: 'Physical Health & Wellness',
    icon: Activity,
    description: 'Share about your physical health and wellness habits',
    questions: [
      {
        id: 'ph1',
        text: 'How would you rate your current physical health?',
        type: 'scale',
        options: ['1 - Poor', '2', '3', '4', '5 - Excellent']
      },
      {
        id: 'ph2',
        text: 'How often do you exercise or do physical activity?',
        type: 'multiple_choice',
        options: ['Daily', '3-5 times per week', '1-2 times per week', 'Occasionally', 'Rarely or never']
      },
      {
        id: 'ph3',
        text: 'What type of physical activity do you enjoy most?',
        type: 'multiple_choice',
        options: ['Walking/hiking', 'Running', 'Gym/weights', 'Yoga/stretching', 'Sports', 'Dancing', 'Swimming', 'None really appeal to me']
      },
      {
        id: 'ph4',
        text: 'How many hours of sleep do you typically get?',
        type: 'multiple_choice',
        options: ['Less than 5 hours', '5-6 hours', '6-7 hours', '7-8 hours', '8+ hours']
      },
      {
        id: 'ph5',
        text: 'How would you describe your sleep quality?',
        type: 'multiple_choice',
        options: ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent']
      },
      {
        id: 'ph6',
        text: 'Do you have any chronic health conditions?',
        type: 'multiple_choice',
        options: ['Yes, affects daily life significantly', 'Yes, but manageable', 'Minor conditions only', 'No chronic conditions', 'Prefer not to share']
      },
      {
        id: 'ph7',
        text: 'How do you feel about your current diet/nutrition?',
        type: 'multiple_choice',
        options: ['Very healthy', 'Mostly healthy', 'Mixed - some good, some bad', 'Not very healthy', 'Poor']
      },
      {
        id: 'ph8',
        text: 'What affects your energy levels most?',
        type: 'multiple_choice',
        options: ['Sleep quality', 'Diet/nutrition', 'Exercise', 'Stress levels', 'Health conditions', 'Work schedule', 'Mood']
      },
      {
        id: 'ph9',
        text: 'Do you use substances to cope with stress? (alcohol, drugs, etc.)',
        type: 'multiple_choice',
        options: ['Never', 'Rarely', 'Occasionally', 'Regularly', 'Daily', 'Prefer not to share']
      },
      {
        id: 'ph10',
        text: 'How much water do you drink daily?',
        type: 'multiple_choice',
        options: ['Less than 2 glasses', '2-4 glasses', '4-6 glasses', '6-8 glasses', '8+ glasses']
      },
      {
        id: 'ph11',
        text: 'What physical symptoms do you notice when stressed?',
        type: 'text'
      },
      {
        id: 'ph12',
        text: 'Do you take any vitamins or supplements?',
        type: 'multiple_choice',
        options: ['Yes, regularly', 'Yes, occasionally', 'No, but interested', 'No, not interested', 'Only when sick']
      },
      {
        id: 'ph13',
        text: 'How often do you go to medical checkups?',
        type: 'multiple_choice',
        options: ['Annually as recommended', 'Every few years', 'Only when sick', 'Rarely', 'Never']
      },
      {
        id: 'ph14',
        text: 'What health goal would you most like to achieve?',
        type: 'text'
      },
      {
        id: 'ph15',
        text: 'How does your physical health affect your mental health?',
        type: 'multiple_choice',
        options: ['Significantly - they\'re very connected', 'Somewhat connected', 'Minimally connected', 'Not connected', 'I\'m not sure']
      }
    ]
  },
  {
    id: 'daily_life',
    name: 'Daily Life & Routines',
    icon: Clock,
    description: 'Tell me about your daily routines and lifestyle patterns',
    questions: [
      {
        id: 'dl1',
        text: 'What does a typical morning routine look like for you?',
        type: 'text'
      },
      {
        id: 'dl2',
        text: 'How structured vs. flexible do you prefer your days?',
        type: 'multiple_choice',
        options: ['Highly structured with set routines', 'Somewhat structured with flexibility', 'Balanced structure and spontaneity', 'Mostly flexible and spontaneous', 'No structure - go with the flow']
      },
      {
        id: 'dl3',
        text: 'What time do you typically wake up?',
        type: 'multiple_choice',
        options: ['Before 6 AM', '6-7 AM', '7-8 AM', '8-9 AM', '9-10 AM', 'After 10 AM', 'Varies greatly']
      },
      {
        id: 'dl4',
        text: 'What time do you typically go to bed?',
        type: 'multiple_choice',
        options: ['Before 9 PM', '9-10 PM', '10-11 PM', '11 PM-12 AM', '12-1 AM', 'After 1 AM', 'Varies greatly']
      },
      {
        id: 'dl5',
        text: 'How do you typically spend your evenings?',
        type: 'multiple_choice',
        options: ['Relaxing at home', 'Social activities', 'Hobbies/personal projects', 'Exercise', 'Work/studying', 'Screen time', 'Varies daily']
      },
      {
        id: 'dl6',
        text: 'What part of your day do you feel most productive?',
        type: 'multiple_choice',
        options: ['Early morning', 'Late morning', 'Afternoon', 'Evening', 'Late night', 'Varies']
      },
      {
        id: 'dl7',
        text: 'How much screen time do you have daily (excluding work)?',
        type: 'multiple_choice',
        options: ['Less than 1 hour', '1-2 hours', '2-4 hours', '4-6 hours', '6+ hours']
      },
      {
        id: 'dl8',
        text: 'What daily habit would you most like to change?',
        type: 'text'
      },
      {
        id: 'dl9',
        text: 'What daily habit are you most proud of?',
        type: 'text'
      },
      {
        id: 'dl10',
        text: 'How do you typically handle household chores?',
        type: 'multiple_choice',
        options: ['Do them as needed', 'Set schedule/routine', 'Batch them on weekends', 'Minimal cleaning', 'Share with others', 'Procrastinate on them']
      },
      {
        id: 'dl11',
        text: 'What makes a day feel successful to you?',
        type: 'text'
      },
      {
        id: 'dl12',
        text: 'How do you typically spend your weekends?',
        type: 'multiple_choice',
        options: ['Relaxing and recharging', 'Social activities', 'Household tasks', 'Hobbies/personal projects', 'Work or catching up', 'Adventure/exploration']
      },
      {
        id: 'dl13',
        text: 'What daily routine grounds you most?',
        type: 'multiple_choice',
        options: ['Morning routine', 'Exercise', 'Meals', 'Evening wind-down', 'Meditation/reflection', 'None - I prefer flexibility']
      },
      {
        id: 'dl14',
        text: 'How do you handle unexpected changes to your plans?',
        type: 'multiple_choice',
        options: ['Adapt easily', 'Need some time to adjust', 'Get stressed/anxious', 'Try to stick to original plan', 'See it as an opportunity']
      },
      {
        id: 'dl15',
        text: 'What would improve your daily life quality most?',
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
        text: 'Do you work from home, office, or mixed?',
        type: 'multiple_choice',
        options: ['Fully remote/home', 'Mostly home', 'Hybrid/mixed', 'Mostly office', 'Fully in office', 'Multiple locations', 'Not applicable']
      },
      {
        id: 'wl7',
        text: 'What motivates you most in your work/career?',
        type: 'multiple_choice',
        options: ['Purpose and meaning', 'Financial security', 'Growth and learning', 'Recognition and achievement', 'Helping others', 'Creative expression', 'Flexibility and freedom']
      },
      {
        id: 'wl8',
        text: 'How do you handle work stress?',
        type: 'multiple_choice',
        options: ['Talk to colleagues', 'Take breaks during day', 'Exercise after work', 'Disconnect completely', 'Work through it', 'Seek support from manager']
      },
      {
        id: 'wl9',
        text: 'What career goal are you working toward?',
        type: 'text'
      },
      {
        id: 'wl10',
        text: 'How supportive is your work environment for mental health?',
        type: 'multiple_choice',
        options: ['Very supportive', 'Somewhat supportive', 'Neutral', 'Not very supportive', 'Unsupportive', 'Not applicable']
      },
      {
        id: 'wl11',
        text: 'Do you feel financially secure?',
        type: 'multiple_choice',
        options: ['Very secure', 'Mostly secure', 'Somewhat secure', 'Insecure', 'Very insecure']
      },
      {
        id: 'wl12',
        text: 'What would improve your work-life balance most?',
        type: 'text'
      },
      {
        id: 'wl13',
        text: 'How do you separate work time from personal time?',
        type: 'multiple_choice',
        options: ['Clear boundaries', 'Somewhat clear', 'Blurred boundaries', 'Very blurred', 'No separation', 'Not applicable']
      },
      {
        id: 'wl14',
        text: 'What skills would you most like to develop?',
        type: 'text'
      },
      {
        id: 'wl15',
        text: 'How does your work impact your mental health?',
        type: 'multiple_choice',
        options: ['Very positive impact', 'Somewhat positive', 'Neutral', 'Somewhat negative', 'Very negative impact']
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

    setAnsweredQuestions(prev => new Set([...prev, questionId]));

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

          {/* Sample Questions Preview */}
          <div className="max-w-2xl mx-auto mb-4 md:mb-8 px-2">
            <div className="theme-card rounded-xl p-3 md:p-6 border border-[var(--theme-accent)]/30">
              <h3 className="text-sm md:text-lg font-semibold theme-text mb-2 md:mb-4 text-center">💭 Sample Questions You'll Find:</h3>
              <div className="space-y-2 md:space-y-3 text-xs md:text-sm theme-text-secondary">
                <div className="flex items-start">
                  <span className="mr-2">❤️</span>
                  <span>"If your friends had to describe you in 3 words, what would they say?"</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">🧠</span>
                  <span>"When you're stressed, what helps you feel better?"</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">🎯</span>
                  <span>"What's one thing you'd like to change about yourself?"</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2">☕</span>
                  <span>"Are you more of a morning person or night owl?"</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 px-2">
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
                      {progress === 100 ? '✓ Review Answers' : '→ Click to Start Questions'}
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
      <div className="max-w-2xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => {
              setActiveCategory(null);
              setCurrentQuestionIndex(0);
            }}
            className="flex items-center theme-accent hover:theme-primary transition-colors"
          >
            <ChevronLeft className="mr-2" size={20} />
            Back to Categories
          </button>
          
          {saving && (
            <div className="flex items-center theme-text-secondary text-sm">
              <Save className="mr-2 animate-pulse" size={16} />
              Saving...
            </div>
          )}
        </div>

        {currentCategory && currentQuestion && (
          <div className="theme-card rounded-xl p-8 border border-[var(--theme-accent)]/30 shadow-lg">
            {/* Category Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <currentCategory.icon className="mr-3 theme-accent" size={28} />
                <h2 className="text-2xl font-bold theme-text font-serif">{currentCategory.name}</h2>
              </div>
              
              {/* Question Progress */}
              <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center mb-2">
                  <span className="theme-text text-sm">Question {currentQuestionIndex + 1} of {currentCategory.questions.length}</span>
                  <span className="theme-text text-sm">{Math.round(getProgressForCategory(currentCategory.id))}% complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / currentCategory.questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="mb-8">
              <h3 className="text-xl theme-text mb-6 leading-relaxed font-medium">
                {currentQuestion.text}
              </h3>

              {/* Answer Options */}
              <div className="space-y-4">
                {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = answers[currentQuestion.id]?.answer === option;
                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswer(currentQuestion.id, option, currentCategory.id)}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                            isSelected
                              ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10 theme-text'
                              : 'border-gray-200 hover:border-[var(--theme-accent)]/50 theme-text hover:bg-[var(--theme-surface)]'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === 'text' && (
                  <textarea
                    className="w-full p-4 rounded-lg border-2 border-gray-200 focus:border-[var(--theme-accent)] theme-background theme-text resize-none"
                    rows={4}
                    placeholder="Type your answer here..."
                    value={answers[currentQuestion.id]?.answer as string || ''}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value, currentCategory.id)}
                  />
                )}

                {currentQuestion.type === 'yes_no' && (
                  <div className="flex space-x-4">
                    {['Yes', 'No'].map((option) => {
                      const isSelected = answers[currentQuestion.id]?.answer === option;
                      return (
                        <button
                          key={option}
                          onClick={() => handleAnswer(currentQuestion.id, option, currentCategory.id)}
                          className={`flex-1 p-4 rounded-lg border-2 transition-all duration-200 ${
                            isSelected
                              ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10 theme-text'
                              : 'border-gray-200 hover:border-[var(--theme-accent)]/50 theme-text hover:bg-[var(--theme-surface)]'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center px-4 py-2 theme-accent hover:theme-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="mr-2" size={16} />
                Previous
              </button>

              <button
                onClick={() => {
                  if (currentQuestionIndex < currentCategory.questions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                  } else {
                    setActiveCategory(null);
                    setCurrentQuestionIndex(0);
                  }
                }}
                className="flex items-center px-6 py-2 bg-[var(--theme-accent)] text-white rounded-lg hover:bg-[var(--theme-primary)] transition-colors"
              >
                {currentQuestionIndex < currentCategory.questions.length - 1 ? 'Next' : 'Finish Category'}
                <ChevronRight className="ml-2" size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}