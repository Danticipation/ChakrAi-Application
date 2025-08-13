import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Brain, Heart, MessageCircle, Target } from 'lucide-react';
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
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!quizQuestionsArray.length) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-gray-600">Unable to load personality assessment questions.</p>
        {onSkip && (
          <button onClick={onSkip} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Continue Without Assessment
          </button>
        )}
      </div>
    );
  }

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [quizQuestionsArray[currentQuestion].id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestionsArray.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
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

      const response = await axios.post('/api/personality-quiz/complete', {
        userId: localStorage.getItem('userId') || 'anonymous',
        answers: formattedAnswers
      });

      onComplete(response.data.profile);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    }
    setIsSubmitting(false);
  };

  const currentQ = quizQuestionsArray[currentQuestion];
  const selectedAnswer = answers[currentQ?.id];
  const progress = ((currentQuestion + 1) / quizQuestionsArray.length) * 100;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Personality Assessment</h2>
          <span className="text-sm text-gray-500">
            {currentQuestion + 1} of {quizQuestionsArray.length}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            {currentQ?.category === 'communication' && <MessageCircle className="w-6 h-6 text-blue-500 mr-3" />}
            {currentQ?.category === 'emotional' && <Heart className="w-6 h-6 text-red-500 mr-3" />}
            {currentQ?.category === 'goals' && <Target className="w-6 h-6 text-green-500 mr-3" />}
            {currentQ?.category === 'support' && <Brain className="w-6 h-6 text-purple-500 mr-3" />}
            <span className="text-sm font-medium text-gray-500 capitalize">
              {currentQ?.category}
            </span>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            {currentQ?.question}
          </h3>
        </div>

        <div className="space-y-3 mb-8">
          {currentQ?.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedAnswer === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                  selectedAnswer === option.value
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedAnswer === option.value && (
                    <div className="w-2 h-2 rounded-full bg-white m-1" />
                  )}
                </div>
                <span>{option.label}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              currentQuestion === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!selectedAnswer || isSubmitting}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              !selectedAnswer || isSubmitting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              'Processing...'
            ) : currentQuestion === quizQuestionsArray.length - 1 ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>

        {onSkip && (
          <div className="text-center mt-6">
            <button
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Skip assessment and continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalityQuiz;