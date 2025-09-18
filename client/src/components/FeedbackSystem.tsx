import React, { useState, useCallback, useEffect } from 'react';
import { MessageSquare, Bug, Lightbulb, Send, CheckCircle, AlertCircle, Star, Loader2, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from "axios";
import type { AxiosResponse } from "axios";
import { getCurrentUserId } from '../utils/unifiedUserSession';

// Types and Interfaces
interface FeedbackItem {
  id: number;
  userId: number;
  type: 'bug' | 'feature' | 'general';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'submitted' | 'reviewed' | 'in_progress' | 'resolved';
  rating?: number;
  createdAt: string;
}

interface FeedbackSubmission {
  userId: number;
  type: 'bug' | 'feature' | 'general';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  rating?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  feedback?: T[];
}

type FeedbackFormErrors = {
  title?: string;
  description?: string;
  general?: string;
};

// Utility Components
const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-[var(--theme-accent)] mb-4" />
    <p className="theme-text-secondary">{message || 'Loading...'}</p>
  </div>
);

const ErrorMessage: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
        <div>
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Retry
        </button>
      )}
    </div>
  </div>
);

const SuccessAlert: React.FC<{ message: string }> = ({ message }) => (
  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
    <CheckCircle className="text-green-600 mr-3 flex-shrink-0" size={20} />
    <span className="text-green-800">{message}</span>
  </div>
);

const EmptyState: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="text-center py-12">
    <div className="mb-4">{icon}</div>
    <h3 className="text-lg font-medium theme-text mb-2">{title}</h3>
    <p className="theme-text-secondary mb-4">{description}</p>
    {action}
  </div>
);

// Color mapping objects for consistent styling
const typeColors = {
  bug: 'text-red-500',
  feature: 'text-yellow-500',
  general: 'text-blue-500'
} as const;

const statusColors = {
  submitted: 'text-gray-500',
  reviewed: 'text-blue-400',
  in_progress: 'text-yellow-400',
  resolved: 'text-green-400'
} as const;

const priorityColors = {
  high: 'text-red-400 bg-red-400/20',
  medium: 'text-yellow-400 bg-yellow-400/20',
  low: 'text-green-400 bg-green-400/20'
} as const;

const feedbackTypes = [
  { value: 'general' as const, label: 'General Feedback', icon: MessageSquare, colorClass: typeColors.general },
  { value: 'bug' as const, label: 'Bug Report', icon: Bug, colorClass: typeColors.bug },
  { value: 'feature' as const, label: 'Feature Request', icon: Lightbulb, colorClass: typeColors.feature }
];

