import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Brain, Heart, MessageCircle, Target, Sparkles, Star, Lightbulb, Award, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface PersonalityQuizProps {
  onComplete: (profile: UserProfile) => void;
  onSkip?: () => void;
}

interface QuizQuestion {
  id: number;
  question: string;
  category: 'communication' | 'emotional' | 'goals' | 'support';
  options: {
    value: string;
    label: string;
    weight: number;
  }[];
}

interface UserProfile {
  communicationStyle: 'direct' | 'gentle' | 'encouraging' | 'analytical';
  emotionalSupport: 'high' | 'moderate' | 'minimal';
  preferredTone: 'casual' | 'professional' | 'warm' | 'straightforward';
  primaryGoals: string[];
  stressResponses: string[];
  motivationFactors: string[];
  sessionPreference: 'short' | 'medium' | 'long';
  personalityTraits: string[];
}

const PersonalityQuiz: React.FC<PersonalityQuizProps> = ({ onComplete, onSkip }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Fetch questions from server to ensure clinical validity
  const { data: quizQuestions, isLoading: questionsLoading } = useQuery({
    queryKey: ['personality-quiz-questions'],
    queryFn: async () => {
      const response = await axios.get('/api/personality-quiz/questions');
      return response.data;
    },
  });

  const quizQuestionsArray: QuizQuestion[] = quizQuestions || [];

  if (questionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Preparing Your Assessment</h2>
              <div className="space-y-4">
                <div className="h-4 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse w-3/4"></div>
                </div>
                <p className="text-white/70">Loading personalized questions...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quizQuestionsArray.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Assessment Unavailable</h2>
            <p className="text-white/70 mb-6">Unable to load personality assessment questions.</p>
            {onSkip && (
              <button 
                onClick={onSkip} 
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Continue to Chakrai
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const getCategoryInfo = (category: string) => {
    const categories = {
      communication: { 
        icon: MessageCircle, 
        color: 'from-blue-500 to-cyan-500', 
        bgColor: 'bg-blue-500/10',
        title: 'Communication Style',
        description: 'How you prefer to express and receive information'
      },
      emotional: { 
        icon: Heart, 
        color: 'from-pink-500 to-rose-500', 
        bgColor: 'bg-pink-500/10',
        title: 'Emotional Support',
        description: 'Your emotional processing and support preferences'
      },
      goals: { 
        icon: Target, 
        color: 'from-green-500 to-emerald-500', 
        bgColor: 'bg-green-500/10',
        title: 'Goals & Motivation',
        description: 'What drives and motivates your wellness journey'
      },
      support: { 
        icon: Brain, 
        color: 'from-purple-500 to-indigo-500', 
        bgColor: 'bg-purple-500/10',
        title: 'Support Preferences',
        description: 'How you prefer to receive guidance and feedback'
      }
    };
    return categories[category as keyof typeof categories] || categories.communication;
  };

  const handleAnswer = (value: string) => {
    setSelectedOption(value);
    const currentQ = quizQuestionsArray[currentQuestion];
    if (currentQ) {
      setAnswers(prev => ({
        ...prev,
        [currentQ.id]: value
      }));
    }
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestionsArray.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      const nextQ = quizQuestionsArray[currentQuestion + 1];
      setSelectedOption(nextQ ? (answers[nextQ.id] || null) : null);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      const prevQ = quizQuestionsArray[currentQuestion - 1];
      setSelectedOption(prevQ ? (answers[prevQ.id] || null) : null);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Convert answers to expected format
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedValue]) => ({
        questionId: parseInt(questionId),
        selectedValue
      }));

      const userId = localStorage.getItem('userId');
      const response = await axios.post('/api/personality-quiz/complete', {
        userId: userId || 'anonymous',
        answers: formattedAnswers
      });

      onComplete(response.data.profile);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    }
    setIsSubmitting(false);
  };

  const currentQ = quizQuestionsArray[currentQuestion];
  const selectedAnswer = (currentQ ? answers[currentQ.id] : null) || selectedOption;
  const progress = ((currentQuestion + 1) / quizQuestionsArray.length) * 100;
  const categoryInfo = getCategoryInfo(currentQ?.category || 'communication');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Personality Assessment</h1>
          <p className="text-blue-200 text-lg">Help us understand how to best support your wellness journey</p>
        </div>

        {/* Progress Section */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-semibold">Question {currentQuestion + 1} of {quizQuestionsArray.length}</span>
              </div>
              <span className="text-blue-200 text-sm font-medium">
                {Math.round(progress)}% Complete
              </span>
            </div>
            
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 overflow-hidden mb-8">
          {/* Category Header */}
          <div className={`${categoryInfo.bgColor} p-6 border-b border-white/10`}>
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${categoryInfo.color}`}>
                <categoryInfo.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{categoryInfo.title}</h3>
                <p className="text-white/70 text-sm">{categoryInfo.description}</p>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-white mb-8 leading-relaxed">
              {currentQ?.question}
            </h2>

            {/* Options */}
            <div className="space-y-4 mb-8">
              {currentQ?.options.map((option, index) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-102 ${
                    selectedAnswer === option.value
                      ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                      : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${
                      selectedAnswer === option.value
                        ? 'border-blue-400 bg-blue-500'
                        : 'border-white/40'
                    }`}>
                      {selectedAnswer === option.value && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-lg">{option.label}</span>
                        {selectedAnswer === option.value && (
                          <Sparkles className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
                  currentQuestion === 0
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </button>

              <div className="text-center">
                <div className="text-white/60 text-sm">
                  {currentQuestion + 1} / {quizQuestionsArray.length}
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={!selectedAnswer || isSubmitting}
                className={`flex items-center px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                  !selectedAnswer || isSubmitting
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg shadow-blue-500/25'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : currentQuestion === quizQuestionsArray.length - 1 ? (
                  <>
                    <Award className="w-5 h-5 mr-2" />
                    Complete Assessment
                  </>
                ) : (
                  <>
                    Next Question
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Skip Option */}
        {onSkip && (
          <div className="text-center">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <span className="text-white/80 text-sm">Want to explore Chakrai first?</span>
              </div>
              <button
                onClick={onSkip}
                className="text-blue-300 hover:text-blue-200 text-sm font-medium hover:underline transition-colors"
              >
                Skip assessment and continue to your wellness companion
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalityQuiz;
