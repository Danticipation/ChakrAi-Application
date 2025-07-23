import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Clock, Star, CheckCircle, Brain, Target, Loader2, AlertCircle, RefreshCw, ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WellnessRecommendation {
  id: string;
  type: 'exercise' | 'meditation' | 'journaling' | 'breathing' | 'activity';
  name: string;
  description: string;
  duration: number;
  difficulty: 'easy' | 'moderate' | 'challenging';
  tags: string[];
  personalizedReason: string;
  confidence: number;
}

interface AdaptationInsight {
  conversationThemes: string[];
  emotionalPatterns: string[];
  effectiveApproaches: string[];
  wellnessNeeds: string[];
  learningProgress: number;
  confidenceScore: number;
}

interface AdaptiveRecommendationsProps {
  userId: number;
  currentEmotion?: string;
  recentMessages?: string[];
}

// Reusable Loading Component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center py-8" role="status" aria-label={message}>
    <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-500" />
    <span className="text-sm text-gray-600">{message}</span>
  </div>
);

// Reusable Error Component
const ErrorMessage: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
    <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
    <h3 className="text-sm font-medium text-red-800 mb-1">Error Loading Recommendations</h3>
    <p className="text-xs text-red-600 text-center mb-3">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded transition-colors"
        aria-label="Retry loading recommendations"
      >
        <RefreshCw className="w-3 h-3 mr-1 inline" />
        Try Again
      </button>
    )}
  </div>
);

// Reusable Success Feedback Component
const SuccessFeedback: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm">
    <CheckCircle className="w-4 h-4 mr-2" />
    {message}
  </div>
);

