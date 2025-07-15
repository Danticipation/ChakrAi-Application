import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Heart, Users, Target, Coffee, Settings, Sparkles, Save, RotateCcw } from 'lucide-react';
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
      <div className="min-h-screen theme-background p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="mr-3 theme-text" size={32} />
              <h1 className="text-3xl font-bold theme-text font-serif">Question Deck</h1>
            </div>
            <p className="theme-text-secondary text-lg leading-relaxed max-w-2xl mx-auto">
              These optional questions help me understand you better so I can provide more personalized support. 
              <strong className="theme-text">Click any category below to start answering questions!</strong><br/>
              Answer what you want, when you want - there's no pressure!
            </p>
            
            {/* Overall Progress */}
            <div className="mt-6 max-w-md mx-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="theme-text text-sm">Overall Progress</span>
                <span className="theme-text text-sm">{answeredQuestions.size} questions answered</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${getTotalProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Sample Questions Preview */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="theme-card rounded-xl p-6 border border-[var(--theme-accent)]/30">
              <h3 className="text-lg font-semibold theme-text mb-4 text-center">💭 Sample Questions You'll Find:</h3>
              <div className="space-y-3 text-sm theme-text-secondary">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionCategories.map((category) => {
              const IconComponent = category.icon;
              const progress = getProgressForCategory(category.id);
              const answeredCount = category.questions.filter(q => answeredQuestions.has(q.id)).length;
              
              return (
                <div
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className="theme-card rounded-xl p-6 border border-[var(--theme-accent)]/30 shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300 group"
                >
                  <div className="flex items-center mb-4">
                    <IconComponent className="mr-3 theme-accent" size={24} />
                    <h3 className="text-xl font-semibold theme-text">{category.name}</h3>
                  </div>
                  
                  <p className="theme-text-secondary text-sm leading-relaxed mb-4">
                    {category.description}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="theme-text text-xs">Progress</span>
                      <span className="theme-text text-xs">{answeredCount}/{category.questions.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="theme-accent text-sm group-hover:underline font-semibold">
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