// Main Component
const FeedbackSystem: React.FC = () => {
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [rating, setRating] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [formErrors, setFormErrors] = useState<FeedbackFormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const [userId, setUserId] = useState<number | null>(null);

  // Initialize userId
  useEffect(() => {
    const initUserId = async () => {
      const id = await getCurrentUserId();
      setUserId(id);
    };
    initUserId();
  }, []);
  const queryClient = useQueryClient();

  // Validation functions
  const validateForm = useCallback((): FeedbackFormErrors => {
    const errors: FeedbackFormErrors = {};
    
    if (!title.trim()) {
      errors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }
    
    if (!description.trim()) {
      errors.description = 'Description is required';
    } else if (description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }
    
    return errors;
  }, [title, description]);

  // API functions with proper error handling
  const fetchFeedbackHistory = useCallback(async (): Promise<FeedbackItem[]> => {
    if (!userId) throw new Error('User authentication required');
    
    const response: AxiosResponse<ApiResponse<FeedbackItem>> = await axios.get(`/api/feedback/${userId}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to load feedback history');
    }
    
    return response.data.feedback || [];
  }, [userId]);

  const submitFeedback = useCallback(async (feedbackData: FeedbackSubmission): Promise<void> => {
    const response: AxiosResponse<ApiResponse<void>> = await axios.post('/api/feedback', feedbackData);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to submit feedback');
    }
  }, []);

  // React Query hooks
  const {
    data: userFeedback = [],
    isLoading: feedbackLoading,
    error: feedbackError,
    refetch: refetchFeedback
  } = useQuery({
    queryKey: ['/api/feedback', userId],
    queryFn: fetchFeedbackHistory,
    enabled: !!userId && activeTab === 'history',
    retry: 2,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => {
      // Reset form
      setTitle('');
      setDescription('');
      setRating(0);
      setPriority('medium');
      setFormErrors({});
      setShowSuccess(true);
      
      // Invalidate and refetch feedback history
      queryClient.invalidateQueries({ queryKey: ['/api/feedback', userId] });
      
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    },
    onError: (error: Error) => {
      setFormErrors({ general: error.message });
    }
  });

  // Event handlers
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    if (!userId) {
      setFormErrors({ general: 'User authentication required' });
      return;
    }

    const feedbackData: FeedbackSubmission = {
      userId,
      type: feedbackType,
      title: title.trim(),
      description: description.trim(),
      priority,
      ...(feedbackType === 'general' && rating > 0 && { rating })
    };

    submitFeedbackMutation.mutate(feedbackData);
  }, [feedbackType, title, description, priority, rating, userId, validateForm, submitFeedbackMutation]);

  const handleTabChange = useCallback((tab: 'submit' | 'history') => {
    setActiveTab(tab);
    setFormErrors({});
  }, []);

  // Helper functions
  const getTypeIcon = useCallback((type: string) => {
    const typeConfig = feedbackTypes.find(t => t.value === type);
    if (!typeConfig) return <MessageSquare className={typeColors.general} size={20} />;
    
    const IconComponent = typeConfig.icon;
    return <IconComponent className={typeConfig.colorClass} size={20} />;
  }, []);

  const getStatusColor = useCallback((status: string) => {
    return statusColors[status as keyof typeof statusColors] || statusColors.submitted;
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    return priorityColors[priority as keyof typeof priorityColors] || 'theme-text-secondary theme-surface';
  }, []);

  // User validation
  if (!userId) {
    return (
      <div className="min-h-screen theme-background p-4">
        <div className="max-w-4xl mx-auto">
          <ErrorMessage 
            error="Please log in to access the feedback system" 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MessageSquare className="mr-3 theme-text" size={32} />
            <h1 className="text-3xl font-bold theme-text font-serif">Feedback & Suggestions</h1>
          </div>
          <p className="theme-text-secondary text-lg leading-relaxed max-w-2xl mx-auto">
            Help us improve Chakrai by sharing your thoughts, reporting bugs, or suggesting new features. 
            Your feedback is invaluable in making this a better wellness companion for everyone.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex theme-surface rounded-lg p-1 border border-[var(--theme-accent)]/30">
            <button
              onClick={() => handleTabChange('submit')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'submit'
                  ? 'bg-[var(--theme-accent)] text-white shadow-sm'
                  : 'theme-text-secondary hover:theme-text'
              }`}
              aria-label="Submit new feedback"
            >
              Submit Feedback
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-[var(--theme-accent)] text-white shadow-sm'
                  : 'theme-text-secondary hover:theme-text'
              }`}
              aria-label={`View feedback history (${userFeedback.length} items)`}
            >
              My Feedback ({userFeedback.length})
            </button>
          </div>
        </div>

        {/* Submit Tab */}
        {activeTab === 'submit' && (
          <div className="max-w-2xl mx-auto">
            {showSuccess && (
              <SuccessAlert message="Thank you! Your feedback has been submitted successfully." />
            )}

            {formErrors.general && (
              <ErrorMessage error={formErrors.general} />
            )}

            <div className="theme-card rounded-xl p-8 border border-[var(--theme-accent)]/30 shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Feedback Type Selection */}
                <div>
                  <label className="block theme-text text-sm font-medium mb-3">
                    Feedback Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {feedbackTypes.map(({ value, label, icon: Icon, colorClass }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFeedbackType(value)}
                        className={`p-4 rounded-lg border-2 transition-all text-center theme-surface hover-lift ${
                          feedbackType === value
                            ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20'
                            : 'border-[var(--theme-accent)]/30 hover:border-[var(--theme-accent)]/50'
                        }`}
                        aria-label={`Select ${label}`}
                        aria-pressed={feedbackType === value}
                      >
                        <Icon className={`mx-auto mb-2 ${colorClass}`} size={24} />
                        <div className="text-sm font-medium theme-text">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="feedback-title" className="block theme-text text-sm font-medium mb-2">
                    {feedbackType === 'bug' ? 'Bug Summary' : 
                     feedbackType === 'feature' ? 'Feature Title' : 'Feedback Title'}
                    <span className="text-red-500 ml-1" aria-label="required">*</span>
                  </label>
                  <input
                    id="feedback-title"
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (formErrors.title) {
                        setFormErrors(prev => {
                          const { title, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    placeholder={
                      feedbackType === 'bug' ? 'Brief description of the bug...' :
                      feedbackType === 'feature' ? 'What feature would you like to see?' :
                      'What would you like to share?'
                    }
                    className={`w-full p-3 rounded-lg border-2 theme-surface theme-text transition-colors ${
                      formErrors.title 
                        ? 'border-red-400 focus:border-red-500' 
                        : 'border-[var(--theme-accent)]/30 focus:border-[var(--theme-accent)]'
                    }`}
                    aria-describedby={formErrors.title ? 'title-error' : undefined}
                    aria-invalid={!!formErrors.title}
                    required
                  />
                  {formErrors.title && (
                    <p id="title-error" className="text-red-600 text-sm mt-1" role="alert">
                      {formErrors.title}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="feedback-description" className="block theme-text text-sm font-medium mb-2">
                    {feedbackType === 'bug' ? 'Steps to Reproduce / Details' : 'Description'}
                    <span className="text-red-500 ml-1" aria-label="required">*</span>
                  </label>
                  <textarea
                    id="feedback-description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (formErrors.description) {
                        setFormErrors(prev => {
                          const { description, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    placeholder={
                      feedbackType === 'bug' ? 'Please describe the bug in detail, including steps to reproduce it...' :
                      feedbackType === 'feature' ? 'Describe the feature and how it would help you...' :
                      'Share your thoughts, suggestions, or feedback...'
                    }
                    rows={6}
                    className={`w-full p-3 rounded-lg border-2 theme-surface theme-text resize-none transition-colors ${
                      formErrors.description 
                        ? 'border-red-400 focus:border-red-500' 
                        : 'border-[var(--theme-accent)]/30 focus:border-[var(--theme-accent)]'
                    }`}
                    aria-describedby={formErrors.description ? 'description-error' : undefined}
                    aria-invalid={!!formErrors.description}
                    required
                  />
                  {formErrors.description && (
                    <p id="description-error" className="text-red-600 text-sm mt-1" role="alert">
                      {formErrors.description}
                    </p>
                  )}
                </div>

                {/* Priority (for bugs and features) */}
                {(feedbackType === 'bug' || feedbackType === 'feature') && (
                  <div>
                    <label htmlFor="feedback-priority" className="block theme-text text-sm font-medium mb-2">
                      Priority
                    </label>
                    <select
                      id="feedback-priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                      className="w-full p-3 rounded-lg border-2 border-[var(--theme-accent)]/30 focus:border-[var(--theme-accent)] theme-surface theme-text"
                    >
                      <option value="low">Low - Minor issue or nice-to-have</option>
                      <option value="medium">Medium - Noticeable issue or useful feature</option>
                      <option value="high">High - Major issue or important feature</option>
                    </select>
                  </div>
                )}

                {/* Rating (for general feedback) */}
                {feedbackType === 'general' && (
                  <div>
                    <label className="block theme-text text-sm font-medium mb-2">
                      Overall Rating (Optional)
                    </label>
                    <div className="flex space-x-1" role="radiogroup" aria-label="Rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
                          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                          role="radio"
                          aria-checked={star === rating}
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              star <= rating ? 'text-[var(--theme-accent)] fill-[var(--theme-accent)]' : 'theme-text-secondary'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitFeedbackMutation.isPending}
                  className="w-full bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-accent)] text-white py-3 px-6 rounded-lg font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Submit feedback form"
                >
                  {submitFeedbackMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2" size={18} />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto">
            {feedbackError && (
              <ErrorMessage 
                error={feedbackError.message || 'Failed to load feedback history'} 
                onRetry={() => refetchFeedback()}
              />
            )}

            {feedbackLoading ? (
              <LoadingSpinner message="Loading your feedback history..." />
            ) : userFeedback.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="mx-auto theme-text-secondary" size={48} />}
                title="No feedback submitted yet"
                description="Click 'Submit Feedback' to share your thoughts!"
                action={
                  <button
                    onClick={() => handleTabChange('submit')}
                    className="bg-[var(--theme-accent)] text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    Submit Your First Feedback
                  </button>
                }
              />
            ) : (
              <div className="space-y-4">
                {userFeedback.map((feedback) => (
                  <div 
                    key={`feedback-${feedback.id}`} 
                    className="theme-card rounded-lg p-6 border border-[var(--theme-accent)]/30"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        {getTypeIcon(feedback.type)}
                        <h3 className="theme-text font-semibold ml-2">{feedback.title}</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(feedback.priority)}`}>
                          {feedback.priority.toUpperCase()}
                        </span>
                        <span className={`text-sm font-medium ${getStatusColor(feedback.status)}`}>
                          {feedback.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <p className="theme-text-secondary mb-3">{feedback.description}</p>
                    
                    <div className="flex items-center justify-between text-sm theme-text-secondary">
                      <span>Submitted: {new Date(feedback.createdAt).toLocaleDateString()}</span>
                      {feedback.rating && (
                        <div className="flex items-center" aria-label={`Rating: ${feedback.rating} stars`}>
                          <span className="mr-1">Rating:</span>
                          {[...Array(feedback.rating)].map((_, i) => (
                            <Star 
                              key={i} 
                              className="w-4 h-4 text-[var(--theme-accent)] fill-[var(--theme-accent)]" 
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackSystem;