// Main Component
export function AdaptiveRecommendations({ 
  userId, 
  currentEmotion = 'neutral',
  recentMessages = []
}: AdaptiveRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<WellnessRecommendation[]>([]);
  const [insights, setInsights] = useState<AdaptationInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);
  const [processingStates, setProcessingStates] = useState<Set<string>>(new Set());
  const [ratingStates, setRatingStates] = useState<Set<string>>(new Set());
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  
  // AbortController refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // Enhanced effect with AbortController
  useEffect(() => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController
    abortControllerRef.current = new AbortController();
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchPersonalizedRecommendations(abortControllerRef.current!.signal),
          fetchAdaptationInsights(abortControllerRef.current!.signal)
        ]);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message || 'Failed to load recommendations');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [userId, currentEmotion]);

  // Enhanced fetch functions with AbortController and error handling
  const fetchPersonalizedRecommendations = useCallback(async (signal: AbortSignal) => {
    try {
      const response = await fetch('/api/personalization/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || 0,
          emotionalState: currentEmotion || 'neutral',
          recentMessages: (recentMessages || []).slice(-5)
        }),
        signal
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to fetch recommendations:', error);
        throw error;
      }
    }
  }, [userId, currentEmotion, recentMessages]);

  const fetchAdaptationInsights = useCallback(async (signal: AbortSignal) => {
    try {
      const response = await fetch(`/api/personalization/insights/${userId || 0}`, { signal });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch insights: ${response.statusText}`);
      }
      
      const data = await response.json();
      setInsights(data.insights || null);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to fetch insights:', error);
        throw error;
      }
    }
  }, [userId]);

  // Enhanced action handlers with visual feedback
  const handleUseRecommendation = useCallback(async (recommendationId: string) => {
    if (!recommendationId || !userId) return;
    
    // Add to processing states
    setProcessingStates(prev => new Set(prev).add(recommendationId));
    
    try {
      const response = await fetch('/api/personalization/use-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          recommendationId,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to track recommendation usage');
      }
      
      // Mark as completed and show rating interface
      setSelectedRecommendation(recommendationId);
      setCompletedActions(prev => new Set(prev).add(recommendationId));
      
      toast({
        title: "Recommendation Started!",
        description: "How would you rate this recommendation?",
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Failed to track recommendation usage:', error);
      toast({
        title: "Error",
        description: "Failed to track recommendation usage. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      // Remove from processing states
      setProcessingStates(prev => {
        const newSet = new Set(prev);
        newSet.delete(recommendationId);
        return newSet;
      });
    }
  }, [userId, toast]);

  const handleRateRecommendation = useCallback(async (recommendationId: string, rating: number) => {
    if (!recommendationId || !userId || rating < 1 || rating > 5) return;
    
    // Add to rating states
    setRatingStates(prev => new Set(prev).add(recommendationId));
    
    try {
      const response = await fetch('/api/personalization/rate-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          recommendationId,
          rating
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }
      
      // Clear selection and show success
      setSelectedRecommendation(null);
      
      toast({
        title: "Thank you for your feedback!",
        description: `You rated this recommendation ${rating} stars.`,
        duration: 3000,
      });
      
      // Refresh recommendations after rating
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      await fetchPersonalizedRecommendations(abortControllerRef.current.signal);
      
    } catch (error) {
      console.error('Failed to rate recommendation:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      // Remove from rating states
      setRatingStates(prev => {
        const newSet = new Set(prev);
        newSet.delete(recommendationId);
        return newSet;
      });
    }
  }, [userId, fetchPersonalizedRecommendations, toast]);

  // Memoized utility functions for performance
  const getDifficultyColor = useMemo(() => (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'challenging': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getTypeIcon = useMemo(() => (type: string) => {
    switch (type) {
      case 'breathing': return '🫁';
      case 'meditation': return '🧘';
      case 'exercise': return '💪';
      case 'journaling': return '📝';
      case 'activity': return '🎯';
      default: return '💡';
    }
  }, []);

  // Memoized sorted and uniquely keyed tags
  const getSortedUniqueTags = useMemo(() => (tags: string[]) => {
    return Array.from(new Set(tags)).sort();
  }, []);

  // Retry function for error handling
  const handleRetry = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    Promise.all([
      fetchPersonalizedRecommendations(abortControllerRef.current.signal),
      fetchAdaptationInsights(abortControllerRef.current.signal)
    ]).catch(err => {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load recommendations');
      }
    }).finally(() => {
      setLoading(false);
    });
  }, [fetchPersonalizedRecommendations, fetchAdaptationInsights]);

  // Presentational components extracted for better readability
  const InsightCard: React.FC<{ insights: AdaptationInsight }> = ({ insights }) => (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 border-2 border-silver hover:border-4 hover:animate-shimmer transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg text-purple-800">
          <Brain className="w-5 h-5 mr-2" aria-hidden="true" />
          Your Learning Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-purple-700">Personalization Level</span>
          <span className="text-sm font-medium text-purple-800">
            {Math.round((insights.learningProgress || 0) * 100)}%
          </span>
        </div>
        <Progress 
          value={(insights.learningProgress || 0) * 100} 
          className="h-2 bg-purple-100"
          aria-label={`Learning progress: ${Math.round((insights.learningProgress || 0) * 100)}%`}
        />
        
        {insights.emotionalPatterns && insights.emotionalPatterns.length > 0 && (
          <div>
            <p className="text-sm font-medium text-purple-800 mb-2">Key Insights:</p>
            <div className="flex flex-wrap gap-1">
              {insights.emotionalPatterns.slice(0, 3).map((pattern, index) => (
                <Badge key={`pattern-${index}-${pattern}`} variant="outline" className="text-xs border-purple-200 text-purple-700">
                  {pattern}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const RecommendationCard: React.FC<{ 
    recommendation: WellnessRecommendation; 
    isSelected: boolean; 
    isProcessing: boolean;
    isRating: boolean;
    isCompleted: boolean;
    onUse: () => void; 
    onRate: (rating: number) => void;
  }> = ({ recommendation, isSelected, isProcessing, isRating, isCompleted, onUse, onRate }) => (
    <Card className="border border-silver hover:border-2 hover:animate-shimmer transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl" aria-hidden="true">{getTypeIcon(recommendation.type)}</span>
            <div>
              <h3 className="font-semibold text-gray-800">{recommendation.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getDifficultyColor(recommendation.difficulty)}>
                  {recommendation.difficulty}
                </Badge>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                  {recommendation.duration} min
                </div>
                <div className="flex items-center text-xs text-blue-600">
                  <Star className="w-3 h-3 mr-1" aria-hidden="true" />
                  {Math.round((recommendation.confidence || 0) * 100)}% match
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
        
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-blue-800">
            <Lightbulb className="w-4 h-4 inline mr-1" aria-hidden="true" />
            {recommendation.personalizedReason}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {getSortedUniqueTags(recommendation.tags || []).slice(0, 3).map((tag, index) => (
              <Badge key={`tag-${recommendation.id}-${tag}-${index}`} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            {isCompleted && <SuccessFeedback message="Completed!" />}
            {isSelected ? (
              <div className="flex items-center space-x-1" role="group" aria-label="Rate this recommendation">
                {isRating && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => onRate(rating)}
                    disabled={isRating}
                    className="text-yellow-400 hover:text-yellow-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label={`Rate ${rating} stars`}
                    title={`Rate ${rating} stars`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                ))}
              </div>
            ) : (
              <Button
                size="sm"
                onClick={onUse}
                disabled={isProcessing}
                className="bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={`Try recommendation: ${recommendation.name}`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Starting...
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    Try This
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const WellnessFocusCard: React.FC<{ insights: AdaptationInsight }> = ({ insights }) => (
    <Card className="border-green-200 border-2 border-silver hover:border-4 hover:animate-shimmer">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg text-green-800">
          <Target className="w-5 h-5 mr-2" aria-hidden="true" />
          Your Wellness Focus Areas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {(insights.wellnessNeeds || []).slice(0, 4).map((need, index) => (
            <div key={`wellness-${index}-${need}`} className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-sm font-medium text-green-800 capitalize">
                {need.replace('-', ' ')}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Enhanced loading state
  if (loading) {
    return <LoadingSpinner message="Loading personalized recommendations..." />;
  }

  // Enhanced error state
  if (error) {
    return <ErrorMessage error={error} onRetry={handleRetry} />;
  }

  // Enhanced main render with proper defensive programming
  return (
    <div className="space-y-6 min-h-[400px]" role="main" aria-label="Adaptive recommendations dashboard">
      {/* Adaptation Insights */}
      {insights && <InsightCard insights={insights} />}

      {/* Personalized Recommendations */}
      <Card className="border-blue-200 border-2 border-silver hover:border-4 hover:animate-shimmer">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-xl text-blue-800">
            <Lightbulb className="w-6 h-6 mr-2" aria-hidden="true" />
            Personalized for You
          </CardTitle>
          <p className="text-sm text-blue-600">
            Recommendations tailored to your preferences and current needs
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!recommendations || recommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-500" role="status">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
              <h3 className="text-lg font-medium text-gray-600 mb-1">Building Personalized Recommendations</h3>
              <p className="text-sm">Keep chatting to help me learn your preferences!</p>
            </div>
          ) : (
            <div className="space-y-4" role="list" aria-label="Wellness recommendations">
              {recommendations.map((rec) => (
                <div key={`recommendation-${rec.id}`} role="listitem">
                  <RecommendationCard
                    recommendation={rec}
                    isSelected={selectedRecommendation === rec.id}
                    isProcessing={processingStates.has(rec.id)}
                    isRating={ratingStates.has(rec.id)}
                    isCompleted={completedActions.has(rec.id)}
                    onUse={() => handleUseRecommendation(rec.id)}
                    onRate={(rating) => handleRateRecommendation(rec.id, rating)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wellness Focus Areas */}
      {insights && insights.wellnessNeeds && insights.wellnessNeeds.length > 0 && (
        <WellnessFocusCard insights={insights} />
      )}
    </div>
  );
}